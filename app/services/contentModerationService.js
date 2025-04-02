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
  // Negative personal attacks - only include strong negative terms
  "stupid",
  "idiot",
  "dumb",
  "moron",
  "incompetent",
  // Remove overly broad terms that might appear in legitimate reviews
  // "useless",
  // "terrible",
  // "horrible",
  // "worst",
  // "sucks",
  // "hate",
  // Add more words as needed
];

// Content moderation rules
const contentRules = {
  maxConsecutiveCapitals: 10, // Maximum consecutive capital letters
  maxExclamationMarks: 3, // Maximum consecutive exclamation marks
  minWordCount: 5, // Minimum number of words required
  maxWordCount: 500, // Maximum number of words allowed
};

// Constants for content validation
const contentLimits = {
  minReviewLength: 10, // Minimum number of characters for review text
  maxReviewLength: 1000, // Maximum number of characters for review text
  minProfessorNameLength: 2, // Minimum number of characters for professor name
  maxProfessorNameLength: 100, // Maximum number of characters for professor name
  minSubjectLength: 2, // Minimum number of characters for subject
  maxSubjectLength: 100, // Maximum number of characters for subject
  maxWordCount: 500, // Maximum number of words allowed
};

/**
 * Service for moderating content using OpenAI's moderation API
 */
export const contentModerationService = {
  /**
   * Validates content against defined limits
   * @param {Object} content - The content to validate
   * @returns {Object} Validation result
   */
  validateContent(content) {
    const errors = [];

    // Validate professor name
    if (
      !content.professorName ||
      content.professorName.length < contentLimits.minProfessorNameLength
    ) {
      errors.push(
        `Professor name must be at least ${contentLimits.minProfessorNameLength} characters long`
      );
    }
    if (content.professorName.length > contentLimits.maxProfessorNameLength) {
      errors.push(
        `Professor name cannot exceed ${contentLimits.maxProfessorNameLength} characters`
      );
    }

    // Validate subject
    if (
      !content.subject ||
      content.subject.length < contentLimits.minSubjectLength
    ) {
      errors.push(
        `Subject must be at least ${contentLimits.minSubjectLength} characters long`
      );
    }
    if (content.subject.length > contentLimits.maxSubjectLength) {
      errors.push(
        `Subject cannot exceed ${contentLimits.maxSubjectLength} characters`
      );
    }

    // Validate review text
    if (
      !content.reviewText ||
      content.reviewText.length < contentLimits.minReviewLength
    ) {
      errors.push(
        `Review text must be at least ${contentLimits.minReviewLength} characters long`
      );
    }
    if (content.reviewText.length > contentLimits.maxReviewLength) {
      errors.push(
        `Review text cannot exceed ${contentLimits.maxReviewLength} characters`
      );
    }

    // Validate word count
    const wordCount = content.reviewText.trim().split(/\s+/).length;
    if (wordCount > contentLimits.maxWordCount) {
      errors.push(`Review cannot exceed ${contentLimits.maxWordCount} words`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Checks for inappropriate content in text
   * @param {string} text - The text to check
   * @returns {Array} List of issues found
   */
  checkForInappropriateContent(text) {
    const issues = [];
    const words = text.toLowerCase().split(/\s+/);

    // Check for inappropriate words - using word boundary matching instead of substring
    const foundInappropriateWords = words.filter((word) =>
      inappropriateWords.some((inappropriate) => {
        // Create a proper word boundary regex to match only complete words
        const wordRegex = new RegExp(`\\b${inappropriate}\\b`, "i");
        return wordRegex.test(word);
      })
    );

    if (foundInappropriateWords.length > 0) {
      issues.push("Review contains inappropriate language or personal attacks");
    }

    // Check word count
    if (words.length < contentRules.minWordCount) {
      issues.push(`Review must be at least ${contentRules.minWordCount} words`);
    }
    if (words.length > contentRules.maxWordCount) {
      issues.push(`Review cannot exceed ${contentRules.maxWordCount} words`);
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
      "go back to your",
      "you people should",
      "these people should",
      "those people should",
      // Remove phrases that could appear in legitimate academic contexts
      // "not qualified",
      // "doesn't belong",
      // "don't belong",
    ];

    // Only check for discriminatory phrases in a more contextual way
    for (const phrase of discriminatoryPhrases) {
      // Use a more precise check that includes context
      const regex = new RegExp(`\\b${phrase}\\b`, "i");
      if (regex.test(text.toLowerCase())) {
        issues.push("Review contains potentially discriminatory language");
        break;
      }
    }

    return issues;
  },

  /**
   * Sanitizes text by removing excessive whitespace and normalizing case
   * @param {string} text - The text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    return text
      .replace(/\s+/g, " ")
      .trim()
      .replace(
        /[A-Z]{3,}/g,
        (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
      );
  },

  /**
   * Moderates content using OpenAI's moderation API
   * @param {string} content - The content to moderate
   * @param {string} userId - The user's ID for rate limiting
   * @returns {Promise<Object>} The moderation result
   */
  async moderateContent(content, userId) {
    try {
      // First validate content against limits
      const validationResult = this.validateContent({ reviewText: content });
      if (!validationResult.isValid) {
        return {
          isValid: false,
          message: validationResult.errors.join(". "),
          sanitizedText: null,
        };
      }

      // Check for inappropriate content
      const issues = this.checkForInappropriateContent(content);
      if (issues.length > 0) {
        return {
          isValid: false,
          message: issues.join(". "),
          sanitizedText: null,
        };
      }

      // Use OpenAI's moderation API
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          input: content,
          model: "text-moderation-latest",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to moderate content: ${response.statusText}`);
      }

      const result = await response.json();
      const moderationResult = result.results[0];

      // Check if content is flagged
      const isFlagged = Object.values(moderationResult.categories).some(
        (value) => value === true
      );

      if (isFlagged) {
        return {
          isValid: false,
          message:
            "Your content contains inappropriate material. Please revise and try again.",
          sanitizedText: null,
        };
      }

      // Content is valid, return sanitized version
      return {
        isValid: true,
        message: null,
        sanitizedText: this.sanitizeText(content),
      };
    } catch (error) {
      console.error("Error moderating content:", error);
      // If moderation fails, allow the content but log the error
      return {
        isValid: true,
        message: null,
        sanitizedText: this.sanitizeText(content),
      };
    }
  },
};
