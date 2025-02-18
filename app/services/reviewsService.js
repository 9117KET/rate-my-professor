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

  async addReview(reviewData) {
    try {
      const reviewsRef = collection(db, COLLECTION_NAME);
      const enrichedReview = {
        ...reviewData,
        createdAt: serverTimestamp(),
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
