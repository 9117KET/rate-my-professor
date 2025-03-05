// Character limits for reviews
export const REVIEW_LIMITS = {
  MIN_LENGTH: 50,
  MAX_LENGTH: 1000,
  MIN_PROFESSOR_LENGTH: 3,
  MAX_PROFESSOR_LENGTH: 100,
  MIN_SUBJECT_LENGTH: 2,
  MAX_SUBJECT_LENGTH: 50,
};

// Character limits for tips
export const TIP_LIMITS = {
  MIN_LENGTH: 30,
  MAX_LENGTH: 500,
};

export const validateText = (text, options = {}) => {
  const {
    minLength = 30,
    maxLength = 500,
    type = "tip", // or 'review'
  } = options;

  // Check for minimum length
  if (text.length < minLength) {
    return `${
      type === "review" ? "Review" : "Tip"
    } must be at least ${minLength} characters long`;
  }

  // Check for maximum length
  if (text.length > maxLength) {
    return `${
      type === "review" ? "Review" : "Tip"
    } cannot exceed ${maxLength} characters`;
  }

  // Check for meaningful content (at least 3 words)
  const words = text.trim().split(/\s+/);
  if (words.length < 3) {
    return `${
      type === "review" ? "Review" : "Tip"
    } must contain at least 3 words`;
  }

  // Check for repetitive characters (more lenient now)
  const repetitivePattern = /(.)\1{7,}/;
  if (repetitivePattern.test(text)) {
    return "Text contains too many repetitive characters";
  }

  // Check for all caps (more lenient - now requires longer text)
  if (text === text.toUpperCase() && text.length > 50) {
    return "Text cannot be in all capital letters";
  }

  // Check for obvious gibberish patterns
  const gibberishPatterns = [
    // Random consonant strings (more lenient)
    /[bcdfghjklmnpqrstvwxz]{7,}/i,
    // Keyboard smashing patterns
    /[asdfghjkl]{5,}|[qwertyuiop]{5,}|[zxcvbnm]{5,}/i,
    // Extremely long words without vowels (more lenient)
    /\b[^aeiou\s]{7,}\b/i,
  ];

  for (const pattern of gibberishPatterns) {
    if (pattern.test(text)) {
      return "Text appears to contain random characters. Please write meaningful content.";
    }
  }

  // Check for word variety (more lenient now)
  const wordFrequency = {};
  const normalizedWords = words.map((w) => w.toLowerCase());
  const commonWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
  ]);

  for (const word of normalizedWords) {
    if (commonWords.has(word)) continue;
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    // Only flag if a non-common word is repeated excessively
    if (wordFrequency[word] > 5 && word.length > 3) {
      return "Text contains too many repeated words";
    }
  }

  // Check for reasonable word lengths (more lenient)
  const hasUnreasonableWords = words.some((word) => {
    const wordLength = word.length;
    // Allow longer words, only flag extremely long ones
    return wordLength > 25 || (wordLength > 7 && !/[aeiou]/i.test(word));
  });

  if (hasUnreasonableWords) {
    return "Text contains unreasonably long words";
  }

  // Remove punctuation check for shorter texts
  if (text.length > 200 && !/[.!?]/.test(text)) {
    return "Please use proper punctuation in longer texts";
  }

  return "";
};
