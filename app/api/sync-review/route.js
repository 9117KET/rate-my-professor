import { embeddingService } from "../../services/embeddingService";
import { withCors } from "../../utils/cors";
import { chunkText } from "../../utils/textChunker";
import {
  createErrorResponse,
  logError,
  identifyErrorType,
} from "../../utils/errorHandler";
import { db, auth } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

/**
 * API route to sync a single review to Pinecone
 * Called after a review is added to Firestore from the client
 * This ensures server-side environment variables are available
 */
async function syncReviewHandler(req) {
  try {
    console.log("[SYNC-API] Received sync request");

    if (req.method !== "POST") {
      return createErrorResponse(
        new Error("Method not allowed"),
        "INVALID_METHOD",
        405
      );
    }

    const { reviewId } = await req.json();
    console.log(`[SYNC-API] Syncing review: ${reviewId}`);

    if (!reviewId) {
      return createErrorResponse(
        new Error("Review ID is required"),
        "INVALID_INPUT",
        400
      );
    }

    // Authenticate anonymously for server-side Firestore access
    // Server-side API routes need authentication to satisfy Firestore security rules
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log(
          "[SYNC-API] Authenticated anonymously for Firestore access"
        );
      } catch (authError) {
        console.error("[SYNC-API] Failed to authenticate:", authError.message);
        throw new Error(`Firebase authentication failed: ${authError.message}`);
      }
    }

    // Get the review from Firestore directly by ID
    // This is more efficient than getting all reviews
    console.log(`[SYNC-API] Fetching review ${reviewId} from Firestore...`);
    const reviewRef = doc(db, "reviews", reviewId);
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      console.error(`[SYNC-API] Review ${reviewId} not found in Firestore`);
      return createErrorResponse(
        new Error("Review not found"),
        "NOT_FOUND",
        404
      );
    }

    console.log(
      `[SYNC-API] Review found: ${reviewSnap.data().professor || "Unknown"}`
    );

    const review = {
      id: reviewSnap.id,
      ...reviewSnap.data(),
      createdAt: reviewSnap.data().createdAt?.toDate() || new Date(),
    };

    // Get OpenAI and Pinecone clients (server-side)
    console.log(`[SYNC-API] Initializing OpenAI and Pinecone clients...`);
    const clients = await embeddingService.getClients();
    if (!clients) {
      return createErrorResponse(
        new Error(
          "Embeddings are not configured (missing/invalid OPENAI_API_KEY)."
        ),
        "EXTERNAL_SERVICE_ERROR",
        503
      );
    }
    const { openai, pc } = clients;
    const index = pc.Index("rag");
    console.log(`[SYNC-API] Clients initialized`);

    // Chunk the review text for better retrieval (RAG).
    const reviewText = (review.review || "").trim();
    const chunks = chunkText(reviewText);

    if (chunks.length === 0) {
      return createErrorResponse(
        new Error("Review text is empty; nothing to embed."),
        "INVALID_INPUT",
        400
      );
    }

    // Create enhanced embedding input prefix to help queries that mention professor/subject.
    const professorName = (review.professor || "").trim();
    const subject = (review.subject || "").trim();
    const prefix = [
      professorName && `Professor ${professorName}`,
      subject && `Subject ${subject}`,
    ]
      .filter(Boolean)
      .join(". ");

    console.log(
      `[SYNC-API] Creating ${chunks.length} chunk embedding(s) for: ${professorName} - ${subject}`
    );

    const createdAtIso =
      review.createdAt instanceof Date
        ? review.createdAt.toISOString()
        : new Date(review.createdAt).toISOString();

    const vectors = [];

    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const finalInput = prefix ? `${prefix}. ${chunk}` : chunk;

      const embeddingResponse = await openai.embeddings.create({
        input: finalInput,
        model: "text-embedding-3-small",
      });

      vectors.push({
        values: embeddingResponse.data[0].embedding,
        id: `${review.id}#${i}`,
        metadata: {
          reviewId: review.id,
          chunkIndex: i,
          chunk,
          // keep core metadata used by chat/context
          subject: review.subject,
          stars: review.stars,
          professor: review.professor,
          createdAt: createdAtIso,
        },
      });
    }

    console.log(`[SYNC-API] Upserting ${vectors.length} vector(s) to Pinecone...`);
    await index.upsert(vectors);

    console.log(
      `[SYNC-API] ✅ Successfully synced review ${reviewId} to Pinecone`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Review ${reviewId} synced to Pinecone successfully`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError(error, "sync-review-api", {
      reviewId: req.body?.reviewId,
    });

    const errorType = identifyErrorType(error);
    return createErrorResponse(
      error,
      errorType,
      errorType === "EXTERNAL_SERVICE_ERROR" ? 503 : 500
    );
  }
}

export const POST = withCors(syncReviewHandler);
