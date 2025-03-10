import { v4 as uuidv4 } from "uuid";

// Constants for localStorage keys
const USER_ID_KEY = "rate_my_professor_user_id";
const PRIVACY_CONSENT_KEY = "rate_my_professor_privacy_consent";
const PRIVACY_SETTINGS_KEY = "rate_my_professor_privacy_settings";

export const userTrackingService = {
  /**
   * Generates a new random UUID
   * @returns {string} A new UUID
   */
  generateUserId() {
    return uuidv4();
  },

  /**
   * Gets the existing user ID or creates a new one
   * @returns {string} The user ID
   */
  getOrCreateUserId() {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      throw new Error("This function must be called from the client side");
    }

    // Try to get existing user ID from localStorage
    let userId = localStorage.getItem(USER_ID_KEY);

    // If no user ID exists, create one and store it
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem(USER_ID_KEY, userId);

      // Set default privacy settings for new users
      this.setPrivacySettings({
        analyticsConsent: true,
        contentStorageConsent: true,
        lastUpdated: new Date().toISOString(),
      });
    }

    return userId;
  },

  /**
   * Resets the user ID by removing it from localStorage
   * This will cause a new ID to be generated on next use
   */
  resetUserId() {
    if (typeof window === "undefined") {
      throw new Error("This function must be called from the client side");
    }
    localStorage.removeItem(USER_ID_KEY);
  },

  /**
   * Records user's consent to the privacy policy
   * @param {boolean} hasConsented Whether the user has consented
   */
  setPrivacyConsent(hasConsented) {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      PRIVACY_CONSENT_KEY,
      JSON.stringify({
        consented: hasConsented,
        timestamp: new Date().toISOString(),
        version: "1.0", // Update this when privacy policy changes
      })
    );
  },

  /**
   * Checks if the user has consented to the privacy policy
   * @returns {Object|null} Consent information or null if not consented
   */
  getPrivacyConsent() {
    if (typeof window === "undefined") {
      return null;
    }

    const consentData = localStorage.getItem(PRIVACY_CONSENT_KEY);
    if (!consentData) {
      return null;
    }

    try {
      return JSON.parse(consentData);
    } catch (e) {
      return null;
    }
  },

  /**
   * Sets user's privacy settings
   * @param {Object} settings Privacy settings object
   */
  setPrivacySettings(settings) {
    if (typeof window === "undefined") {
      return;
    }

    const currentSettings = this.getPrivacySettings() || {};
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(updatedSettings));
  },

  /**
   * Gets user's privacy settings
   * @returns {Object|null} Privacy settings or null if not set
   */
  getPrivacySettings() {
    if (typeof window === "undefined") {
      return null;
    }

    const settingsData = localStorage.getItem(PRIVACY_SETTINGS_KEY);
    if (!settingsData) {
      return null;
    }

    try {
      return JSON.parse(settingsData);
    } catch (e) {
      return null;
    }
  },

  /**
   * Deletes all user tracking data from localStorage
   */
  deleteAllUserData() {
    if (typeof window === "undefined") {
      return;
    }

    // Remove all Rate My Professor related data
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(PRIVACY_CONSENT_KEY);
    localStorage.removeItem(PRIVACY_SETTINGS_KEY);

    // Remove any other app-specific data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("rate_my_professor_")) {
        keysToRemove.push(key);
      }
    }

    // Remove the collected keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  },
};
