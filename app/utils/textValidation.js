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

  // Check for repetitive characters
  const repetitivePattern = /(.)\1{4,}/;
  if (repetitivePattern.test(text)) {
    return "Text contains too many repetitive characters";
  }

  // Check for all caps
  if (text === text.toUpperCase() && text.length > 20) {
    return "Text cannot be in all capital letters";
  }

  // Check for obvious gibberish patterns
  const gibberishPatterns = [
    // Random consonant strings (more permissive)
    /[bcdfghjklmnpqrstvwxz]{7,}/i,
    // Keyboard smashing patterns (more permissive)
    /[asdfghjkl]{6,}|[qwertyuiop]{6,}|[zxcvbnm]{6,}/i,
    // Words without vowels (only check longer strings)
    /\b[^aeiou\s]{7,}\b/i,
    // Random character combinations (more permissive)
    /[^a-zA-Z0-9\s.,!?'"-]{4,}/,
    // Repeated short patterns (more specific)
    /(.{2,3})\1{3,}/,
    // Random letter sequences (more specific)
    /[a-z]{3,}[0-9]{3,}[a-z]{3,}|[0-9]{3,}[a-z]{3,}[0-9]{3,}/i,
  ];

  for (const pattern of gibberishPatterns) {
    if (pattern.test(text)) {
      return "Text appears to contain random characters or gibberish. Please write meaningful content.";
    }
  }

  // Check for word variety with more permissive limits
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
    "is",
    "are",
    "was",
    "were",
    "be",
    "this",
    "that",
    "these",
    "those",
    "it",
    "they",
    "he",
    "she",
    "my",
    "your",
    "his",
    "her",
    "their",
    "our",
    "its",
    "i",
    "you",
    "not",
    "very",
    "too",
    "so",
    "would",
    "could",
    "should",
    "will",
    "have",
    "has",
    "had",
    "been",
    "can",
    "may",
    "might",
    "must",
    "about",
    "before",
    "after",
    "during",
    "while",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "more",
    "most",
    "other",
    "some",
    "such",
    "than",
    "well",
    "just",
    "now",
  ]);

  let meaningfulWordCount = 0;
  for (const word of normalizedWords) {
    if (word.length < 2) continue; // Skip single characters
    if (commonWords.has(word)) continue;
    meaningfulWordCount++;
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    // More permissive repetition limit
    if (wordFrequency[word] > 5 && word.length > 3) {
      return "Text contains too many repeated words";
    }
  }

  // More permissive meaningful word count
  if (meaningfulWordCount < 2) {
    return `${
      type === "review" ? "Review" : "Tip"
    } must contain at least 2 meaningful words`;
  }

  // Check for reasonable word lengths with more permissive limits
  const hasUnreasonableWords = words.some((word) => {
    const wordLength = word.length;
    return (
      wordLength > 30 || // Allow longer words
      (wordLength > 8 && !/[aeiou]/i.test(word)) || // Only check longer words for vowels
      (/^\d+$/.test(word) && wordLength > 8) // Allow longer number sequences
    );
  });

  if (hasUnreasonableWords) {
    return "Text contains unreasonably long or invalid words";
  }

  // More permissive sentence structure checks
  if (text.length > 200) {
    // Only check longer texts
    // Check for punctuation
    if (!/[.!?]/.test(text)) {
      return "Please use proper punctuation in your text";
    }

    // Only check sentence case for longer texts
    if (text.length > 300) {
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed && trimmed.length > 20 && !/^[A-Z]/.test(trimmed)) {
          return "Please start longer sentences with capital letters";
        }
      }
    }
  }

  return "";
};
