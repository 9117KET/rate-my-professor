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
          thumbsUp: 0,
          thumbsDown: 0,
        },
      }));
    } catch (error) {
      console.error("Error getting reviews:", error);
      throw error;
    }
  },

  async addReview(reviewData, ipAddress) {
    try {
      const reviewsRef = collection(db, COLLECTION_NAME);
      const enrichedReview = {
        ...reviewData,
        createdAt: serverTimestamp(),
        ipAddress: ipAddress,
        reactions: {
          thumbsUp: 0,
          thumbsDown: 0,
        },
      };

      const docRef = await addDoc(reviewsRef, enrichedReview);
      console.log(`Added new review with ID: ${docRef.id}`);

      // Sync with Pinecone after adding new review
      try {
        await embeddingService.syncFirestoreWithPinecone();
        console.log(
          `Successfully synced Pinecone after adding review: ${docRef.id}`
        );
      } catch (syncError) {
        console.error(
          `Error syncing with Pinecone after adding review: ${docRef.id}`,
          syncError
        );
        // We don't throw here to not disrupt the user flow, but we log the error
      }

      return { id: docRef.id, ...enrichedReview };
    } catch (error) {
      console.error("Error adding review:", error);
      throw error;
    }
  },

  async editReview(reviewId, newContent, ipAddress) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();

      // Check if review exists and IP matches
      if (!reviewSnap.exists()) {
        throw new Error("Review not found");
      }

      if (reviewData.ipAddress !== ipAddress) {
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

  async deleteReview(reviewId, ipAddress) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();

      // Check if review exists and IP matches
      if (!reviewSnap.exists()) {
        throw new Error("Review not found");
      }

      if (reviewData.ipAddress !== ipAddress) {
        throw new Error("Unauthorized to delete this review");
      }

      // Check if within 24 hours
      const createdAt = reviewData.createdAt.toDate();
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        throw new Error(
          "Review can only be deleted within 24 hours of creation"
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

  async addReaction(reviewId, reactionType) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const updateData = {};
      updateData[`reactions.${reactionType}`] = increment(1);
      await updateDoc(reviewRef, updateData);
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  },

  async removeReaction(reviewId, reactionType) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const updateData = {};
      updateData[`reactions.${reactionType}`] = increment(-1);
      await updateDoc(reviewRef, updateData);
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  },

  async addReply(reviewId, replyData, ipAddress) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const now = new Date();

      const reply = {
        content: replyData.content,
        createdAt: now,
        ipAddress: ipAddress,
        lastEdited: null,
        reactions: {
          thumbsUp: 0,
          thumbsDown: 0,
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

  async deleteReply(reviewId, replyIndex, ipAddress) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();

      if (!reviewSnap.exists()) {
        throw new Error("Review not found");
      }

      const replies = reviewData.replies || [];
      const reply = replies[replyIndex];

      if (!reply || reply.ipAddress !== ipAddress) {
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

  async editReply(reviewId, replyIndex, newContent, ipAddress) {
    try {
      const reviewRef = doc(db, COLLECTION_NAME, reviewId);
      const reviewSnap = await getDoc(reviewRef);
      const reviewData = reviewSnap.data();

      if (!reviewSnap.exists()) {
        throw new Error("Review not found");
      }

      const replies = reviewData.replies || [];
      const reply = replies[replyIndex];

      if (!reply || reply.ipAddress !== ipAddress) {
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
};
