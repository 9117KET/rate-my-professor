/**
 * Rate Limiter Service
 *
 * Provides rate limiting functionality to prevent abuse of the application
 * Uses an in-memory cache (NodeCache) to track request counts per user and action
 * Different actions (chat, review submission, etc.) have different limits
 */
import NodeCache from "node-cache";

// Initialize cache with 1 hour TTL (time-to-live) for cached items
const rateLimitCache = new NodeCache({ stdTTL: 3600 });

// Rate limit configuration for different actions
// Each config defines the number of allowed requests within a time window
const RATE_LIMITS = {
  // Default/fallback rate limit
  DEFAULT: {
    limit: 50,
    windowMs: 3600000, // 1 hour in milliseconds
  },
  // Chat/message rate limit
  CHAT: {
    limit: 50,
    windowMs: 3600000, // 1 hour
  },
  // Review submission rate limit - more restricted (10 per day)
  REVIEW_SUBMISSION: {
    limit: 10,
    windowMs: 86400000, // 24 hours
  },
  // Review reaction rate limit (like/dislike)
  REVIEW_REACTION: {
    limit: 60,
    windowMs: 3600000, // 1 hour
  },
  // Reply submission rate limit
  REPLY_SUBMISSION: {
    limit: 20,
    windowMs: 3600000, // 1 hour
  },
  // Content moderation check rate limit
  CONTENT_MODERATION: {
    limit: 20,
    windowMs: 3600000, // 1 hour
  },
  // Bug report submission rate limit
  BUG_REPORT: {
    limit: 5,
    windowMs: 3600000, // 1 hour - prevent spam but allow legitimate reports
  },
};

export const rateLimiterService = {
  /**
   * Check if a user has exceeded their rate limit for a specific action
   * Increments the counter if the user hasn't exceeded their limit
   *
   * @param {string} identifier - User identifier (userId, IP, etc.)
   * @param {string} actionType - Type of action (DEFAULT, CHAT, REVIEW_SUBMISSION, etc.)
   * @returns {Object} - Rate limit check result with fields:
   *   - allowed: boolean indicating if the request is allowed
   *   - remaining: number of requests remaining in the current window
   *   - resetTime: timestamp when the rate limit window resets
   *   - limit: total number of requests allowed in the window
   *   - actionType: the action type being limited
   */
  async checkRateLimit(identifier, actionType = "DEFAULT") {
    const now = Date.now();

    // Get the rate limit configuration for this action type
    const rateLimit = RATE_LIMITS[actionType] || RATE_LIMITS.DEFAULT;
    const { limit, windowMs } = rateLimit;

    // Create a unique key for this user and action type
    const key = `rate_limit_${actionType}_${identifier}`;

    // Get existing rate limit data or initialize new data if none exists
    const rateLimitData = rateLimitCache.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Reset counter if the current time window has expired
    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 0;
      rateLimitData.resetTime = now + windowMs;
    }

    // Check if user has exceeded rate limit
    if (rateLimitData.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: rateLimitData.resetTime,
        limit,
        actionType,
      };
    }

    // Increment counter and update cache
    rateLimitData.count++;
    rateLimitCache.set(key, rateLimitData);

    return {
      allowed: true,
      remaining: limit - rateLimitData.count,
      resetTime: rateLimitData.resetTime,
      limit,
      actionType,
    };
  },

  /**
   * Get the current rate limit status without incrementing the counter
   * Useful for checking how many requests a user has left
   *
   * @param {string} identifier - User identifier (userId, IP, etc.)
   * @param {string} actionType - Type of action (DEFAULT, CHAT, REVIEW_SUBMISSION, etc.)
   * @returns {Object} - Rate limit status with fields:
   *   - count: current number of requests made in the window
   *   - remaining: number of requests remaining in the current window
   *   - resetTime: timestamp when the rate limit window resets
   *   - limit: total number of requests allowed in the window
   *   - actionType: the action type being checked
   */
  async getRateLimitStatus(identifier, actionType = "DEFAULT") {
    const now = Date.now();

    // Get the rate limit configuration for this action type
    const rateLimit = RATE_LIMITS[actionType] || RATE_LIMITS.DEFAULT;
    const { limit, windowMs } = rateLimit;

    // Create a unique key for this user and action type
    const key = `rate_limit_${actionType}_${identifier}`;

    // Get existing rate limit data or initialize new data if none exists
    const rateLimitData = rateLimitCache.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // If the window has expired, return a fresh status (but don't update the cache)
    if (now > rateLimitData.resetTime) {
      return {
        count: 0,
        remaining: limit,
        resetTime: now + windowMs,
        limit,
        actionType,
      };
    }

    return {
      count: rateLimitData.count,
      remaining: limit - rateLimitData.count,
      resetTime: rateLimitData.resetTime,
      limit,
      actionType,
    };
  },
};
