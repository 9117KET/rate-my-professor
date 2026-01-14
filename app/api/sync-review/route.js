import { embeddingService } from "../../services/embeddingService";
import { withCors } from "../../utils/cors";
import {
  createErrorResponse,
  logError,
  identifyErrorType,
} from "../../utils/errorHandler";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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
    
    console.log(`[SYNC-API] Review found: ${reviewSnap.data().professor || "Unknown"}`);

    const review = {
      id: reviewSnap.id,
      ...reviewSnap.data(),
      createdAt: reviewSnap.data().createdAt?.toDate() || new Date(),
    };

    // Get OpenAI and Pinecone clients (server-side)
    console.log(`[SYNC-API] Initializing OpenAI and Pinecone clients...`);
    const { openai, pc } = await embeddingService.getClients();
    const index = pc.Index("rag");
    console.log(`[SYNC-API] Clients initialized`);

    // Create enhanced embedding input
    const professorName = (review.professor || "").trim();
    const subject = (review.subject || "").trim();
    const reviewText = (review.review || "").trim();

    const embeddingInput = [
      professorName && `Professor ${professorName}`,
      subject && `teaches ${subject}`,
      reviewText,
    ]
      .filter(Boolean)
      .join(". ");

    const finalInput = embeddingInput || reviewText || "Review";
    console.log(`[SYNC-API] Creating embedding for: ${professorName} - ${subject}`);

    // Generate embedding for the review
    const embeddingResponse = await openai.embeddings.create({
      input: finalInput,
      model: "text-embedding-3-small",
    });
    console.log(`[SYNC-API] Embedding generated, upserting to Pinecone...`);

    // Upsert to Pinecone
    await index.upsert([
      {
        values: embeddingResponse.data[0].embedding,
        id: review.id,
        metadata: {
          review: review.review,
          subject: review.subject,
          stars: review.stars,
          professor: review.professor,
          createdAt:
            review.createdAt instanceof Date
              ? review.createdAt.toISOString()
              : new Date(review.createdAt).toISOString(),
        },
      },
    ]);

    console.log(`[SYNC-API] ✅ Successfully synced review ${reviewId} to Pinecone`);

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
