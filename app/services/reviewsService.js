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

const COLLECTION_NAME = "reviews";

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
      console.error("Error getting reviews:", error);
      throw error;
    }
  },

  async addReview(reviewData) {
    try {
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
          console.error("Error during Pinecone sync:", syncError);
          // Attempt alternative sync method
          try {
            console.log("Attempting alternative sync method...");
            await embeddingService.syncFirestoreWithPineconeFallback();
            console.log("Alternative sync successful");
          } catch (fallbackError) {
            console.error("Alternative sync failed:", fallbackError);
            // Log error but don't throw since this is background sync
            console.error("Failed to sync review with search index");
          }
        }
      }, 0);

      return savedReview;
    } catch (error) {
      console.error("Error adding review:", error);
      throw error;
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
};
