import { rateLimiterService } from "./rateLimiterService";

// List of words to filter (this is a basic list - you may want to expand it)
const inappropriateWords = [
  // Profanity and slurs
  "fuck",
  "shit",
  "ass",
  "bitch",
  "damn",
  "crap",
  "piss",
  // Discriminatory terms
  "racist",
  "racism",
  "nazi",
  "sexist",
  "homophobic",
  "retard",
  // Negative personal attacks
  "stupid",
  "idiot",
  "dumb",
  "moron",
  "incompetent",
  "useless",
  "terrible",
  "horrible",
  "worst",
  "sucks",
  "hate",
  // Add more words as needed
];

// Content moderation rules
const contentRules = {
  maxConsecutiveCapitals: 10, // Maximum consecutive capital letters
  maxExclamationMarks: 3, // Maximum consecutive exclamation marks
  minWordCount: 5, // Minimum number of words required
  maxWordCount: 500, // Maximum number of words allowed
};

class ContentModerationService {
  constructor() {
    this.inappropriateWords = inappropriateWords;
    this.contentRules = contentRules;
  }

  checkForInappropriateContent(text) {
    const issues = [];
    const words = text.toLowerCase().split(/\s+/);

    // Check for inappropriate words
    const foundInappropriateWords = words.filter((word) =>
      this.inappropriateWords.some((inappropriate) =>
        word.includes(inappropriate)
      )
    );

    if (foundInappropriateWords.length > 0) {
      issues.push("Review contains inappropriate language or personal attacks");
    }

    // Check word count
    if (words.length < this.contentRules.minWordCount) {
      issues.push(
        `Review must be at least ${this.contentRules.minWordCount} words`
      );
    }
    if (words.length > this.contentRules.maxWordCount) {
      issues.push(
        `Review cannot exceed ${this.contentRules.maxWordCount} words`
      );
    }

    // Check for excessive capitals (shouting)
    const consecutiveCapitalsMatch = text.match(/[A-Z]{10,}/g);
    if (consecutiveCapitalsMatch) {
      issues.push("Review contains excessive capital letters");
    }

    // Check for excessive punctuation
    const excessiveExclamations = text.match(/!{3,}/g);
    if (excessiveExclamations) {
      issues.push("Review contains excessive exclamation marks");
    }

    // Additional checks for potentially discriminatory content
    const discriminatoryPhrases = [
      "go back to",
      "you people",
      "these people",
      "those people",
      "not qualified",
      "doesn't belong",
      "don't belong",
    ];

    for (const phrase of discriminatoryPhrases) {
      if (text.toLowerCase().includes(phrase)) {
        issues.push("Review contains potentially discriminatory language");
        break;
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
    };
  }

  sanitizeText(text) {
    // Basic text sanitization
    return text
      .replace(/[<>]/g, "") // Remove HTML tags
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .trim();
  }

  async moderateContent(text, userId = null) {
    // If userId is provided, check rate limit
    if (userId) {
      const rateLimitResult = await rateLimiterService.checkRateLimit(
        userId,
        "CONTENT_MODERATION"
      );

      if (!rateLimitResult.allowed) {
        throw new Error(
          `Rate limit exceeded for content moderation checks. You can make ${
            rateLimitResult.limit
          } moderation checks per hour. Please try again in ${Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 60000
          )} minutes.`
        );
      }
    }

    // Sanitize the input first
    const sanitizedText = this.sanitizeText(text);

    // Check for inappropriate content
    const result = this.checkForInappropriateContent(sanitizedText);

    return {
      ...result,
      sanitizedText: result.isValid ? sanitizedText : null,
    };
  }
}

// Create and export a single instance
const contentModerationService = new ContentModerationService();
export { contentModerationService };
