import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class AuthService {
  constructor() {
    this.auth = getFirebaseAuth();
    this.currentUser = null;
    this.authInitialized = false;
  }

  async initializeAuth() {
    if (this.authInitialized) {
      return;
    }

    try {
      // Set up auth state listener
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.authInitialized = true;
      });

      // If no user is signed in, sign in anonymously
      if (!this.currentUser) {
        const userCredential = await signInAnonymously(this.auth);
        this.currentUser = userCredential.user;
      }

      return this.currentUser;
    } catch (error) {
      console.error("Authentication initialization failed:", error);
      throw new AuthenticationError(
        "Failed to initialize authentication. Please try again."
      );
    }
  }

  async getCurrentUserId() {
    if (!this.authInitialized) {
      await this.initializeAuth();
    }

    if (!this.currentUser) {
      throw new AuthenticationError("No authenticated user found");
    }

    return this.currentUser.uid;
  }

  isAuthenticated() {
    return this.authInitialized && this.currentUser !== null;
  }

  async signOut() {
    try {
      await this.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      console.error("Sign out failed:", error);
      throw new AuthenticationError("Failed to sign out");
    }
  }
}

export const authService = new AuthService();
