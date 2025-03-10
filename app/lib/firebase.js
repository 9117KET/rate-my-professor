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

// List of Firebase config variables
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
];

// Create custom error for configuration issues
class FirebaseConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "FirebaseConfigError";
  }
}

// Function to safely log errors without exposing sensitive information
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

// Comment out the environment variable check temporarily
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

// Your web app's Firebase configuration - temporarily hardcoding for debugging
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

// Add error handling to prevent app crashes if environment variables are missing
try {
  // Make sure we have the minimum required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new FirebaseConfigError(
      "Missing required Firebase configuration. Check your environment variables."
    );
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  logFirebaseError(error, "initialization");

  // In development, show a more specific error
  if (process.env.NODE_ENV === "development") {
    console.error(
      "Firebase initialization failed. The app will continue with limited functionality."
    );
  }
}

// Export Firestore instance
export { db };

// Export function to initialize analytics on client side only
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
