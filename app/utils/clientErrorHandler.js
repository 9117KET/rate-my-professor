/**
 * Client-side error handling utilities
 * Helps standardize error handling in components and prevent sensitive information leakage
 */

// User-friendly error messages for common error types
const ERROR_MESSAGES = {
  // Rate limiting
  RATE_LIMIT: "You've reached the rate limit. Please try again later.",

  // Network errors
  NETWORK:
    "Unable to connect to the server. Please check your internet connection.",
  TIMEOUT: "The request timed out. Please try again.",

  // Authentication errors
  AUTH: "You need to be logged in to perform this action.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",

  // Permission errors
  PERMISSION: "You don't have permission to perform this action.",

  // Resource errors
  NOT_FOUND: "The requested content was not found.",
  ALREADY_EXISTS: "This item already exists.",

  // Input validation
  VALIDATION: "Please check your input and try again.",

  // Generic errors
  GENERIC: "An error occurred. Please try again later.",
  SERVER: "The server encountered an error. Our team has been notified.",

  // Content moderation
  MODERATION: "Your content could not be submitted due to policy violations.",
};

/**
 * Formats an error for display to the user
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export function formatClientError(error) {
  if (!error) {
    return ERROR_MESSAGES.GENERIC;
  }

  // Extract API error message if available
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error.message || ERROR_MESSAGES.SERVER;
  }

  const errorMessage = error.message || "";

  // Check for specific types of errors
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many requests")
  ) {
    return ERROR_MESSAGES.RATE_LIMIT;
  }

  if (
    errorMessage.includes("network") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("offline") ||
    error.name === "NetworkError"
  ) {
    return ERROR_MESSAGES.NETWORK;
  }

  if (errorMessage.includes("timeout") || error.name === "TimeoutError") {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (
    errorMessage.includes("authentication") ||
    errorMessage.includes("login") ||
    errorMessage.includes("unauthorized") ||
    error.status === 401
  ) {
    return ERROR_MESSAGES.AUTH;
  }

  if (
    errorMessage.includes("permission") ||
    errorMessage.includes("forbidden") ||
    error.status === 403
  ) {
    return ERROR_MESSAGES.PERMISSION;
  }

  if (errorMessage.includes("not found") || error.status === 404) {
    return ERROR_MESSAGES.NOT_FOUND;
  }

  if (errorMessage.includes("already exists") || error.status === 409) {
    return ERROR_MESSAGES.ALREADY_EXISTS;
  }

  if (
    errorMessage.includes("validation") ||
    errorMessage.includes("invalid") ||
    error.status === 400
  ) {
    return ERROR_MESSAGES.VALIDATION;
  }

  if (
    errorMessage.includes("moderation") ||
    errorMessage.includes("policy violation")
  ) {
    return ERROR_MESSAGES.MODERATION;
  }

  // Special case for rate limit errors with timing information
  if (errorMessage.includes("Rate limit exceeded")) {
    // Keep this specific error as it contains useful information about when they can try again
    return errorMessage;
  }

  // Default to generic error
  return process.env.NODE_ENV === "development"
    ? `Error: ${errorMessage}` // More details in development
    : ERROR_MESSAGES.GENERIC; // Generic message in production
}

/**
 * Logs client errors to the console and potentially to a monitoring service
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @param {Object} additionalInfo - Additional information about the error
 */
export function logClientError(
  error,
  context = "unknown",
  additionalInfo = {}
) {
  console.error(`Client Error in ${context}:`, {
    message: error?.message,
    stack: error?.stack,
    ...additionalInfo,
  });

  // Here you could add error reporting to a service like Sentry
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     tags: { context },
  //     extra: additionalInfo
  //   });
  // }
}

/**
 * Handles API errors from fetch responses
 * @param {Response} response - Fetch API response object
 * @returns {Promise<Object>} - Parsed error data
 */
export async function handleApiError(response) {
  try {
    const errorData = await response.json();
    const error = new Error(
      errorData.error?.message ||
        errorData.message ||
        `API error: ${response.status}`
    );
    error.status = response.status;
    error.data = errorData;
    return error;
  } catch (e) {
    // If we can't parse the JSON, create a generic error
    const error = new Error(`API error: ${response.status}`);
    error.status = response.status;
    return error;
  }
}
