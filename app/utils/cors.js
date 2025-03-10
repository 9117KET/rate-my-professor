/**
 * CORS Middleware
 *
 * This middleware allows you to configure CORS for your API routes.
 * It sets appropriate headers to control which domains can access your API
 * and what HTTP methods are allowed.
 */

// Default CORS configuration
const DEFAULT_CORS_CONFIG = {
  // Allow requests only from your own domain in production
  // In development, allow requests from localhost development servers
  allowedOrigins:
    process.env.NODE_ENV === "production"
      ? [
          // Add your production domains here
          process.env.NEXT_PUBLIC_SITE_URL || "https://ratemycubprofessor.com",
          "https://ratemycubprofessor.com",
        ]
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
        ],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Anonymous-User-ID"],
  // Whether to allow credentials (cookies, authorization headers)
  allowCredentials: true,
  // How long the preflight results can be cached in seconds
  maxAge: 86400, // 24 hours
};

/**
 * Apply CORS headers to a Response object
 * @param {Response} response - The Response object to apply CORS headers to
 * @param {Object} config - CORS configuration options
 * @returns {Response} - The Response object with CORS headers
 */
export function applyCorsHeaders(response, customConfig = {}) {
  const config = { ...DEFAULT_CORS_CONFIG, ...customConfig };
  const headers = response.headers;

  // Get the origin from the request (if provided)
  const origin = headers.get("Origin") || "";

  // Check if the origin is allowed
  const isAllowedOrigin =
    config.allowedOrigins.includes(origin) ||
    config.allowedOrigins.includes("*");

  // Set the appropriate Access-Control-Allow-Origin header
  if (isAllowedOrigin) {
    headers.set("Access-Control-Allow-Origin", origin);
  } else if (config.allowedOrigins.includes("*")) {
    headers.set("Access-Control-Allow-Origin", "*");
  }

  // Set other CORS headers
  headers.set("Access-Control-Allow-Methods", config.allowedMethods.join(", "));
  headers.set("Access-Control-Allow-Headers", config.allowedHeaders.join(", "));

  if (config.allowCredentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set("Access-Control-Max-Age", config.maxAge.toString());

  return response;
}

/**
 * CORS middleware for API routes
 * @param {Object} req - The request object
 * @param {Object} customConfig - Custom CORS configuration
 * @returns {Response|null} - Returns a Response for OPTIONS requests, null otherwise
 */
export async function cors(req, customConfig = {}) {
  const config = { ...DEFAULT_CORS_CONFIG, ...customConfig };

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    const response = new Response(null, { status: 204 }); // No content
    return applyCorsHeaders(response, config);
  }

  // For other requests, return null to continue processing
  return null;
}

/**
 * Higher-order function to wrap API handlers with CORS
 * @param {Function} handler - The API route handler function
 * @param {Object} customConfig - Custom CORS configuration
 * @returns {Function} - A new handler function with CORS applied
 */
export function withCors(handler, customConfig = {}) {
  return async (req) => {
    // Handle OPTIONS request (preflight)
    const corsResult = await cors(req, customConfig);
    if (corsResult) return corsResult;

    // Call the original handler
    const response = await handler(req);

    // Apply CORS headers to the response
    return applyCorsHeaders(response, customConfig);
  };
}
