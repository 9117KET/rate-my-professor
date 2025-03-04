import NodeCache from "node-cache";

// Initialize cache with 1 hour TTL
const rateLimitCache = new NodeCache({ stdTTL: 3600 });

// Default rate limit: 50 messages per hour
const DEFAULT_RATE_LIMIT = 50;
const DEFAULT_WINDOW_MS = 3600000; // 1 hour in milliseconds

export const rateLimiterService = {
  async checkRateLimit(identifier) {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;

    // Get existing rate limit data
    const rateLimitData = rateLimitCache.get(key) || {
      count: 0,
      resetTime: now + DEFAULT_WINDOW_MS,
    };

    // Check if we need to reset the counter
    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 0;
      rateLimitData.resetTime = now + DEFAULT_WINDOW_MS;
    }

    // Check if user has exceeded rate limit
    if (rateLimitData.count >= DEFAULT_RATE_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: rateLimitData.resetTime,
      };
    }

    // Increment counter
    rateLimitData.count++;
    rateLimitCache.set(key, rateLimitData);

    return {
      allowed: true,
      remaining: DEFAULT_RATE_LIMIT - rateLimitData.count,
      resetTime: rateLimitData.resetTime,
    };
  },
};
