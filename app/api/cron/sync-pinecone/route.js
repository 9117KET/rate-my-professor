import { NextResponse } from "next/server";
import { embeddingService } from "../../../services/embeddingService";

// This endpoint can be called by a cron job to keep Pinecone in sync
// Example cron schedule: Every 6 hours
export async function GET(req) {
  try {
    // Verify request is from a trusted source (like Vercel Cron)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Unauthorized cron job attempt");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Run the sync
    console.log("[CRON] Starting scheduled Pinecone sync");
    const startTime = Date.now();

    await embeddingService.syncFirestoreWithPinecone();

    const duration = Date.now() - startTime;
    console.log(`[CRON] Completed Pinecone sync in ${duration}ms`);

    return new NextResponse(
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
    console.error("[CRON] Error in scheduled Pinecone sync:", error);

    return new NextResponse(
      JSON.stringify({
        error: "Error during scheduled synchronization",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
