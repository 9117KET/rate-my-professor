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

const COLLECTION_NAME = "reviews";

// Custom error classes to standardize error types
class ReviewError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReviewError";
  }
}

class ReviewPermissionError extends ReviewError {
  constructor(message = "You don't have permission to perform this action") {
    super(message);
    this.name = "ReviewPermissionError";
  }
}

class ReviewNotFoundError extends ReviewError {
  constructor(message = "Review not found") {
    super(message);
    this.name = "ReviewNotFoundError";
  }
}

class ReviewTimeWindowError extends ReviewError {
  constructor(message) {
    super(message);
    this.name = "ReviewTimeWindowError";
  }
}

export const reviewsService = {
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

      // Sync with Pinecone in the background
      setTimeout(async () => {
        try {
          console.log("Starting Pinecone sync for new review...");
          await embeddingService.syncFirestoreWithPinecone();
          console.log(`Successfully synced review ${docRef.id} to Pinecone`);
        } catch (syncError) {
          logError(syncError, "pinecone-sync-after-add", {
            reviewId: docRef.id,
          });

          // Attempt alternative sync method
          try {
            console.log("Attempting alternative sync method...");
            await embeddingService.syncFirestoreWithPineconeFallback();
            console.log("Alternative sync successful");
          } catch (fallbackError) {
            logError(fallbackError, "pinecone-sync-fallback", {
              reviewId: docRef.id,
            });
            // Don't throw here since this is background sync
          }
        }
      }, 0);

      return savedReview;
    } catch (error) {
      logError(error, "add-review", {
        professor: reviewData?.professor,
        subject: reviewData?.subject,
        contentLength: reviewData?.review?.length,
      });

      // Preserve rate limit error messages as they contain useful information
      if (error.message.includes("Rate limit exceeded")) {
        throw error;
      } else {
        throw new ReviewError(
          "Failed to submit review. Please try again later."
        );
      }
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

      // Delete user's reviews
      for (const review of userContent.reviews) {
        await this.deleteReview(review.id, userId);
      }

      // Remove user's replies from reviews
      for (const reply of userContent.replies) {
        await this.deleteReply(reply.reviewId, reply.index, userId);
      }

      // Remove user's reactions from reviews
      for (const reaction of userContent.reactions) {
        await this.removeReaction(reaction.reviewId, reaction.type, userId);
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
