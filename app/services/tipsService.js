import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import { generateId } from "../utils/generateId";

const COLLECTION_NAME = "tips";

export const tipsService = {
  async getAllTips() {
    try {
      const tipsRef = collection(db, COLLECTION_NAME);
      const q = query(tipsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastEdited: data.lastEdited?.toDate?.() || null,
        };
      });
    } catch (error) {
      console.error("Error getting tips:", error);
      throw error;
    }
  },

  async addTip(tip) {
    try {
      const tipsRef = collection(db, COLLECTION_NAME);
      const userId = generateId();
      const enrichedTip = {
        content: tip,
        createdAt: serverTimestamp(),
        userId,
        canEdit: true,
      };

      const docRef = await addDoc(tipsRef, enrichedTip);
      if (typeof window !== "undefined") {
        localStorage.setItem(`tip_${docRef.id}_userId`, userId);
      }

      // Return the tip with a proper Date object for immediate display
      return {
        id: docRef.id,
        ...enrichedTip,
        createdAt: new Date(), // Use current date for immediate display
        lastEdited: null,
      };
    } catch (error) {
      console.error("Error adding tip:", error);
      throw error;
    }
  },

  async updateTip(tipId, newContent) {
    try {
      const tipRef = doc(db, COLLECTION_NAME, tipId);
      await updateDoc(tipRef, {
        content: newContent,
        lastEdited: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating tip:", error);
      throw error;
    }
  },

  async deleteTip(tipId) {
    try {
      const tipRef = doc(db, COLLECTION_NAME, tipId);
      await deleteDoc(tipRef);
    } catch (error) {
      console.error("Error deleting tip:", error);
      throw error;
    }
  },
};
