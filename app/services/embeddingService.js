import { reviewsService } from "./reviewsService";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Service for managing vector embeddings of reviews and other content
 * Handles synchronization between Firestore and Pinecone vector database
 * Enables semantic search and AI-powered retrieval of relevant reviews
 */
/**
 * Extract a valid OpenAI API key from a potentially corrupted/concatenated string
 * Supports both sk- (40-60 chars) and sk-proj- (100-200 chars) formats
 * @param {string} keyRaw - The raw API key string
 * @returns {string|null} - The extracted valid key or null if none found
 */
function extractValidOpenAIKey(keyRaw) {
  if (!keyRaw) return null;

  // Clean the key: remove quotes, trim whitespace, and remove any non-printable characters
  let cleaned = keyRaw
    .replace(/^["']|["']$/g, "")
    .trim()
    .replace(/[^\x20-\x7E]/g, "");

  // Check for sk-proj- format (project keys, typically 100-200 chars)
  if (cleaned.startsWith("sk-proj-")) {
    // Project keys are longer, typically 100-200 characters
    if (cleaned.length >= 100 && cleaned.length <= 200) {
      return cleaned;
    }
    // If too long, might be duplicated - try to extract the first valid one
    if (cleaned.length > 200) {
      const keyPattern = /sk-proj-[a-zA-Z0-9_-]{90,190}/;
      const match = cleaned.match(keyPattern);
      if (match && match[0].length >= 100 && match[0].length <= 200) {
        return match[0];
      }
    }
    // Return as-is if it starts with sk-proj- (might be slightly off length)
    return cleaned;
  }

  // Check for standard sk- format (40-60 chars)
  if (cleaned.startsWith("sk-")) {
    if (cleaned.length >= 40 && cleaned.length <= 60) {
      return cleaned;
    }
    // If too long, might be duplicated - try to extract the first valid one
    if (cleaned.length > 60) {
      const keyPattern = /sk-[a-zA-Z0-9]{37,57}/;
      const match = cleaned.match(keyPattern);
      if (match && match[0].length >= 40 && match[0].length <= 60) {
        return match[0];
      }
    }
    // Return as-is if it starts with sk- (might be slightly off length)
    return cleaned;
  }

  return null;
}

export const embeddingService = {
  /**
   * Initialize and return OpenAI and Pinecone clients
   * @returns {Object} Object containing initialized clients
   */
  async getClients() {
    // Try both OPENAI_API_KEY and OPENAI_API_KEY_NEW (workaround for Vercel caching)
    let apiKeyRaw =
      process.env.OPENAI_API_KEY_NEW || process.env.OPENAI_API_KEY;

    // Extract a valid key (handles concatenated/corrupted keys)
    const apiKey = extractValidOpenAIKey(apiKeyRaw) || "";
    const keyPreview = apiKey
      ? `${apiKey.substring(0, 10)}...${apiKey.substring(
          apiKey.length - 4
        )} (length: ${apiKey.length})`
      : "MISSING";

    // Detect if there were any issues with the key
    const originalLength =
      (process.env.OPENAI_API_KEY_NEW || process.env.OPENAI_API_KEY)?.length ||
      0;
    const cleanedLength = apiKey.length;
    const hadHiddenChars = originalLength !== cleanedLength;

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
          startsWithSk:
            apiKey.startsWith("sk-") || apiKey.startsWith("sk-proj-"),
          startsWithSkProj: apiKey.startsWith("sk-proj-"),
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
      apiKey ? `Present (${keyPreview})` : "Missing",
      hadHiddenChars
        ? `[WARNING: Key had hidden characters - original length: ${originalLength}, cleaned length: ${cleanedLength}]`
        : ""
    );

    // Validate API key format before creating client
    // Accept both sk- (40-60 chars) and sk-proj- (100-200 chars) formats
    const isValidFormat =
      apiKey &&
      (apiKey.startsWith("sk-proj-") || apiKey.startsWith("sk-")) &&
      ((apiKey.startsWith("sk-proj-") &&
        apiKey.length >= 100 &&
        apiKey.length <= 200) ||
        (apiKey.startsWith("sk-") &&
          apiKey.length >= 40 &&
          apiKey.length <= 60));

    if (!isValidFormat) {
      const originalLength = apiKeyRaw?.length || 0;
      const expectedFormat = apiKey?.startsWith("sk-proj-")
        ? "sk-proj- format (100-200 characters)"
        : "sk- format (40-60 characters) or sk-proj- format (100-200 characters)";
      throw new Error(
        `Invalid OpenAI API key format. Key preview: ${keyPreview}. OpenAI API keys should start with "sk-" or "sk-proj-" and be the correct length for their format (found: ${
          apiKey.length
        } chars, expected: ${expectedFormat}).${
          originalLength > 200
            ? ` The original key was ${originalLength} characters, which suggests it may be duplicated or concatenated. Please check your Vercel environment variable and ensure it contains only a single valid API key.`
            : ""
        } Please verify your OPENAI_API_KEY in Vercel Settings → Environment Variables.`
      );
    }

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
      // Validate API keys before proceeding - use same fallback logic as getClients()
      let openAIKeyRaw =
        process.env.OPENAI_API_KEY_NEW || process.env.OPENAI_API_KEY;

      // Extract a valid key (handles concatenated/corrupted keys)
      const openAIKey = extractValidOpenAIKey(openAIKeyRaw) || "";

      if (!openAIKey) {
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

      // Validate API key format - accept both sk- and sk-proj- formats
      const isValidFormat =
        openAIKey &&
        (openAIKey.startsWith("sk-proj-") || openAIKey.startsWith("sk-")) &&
        ((openAIKey.startsWith("sk-proj-") &&
          openAIKey.length >= 100 &&
          openAIKey.length <= 200) ||
          (openAIKey.startsWith("sk-") &&
            openAIKey.length >= 40 &&
            openAIKey.length <= 60));

      if (!isValidFormat) {
        const keyPreview = openAIKey
          ? `${openAIKey.substring(0, 10)}...${openAIKey.substring(
              openAIKey.length - 4
            )} (length: ${openAIKey.length})`
          : "MISSING";
        const originalLength = openAIKeyRaw?.length || 0;
        const expectedFormat = openAIKey?.startsWith("sk-proj-")
          ? "sk-proj- format (100-200 characters)"
          : "sk- format (40-60 characters) or sk-proj- format (100-200 characters)";
        throw new Error(
          `API key configuration error: Invalid OpenAI API key format. Key preview: ${keyPreview}. OpenAI API keys should start with "sk-" or "sk-proj-" and be the correct length (found: ${
            openAIKey.length
          } chars, expected: ${expectedFormat}).${
            originalLength > 200
              ? ` The original key was ${originalLength} characters, which suggests it may be duplicated or concatenated. Please check your Vercel environment variable.`
              : ""
          }`
        );
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
      if (
        error.message?.includes("API key") ||
        error.message?.includes("401") ||
        error.code === "invalid_api_key" ||
        error.status === 401
      ) {
        let openAIKeyRaw =
          process.env.OPENAI_API_KEY_NEW || process.env.OPENAI_API_KEY;
        const originalLength = openAIKeyRaw?.length || 0;

        // Clean the key to check for hidden characters
        if (openAIKeyRaw) {
          openAIKeyRaw = openAIKeyRaw
            .replace(/^["']|["']$/g, "")
            .trim()
            .replace(/[^\x20-\x7E]/g, "");
        }

        const keyPreview = openAIKeyRaw
          ? `${openAIKeyRaw.substring(0, 10)}...${openAIKeyRaw.substring(
              openAIKeyRaw.length - 4
            )} (length: ${openAIKeyRaw.length})`
          : "MISSING";

        const troubleshooting = [
          "1. Verify the key is correct in Vercel Settings → Environment Variables",
          "2. Check that the key starts with 'sk-' and is 40-60 characters long",
          "3. Ensure there are no extra spaces, quotes, or hidden characters",
          "4. Verify the key is active in your OpenAI account dashboard",
          "5. Try regenerating the API key in OpenAI and updating it in Vercel",
          "6. Make sure to redeploy after updating environment variables",
        ].join("\n");

        throw new Error(
          `API key configuration error: ${
            error.message
          }\nKey preview: ${keyPreview}${
            originalLength !== openAIKeyRaw?.length
              ? ` [Original length: ${originalLength}, cleaned length: ${openAIKeyRaw?.length} - key may have hidden characters]`
              : ""
          }\n\nTroubleshooting:\n${troubleshooting}`
        );
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
