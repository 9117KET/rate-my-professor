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
  getDoc,
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

  async getUserTips(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const tipsRef = collection(db, COLLECTION_NAME);
      const q = query(
        tipsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
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
      console.error("Error getting user tips:", error);
      throw error;
    }
  },

  async isUsersTip(tipId, userId) {
    try {
      if (!userId || !tipId) {
        return false;
      }

      const tipRef = doc(db, COLLECTION_NAME, tipId);
      const tipSnap = await getDoc(tipRef);

      if (!tipSnap.exists()) {
        return false;
      }

      const tipData = tipSnap.data();
      return tipData.userId === userId;
    } catch (error) {
      console.error("Error checking tip ownership:", error);
      return false;
    }
  },

  async addTip(tip) {
    try {
      const tipsRef = collection(db, COLLECTION_NAME);
      const userId = tip.userId || generateId();

      // Check if tip is an object with content property or a string
      const content =
        typeof tip === "object" && tip.content ? tip.content : tip;

      const enrichedTip = {
        content: content,
        createdAt: serverTimestamp(),
        userId,
        canEdit: true,
      };

      const docRef = await addDoc(tipsRef, enrichedTip);

      // Use clientStorage utility instead of direct localStorage access
      clientStorage.setItem(`tip_${docRef.id}_userId`, userId);

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

  async deleteTip(tipId, userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required to delete a tip");
      }

      const tipRef = doc(db, COLLECTION_NAME, tipId);
      const tipSnap = await getDoc(tipRef);

      if (!tipSnap.exists()) {
        throw new Error("Tip not found");
      }

      const tipData = tipSnap.data();

      // Verify the user owns this tip
      if (tipData.userId !== userId) {
        throw new Error("Unauthorized: You can only delete your own tips");
      }

      await deleteDoc(tipRef);

      // Clean up local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem(`tip_${tipId}_userId`);
      }
    } catch (error) {
      console.error("Error deleting tip:", error);
      throw error;
    }
  },
};

export const formatTimestamp = (date) => {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) return "";

  // Use ISO string format initially
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  };

  // Use a consistent locale and timezone for both server and client
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
};

// Create a separate utility for client-side operations
export const clientStorage = {
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
};
