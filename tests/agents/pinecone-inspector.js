/**
 * Pinecone Metadata Inspector Agent
 *
 * Purpose: This agent inspects the Pinecone vector database to understand what
 * metadata is actually stored and how it compares to what the code expects.
 * This helps identify metadata schema mismatches.
 *
 * Architecture: This diagnostic tool queries Pinecone directly to examine:
 * - What vectors exist
 * - What metadata fields are stored
 * - How metadata values look
 * - Whether metadata matches what the code expects
 *
 * Problem-solving: By examining Pinecone metadata, we can identify:
 * - Missing metadata fields (e.g., name, department vs professor, subject)
 * - Incorrect field names
 * - Data type mismatches
 * - Schema inconsistencies
 */

// Load environment variables - try .env.local first (Next.js convention), then .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
require("dotenv").config();

const { Pinecone } = require("@pinecone-database/pinecone");

async function inspectPinecone() {
  try {
    console.log("🔍 Pinecone Metadata Inspector Agent Starting...\n");
    console.log("=".repeat(60));

    // Debug: Check environment variable
    const pineconeKey = process.env.PINECONE_API_KEY;
    console.log("🔧 Environment Check:");
    console.log(`  PINECONE_API_KEY: ${pineconeKey ? "Present" : "MISSING"}`);
    if (pineconeKey) {
      console.log(
        `  Key preview: ${pineconeKey.substring(
          0,
          10
        )}...${pineconeKey.substring(pineconeKey.length - 4)}\n`
      );
    } else {
      console.log(
        "  ⚠️  PINECONE_API_KEY not found in environment variables\n"
      );
    }

    if (!pineconeKey) {
      return {
        totalVectors: 0,
        issues: ["PINECONE_API_KEY environment variable not found"],
      };
    }

    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: pineconeKey,
    });

    const index = pc.Index("rag");

    // Get index stats
    console.log("📊 Index Statistics:");
    console.log("-".repeat(60));
    const stats = await index.describeIndexStats();
    console.log(`  Total Vectors: ${stats.totalRecordCount || 0}`);
    console.log(`  Dimension: ${stats.dimension || "N/A"}`);
    console.log(`  Index Fullness: ${stats.indexFullness || "N/A"}\n`);

    if (stats.totalRecordCount === 0) {
      console.log("⚠️  WARNING: No vectors found in Pinecone!");
      console.log("   This could be the root cause - nothing is indexed.\n");
      return {
        totalVectors: 0,
        issues: ["No vectors found in Pinecone"],
      };
    }

    // Try to fetch sample vectors
    console.log("🔎 Fetching Sample Vectors...");
    console.log("-".repeat(60));

    let sampleVectors = [];
    const pageSize = 10;

    try {
      // Try to list vectors (this might not work in all Pinecone tiers)
      const listResponse = await index.listVectors({
        limit: pageSize,
      });

      if (listResponse?.vectors && listResponse.vectors.length > 0) {
        const vectorIds = listResponse.vectors.map((v) => v.id);
        const fetchResponse = await index.fetch(vectorIds);
        sampleVectors = Object.values(fetchResponse.vectors || {});
      }
    } catch (listError) {
      console.log(`  ⚠️  Cannot list vectors directly: ${listError.message}`);
      console.log("  Trying alternative method...\n");

      // Alternative: Query with a dummy vector to get some results
      try {
        // Create a dummy embedding (1536 dimensions for text-embedding-3-small)
        const dummyVector = new Array(1536).fill(0.001);
        const queryResponse = await index.query({
          vector: dummyVector,
          topK: Math.min(pageSize, stats.totalRecordCount || pageSize),
          includeMetadata: true,
        });

        if (queryResponse.matches && queryResponse.matches.length > 0) {
          sampleVectors = queryResponse.matches.map((match) => ({
            id: match.id,
            metadata: match.metadata,
            score: match.score,
          }));
        }
      } catch (queryError) {
        console.error(
          `  ❌ Alternative method also failed: ${queryError.message}`
        );
      }
    }

    if (sampleVectors.length === 0) {
      console.log("  ⚠️  Could not fetch sample vectors");
      return {
        totalVectors: stats.totalRecordCount,
        issues: ["Could not fetch sample vectors for inspection"],
      };
    }

    console.log(`  ✅ Fetched ${sampleVectors.length} sample vectors\n`);

    // Analyze metadata structure
    console.log("📋 Metadata Field Analysis:");
    console.log("-".repeat(60));

    const metadataFields = {};
    const fieldTypes = {};

    sampleVectors.forEach((vector) => {
      if (vector.metadata) {
        Object.keys(vector.metadata).forEach((key) => {
          if (!metadataFields[key]) {
            metadataFields[key] = 0;
            fieldTypes[key] = new Set();
          }
          metadataFields[key]++;
          fieldTypes[key].add(typeof vector.metadata[key]);
        });
      }
    });

    Object.entries(metadataFields)
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        const percentage = ((count / sampleVectors.length) * 100).toFixed(1);
        const types = Array.from(fieldTypes[field]).join(", ");
        console.log(
          `  ${field.padEnd(20)}: ${count.toString().padStart(3)}/${
            sampleVectors.length
          } (${percentage}%) [${types}]`
        );
      });

    // Check for expected vs actual fields
    console.log("\n🔎 Expected Field Check:");
    console.log("-".repeat(60));

    // Fields that the code expects (from embeddingService.js and sync-review/route.js)
    const expectedFields = [
      "professor",
      "subject",
      "review",
      "stars",
      "createdAt",
    ];
    // Fields that the chat route looks for (from api/chat/route.js)
    // Note: name is handled via professor field, department is not available
    const chatRouteExpects = [
      "professor", // Used instead of name
      "subject",
      "stars",
      "review",
    ];

    const missingExpected = [];
    const unexpectedFields = [];

    expectedFields.forEach((field) => {
      if (!metadataFields[field]) {
        missingExpected.push(field);
        console.log(
          `  ❌ ${field.padEnd(15)}: MISSING (expected by sync code)`
        );
      } else {
        console.log(`  ✅ ${field.padEnd(15)}: Present`);
      }
    });

    chatRouteExpects.forEach((field) => {
      if (!metadataFields[field]) {
        if (!expectedFields.includes(field)) {
          console.log(
            `  ⚠️  ${field.padEnd(15)}: MISSING (expected by chat route)`
          );
          missingExpected.push(field);
        }
      }
    });

    // Check if professor field exists (used instead of name)
    if (metadataFields.professor && !metadataFields.name) {
      console.log(
        `  ✅ professor      : Present (used instead of 'name' field)`
      );
    }

    // Show sample metadata
    console.log("\n📝 Sample Vector Metadata:");
    console.log("-".repeat(60));
    sampleVectors.slice(0, 5).forEach((vector, index) => {
      console.log(`\n  Vector ${index + 1} (ID: ${vector.id}):`);
      if (vector.metadata) {
        Object.entries(vector.metadata).forEach(([key, value]) => {
          const displayValue =
            typeof value === "string" && value.length > 50
              ? value.substring(0, 50) + "..."
              : value;
          console.log(`    ${key}: ${displayValue}`);
        });
      } else {
        console.log("    (no metadata)");
      }
    });

    // Identify issues
    console.log("\n" + "=".repeat(60));
    console.log("📋 SUMMARY");
    console.log("=".repeat(60));

    const issues = [];

    if (missingExpected.length > 0) {
      issues.push(
        `Missing expected metadata fields: ${missingExpected.join(", ")}`
      );
    }

    // Check for schema mismatch
    const hasProfessorField = metadataFields.professor;

    // Chat route now uses 'professor' field (fixed), so no mismatch
    if (hasProfessorField) {
      // This is correct - no issue
    } else {
      issues.push("Missing 'professor' field in metadata");
    }

    // Department field is not available in Firestore and has been removed from chat route
    // No need to flag this as an issue

    const report = {
      totalVectors: stats.totalRecordCount,
      dimension: stats.dimension,
      metadataFields,
      missingExpected,
      issues,
      sampleVectors: sampleVectors.slice(0, 5).map((v) => ({
        id: v.id,
        metadata: v.metadata,
      })),
    };

    if (issues.length === 0) {
      console.log("✅ No critical metadata issues found");
    } else {
      console.log("❌ Issues found:");
      issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    console.log("\n");

    return report;
  } catch (error) {
    console.error("❌ Error inspecting Pinecone:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  inspectPinecone()
    .then((report) => {
      console.log("✅ Inspection complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Inspection failed:", error);
      process.exit(1);
    });
}

module.exports = { inspectPinecone };
