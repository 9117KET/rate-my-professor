import { OpenAI } from "openai";
import { embeddingService } from "../../services/embeddingService";
import { rateLimiterService } from "../../services/rateLimiterService";
import { reviewsService } from "../../services/reviewsService";
import { withCors } from "../../utils/cors";
import {
  createErrorResponse,
  logError,
  identifyErrorType,
} from "../../utils/errorHandler";
import localReviewsData from "../../../reviews.json";

// Detect "best rated professor" queries in flexible phrasing.
// This keeps the match logic simple and avoids brittle, exact matching.
const BEST_RATED_QUERY_PATTERN =
  /(best|top|highest)\s*(rated|rating|ratings)?\s*(professor|professors|lecturer|instructor)/i;

// Stream a short, deterministic answer back to the client without waiting on LLMs.
// This is useful for ranking questions where we can compute a reliable result.
const createTextStream = (text) =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(text);
      controller.close();
    },
  });

// Decide if a message is asking for a ranking of professors.
// We keep this fast to avoid extra server work on unrelated queries.
const isBestRatedProfessorQuery = (message) => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    BEST_RATED_QUERY_PATTERN.test(normalized) ||
    normalized.includes("best professor")
  );
};

// Use local JSON data as a safe fallback when Firestore is unavailable on the server.
// This prevents a full 500 error and keeps the chat responsive.
const getFallbackReviews = () =>
  Array.isArray(localReviewsData?.reviews) ? localReviewsData.reviews : [];

// Compute the top-rated professors from review data using averages.
// This avoids asking the LLM to "guess" rankings from raw text.
const buildBestRatedProfessorResponse = async () => {
  let reviews = [];

  try {
    reviews = await reviewsService.getAllReviews();
  } catch (error) {
    // If Firestore isn't reachable in this environment, we fall back to local data.
    // Real-life analogy: like checking a cached leaderboard when the live API is down.
    logError(error, "best-rated-professor-firestore-fallback");
  }

  if (!Array.isArray(reviews) || reviews.length === 0) {
    reviews = getFallbackReviews();
  }

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return (
      "I do not have enough reviews yet to determine the best rated professor. " +
      "Try again after more reviews are submitted."
    );
  }

  const stats = new Map();

  reviews.forEach((review) => {
    const professor = (review.professor || "").trim();
    const stars = Number(review.stars);

    if (!professor || Number.isNaN(stars)) {
      return;
    }

    if (!stats.has(professor)) {
      stats.set(professor, {
        professor,
        totalRating: 0,
        reviewCount: 0,
        subjects: new Set(),
      });
    }

    const entry = stats.get(professor);
    entry.totalRating += stars;
    entry.reviewCount += 1;

    if (review.subject) {
      entry.subjects.add(review.subject);
    }
  });

  const ranked = Array.from(stats.values())
    .map((entry) => ({
      professor: entry.professor,
      averageRating: entry.totalRating / entry.reviewCount,
      reviewCount: entry.reviewCount,
      subjects: Array.from(entry.subjects),
    }))
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return a.professor.localeCompare(b.professor);
    });

  if (ranked.length === 0) {
    return (
      "I could not find any rated professors yet. " +
      "Once reviews are submitted, I can calculate the best rated professor."
    );
  }

  const topRated = ranked[0];
  const topList = ranked.slice(0, 3);

  const summaryLine =
    `Based on ${topRated.reviewCount} review` +
    `${topRated.reviewCount === 1 ? "" : "s"}, the best rated professor is ` +
    `${topRated.professor} (${topRated.averageRating.toFixed(2)}/5).`;

  const listLines = topList
    .map((entry, index) => {
      const subjects =
        entry.subjects.length > 0
          ? ` Subjects: ${entry.subjects.join(", ")}.`
          : "";
      return `${index + 1}. ${entry.professor} - ${entry.averageRating.toFixed(
        2
      )}/5 from ${entry.reviewCount} review${
        entry.reviewCount === 1 ? "" : "s"
      }.${subjects}`;
    })
    .join("\n");

  return `${summaryLine}\n\nTop rated professors:\n${listLines}`;
};

