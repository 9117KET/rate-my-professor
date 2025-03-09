import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

export const chatService = {
  async saveChat(messages, userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required to save chat");
      }

      if (!Array.isArray(messages)) {
        throw new Error("Messages must be an array");
      }

      const chatRef = collection(db, "chats");
      await addDoc(chatRef, {
        messages: messages.map((msg) => ({
          role: msg.role || "user",
          content: msg.content || "",
          timestamp: msg.timestamp
            ? msg.timestamp.toISOString()
            : new Date().toISOString(),
        })),
        userId: userId,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving chat:", error);
      throw error;
    }
  },

  async getAllChats() {
    try {
      const chatRef = collection(db, "chats");
      const q = query(chatRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      console.error("Error getting chats:", error);
      throw error;
    }
  },
};
