import { embeddingService } from "../../services/embeddingService";
import { withCors } from "../../utils/cors";
import {
  createErrorResponse,
  identifyErrorType,
  logError,
} from "../../utils/errorHandler";

/**
 * Deletes Pinecone vectors for a given reviewId.
 *
 * Primary use-case: keep the vector DB consistent when a review is deleted.
 * We delete by metadata filter (reviewId) when supported; otherwise fall back to
 * listing vectors and deleting those with ID prefix `${reviewId}#`.
 */
async function deleteReviewVectorsHandler(req) {
  try {
    if (req.method !== "POST") {
      return createErrorResponse(
        new Error("Method not allowed"),
        "INVALID_METHOD",
        405
      );
    }

    const { reviewId } = await req.json();
    if (!reviewId) {
      return createErrorResponse(
        new Error("Review ID is required"),
        "INVALID_INPUT",
        400
      );
    }

    const clients = await embeddingService.getClients();
    if (!clients) {
      return createErrorResponse(
        new Error("Embeddings are not configured (missing OPENAI_API_KEY)."),
        "EXTERNAL_SERVICE_ERROR",
        503
      );
    }

    const { pc } = clients;
    const index = pc.Index("rag");

    // Best path: delete by metadata filter (reviewId).
    try {
      await index.deleteMany({
        reviewId: { $eq: reviewId },
      });
    } catch (filterDeleteError) {
      // Fallback path: list all IDs and delete by prefix (works for chunk IDs reviewId#N).
      // This is less efficient on large indexes, but safe as a fallback.
      const vectorsList = await index.listVectors();
      const ids = (vectorsList?.vectors || [])
        .map((v) => v?.id)
        .filter(Boolean)
        .filter((id) => id === reviewId || String(id).startsWith(`${reviewId}#`));

      if (ids.length > 0) {
        // Pinecone deleteMany has a max IDs per request; keep it small.
        const BATCH = 500;
        for (let i = 0; i < ids.length; i += BATCH) {
          // deleteMany(ids[]) is used elsewhere in the codebase.
          // eslint-disable-next-line no-await-in-loop
          await index.deleteMany(ids.slice(i, i + BATCH));
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError(error, "delete-review-vectors", {});
    const errorType = identifyErrorType(error);
    return createErrorResponse(
      error,
      errorType,
      errorType === "EXTERNAL_SERVICE_ERROR" ? 503 : 500
    );
  }
}

export const POST = withCors(deleteReviewVectorsHandler);

