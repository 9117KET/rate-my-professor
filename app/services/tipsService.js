import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const COLLECTION_NAME = "tips";

export const tipsService = {
  async getAllTips() {
    try {
      const tipsRef = collection(db, COLLECTION_NAME);
      const q = query(tipsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error("Error getting tips:", error);
      throw error;
    }
  },

  async addTip(tip) {
    try {
      const tipsRef = collection(db, COLLECTION_NAME);
      const enrichedTip = {
        content: tip,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(tipsRef, enrichedTip);
      return { id: docRef.id, ...enrichedTip };
    } catch (error) {
      console.error("Error adding tip:", error);
      throw error;
    }
  },
};
