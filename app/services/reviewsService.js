import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const COLLECTION_NAME = "reviews";

export const reviewsService = {
  async getAllReviews() {
    try {
      const reviewsRef = collection(db, COLLECTION_NAME);
      if (!reviewsRef) {
        throw new Error("Failed to get collection reference");
      }

      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      if (!snapshot) {
        throw new Error("Failed to get documents snapshot");
      }

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error("Error getting reviews:", error);
      throw new Error(`Database connection error: ${error.message}`);
    }
  },

  async addReview(reviewData) {
    try {
      const reviewsRef = collection(db, COLLECTION_NAME);
      const enrichedReview = {
        ...reviewData,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(reviewsRef, enrichedReview);
      return { id: docRef.id, ...enrichedReview };
    } catch (error) {
      console.error("Error adding review:", error);
      throw error;
    }
  },
};
