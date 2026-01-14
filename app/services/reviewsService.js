import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  deleteDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { embeddingService } from "./embeddingService";
import { rateLimiterService } from "./rateLimiterService";
import { logError } from "../utils/errorHandler";

// Collection name in Firestore database
const COLLECTION_NAME = "reviews";

/**
 * Base error class for review-related errors
 * Provides a common type for catching and handling review errors
 */
class ReviewError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReviewError";
  }
}

/**
 * Error thrown when a user attempts to perform an action they aren't authorized for
 * Examples: editing someone else's review, deleting another user's content
 */
class ReviewPermissionError extends ReviewError {
  constructor(message = "You don't have permission to perform this action") {
    super(message);
    this.name = "ReviewPermissionError";
  }
}

/**
 * Error thrown when attempting to access a review that doesn't exist
 * Used when fetching, updating, or deleting a non-existent review
 */
class ReviewNotFoundError extends ReviewError {
  constructor(message = "Review not found") {
    super(message);
    this.name = "ReviewNotFoundError";
  }
}

/**
 * Error thrown when a time-based restriction prevents an action
 * Example: editing a review after the allowed edit window has passed
 */
class ReviewTimeWindowError extends ReviewError {
  constructor(message) {
    super(message);
    this.name = "ReviewTimeWindowError";
  }
}

