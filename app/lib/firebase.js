// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
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

// Initialize Firebase objects with default values
let firebaseApp = null;
let firestoreDb = null;
let analytics = null;
let auth = null;

/**
 * Custom error class for Firebase configuration issues
 */
class FirebaseConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "FirebaseConfigError";
  }
}

/**
 * Safely logs Firebase errors without exposing sensitive information
 */
function logFirebaseError(error, context = "firebase") {
  const sensitiveInfoPattern = /(key|token|secret|password|credential|auth)/i;

  if (process.env.NODE_ENV === "development") {
    console.error(`Firebase Error (${context}):`, {
      name: error.name,
      message: error.message,
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

export function initializeFirebase() {
  try {
    // Return existing app if already initialized
    if (getApps().length > 0) {
      firebaseApp = getApp();
      firestoreDb = getFirestore(firebaseApp);
      auth = getAuth(firebaseApp);
      return firebaseApp;
    }

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // Validate required config before initialization
    const missingVars = Object.entries(firebaseConfig)
      .filter(([key, value]) => !value && key !== "measurementId")
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new FirebaseConfigError(
        `Missing required Firebase configuration variables: ${missingVars.join(
          ", "
        )}`
      );
    }

    // Log environment variables availability (without exposing values)
    if (process.env.NODE_ENV === "development") {
      console.log("Firebase config check:", {
        apiKey: !!firebaseConfig.apiKey,
        authDomain: !!firebaseConfig.authDomain,
        projectId: !!firebaseConfig.projectId,
        storageBucket: !!firebaseConfig.storageBucket,
        messagingSenderId: !!firebaseConfig.messagingSenderId,
        appId: !!firebaseConfig.appId,
        measurementId: !!firebaseConfig.measurementId,
      });
    }

    // Initialize Firebase app
    firebaseApp = initializeApp(firebaseConfig);

    // Initialize Firestore
    firestoreDb = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);

    return firebaseApp;
  } catch (error) {
    logFirebaseError(error, "initialization");
    throw error;
  }
}

export function getFirebaseApp() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp;
}

export function getDb() {
  if (!firestoreDb) {
    initializeFirebase();
  }
  return firestoreDb;
}

export function getFirebaseAuth() {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

/**
 * Lazy-loads Firebase Analytics only on the client side
 */
export const initAnalytics = () => {
  if (typeof window !== "undefined" && !analytics && firebaseApp) {
    try {
      import("firebase/analytics")
        .then(({ getAnalytics }) => {
          analytics = getAnalytics(firebaseApp);
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

// Export initialized Firestore database instance
export { firestoreDb };
