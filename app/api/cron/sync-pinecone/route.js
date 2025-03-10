import { embeddingService } from "../../../services/embeddingService";
import { withCors } from "../../../utils/cors";
import { createErrorResponse, logError } from "../../../utils/errorHandler";

// This endpoint can be called by a cron job to keep Pinecone in sync
// Example cron schedule: Every 6 hours
async function syncPineconeCronHandler(req) {
  try {
    // Verify request is from a trusted source (like Vercel Cron)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // This cron job keeps Pinecone vector database in sync with Firestore
      // The CRON_SECRET_KEY should be set in your environment variables (e.g. Vercel dashboard)
      // For local development, add it to your .env file
      // Generate a secure random string (e.g. using `openssl rand -base64 32`)
      logError(
        new Error("Unauthorized cron job attempt"),
        "cron-auth-failure",
        {
          ip: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        }
      );

      return createErrorResponse(
        new Error("Invalid or missing cron secret"),
        "PERMISSION_DENIED",
        401
      );
    }

    // Run the sync
    console.log("[CRON] Starting scheduled Pinecone sync");
    const startTime = Date.now();

    await embeddingService.syncFirestoreWithPinecone();

    const duration = Date.now() - startTime;
    console.log(`[CRON] Completed Pinecone sync in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Scheduled synchronization completed successfully",
        duration: `${duration}ms`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log the error with detailed information
    logError(error, "cron-sync-pinecone", {
      duration: Date.now() - (error.startTime || Date.now()),
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

// Apply CORS middleware with stricter configuration for cron API
const cronCorsConfig = {
  // Only allow access from trusted sources
  allowedOrigins:
    process.env.NODE_ENV === "production"
      ? [
          // Vercel cron jobs or other trusted services
          "https://vercel.com",
          // Your own domains if you need to trigger this manually
          process.env.NEXT_PUBLIC_SITE_URL || "https://yourapp.com",
        ]
      : ["http://localhost:3000", "http://localhost:3001"],
  allowedMethods: ["GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export const GET = withCors(syncPineconeCronHandler, cronCorsConfig);
