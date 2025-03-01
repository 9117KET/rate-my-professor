import { reviewsService } from "./reviewsService";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export const embeddingService = {
  async getClients() {
    console.log(
      "OPENAI_API_KEY:",
      process.env.OPENAI_API_KEY ? "Present" : "Missing"
    );

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });

    return { openai, pc };
  },

  async syncFirestoreWithPinecone() {
    try {
      const { openai, pc } = await this.getClients();
      const index = pc.Index("rag");

      // Step 1: Get all reviews from Firestore
      const reviews = await reviewsService.getAllReviews();
      const firestoreIds = reviews.map((review) => review.id);

      // Step 2: Try to get all existing vector IDs from Pinecone
      // Note: listVectors may not be available in all Pinecone plans
      try {
        const existingVectors = await index.listVectors();
        const pineconeIds =
          existingVectors?.vectors?.map((vector) => vector.id) || [];

        // Step 3: Find vectors to delete (in Pinecone but not in Firestore)
        const vectorsToDelete = pineconeIds.filter(
          (id) => !firestoreIds.includes(id)
        );

        // Step 4: Delete vectors that no longer exist in Firestore
        if (vectorsToDelete.length > 0) {
          console.log(
            `Deleting ${vectorsToDelete.length} vectors from Pinecone that no longer exist in Firestore`
          );
          await index.deleteMany(vectorsToDelete);
        }
      } catch (listError) {
        console.warn(
          "Unable to list vectors from Pinecone. Falling back to alternative method:",
          listError.message
        );
        // If listVectors is not available, fall back to the alternative method
        return this.syncFirestoreWithPineconeFallback();
      }

      // Step 5: Create or update embeddings for current reviews
      const processedData = await Promise.all(
        reviews.map(async (review) => {
          const response = await openai.embeddings.create({
            input: review.review,
            model: "text-embedding-3-small",
          });

          return {
            values: response.data[0].embedding,
            id: review.id,
            metadata: {
              review: review.review,
              subject: review.subject,
              stars: review.stars,
              professor: review.professor,
            },
          };
        })
      );

      // Step 6: Upsert to Pinecone
      if (processedData.length > 0) {
        await index.upsert(processedData);
      }

      return true;
    } catch (error) {
      console.error("Error syncing with Pinecone:", error);
      throw error;
    }
  },

  // Alternative implementation if listVectors is not available
  async syncFirestoreWithPineconeFallback() {
    try {
      const { openai, pc } = await this.getClients();
      const index = pc.Index("rag");

      // Get all reviews from Firestore
      const reviews = await reviewsService.getAllReviews();

      // First, delete all vectors in the index to ensure clean state
      try {
        await index.deleteAll();
        console.log("Cleared all vectors from Pinecone index");
      } catch (deleteError) {
        console.error("Error clearing Pinecone index:", deleteError);
        // Continue with the upsert even if deletion fails
      }

      // Create embeddings for each review
      const processedData = await Promise.all(
        reviews.map(async (review) => {
          const response = await openai.embeddings.create({
            input: review.review,
            model: "text-embedding-3-small",
          });

          return {
            values: response.data[0].embedding,
            id: review.id,
            metadata: {
              review: review.review,
              subject: review.subject,
              stars: review.stars,
              professor: review.professor,
            },
          };
        })
      );

      // Upsert to Pinecone
      if (processedData.length > 0) {
        await index.upsert(processedData);
      }

      return true;
    } catch (error) {
      console.error("Error syncing with Pinecone:", error);
      throw error;
    }
  },

  async queryReviews(userMessage) {
    try {
      const { openai, pc } = await this.getClients();
      const index = pc.Index("rag");

      // Get embedding for user message
      const embeddingResponse = await openai.embeddings.create({
        input: userMessage,
        model: "text-embedding-3-small",
      });

      // Query Pinecone
      const queryResponse = await index.query({
        vector: embeddingResponse.data[0].embedding,
        topK: 3,
        includeMetadata: true,
      });

      return queryResponse.matches;
    } catch (error) {
      console.error("Error querying reviews:", error);
      throw error;
    }
  },

  async createTipEmbeddings(tips) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const processedTips = [];

    for (const tip of tips) {
      const response = await client.embeddings.create({
        input: tip.content,
        model: "text-embedding-3-small",
      });
      const embedding = response.data[0].embedding;
      processedTips.push({
        values: embedding,
        id: tip.id,
        metadata: {
          content: tip.content,
          createdAt: tip.createdAt,
        },
      });
    }

    // Store processedTips in your database or vector store
  },
};
