import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getApp, initializeApp, getApps } from "firebase/app";
import { userTrackingService } from "./userTrackingService";

/**
 * Initializes or retrieves the Firebase app instance
 * @returns {Object} Firebase app instance
 */
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

/**
 * Gets browser and system information safely
 * @returns {Object} Browser and system information
 */
const getSystemInfo = () => {
  if (typeof window === "undefined") {
    return {
      userAgent: "Server Side Rendering",
      platform: "unknown",
      language: "unknown",
      screenSize: { width: 0, height: 0 },
      viewportSize: { width: 0, height: 0 },
    };
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height,
    },
    viewportSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    browserName: getBrowserName(),
  };
};

/**
 * Detects the user's browser name
 * @returns {string} Browser name
 */
const getBrowserName = () => {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";

  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
  }

  return browserName;
};

export const bugReportService = {
  /**
   * Submits a bug report to Firestore with enhanced contextual information
   * @param {Object} reportData Basic report data from the form
   * @returns {Object} Result with success status and report ID
   */
  async submitBugReport(reportData) {
    try {
      const app = getFirebaseApp();
      const db = getFirestore(app);
      const reportId = uuidv4();

      // Get user ID if available
      let userId = "anonymous";
      try {
        if (typeof window !== "undefined") {
          userId = userTrackingService.getOrCreateUserId();
        }
      } catch (userIdError) {
        console.warn("Could not retrieve user ID:", userIdError);
      }

      // Get privacy settings
      let privacySettings = null;
      try {
        if (typeof window !== "undefined") {
          privacySettings = userTrackingService.getPrivacySettings();
        }
      } catch (privacyError) {
        console.warn("Could not retrieve privacy settings:", privacyError);
      }

      // Collect navigation and route information
      const routeInfo =
        typeof window !== "undefined"
          ? {
              path: window.location.pathname,
              query: window.location.search,
              hash: window.location.hash,
              referrer: document.referrer || null,
            }
          : null;

      // System information
      const systemInfo = getSystemInfo();

      // Add the report to Firestore with enhanced data
      const docRef = await addDoc(collection(db, "bug_reports"), {
        ...reportData,
        id: reportId,
        userId,
        timestamp: serverTimestamp(),
        status: "new",
        systemInfo,
        routeInfo,
        privacyConsent: privacySettings?.analyticsConsent || false,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        localStorageAvailable:
          typeof window !== "undefined" ? !!window.localStorage : false,
      });

      return { success: true, id: docRef.id, reportId };
    } catch (error) {
      console.error("Error submitting bug report:", error);
      throw error;
    }
  },

  /**
   * Gets a list of valid issue types for bug reports
   * @returns {Array} List of issue types with labels and descriptions
   */
  getIssueTypes() {
    return [
      {
        value: "bug",
        label: "Bug or Error",
        description: "Something isn't working as expected",
      },
      {
        value: "feature",
        label: "Feature Request",
        description: "Suggest a new feature or improvement",
      },
      {
        value: "content",
        label: "Content Issue",
        description: "Report incorrect or inappropriate content",
      },
      {
        value: "performance",
        label: "Performance Issue",
        description: "The app is slow or unresponsive",
      },
      {
        value: "usability",
        label: "Usability Issue",
        description: "The app is difficult to use or understand",
      },
      {
        value: "other",
        label: "Other",
        description: "Something else not covered by the categories above",
      },
    ];
  },
};
