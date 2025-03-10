import NodeCache from "node-cache";

// Initialize cache with 1 hour TTL
const rateLimitCache = new NodeCache({ stdTTL: 3600 });

// Rate limit configuration for different actions
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
  // Review submission rate limit
  REVIEW_SUBMISSION: {
    limit: 10,
    windowMs: 86400000, // 24 hours
  },
  // Review reaction rate limit
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
};

export const rateLimiterService = {
  /**
   * Check if a user has exceeded their rate limit for a specific action
   * @param {string} identifier - User identifier (userId, IP, etc.)
   * @param {string} actionType - Type of action (DEFAULT, CHAT, REVIEW_SUBMISSION, etc.)
   * @returns {Object} - Rate limit check result
   */
  async checkRateLimit(identifier, actionType = "DEFAULT") {
    const now = Date.now();

    // Get the rate limit configuration for this action type
    const rateLimit = RATE_LIMITS[actionType] || RATE_LIMITS.DEFAULT;
    const { limit, windowMs } = rateLimit;

    // Create a unique key for this user and action type
    const key = `rate_limit_${actionType}_${identifier}`;

    // Get existing rate limit data
    const rateLimitData = rateLimitCache.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Check if we need to reset the counter
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

    // Increment counter
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
   * @param {string} identifier - User identifier (userId, IP, etc.)
   * @param {string} actionType - Type of action (DEFAULT, CHAT, REVIEW_SUBMISSION, etc.)
   * @returns {Object} - Rate limit status
   */
  async getRateLimitStatus(identifier, actionType = "DEFAULT") {
    const now = Date.now();

    // Get the rate limit configuration for this action type
    const rateLimit = RATE_LIMITS[actionType] || RATE_LIMITS.DEFAULT;
    const { limit, windowMs } = rateLimit;

    // Create a unique key for this user and action type
    const key = `rate_limit_${actionType}_${identifier}`;

    // Get existing rate limit data
    const rateLimitData = rateLimitCache.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Check if we need to reset the counter (but don't modify it)
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
