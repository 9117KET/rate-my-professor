/**
 * Error handling utilities for the application
 * Provides centralized error handling with sanitization to prevent leaking sensitive information
 */

// Error types with user-friendly messages
const ERROR_TYPES = {
  // Authentication errors
  AUTHENTICATION_REQUIRED: "Authentication is required for this action",
  INVALID_CREDENTIALS: "Invalid authentication credentials",
  SESSION_EXPIRED: "Your session has expired, please log in again",

  // Authorization errors
  PERMISSION_DENIED: "You do not have permission to perform this action",
  INSUFFICIENT_RIGHTS: "Insufficient rights to access this resource",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",

  // Input validation
  INVALID_INPUT: "The provided input is invalid",
  MISSING_REQUIRED_FIELD: "Required information is missing",

  // Resource errors
  RESOURCE_NOT_FOUND: "The requested resource was not found",
  RESOURCE_ALREADY_EXISTS: "This resource already exists",
  RESOURCE_CONFLICT: "A conflict occurred with the existing data",

  // API errors
  API_ERROR: "An error occurred while processing your request",
  EXTERNAL_SERVICE_ERROR:
    "A service required to process your request is currently unavailable",

  // Database errors
  DATABASE_ERROR: "A database error occurred",

  // Server errors
  SERVER_ERROR: "An unexpected error occurred, please try again later",
  MAINTENANCE_MODE:
    "The system is currently under maintenance, please try again later",

  // Default error
  DEFAULT: "An error occurred while processing your request",
};

/**
 * Maps a raw error to a safe user-friendly error
 * @param {Error} error - The original error
 * @param {string} errorType - The type of error from ERROR_TYPES
 * @returns {Object} - Sanitized error object safe for user display
 */
export function sanitizeError(error, errorType = "DEFAULT") {
  // Select the appropriate user-friendly message
  const userMessage = ERROR_TYPES[errorType] || ERROR_TYPES.DEFAULT;

  // For development, we can include more details about the error
  if (process.env.NODE_ENV === "development") {
    return {
      message: userMessage,
      detail: error?.message || "No additional details available",
      stack: error?.stack,
    };
  }

  // For production, only return the user-friendly message
  return {
    message: userMessage,
    // Include a request ID if available for support reference
    requestId: getRequestId(),
  };
}

/**
 * Creates a standard API error response
 * @param {Error} error - The original error
 * @param {string} errorType - The type of error from ERROR_TYPES
 * @param {number} statusCode - HTTP status code
 * @returns {Response} - A standardized error response
 */
export function createErrorResponse(
  error,
  errorType = "DEFAULT",
  statusCode = 500
) {
  console.error("API Error:", {
    type: errorType,
    message: error?.message,
    stack: error?.stack,
  });

  // Create a sanitized error object for the response
  const sanitizedError = sanitizeError(error, errorType);

  return new Response(JSON.stringify({ error: sanitizedError }), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Logs an error with appropriate context for server-side logging
 * @param {Error} error - The error to log
 * @param {string} context - The context where the error occurred
 * @param {Object} additionalInfo - Any additional information to log
 */
export function logError(error, context = "unknown", additionalInfo = {}) {
  console.error(`Error in ${context}:`, {
    message: error?.message,
    stack: error?.stack,
    ...additionalInfo,
  });
}

/**
 * Generates a request ID for tracking errors across logs
 * @returns {string} A unique request ID
 */
function getRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Maps common error causes to appropriate error types
 * @param {Error} error - The error to analyze
 * @returns {string} - The identified error type
 */
export function identifyErrorType(error) {
  const message = error?.message?.toLowerCase() || "";

  // Authentication and authorization errors
  if (message.includes("auth") && message.includes("required")) {
    return "AUTHENTICATION_REQUIRED";
  }
  if (message.includes("permission") || message.includes("unauthorized")) {
    return "PERMISSION_DENIED";
  }
  if (
    message.includes("token") &&
    (message.includes("invalid") || message.includes("expired"))
  ) {
    return "SESSION_EXPIRED";
  }

  // Rate limiting errors
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "RATE_LIMIT_EXCEEDED";
  }

  // Database related errors
  if (message.includes("not found") || message.includes("404")) {
    return "RESOURCE_NOT_FOUND";
  }
  if (message.includes("conflict") || message.includes("duplicate")) {
    return "RESOURCE_CONFLICT";
  }
  if (message.includes("database") || message.includes("db")) {
    return "DATABASE_ERROR";
  }

  // API errors
  if (message.includes("api") || message.includes("service")) {
    return "API_ERROR";
  }

  // OpenAI API key errors (401 Unauthorized)
  if (
    message.includes("401") ||
    message.includes("incorrect api key") ||
    message.includes("invalid api key") ||
    message.includes("authentication")
  ) {
    return "EXTERNAL_SERVICE_ERROR";
  }

  // Input validation
  if (message.includes("invalid") || message.includes("validation")) {
    return "INVALID_INPUT";
  }
  if (message.includes("required") || message.includes("missing")) {
    return "MISSING_REQUIRED_FIELD";
  }

  // Default to server error for anything else
  return "SERVER_ERROR";
}
