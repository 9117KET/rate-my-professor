import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const chatService = {
  async saveChat(messages) {
    try {
      const chatRef = collection(db, "chats");
      await addDoc(chatRef, {
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving chat:", error);
      throw error;
    }
  },
};
