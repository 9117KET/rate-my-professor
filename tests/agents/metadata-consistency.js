/**
 * Metadata Consistency Agent
 *
 * Purpose: This agent compares what metadata is stored in Pinecone vs what
 * the code expects to find. It identifies schema mismatches that could cause
 * indexing or retrieval issues.
 *
 * Architecture: This follows a schema validation pattern, comparing:
 * - What fields are stored (Pinecone)
 * - What fields the sync code writes
 * - What fields the query code expects
 *
 * Problem-solving: By comparing schemas, we can identify:
 * - Field name mismatches (e.g., "name" vs "professor")
 * - Missing fields that code expects
 * - Extra fields that aren't used
 * - Data type inconsistencies
 */

// Load environment variables - try .env.local first (Next.js convention), then .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
require("dotenv").config();

const { Pinecone } = require("@pinecone-database/pinecone");
const fs = require("fs");
const path = require("path");

async function checkMetadataConsistency() {
  const results = {
    schemaMismatches: [],
    missingFields: [],
    unexpectedFields: [],
    issues: [],
    recommendations: [],
  };

  try {
    console.log("🔍 Metadata Consistency Agent Starting...\n");
    console.log("=".repeat(60));

    // Define expected schemas from code analysis
    console.log("📋 Analyzing Code to Determine Expected Schema...");
    console.log("-".repeat(60));

    // Schema that sync code writes (from embeddingService.js and sync-review/route.js)
    const syncSchema = {
      professor: "string (required)",
      subject: "string (required)",
      review: "string (required)",
      stars: "number (required)",
      createdAt: "string (ISO date, required)",
    };

    // Schema that chat route expects (from api/chat/route.js)
    // Note: department removed as it's not available in Firestore and handled gracefully
    const chatRouteSchema = {
      professor: "string (used instead of name)",
      subject: "string (expected)",
      stars: "number (expected)",
      review: "string (expected)",
    };

    console.log("  Sync code writes:");
    Object.entries(syncSchema).forEach(([field, type]) => {
      console.log(`    - ${field}: ${type}`);
    });

    console.log("\n  Chat route expects:");
    Object.entries(chatRouteSchema).forEach(([field, type]) => {
      console.log(`    - ${field}: ${type}`);
    });

    // Check Pinecone for actual schema
    console.log("\n📊 Checking Pinecone Actual Schema...");
    console.log("-".repeat(60));

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pc.Index("rag");

    // Get sample vectors
    let sampleVectors = [];
    try {
      const stats = await index.describeIndexStats();
      if (stats.totalRecordCount === 0) {
        console.log("  ⚠️  No vectors in Pinecone - cannot check schema\n");
        results.issues.push("No vectors in Pinecone to analyze");
        return results;
      }

      // Try to get sample vectors
      const dummyVector = new Array(1536).fill(0.001);
      const queryResponse = await index.query({
        vector: dummyVector,
        topK: Math.min(10, stats.totalRecordCount),
        includeMetadata: true,
      });

      sampleVectors = queryResponse.matches || [];
    } catch (error) {
      console.log(`  ❌ Failed to fetch sample vectors: ${error.message}\n`);
      results.issues.push(`Failed to fetch vectors: ${error.message}`);
      return results;
    }

    if (sampleVectors.length === 0) {
      console.log("  ⚠️  No sample vectors retrieved\n");
      results.issues.push("No sample vectors retrieved");
      return results;
    }

    // Analyze actual schema
    const actualSchema = {};
    sampleVectors.forEach((match) => {
      if (match.metadata) {
        Object.keys(match.metadata).forEach((key) => {
          if (!actualSchema[key]) {
            actualSchema[key] = {
              type: typeof match.metadata[key],
              count: 0,
              sample: match.metadata[key],
            };
          }
          actualSchema[key].count++;
        });
      }
    });

    console.log("  Actual Pinecone schema:");
    Object.entries(actualSchema)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([field, info]) => {
        const percentage = ((info.count / sampleVectors.length) * 100).toFixed(
          1
        );
        const samplePreview =
          typeof info.sample === "string" && info.sample.length > 30
            ? info.sample.substring(0, 30) + "..."
            : info.sample;
        console.log(
          `    - ${field}: ${info.type} (${info.count}/${sampleVectors.length}, ${percentage}%)`
        );
        console.log(`      Sample: ${samplePreview}`);
      });

    // Compare schemas
    console.log("\n🔎 Schema Comparison...");
    console.log("-".repeat(60));

    // Check for fields chat route expects but doesn't exist
    Object.keys(chatRouteSchema).forEach((field) => {
      if (!actualSchema[field]) {
        console.log(`  ❌ Missing: ${field} (expected by chat route)`);
        results.missingFields.push({
          field,
          expectedBy: "chat route",
          impact: "Chat route cannot find this field",
        });
      }
    });

    // Check for fields sync code writes
    Object.keys(syncSchema).forEach((field) => {
      if (!actualSchema[field]) {
        console.log(`  ⚠️  Missing: ${field} (should be written by sync code)`);
        results.missingFields.push({
          field,
          expectedBy: "sync code",
          impact: "Sync code should write this but it's missing",
        });
      }
    });

    // Check for schema mismatches
    // Note: Chat route now uses 'professor' field (fixed), so no mismatch
    if (actualSchema.professor) {
      console.log(
        `  ✅ professor field present (chat route uses this instead of 'name')`
      );
    }

    // Department field is not available in Firestore and has been removed from chat route
    // No need to flag this as an issue - it's handled gracefully

    // Check for unexpected fields
    const allExpectedFields = new Set([
      ...Object.keys(syncSchema),
      ...Object.keys(chatRouteSchema),
    ]);

    Object.keys(actualSchema).forEach((field) => {
      if (!allExpectedFields.has(field)) {
        console.log(`  ℹ️  Unexpected: ${field} (not used by code)`);
        results.unexpectedFields.push(field);
      }
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 CONSISTENCY SUMMARY");
    console.log("=".repeat(60));

    if (
      results.schemaMismatches.length === 0 &&
      results.missingFields.length === 0
    ) {
      console.log("✅ No schema consistency issues found!\n");
    } else {
      console.log("❌ Schema consistency issues found:\n");

      if (results.schemaMismatches.length > 0) {
        console.log("  Schema Mismatches:");
        results.schemaMismatches.forEach((mismatch) => {
          console.log(`    - ${mismatch.issue}`);
          console.log(`      Details: ${mismatch.details}`);
          console.log(`      Impact: ${mismatch.impact}`);
          console.log(`      Fix: ${mismatch.fix}`);
          console.log();
        });
      }

      if (results.missingFields.length > 0) {
        console.log("  Missing Fields:");
        results.missingFields.forEach((field) => {
          console.log(`    - ${field.field} (expected by ${field.expectedBy})`);
          console.log(`      Impact: ${field.impact}`);
          console.log();
        });
      }
    }

    // Generate recommendations only if there are actual issues
    if (
      results.schemaMismatches.length > 0 ||
      results.missingFields.length > 0
    ) {
      if (
        results.missingFields.some(
          (f) => !["name", "department"].includes(f.field)
        )
      ) {
        results.recommendations.push(
          "Ensure all required fields are present in every vector"
        );
      }
    }

    results.issues = [
      ...results.schemaMismatches.map((m) => m.issue),
      ...results.missingFields.map((f) => `Missing: ${f.field}`),
    ];

    return results;
  } catch (error) {
    console.error("❌ Consistency check failed:", error);
    results.issues.push(`Error: ${error.message}`);
    return results;
  }
}

// Run if called directly
if (require.main === module) {
  checkMetadataConsistency()
    .then((results) => {
      const hasIssues = results.issues.length > 0;
      process.exit(hasIssues ? 1 : 0);
    })
    .catch((error) => {
      console.error("❌ Consistency check failed:", error);
      process.exit(1);
    });
}

module.exports = { checkMetadataConsistency };