async function chatHandler(req) {
  try {
    // Try both OPENAI_API_KEY and OPENAI_API_KEY_NEW (workaround for Vercel caching)
    let openAIKeyRaw =
      process.env.OPENAI_API_KEY_NEW || process.env.OPENAI_API_KEY;

    // Validate required environment variables
    if (!openAIKeyRaw) {
      logError(new Error("OPENAI_API_KEY is not configured"), "chat-api");
      return createErrorResponse(
        new Error("OpenAI API key is not configured"),
        "EXTERNAL_SERVICE_ERROR",
        503
      );
    }

    // Import the key extraction function (we'll define it here for now)
    // Supports both sk- (40-60 chars) and sk-proj- (100-200 chars) formats
    function extractValidOpenAIKey(keyRaw) {
      if (!keyRaw) return null;
      let cleaned = keyRaw
        .replace(/^["']|["']$/g, "")
        .trim()
        .replace(/[^\x20-\x7E]/g, "");

      // Check for sk-proj- format (project keys, typically 100-200 chars)
      if (cleaned.startsWith("sk-proj-")) {
        if (cleaned.length >= 100 && cleaned.length <= 200) {
          return cleaned;
        }
        // If too long, might be duplicated - try to extract the first valid one
        if (cleaned.length > 200) {
          const keyPattern = /sk-proj-[a-zA-Z0-9_-]{90,190}/;
          const match = cleaned.match(keyPattern);
          if (match && match[0].length >= 100 && match[0].length <= 200) {
            return match[0];
          }
        }
        return cleaned;
      }

      // Check for standard sk- format (40-60 chars)
      if (cleaned.startsWith("sk-")) {
        if (cleaned.length >= 40 && cleaned.length <= 60) {
          return cleaned;
        }
        // If too long, might be duplicated - try to extract the first valid one
        if (cleaned.length > 60) {
          const keyPattern = /sk-[a-zA-Z0-9]{37,57}/;
          const match = cleaned.match(keyPattern);
          if (match && match[0].length >= 40 && match[0].length <= 60) {
            return match[0];
          }
        }
        return cleaned;
      }

      return null;
    }

    // Extract a valid key (handles concatenated/corrupted keys)
    const openAIKey = extractValidOpenAIKey(openAIKeyRaw) || "";

    // Validate API key format - accept both sk- and sk-proj- formats
    const isValidFormat =
      openAIKey &&
      (openAIKey.startsWith("sk-proj-") || openAIKey.startsWith("sk-")) &&
      ((openAIKey.startsWith("sk-proj-") &&
        openAIKey.length >= 100 &&
        openAIKey.length <= 200) ||
        (openAIKey.startsWith("sk-") &&
          openAIKey.length >= 40 &&
          openAIKey.length <= 60));

    if (!isValidFormat) {
      const originalLength = openAIKeyRaw?.length || 0;
      const expectedFormat = openAIKey?.startsWith("sk-proj-")
        ? "sk-proj- format (100-200 characters)"
        : "sk- format (40-60 characters) or sk-proj- format (100-200 characters)";
      const keyPreview = openAIKey
        ? `${openAIKey.substring(0, 10)}...${openAIKey.substring(
            openAIKey.length - 4
          )} (length: ${openAIKey.length})`
        : "MISSING";
      logError(
        new Error(
          `OPENAI_API_KEY appears to be invalid. Preview: ${keyPreview}, Length: ${
            openAIKey.length
          }${
            originalLength > 200
              ? ` (Original was ${originalLength} chars - may be duplicated/concatenated)`
              : ""
          }`
        ),
        "chat-api"
      );
      return createErrorResponse(
        new Error(
          `OpenAI API key format is invalid. Keys should be ${expectedFormat} (found: ${
            openAIKey.length || 0
          } chars).${
            originalLength > 200
              ? ` The key appears to be duplicated or concatenated (${originalLength} chars). Please check your Vercel environment variable.`
              : ""
          }`
        ),
        "EXTERNAL_SERVICE_ERROR",
        503
      );
    }

    if (!process.env.PINECONE_API_KEY) {
      logError(new Error("PINECONE_API_KEY is not configured"), "chat-api");
      return createErrorResponse(
        new Error("Pinecone API key is not configured"),
        "EXTERNAL_SERVICE_ERROR",
        503
      );
    }

    // Get anonymous user ID from request headers
    const userId = req.headers.get("x-anonymous-user-id");

    if (!userId) {
      return createErrorResponse(
        new Error("User ID is required"),
        "AUTHENTICATION_REQUIRED",
        400
      );
    }

    // Check rate limit using anonymous user ID with CHAT action type
    const rateLimitResult = await rateLimiterService.checkRateLimit(
      userId,
      "CHAT"
    );

    if (!rateLimitResult.allowed) {
      // Return a rate limit error with the relevant rate limit information
      // This is acceptable information to share with users
      return new Response(
        JSON.stringify({
          error: {
            message: "Rate limit exceeded. Please try again later.",
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const messages = await req.json();

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return createErrorResponse(
        new Error("Invalid messages format"),
        "INVALID_INPUT",
        400
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (
      !lastMessage ||
      !lastMessage.content ||
      typeof lastMessage.content !== "string"
    ) {
      return createErrorResponse(
        new Error("Invalid message content"),
        "INVALID_INPUT",
        400
      );
    }

    const userMessage = lastMessage.content.trim();

    if (userMessage.length === 0) {
      return createErrorResponse(
        new Error("Message cannot be empty"),
        "INVALID_INPUT",
        400
      );
    }

    if (isBestRatedProfessorQuery(userMessage)) {
      const responseText = await buildBestRatedProfessorResponse();
      return new Response(createTextStream(responseText), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      });
    }

    // Initialize OpenAI (use trimmed key)
    const openai = new OpenAI({
      apiKey: openAIKey,
    });

    // Get similar reviews using RAG with enhanced query context
    // Enhance user message with context for better semantic matching
    const enhancedQuery =
      userMessage.toLowerCase().includes("professor") ||
      userMessage.toLowerCase().includes("teach") ||
      userMessage.toLowerCase().includes("course")
        ? userMessage // Already has context
        : userMessage; // Keep original for now

    const matches = await embeddingService.queryReviews(enhancedQuery);

    // Format context from similar reviews, prioritizing higher relevance scores
    // Filter and sort by relevance (lower score = higher relevance in Pinecone)
    const context =
      matches && matches.length > 0
        ? matches
            .filter((match) => match.metadata && match.score !== undefined) // Filter out invalid matches
            .sort((a, b) => a.score - b.score) // Sort by relevance (lower score = better match)
            .slice(0, 5) // Take top 5 most relevant matches (we query 10, but use best 5)
            .map(
              (match) =>
                `Professor: ${
                  match.metadata.professor || "Unknown"
                }\nSubject: ${match.metadata.subject || "Unknown"}\nRating: ${
                  match.metadata.stars || "N/A"
                }/5\nReview: ${match.metadata.review || "No review text"}`
            )
            .join("\n\n")
        : "No matching professor reviews found in the database.";

    // Create chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert academic advisor and professor review assistant for Constructor University Germany (formerly Jacobs University Bremen). Your purpose is to help students make informed decisions about their courses and professors based on peer reviews and official university information.

When answering questions:
1. Always maintain a professional yet friendly tone
2. Prioritize information from the provided student reviews and official university sources
3. Be balanced in your assessments, considering both positive and negative feedback
4. Respect student and faculty privacy by not sharing personal details beyond what's in the reviews
5. If you're unsure about something, acknowledge it and suggest consulting official university resources
6. Consider the academic context and course requirements when giving advice
7. Remember if anyone asks you who created or developed you, refer to imprint and state it was Kinlo ET

When a user expresses interest in rating a professor (e.g., "I want to rate a professor" or similar queries):
1. Guide them to click on the "Rate" button in the action bar at the top of the interface
2. Explain that they'll need to provide the professor's name, subject taught, a star rating, and a detailed review
3. Emphasize the importance of providing honest, constructive feedback that can help other students
4. Remind them that all reviews are anonymous but should follow community guidelines (be respectful and factual)

Here are relevant professor reviews to inform your responses:\n\n${context}`,
        },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    // Create and return the stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(text);
          }
          controller.close();
        } catch (streamError) {
          // Log the error but don't expose it to the client
          logError(streamError, "chat-stream-processing");

          // Send a safe error message to the client
          controller.enqueue(
            "\n\nI'm sorry, but I encountered an issue while generating a response. Please try again."
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
      },
    });
  } catch (error) {
    // Log the error with full details for debugging
    logError(error, "chat-api", {
      userId: req.headers.get("x-anonymous-user-id"),
    });

    // Identify the type of error and create a sanitized response
    const errorType = identifyErrorType(error);
    return createErrorResponse(
      error,
      errorType,
      errorType === "EXTERNAL_SERVICE_ERROR" ? 503 : 500
    );
  }
}

// Apply CORS middleware to chat handler
export const POST = withCors(chatHandler);
