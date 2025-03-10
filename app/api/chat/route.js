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
  try {
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
    const userMessage = messages[messages.length - 1].content;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get similar reviews using RAG
    const matches = await embeddingService.queryReviews(userMessage);

    // Format context from similar reviews
    const context = matches
      .map(
        (match) =>
          `Professor: ${match.metadata.professor}\nSubject: ${match.metadata.subject}\nRating: ${match.metadata.stars}/5\nReview: ${match.metadata.review}`
      )
      .join("\n\n");

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
