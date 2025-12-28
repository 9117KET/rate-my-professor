import { OpenAI } from "openai";
import { embeddingService } from "../../services/embeddingService";
import { rateLimiterService } from "../../services/rateLimiterService";
import { withCors } from "../../utils/cors";
import {
  createErrorResponse,
  logError,
  identifyErrorType,
} from "../../utils/errorHandler";

async function chatHandler(req) {
  // #region agent log
  fetch("http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "route.js:11",
      message: "chatHandler entry",
      data: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasPineconeKey: !!process.env.PINECONE_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        pineconeKeyLength: process.env.PINECONE_API_KEY?.length || 0,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion
  try {
    // Validate required environment variables
    if (!process.env.OPENAI_API_KEY) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "route.js:14",
            message: "OPENAI_API_KEY missing",
            data: {},
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H1",
          }),
        }
      ).catch(() => {});
      // #endregion
      logError(new Error("OPENAI_API_KEY is not configured"), "chat-api");
      return createErrorResponse(
        new Error("OpenAI API key is not configured"),
        "EXTERNAL_SERVICE_ERROR",
        503
      );
    }

    if (!process.env.PINECONE_API_KEY) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "route.js:23",
            message: "PINECONE_API_KEY missing",
            data: {},
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H1",
          }),
        }
      ).catch(() => {});
      // #endregion
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

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get similar reviews using RAG
    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "route.js:112",
        message: "Before queryReviews call",
        data: { userMessageLength: userMessage.length },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
    const matches = await embeddingService.queryReviews(userMessage);
    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "route.js:113",
        message: "After queryReviews call",
        data: { matchesCount: matches?.length || 0, hasMatches: !!matches },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion

    // Format context from similar reviews
    // Handle empty matches gracefully
    const context =
      matches && matches.length > 0
        ? matches
            .filter((match) => match.metadata) // Filter out matches without metadata
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
    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "route.js:132",
        message: "Before OpenAI chat completion",
        data: { contextLength: context.length, messagesCount: messages.length },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion
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
    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "route.js:163",
        message: "After OpenAI chat completion created",
        data: { hasResponse: !!response },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion

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
    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "route.js:194",
        message: "Catch block - error occurred",
        data: {
          errorName: error?.name,
          errorMessage: error?.message,
          errorStack: error?.stack?.substring(0, 500),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H4",
      }),
    }).catch(() => {});
    // #endregion
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
