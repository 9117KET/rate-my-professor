import { NextResponse } from "next/server";
import { embeddingService } from "../../services/embeddingService";

// This is a server-side only operation and should be protected
export async function POST(req) {
  try {
    // Simple API key check - you should implement better authentication
    const authHeader = req.headers.get("authorization");
    const expectedKey = process.env.API_SECRET_KEY;

    if (!authHeader || !expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Option to use alternative sync method
    const { useAltMethod } = await req.json().catch(() => ({}));

    if (useAltMethod) {
      await embeddingService.syncFirestoreWithPineconeFallback();
    } else {
      await embeddingService.syncFirestoreWithPinecone();
    }

    return new NextResponse(
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
    console.error("Error in sync-embeddings API:", error);

    return new NextResponse(
      JSON.stringify({
        error: "Error synchronizing vector store",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
