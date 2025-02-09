import { reviewsService } from "./reviewsService";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export const embeddingService = {
  async getClients() {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    return { openai, pc };
  },

  async syncFirestoreWithPinecone() {
    try {
      const { openai, pc } = await this.getClients();

      // Get all reviews from Firestore
      const reviews = await reviewsService.getAllReviews();

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
      const index = pc.Index("rag");
      await index.upsert(processedData);

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
};
