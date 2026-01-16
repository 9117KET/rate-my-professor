/**
 * Query Test Agent
 *
 * Purpose: This agent tests the query/search functionality to see if it can
 * correctly retrieve reviews from Pinecone. It simulates user queries and
 * checks if the results match expectations.
 *
 * Architecture: This follows a query validation pattern, testing different
 * types of queries that users might make to identify retrieval issues.
 *
 * Problem-solving: By testing queries, we can identify:
 * - Embedding generation issues for queries
 * - Pinecone query failures
 * - Metadata retrieval problems
 * - Result relevance issues
 * - Filter application problems
 */

// Load environment variables - try .env.local first (Next.js convention), then .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
require("dotenv").config();

const { OpenAI } = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");

async function testQueries() {
  const results = {
    queries: [],
    issues: [],
    success: true,
  };

  try {
    console.log("🔍 Query Test Agent Starting...\n");
    console.log("=".repeat(60));

    // Initialize clients
    const openaiKey =
      process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_NEW;
    const pineconeKey = process.env.PINECONE_API_KEY;

    if (!openaiKey || !pineconeKey) {
      console.log("❌ Missing API keys. Cannot test queries.\n");
      results.issues.push("Missing API keys");
      results.success = false;
      return results;
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    const pc = new Pinecone({ apiKey: pineconeKey });
    const index = pc.Index("rag");

    // Test queries
    const testQueries = [
      {
        name: "Simple professor query",
        query: "best computer science professor",
        expectedFields: ["professor", "subject", "review"],
      },
      {
        name: "Subject-specific query",
        query: "German courses",
        expectedFields: ["subject", "professor"],
      },
      {
        name: "Professor name query",
        query: "Dr. Emily Johnson",
        expectedFields: ["professor"],
      },
      {
        name: "Rating query",
        query: "highest rated professors",
        expectedFields: ["stars", "professor"],
      },
    ];

    console.log(`Testing ${testQueries.length} different query types...\n`);

    for (const testQuery of testQueries) {
      console.log(`Testing: "${testQuery.query}"`);
      console.log("-".repeat(60));

      const queryResult = {
        name: testQuery.name,
        query: testQuery.query,
        success: false,
        issues: [],
        results: [],
      };

      try {
        // Generate embedding for query
        const embeddingResponse = await openai.embeddings.create({
          input: testQuery.query,
          model: "text-embedding-3-small",
        });

        const queryEmbedding = embeddingResponse.data[0].embedding;
        console.log(
          `  ✅ Query embedding generated (dim: ${queryEmbedding.length})`
        );

        // Query Pinecone
        const queryResponse = await index.query({
          vector: queryEmbedding,
          topK: 5,
          includeMetadata: true,
        });

        const matches = queryResponse.matches || [];

        if (matches.length === 0) {
          queryResult.issues.push("No results returned");
          console.log(`  ⚠️  No results returned`);
        } else {
          console.log(`  ✅ Found ${matches.length} results`);

          // Check each result
          matches.forEach((match, index) => {
            const result = {
              id: match.id,
              score: match.score,
              metadata: match.metadata || {},
              missingFields: [],
            };

            // Check for expected fields
            testQuery.expectedFields.forEach((field) => {
              if (!match.metadata || !match.metadata[field]) {
                result.missingFields.push(field);
              }
            });

            if (result.missingFields.length > 0) {
              queryResult.issues.push(
                `Result ${
                  index + 1
                } missing fields: ${result.missingFields.join(", ")}`
              );
            }

            queryResult.results.push(result);

            console.log(`    Result ${index + 1}:`);
            console.log(`      ID: ${match.id}`);
            console.log(`      Score: ${match.score?.toFixed(4)}`);
            console.log(
              `      Professor: ${
                match.metadata?.professor || match.metadata?.name || "MISSING"
              }`
            );
            console.log(
              `      Subject: ${match.metadata?.subject || "MISSING"}`
            );
            if (result.missingFields.length > 0) {
              console.log(
                `      ⚠️  Missing: ${result.missingFields.join(", ")}`
              );
            }
          });
        }

        queryResult.success = queryResult.issues.length === 0;
      } catch (error) {
        queryResult.issues.push(`Query failed: ${error.message}`);
        console.log(`  ❌ Query failed: ${error.message}`);
      }

      results.queries.push(queryResult);
      console.log();
    }

    // Summary
    console.log("=".repeat(60));
    console.log("📋 QUERY TEST SUMMARY");
    console.log("=".repeat(60));

    const passedQueries = results.queries.filter((q) => q.success).length;
    const failedQueries = results.queries.filter((q) => !q.success);

    console.log(`\n  Passed: ${passedQueries}/${results.queries.length}`);
    console.log(
      `  Failed: ${failedQueries.length}/${results.queries.length}\n`
    );

    if (failedQueries.length > 0) {
      console.log("  Failed queries:");
      failedQueries.forEach((q) => {
        console.log(`    - ${q.name}: ${q.issues.join(", ")}`);
        results.issues.push(`${q.name}: ${q.issues.join(", ")}`);
      });
    }

    // Check for common issues
    const allResults = results.queries.flatMap((q) => q.results);
    const missingProfessorField = allResults.some(
      (r) => !r.metadata.professor && !r.metadata.name
    );

    if (missingProfessorField) {
      results.issues.push("Some results missing professor/name field");
    }
    // Department field removed from chat route - no longer expected

    results.success = failedQueries.length === 0 && results.issues.length === 0;

    if (results.success) {
      console.log("\n✅ All queries passed!\n");
    } else {
      console.log("\n❌ Some queries failed. See issues above.\n");
    }

    return results;
  } catch (error) {
    console.error("❌ Query testing failed:", error);
    results.success = false;
    results.issues.push(`Unexpected error: ${error.message}`);
    return results;
  }
}

// Run if called directly
if (require.main === module) {
  testQueries()
    .then((results) => {
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Query testing failed:", error);
      process.exit(1);
    });
}

module.exports = { testQueries };
