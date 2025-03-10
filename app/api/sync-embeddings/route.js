import { embeddingService } from "../../services/embeddingService";
import { withCors } from "../../utils/cors";
import { createErrorResponse, logError } from "../../utils/errorHandler";

// This is a server-side only operation and should be protected
async function syncEmbeddingsHandler(req) {
  try {
    // Simple API key check - you should implement better authentication
    const authHeader = req.headers.get("authorization");
    const expectedKey = process.env.API_SECRET_KEY;

    if (!authHeader || !expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return createErrorResponse(
        new Error("Invalid or missing API key"),
        "PERMISSION_DENIED",
        401
      );
    }

    // Option to use alternative sync method
    const { useAltMethod } = await req.json().catch(() => ({}));

    if (useAltMethod) {
      await embeddingService.syncFirestoreWithPineconeFallback();
    } else {
      await embeddingService.syncFirestoreWithPinecone();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Vector store successfully synchronized with database",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log detailed error information for debugging
    logError(error, "sync-embeddings-api", {
      method: req.method,
      useAltMethod: req.json?.useAltMethod,
    });

    // Return a sanitized error response
    return createErrorResponse(
      error,
      error.message?.includes("Pinecone")
        ? "EXTERNAL_SERVICE_ERROR"
        : "SERVER_ERROR",
      503
    );
  }
}

// Apply CORS middleware with stricter configuration for admin API
const corsConfig = {
  allowedOrigins:
    process.env.NODE_ENV === "production"
      ? [
          // Add your production domains here
          process.env.NEXT_PUBLIC_SITE_URL || "https://ratemycubprofessor.com",
          "https://admin.ratemycubprofessor.com",
        ]
      : ["http://localhost:3000", "http://localhost:3001"],
  allowedMethods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export const POST = withCors(syncEmbeddingsHandler, corsConfig);
