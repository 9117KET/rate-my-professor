import { reviewsService } from "./reviewsService";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Service for managing vector embeddings of reviews and other content
 * Handles synchronization between Firestore and Pinecone vector database
 * Enables semantic search and AI-powered retrieval of relevant reviews
 */
export const embeddingService = {
  /**
   * Initialize and return OpenAI and Pinecone clients
   * @returns {Object} Object containing initialized clients
   */
  async getClients() {
    // Try both OPENAI_API_KEY and OPENAI_API_KEY_NEW (workaround for Vercel caching)
    const apiKey =
      (process.env.OPENAI_API_KEY_NEW || process.env.OPENAI_API_KEY)?.trim() ||
      "";
    const keyPreview = apiKey
      ? `${apiKey.substring(0, 10)}...${apiKey.substring(
          apiKey.length - 4
        )} (length: ${apiKey.length})`
      : "MISSING";

    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "embeddingService.js:15",
        message: "getClients - API key check",
        data: {
          keyPreview: keyPreview,
          keyLength: apiKey.length,
          hasKey: !!apiKey,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H1",
      }),
    }).catch(() => {});
    // #endregion

    console.log(
      "OPENAI_API_KEY:",
      apiKey ? `Present (${keyPreview})` : "Missing"
    );

    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });

    return { openai, pc };
  },

  /**
   * Main synchronization method between Firestore and Pinecone
   * Gets all reviews from Firestore, creates embeddings, and updates Pinecone
   * Also removes vectors from Pinecone that no longer exist in Firestore
   * @returns {boolean} Success status of synchronization
   */
  async syncFirestoreWithPinecone() {
    try {
      console.log("Starting Pinecone sync...");
      const { openai, pc } = await this.getClients();
      const index = pc.Index("rag");

      // Step 1: Get all reviews from Firestore
      const reviews = await reviewsService.getAllReviews();
      console.log(`Found ${reviews.length} reviews in Firestore`);

      if (reviews.length === 0) {
        console.log("No reviews found in Firestore, skipping sync");
        return true;
      }

      const firestoreIds = reviews.map((review) => review.id);

      // Step 2: Try to get all existing vector IDs from Pinecone
      try {
        const existingVectors = await index.describeIndexStats();
        console.log("Current Pinecone index stats:", existingVectors);

        if (existingVectors.totalRecordCount > 0) {
          const vectorsList = await index.listVectors();
          const pineconeIds =
            vectorsList?.vectors?.map((vector) => vector.id) || [];
          console.log(`Found ${pineconeIds.length} vectors in Pinecone`);

          // Step 3: Find vectors to delete
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
        }
      } catch (listError) {
        console.warn(
          "Unable to list vectors from Pinecone, attempting cleanup:",
          listError.message
        );
        // Try to clean up the index
        try {
          await index.deleteAll();
          console.log("Cleared Pinecone index for fresh start");
        } catch (deleteError) {
          console.error("Failed to clear Pinecone index:", deleteError);
        }
      }

      // Step 5: Create or update embeddings for current reviews
      console.log("Generating embeddings for reviews...");
      const processedData = await Promise.all(
        reviews.map(async (review) => {
          try {
            // Create embeddings using OpenAI's embedding model
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
                createdAt:
                  review.createdAt instanceof Date
                    ? review.createdAt.toISOString()
                    : new Date(review.createdAt).toISOString(),
              },
            };
          } catch (error) {
            console.error(
              `Failed to generate embedding for review ${review.id}:`,
              error
            );
            throw error;
          }
        })
      );

      // Step 6: Upsert to Pinecone
      if (processedData.length > 0) {
        console.log(`Upserting ${processedData.length} vectors to Pinecone`);
        await index.upsert(processedData);

        // Verify the upsert
        const stats = await index.describeIndexStats();
        console.log("Post-upsert Pinecone stats:", stats);

        if (stats.totalRecordCount !== reviews.length) {
          console.warn(
            `Warning: Pinecone record count (${stats.totalRecordCount}) doesn't match Firestore review count (${reviews.length})`
          );
        }
      }

      console.log("Pinecone sync completed successfully");
      return true;
    } catch (error) {
      console.error("Error syncing with Pinecone:", error);
      throw error;
    }
  },

  /**
   * Alternative synchronization method that deletes all vectors and recreates them
   * Used as a fallback when the primary sync method fails
   * @returns {boolean} Success status of synchronization
   */
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
        // Continue anyway since we're trying to recover
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
    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "embeddingService.js:208",
        message: "queryReviews entry",
        data: { userMessageLength: userMessage?.length || 0 },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
    try {
      // Validate API keys before proceeding
      if (!process.env.OPENAI_API_KEY) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "embeddingService.js:211",
              message: "OPENAI_API_KEY missing in queryReviews",
              data: {},
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "H1",
            }),
          }
        ).catch(() => {});
        // #endregion
        throw new Error("OPENAI_API_KEY is not configured");
      }
      if (!process.env.PINECONE_API_KEY) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "embeddingService.js:214",
              message: "PINECONE_API_KEY missing in queryReviews",
              data: {},
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "H1",
            }),
          }
        ).catch(() => {});
        // #endregion
        throw new Error("PINECONE_API_KEY is not configured");
      }

      const { openai, pc } = await this.getClients();
      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "embeddingService.js:218",
            message: "After getClients",
            data: { hasOpenAI: !!openai, hasPc: !!pc },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H2",
          }),
        }
      ).catch(() => {});
      // #endregion
      const index = pc.Index("rag");

      // Get embedding for user message
      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "embeddingService.js:222",
            message: "Before OpenAI embedding call",
            data: {},
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H2",
          }),
        }
      ).catch(() => {});
      // #endregion
      const embeddingResponse = await openai.embeddings.create({
        input: userMessage,
        model: "text-embedding-3-small",
      });
      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "embeddingService.js:227",
            message: "After OpenAI embedding call",
            data: {
              hasEmbedding: !!embeddingResponse?.data?.[0]?.embedding,
              embeddingLength:
                embeddingResponse?.data?.[0]?.embedding?.length || 0,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H2",
          }),
        }
      ).catch(() => {});
      // #endregion

      if (!embeddingResponse?.data?.[0]?.embedding) {
        throw new Error("Failed to generate embedding for user message");
      }

      // Query Pinecone
      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "embeddingService.js:232",
            message: "Before Pinecone query",
            data: {},
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H2",
          }),
        }
      ).catch(() => {});
      // #endregion
      const queryResponse = await index.query({
        vector: embeddingResponse.data[0].embedding,
        topK: 3,
        includeMetadata: true,
      });
      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "embeddingService.js:257",
            message: "After Pinecone query",
            data: {
              matchesCount: queryResponse?.matches?.length || 0,
              hasMatches: !!queryResponse?.matches,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H2",
          }),
        }
      ).catch(() => {});
      // #endregion

      // Return matches or empty array if no matches found
      return queryResponse.matches || [];
    } catch (error) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7244/ingest/294ab762-d38f-4683-b888-d3bab9ca5251",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "embeddingService.js:261",
            message: "Error in queryReviews catch",
            data: {
              errorName: error?.name,
              errorMessage: error?.message,
              errorStack: error?.stack?.substring(0, 500),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H2",
          }),
        }
      ).catch(() => {});
      // #endregion
      console.error("Error querying reviews:", error);

      // Provide more specific error messages
      if (error.message?.includes("API key")) {
        throw new Error("API key configuration error: " + error.message);
      }
      if (
        error.message?.includes("Pinecone") ||
        error.message?.includes("index")
      ) {
        throw new Error("Vector database connection error: " + error.message);
      }

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
