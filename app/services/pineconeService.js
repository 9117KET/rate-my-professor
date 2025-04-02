import { Pinecone } from "@pinecone-database/pinecone";
import { getDb } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  controllerHostUrl: `https://${process.env.PINECONE_ENVIRONMENT}.pinecone.io`,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

/**
 * Syncs a review with Pinecone for vector search
 * @param {string} reviewId - The ID of the review
 * @param {Object} reviewData - The review data
 * @param {boolean} isDelete - Whether this is a deletion operation
 */
export async function syncWithPinecone(reviewId, reviewData, isDelete = false) {
  try {
    if (isDelete) {
      // Delete the vector from Pinecone
      await index.delete1({
        ids: [reviewId],
      });
      return;
    }

    // Get the review text for embedding
    const reviewText = reviewData.reviewText;
    if (!reviewText) {
      console.warn(`No review text found for review ${reviewId}`);
      return;
    }

    // Create embedding using OpenAI
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: reviewText,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create embedding: ${response.statusText}`);
    }

    const { data } = await response.json();
    const embedding = data[0].embedding;

    // Upsert the vector to Pinecone
    await index.upsert({
      upsertRequest: {
        vectors: [
          {
            id: reviewId,
            values: embedding,
            metadata: {
              professorName: reviewData.professorName,
              subject: reviewData.subject,
              rating: reviewData.rating,
              createdAt: reviewData.createdAt.toDate().toISOString(),
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error syncing with Pinecone:", error);
    // Don't throw the error to prevent disrupting the user flow
  }
}

/**
 * Searches for similar reviews using vector similarity
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of similar reviews
 */
export async function searchSimilarReviews(query, options = {}) {
  try {
    // Create embedding for the query
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: query,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create query embedding: ${response.statusText}`
      );
    }

    const { data } = await response.json();
    const queryEmbedding = data[0].embedding;

    // Search Pinecone
    const searchResponse = await index.query({
      queryRequest: {
        vector: queryEmbedding,
        topK: options.topK || 10,
        includeMetadata: true,
      },
    });

    // Get full review data from Firestore
    const db = getDb();
    const reviews = await Promise.all(
      searchResponse.matches.map(async (match) => {
        const reviewDoc = await getDoc(doc(db, "reviews", match.id));
        if (reviewDoc.exists()) {
          return {
            id: reviewDoc.id,
            ...reviewDoc.data(),
            similarity: match.score,
          };
        }
        return null;
      })
    );

    return reviews.filter(Boolean);
  } catch (error) {
    console.error("Error searching similar reviews:", error);
    throw error;
  }
}
