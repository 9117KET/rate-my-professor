import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { userTrackingService } from "./userTrackingService";

// Rate limiting configuration
const RATE_LIMIT = {
  maxSubmissions: 5, // Maximum number of submissions allowed
  timeWindow: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
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
   * Checks if the user has exceeded the rate limit
   * @param {string} userId - The user's ID
   * @returns {Promise<{allowed: boolean, remaining: number}>} Rate limit status
   */
  async checkRateLimit(userId) {
    // If no userId is provided, treat as a new user
    if (!userId) {
      return {
        allowed: true,
        remaining: RATE_LIMIT.maxSubmissions,
      };
    }

    const db = getDb();
    const now = Timestamp.now();
    const timeWindowStart = new Timestamp(
      now.seconds - RATE_LIMIT.timeWindow / 1000,
      now.nanoseconds
    );

    const submissionsRef = collection(db, "bugReports");
    const q = query(
      submissionsRef,
      where("userId", "==", userId),
      where("timestamp", ">=", timeWindowStart)
    );

    const querySnapshot = await getDocs(q);
    const submissionCount = querySnapshot.size;

    return {
      allowed: submissionCount < RATE_LIMIT.maxSubmissions,
      remaining: Math.max(0, RATE_LIMIT.maxSubmissions - submissionCount),
    };
  },

  /**
   * Submits a bug report with rate limiting
   * @param {Object} reportData - The bug report data
   * @returns {Promise<{success: boolean, error?: string, reportId?: string}>} Submission result
   */
  async submitBugReport(reportData) {
    try {
      const userId = userTrackingService.getOrCreateUserId();

      // Check rate limit
      const rateLimitStatus = await this.checkRateLimit(userId);
      if (!rateLimitStatus.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded. Please try again in ${Math.ceil(
            RATE_LIMIT.timeWindow / (60 * 60 * 1000)
          )} hours.`,
          remaining: rateLimitStatus.remaining,
        };
      }

      const db = getDb();
      const reportRef = collection(db, "bugReports");

      const report = {
        ...reportData,
        userId,
        timestamp: serverTimestamp(),
        reportId: uuidv4(),
        systemInfo: getSystemInfo(),
      };

      const docRef = await addDoc(reportRef, report);

      return {
        success: true,
        reportId: docRef.id,
        remaining: rateLimitStatus.remaining,
      };
    } catch (error) {
      console.error("Error submitting bug report:", error);
      return {
        success: false,
        error: "Failed to submit bug report. Please try again later.",
      };
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
