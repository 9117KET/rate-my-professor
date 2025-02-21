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
          love: 0,
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
          love: 0,
        },
      };

      const docRef = await addDoc(reviewsRef, enrichedReview);

      // Sync with Pinecone after adding new review
      await embeddingService.syncFirestoreWithPinecone();

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

      // Sync with Pinecone after editing
      await embeddingService.syncFirestoreWithPinecone();

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

      // Sync with Pinecone after deletion
      await embeddingService.syncFirestoreWithPinecone();

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
};
