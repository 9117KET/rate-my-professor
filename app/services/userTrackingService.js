import { v4 as uuidv4 } from "uuid";

export const userTrackingService = {
  generateUserId() {
    return uuidv4();
  },

  // This will be called from the client side
  getOrCreateUserId() {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      throw new Error("This function must be called from the client side");
    }

    // Try to get existing user ID from localStorage
    let userId = localStorage.getItem("rate_my_professor_user_id");

    // If no user ID exists, create one and store it
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem("rate_my_professor_user_id", userId);
    }

    return userId;
  },

  // Optional: Add a way to reset the user ID if needed
  resetUserId() {
    if (typeof window === "undefined") {
      throw new Error("This function must be called from the client side");
    }
    localStorage.removeItem("rate_my_professor_user_id");
  },
};
