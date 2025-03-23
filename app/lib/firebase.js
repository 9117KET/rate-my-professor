// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Import getAnalytics dynamically on the client side only
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Remove the debugging console log that was checking environment variables
// console.log("ENV VARS CHECK:", {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Defined" : "Undefined",
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
//     ? "Defined"
//     : "Undefined",
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
//     ? "Defined"
//     : "Undefined",
//   NODE_ENV: process.env.NODE_ENV,
// });

// Required environment variables for Firebase configuration
// These should be defined in .env.local for local development
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
];

/**
 * Custom error class for Firebase configuration issues
 * Used to distinguish configuration errors from runtime errors
 */
class FirebaseConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "FirebaseConfigError";
  }
}

/**
 * Safely logs Firebase errors without exposing sensitive information
 * Redacts potentially sensitive data in production environments
 *
 * @param {Error} error - The error object to log
 * @param {string} context - Context information to help identify where the error occurred
 */
function logFirebaseError(error, context = "firebase") {
  const sensitiveInfoPattern = /(key|token|secret|password|credential|auth)/i;

  // Only log detailed errors in development
  if (process.env.NODE_ENV === "development") {
    console.error(`Firebase Error (${context}):`, {
      name: error.name,
      message: error.message,
      // Redact potentially sensitive information in the stack trace
      stack: error.stack
        ?.split("\n")
        .map((line) =>
          sensitiveInfoPattern.test(line)
            ? "[REDACTED SENSITIVE INFORMATION]"
            : line
        )
        .join("\n"),
    });
  } else {
    // In production, log minimal information
    console.error(`Firebase Error (${context}): ${error.name}`);
  }
}

// Environment variable check temporarily commented out
// if (process.env.NODE_ENV === "development") {
//   const missingEnvVars = requiredEnvVars.filter(
//     (varName) => !process.env[varName]
//   );
//   if (missingEnvVars.length > 0) {
//     console.error(
//       `Missing required environment variables: ${missingEnvVars.join(", ")}`
//     );
//     console.error("Please check your .env.local file");
//   }
// }

// Firebase configuration object with project settings
// NOTE: In production, these values should come from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyDSEjW_KrlgT8qHEoaeFYlNbqgvyVETGyY",
  authDomain: "ratemyprofessor-99fb5.firebaseapp.com",
  projectId: "ratemyprofessor-99fb5",
  storageBucket: "ratemyprofessor-99fb5.firebasestorage.app",
  messagingSenderId: "177122975941",
  appId: "1:177122975941:web:17578a39295416155150ac",
  measurementId: "G-HMGH83WRN5",
};

// Initialize Firebase objects with default values
let app;
let db = null;
let analytics = null;

// Initialize Firebase with error handling to prevent app crashes
try {
  // Validate minimum required configuration
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new FirebaseConfigError(
      "Missing required Firebase configuration. Check your environment variables."
    );
  }

  // Initialize Firebase app and Firestore database
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  logFirebaseError(error, "initialization");

  // Show more detailed error information in development
  if (process.env.NODE_ENV === "development") {
    console.error(
      "Firebase initialization failed. The app will continue with limited functionality."
    );
  }
}

// Export Firestore database instance for use in other modules
export { db };

/**
 * Lazy-loads Firebase Analytics only on the client side
 * This prevents SSR issues and reduces initial bundle size
 *
 * @returns {object|null} The Analytics instance or null if initialization failed
 */
export const initAnalytics = () => {
  if (typeof window !== "undefined" && !analytics && app) {
    try {
      import("firebase/analytics")
        .then(({ getAnalytics }) => {
          analytics = getAnalytics(app);
        })
        .catch((error) => {
          logFirebaseError(error, "analytics");
        });
    } catch (error) {
      logFirebaseError(error, "analytics-import");
    }
  }
  return analytics;
};
