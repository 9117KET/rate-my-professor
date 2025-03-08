require("dotenv").config();
const { OpenAI } = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");

async function checkEmbeddings() {
  try {
    console.log("Initializing clients...");

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    console.log("Connecting to Pinecone index...");
    const index = pc.Index("rag");

    // Check if we can list vectors
    try {
      console.log("Checking vectors in Pinecone...");
      const stats = await index.describeIndexStats();
      console.log("Index statistics:", stats);

      // Test vector embedding and query
      console.log("\nTesting embedding generation and query...");
      const testText = "Test embedding generation";

      const embedding = await openai.embeddings.create({
        input: testText,
        model: "text-embedding-3-small",
      });

      console.log("Successfully generated embedding");

      const queryResponse = await index.query({
        vector: embedding.data[0].embedding,
        topK: 1,
        includeMetadata: true,
      });

      console.log("\nQuery response:", queryResponse);
      console.log("\n✅ Embeddings system is working correctly!");
    } catch (error) {
      console.error("Error accessing Pinecone:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkEmbeddings().catch(console.error);
