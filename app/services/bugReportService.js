import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getApp, initializeApp, getApps } from "firebase/app";

// Initialize Firebase if not already initialized
const getFirebaseApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  // Make sure we have the required environment variables
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  // Check if any required values are missing
  if (!apiKey || !projectId) {
    throw new Error(
      "Missing required Firebase configuration environment variables"
    );
  }

  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  };

  return initializeApp(firebaseConfig);
};

export const bugReportService = {
  async submitBugReport(reportData) {
    try {
      const app = getFirebaseApp();
      const db = getFirestore(app);

      // Add the report to Firestore
      const docRef = await addDoc(collection(db, "bug_reports"), {
        ...reportData,
        id: uuidv4(),
        timestamp: serverTimestamp(),
        status: "new",
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error submitting bug report:", error);
      throw error;
    }
  },
};