export const reviewsService = {
  /**
   * Retrieves all reviews from the database, ordered by creation date (newest first)
   * Formats dates and ensures reaction fields exist even if not in the database
   *
   * @returns {Array} Array of review objects with consistent structure
   */
  async getAllReviews() {
    try {
      const reviewsRef = collection(db, COLLECTION_NAME);
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        reactions: doc.data().reactions || {
          thumbsUp: [],
          thumbsDown: [],
        },
      }));
    } catch (error) {
      logError(error, "get-all-reviews");
      throw new ReviewError(
        "Failed to retrieve reviews. Please try again later."
      );
    }
  },

  /**
   * Adds a new review to the database
   * Performs rate limiting to prevent spam
   * After saving, syncs the review with Pinecone for vector search
   *
   * @param {Object} reviewData - Review content and metadata
   * @returns {Object} The newly created review with ID and server timestamp
   */
  async addReview(reviewData) {
    try {
      // Check rate limit for review submissions
      const rateLimitResult = await rateLimiterService.checkRateLimit(
        reviewData.userId,
        "REVIEW_SUBMISSION"
      );

      if (!rateLimitResult.allowed) {
        throw new Error(
          `Rate limit exceeded for review submissions. You can submit ${
            rateLimitResult.limit
          } reviews per ${
            rateLimitResult.windowMs / 3600000
          } hours. Please try again in ${Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 60000
          )} minutes.`
        );
      }

      const reviewsRef = collection(db, COLLECTION_NAME);

      // Enrich the review data with required fields
      const enrichedReview = {
        ...reviewData,
        createdAt: serverTimestamp(),
        userId: reviewData.userId,
        reactions: {
          thumbsUp: [],
          thumbsDown: [],
        },
      };

      // Save to Firestore
      const docRef = await addDoc(reviewsRef, enrichedReview);
      console.log(`Added new review with ID: ${docRef.id}`);

      // Get the actual document with server timestamp
      const docSnap = await getDoc(docRef);
      const savedReview = {
        id: docRef.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      };

      // Sync with Pinecone via server-side API route
      // This ensures server-side environment variables are available
      // IMPORTANT: This sync happens automatically but doesn't block review submission
      // If sync fails, the review is still saved and can be synced later via cron or manual sync
      try {
        console.log(
          `[SYNC] Starting automatic sync for review ${docRef.id}...`
        );

        // Call the server-side API route to sync this review to Pinecone
        // Add timeout to prevent hanging (10 seconds max)
        const syncPromise = fetch("/api/sync-review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reviewId: docRef.id }),
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Sync timeout after 10 seconds")),
            10000
          )
        );

        const syncResponse = await Promise.race([syncPromise, timeoutPromise]);

        if (syncResponse.ok) {
          const result = await syncResponse.json();
          console.log(
            `[SYNC] ✅ Successfully synced review ${docRef.id} to Pinecone:`,
            result.message
          );
        } else {
          const errorData = await syncResponse.json().catch(() => ({}));
          console.error(
            `[SYNC] ❌ Failed to sync review ${docRef.id}:`,
            syncResponse.status,
            syncResponse.statusText,
            errorData
          );
          // Log to error handler for monitoring
          logError(
            new Error(
              `Sync failed: ${syncResponse.status} ${syncResponse.statusText}`
            ),
            "auto-sync-failed",
            { reviewId: docRef.id }
          );
        }
      } catch (syncError) {
        // If triggering sync fails or times out, log but don't block the review submission
        // A cron job or manual sync will catch this later
        console.error(
          `[SYNC] ❌ Error/timeout syncing review ${docRef.id}:`,
          syncError.message
        );
        console.warn(
          `[SYNC] Review ${docRef.id} was saved to Firestore but not yet synced to Pinecone.`,
          "Run 'npm run sync-pinecone:full' to sync all reviews."
        );
        logError(syncError, "auto-sync-error", {
          reviewId: docRef.id,
        });
      }

      return savedReview;
    } catch (error) {
      logError(error, "add-review", {
        professor: reviewData?.professor,
        subject: reviewData?.subject,
        contentLength: reviewData?.review?.length,
      });
      // Re-throw as a standardized error
      throw new ReviewError(
        error.message || "Failed to add review. Please try again later."
      );
    }
  },

  async editReview(reviewId, newContent, userId) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();

      // Check if review exists and userId matches
      if (!reviewSnap.exists()) {
        throw new Error("Review not found");
      }

      if (reviewData.userId !== userId) {
        throw new Error("Unauthorized to edit this review");
      }

      // Check if within 24 hours
      const createdAt = reviewData.createdAt.toDate();
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        throw new Error(
          "Review can only be edited within 24 hours of creation"
        );
      }

      await updateDoc(reviewRef, {
        ...newContent,
        lastEdited: serverTimestamp(),
      });

      console.log(`Edited review with ID: ${reviewId}`);

      // Sync with Pinecone after editing
      try {
        await embeddingService.syncFirestoreWithPinecone();
        console.log(
          `Successfully synced Pinecone after editing review: ${reviewId}`
        );
      } catch (syncError) {
        console.error(
          `Error syncing with Pinecone after editing review: ${reviewId}`,
          syncError
        );
        // We don't throw here to not disrupt the user flow, but we log the error
      }

      return true;
    } catch (error) {
      console.error("Error editing review:", error);
      throw error;
    }
  },

  async deleteReview(reviewId, userId) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();

      // Check if review exists
      if (!reviewSnap.exists()) {
        throw new Error("Review not found");
      }

      // Check if userId matches
      if (reviewData.userId !== userId) {
        throw new Error("Unauthorized to delete this review");
      }

      // Check if within 2 hours
      const createdAt = reviewData.createdAt.toDate();
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

      if (hoursDiff > 2) {
        throw new Error(
          "Review can only be deleted within 2 hours of creation"
        );
      }

      await deleteDoc(reviewRef);
      console.log(`Deleted review with ID: ${reviewId}`);

      // Sync with Pinecone after deletion
      try {
        await embeddingService.syncFirestoreWithPinecone();
        console.log(
          `Successfully synced Pinecone after deleting review: ${reviewId}`
        );
      } catch (syncError) {
        console.error(
          `Error syncing with Pinecone after deleting review: ${reviewId}`,
          syncError
        );
        // We don't throw here to not disrupt the user flow, but we log the error
      }

      return true;
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
  },

  async addReaction(reviewId, reactionType, userId) {
    try {
      // Check rate limit for reactions
      const rateLimitResult = await rateLimiterService.checkRateLimit(
        userId,
        "REVIEW_REACTION"
      );

      if (!rateLimitResult.allowed) {
        throw new Error(
          `Rate limit exceeded for reactions. You can perform ${
            rateLimitResult.limit
          } reactions per hour. Please try again in ${Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 60000
          )} minutes.`
        );
      }

      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      await updateDoc(reviewRef, {
        [`reactions.${reactionType}`]: arrayUnion(userId),
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  },

  async removeReaction(reviewId, reactionType, userId) {
    try {
      // For removing reactions, we don't need rate limiting as this
      // actually reduces load and prevents abuse
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      await updateDoc(reviewRef, {
        [`reactions.${reactionType}`]: arrayRemove(userId),
      });
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  },

  async addReply(reviewId, replyData, userId) {
    try {
      // Check rate limit for reply submissions
      const rateLimitResult = await rateLimiterService.checkRateLimit(
        userId,
        "REPLY_SUBMISSION"
      );

      if (!rateLimitResult.allowed) {
        throw new Error(
          `Rate limit exceeded for replies. You can submit ${
            rateLimitResult.limit
          } replies per hour. Please try again in ${Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 60000
          )} minutes.`
        );
      }

      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const now = new Date();

      const reply = {
        content: replyData.content,
        createdAt: now,
        userId: userId,
        lastEdited: null,
        reactions: {
          thumbsUp: [],
          thumbsDown: [],
        },
      };

      await updateDoc(reviewRef, {
        replies: arrayUnion(reply),
      });

      return reply;
    } catch (error) {
      console.error("Error adding reply:", error);
      throw error;
    }
  },

  async deleteReply(reviewId, replyIndex, userId) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();

      if (!reviewSnap.exists()) {
        throw new Error("Review not found");
      }

      const replies = reviewData.replies || [];
      const reply = replies[replyIndex];

      if (!reply || reply.userId !== userId) {
        throw new Error("Unauthorized to delete this reply");
      }

      const createdAt = reply.createdAt.toDate();
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        throw new Error(
          "Reply can only be deleted within 24 hours of creation"
        );
      }

      replies.splice(replyIndex, 1);
      await updateDoc(reviewRef, { replies });

      return true;
    } catch (error) {
      console.error("Error deleting reply:", error);
      throw error;
    }
  },

  async editReply(reviewId, replyIndex, newContent, userId) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();

      if (!reviewSnap.exists()) {
        throw new Error("Review not found");
      }

      const replies = reviewData.replies || [];
      const reply = replies[replyIndex];

      if (!reply || reply.userId !== userId) {
        throw new Error("Unauthorized to edit this reply");
      }

      const createdAt = new Date(reply.createdAt);
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        throw new Error("Reply can only be edited within 24 hours of creation");
      }

      replies[replyIndex] = {
        ...reply,
        content: newContent,
        lastEdited: now,
      };

      await updateDoc(reviewRef, { replies });
      return replies[replyIndex];
    } catch (error) {
      console.error("Error editing reply:", error);
      throw error;
    }
  },

  async migrateReactionsFormat() {
    try {
      const reviewsRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(reviewsRef);

      const batch = [];

      for (const docSnapshot of snapshot.docs) {
        const reviewData = docSnapshot.data();
        const reviewId = docSnapshot.id;
        const reviewRef = doc(db, COLLECTION_NAME, reviewId);
        let needsUpdate = false;
        let updatedData = {};

        // Check if main review reactions exist and are in the old number format
        if (reviewData.reactions) {
          const { thumbsUp, thumbsDown } = reviewData.reactions;

          if (typeof thumbsUp === "number" || typeof thumbsDown === "number") {
            console.log(`Migrating reactions for review: ${reviewId}`);

            // Create updated reactions object with empty arrays
            updatedData.reactions = {
              thumbsUp: [],
              thumbsDown: [],
            };
            needsUpdate = true;
          }
        } else {
          // No reactions at all, initialize them
          updatedData.reactions = {
            thumbsUp: [],
            thumbsDown: [],
          };
          needsUpdate = true;
        }

        // Check for replies with reactions in the old format
        if (
          Array.isArray(reviewData.replies) &&
          reviewData.replies.length > 0
        ) {
          const updatedReplies = [...reviewData.replies];
          let repliesUpdated = false;

          updatedReplies.forEach((reply, index) => {
            if (reply.reactions) {
              const { thumbsUp, thumbsDown } = reply.reactions;

              if (
                typeof thumbsUp === "number" ||
                typeof thumbsDown === "number"
              ) {
                console.log(
                  `Migrating reactions for reply #${index} in review: ${reviewId}`
                );

                updatedReplies[index] = {
                  ...reply,
                  reactions: {
                    thumbsUp: [],
                    thumbsDown: [],
                  },
                };
                repliesUpdated = true;
              }
            } else {
              // Reply has no reactions, initialize them
              updatedReplies[index] = {
                ...reply,
                reactions: {
                  thumbsUp: [],
                  thumbsDown: [],
                },
              };
              repliesUpdated = true;
            }
          });

          if (repliesUpdated) {
            updatedData.replies = updatedReplies;
            needsUpdate = true;
          }
        }

        // Update the document if needed
        if (needsUpdate) {
          batch.push(updateDoc(reviewRef, updatedData));
        }
      }

      // Execute all updates in parallel
      if (batch.length > 0) {
        await Promise.all(batch);
        console.log(
          `Migrated ${batch.length} documents to new reaction format`
        );
      } else {
        console.log("No reviews needed migration");
      }

      return batch.length;
    } catch (error) {
      console.error("Error migrating reactions:", error);
      throw error;
    }
  },

  async getUserContent(userId) {
    try {
      if (!userId) {
        throw new ReviewError("User ID is required");
      }

      // Get all reviews
      const reviewsRef = collection(db, COLLECTION_NAME);
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const allReviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      // Filter user's reviews
      const userReviews = allReviews.filter(
        (review) => review.userId === userId
      );

      // Extract user's replies from all reviews
      const userReplies = [];
      const userReactions = [];

      // Process all reviews to find user's replies and reactions
      allReviews.forEach((review) => {
        // Check for user's replies
        if (Array.isArray(review.replies)) {
          review.replies.forEach((reply, index) => {
            if (reply.userId === userId) {
              userReplies.push({
                reviewId: review.id,
                index: index,
                content: reply.content,
                createdAt: reply.createdAt?.toDate() || new Date(),
                lastEdited: reply.lastEdited?.toDate() || null,
                professorName: review.professor,
                subject: review.subject,
              });
            }
          });
        }

        // Check for user's reactions
        if (review.reactions) {
          Object.entries(review.reactions).forEach(
            ([reactionType, userIds]) => {
              if (Array.isArray(userIds) && userIds.includes(userId)) {
                userReactions.push({
                  reviewId: review.id,
                  type: reactionType,
                  professorName: review.professor,
                  subject: review.subject,
                  timestamp: review.createdAt, // Using review creation time as we don't store reaction timestamps
                });
              }
            }
          );
        }
      });

      return {
        reviews: userReviews,
        replies: userReplies,
        reactions: userReactions,
      };
    } catch (error) {
      logError(error, "get-user-content", { userId });
      throw new ReviewError(
        "Failed to retrieve your content. Please try again later."
      );
    }
  },

  async deleteAllUserContent(userId) {
    try {
      if (!userId) {
        throw new ReviewError("User ID is required");
      }

      // Get user content first
      const userContent = await this.getUserContent(userId);

      // Delete user's reviews directly (bypassing time window check for bulk deletion)
      for (const review of userContent.reviews) {
        try {
          const reviewRef = doc(db, COLLECTION_NAME, review.id);
          const reviewSnap = await getDoc(reviewRef);
          const reviewData = reviewSnap.data();

          // Verify the review belongs to the user
          if (reviewSnap.exists() && reviewData.userId === userId) {
            await deleteDoc(reviewRef);
            console.log(`Deleted review with ID: ${review.id}`);
          }
        } catch (error) {
          console.error(`Error deleting review ${review.id}:`, error);
          // Continue with other deletions even if one fails
        }
      }

      // Remove user's replies from reviews (bypassing time window check)
      for (const reply of userContent.replies) {
        try {
          const reviewRef = doc(db, COLLECTION_NAME, reply.reviewId);
          const reviewSnap = await getDoc(reviewRef);
          const reviewData = reviewSnap.data();

          if (!reviewSnap.exists()) continue;

          const replies = reviewData.replies || [];
          const replyItem = replies[reply.index];

          // Verify ownership before deletion
          if (replyItem && replyItem.userId === userId) {
            replies.splice(reply.index, 1);
            await updateDoc(reviewRef, { replies });
          }
        } catch (error) {
          console.error(`Error deleting reply:`, error);
          // Continue with other deletions
        }
      }

      // Remove user's reactions from reviews
      for (const reaction of userContent.reactions) {
        try {
          await this.removeReaction(reaction.reviewId, reaction.type, userId);
        } catch (error) {
          console.error(`Error removing reaction:`, error);
          // Continue with other operations
        }
      }

      // Sync with Pinecone after all deletions
      try {
        await embeddingService.syncFirestoreWithPinecone();
      } catch (syncError) {
        logError(syncError, "pinecone-sync-after-user-deletion", { userId });
        // Don't throw here as the main deletion was successful
      }

      return {
        deletedReviews: userContent.reviews.length,
        deletedReplies: userContent.replies.length,
        deletedReactions: userContent.reactions.length,
      };
    } catch (error) {
      logError(error, "delete-all-user-content", { userId });
      throw new ReviewError(
        "Failed to delete your content. Please try again later."
      );
    }
  },
};
