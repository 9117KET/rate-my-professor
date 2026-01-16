/**
 * Sync Process Validator Agent
 *
 * Purpose: This agent tests the entire sync process from Firestore to Pinecone
 * to identify where failures might occur. It simulates the sync process and
 * reports on each step's success or failure.
 *
 * Architecture: This follows a step-by-step validation pattern, testing each
 * stage of the sync pipeline independently to isolate issues.
 *
 * Problem-solving: By testing each step, we can identify:
 * - API connection issues
 * - Authentication problems
 * - Data transformation errors
 * - Embedding generation failures
 * - Pinecone upsert problems
 * - Rate limiting issues
 */

// Load environment variables - try .env.local first (Next.js convention), then .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
require("dotenv").config();

const { OpenAI } = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} = require("firebase/firestore");
const { getAuth, signInAnonymously } = require("firebase/auth");

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function validateSyncProcess() {
  const results = {
    steps: {},
    issues: [],
    success: true,
  };

  try {
    console.log("🔍 Sync Process Validator Agent Starting...\n");
    console.log("=".repeat(60));

    // Step 1: Validate API Keys
    console.log("Step 1: Validating API Keys...");
    console.log("-".repeat(60));

    const openaiKey =
      process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_NEW;
    const pineconeKey = process.env.PINECONE_API_KEY;

    if (!openaiKey) {
      results.issues.push("OPENAI_API_KEY is missing");
      results.steps.apiKeys = {
        success: false,
        error: "OPENAI_API_KEY missing",
      };
      console.log("  ❌ OPENAI_API_KEY: MISSING\n");
    } else {
      const keyPreview = `${openaiKey.substring(0, 10)}...${openaiKey.substring(
        openaiKey.length - 4
      )}`;
      console.log(`  ✅ OPENAI_API_KEY: Present (${keyPreview})`);
      results.steps.apiKeys = { success: true, keyLength: openaiKey.length };
    }

    if (!pineconeKey) {
      results.issues.push("PINECONE_API_KEY is missing");
      results.steps.apiKeys = {
        ...results.steps.apiKeys,
        success: false,
        error:
          (results.steps.apiKeys?.error || "") + " PINECONE_API_KEY missing",
      };
      console.log("  ❌ PINECONE_API_KEY: MISSING\n");
    } else {
      const keyPreview = `${pineconeKey.substring(
        0,
        10
      )}...${pineconeKey.substring(pineconeKey.length - 4)}`;
      console.log(`  ✅ PINECONE_API_KEY: Present (${keyPreview})\n`);
    }

    if (!openaiKey || !pineconeKey) {
      results.success = false;
      return results;
    }

    // Step 2: Initialize Clients
    console.log("Step 2: Initializing Clients...");
    console.log("-".repeat(60));

    let openai, pc, index;

    try {
      openai = new OpenAI({ apiKey: openaiKey });
      console.log("  ✅ OpenAI client initialized");

      pc = new Pinecone({ apiKey: pineconeKey });
      console.log("  ✅ Pinecone client initialized");

      index = pc.Index("rag");
      console.log("  ✅ Pinecone index 'rag' accessed\n");

      results.steps.clientInit = { success: true };
    } catch (error) {
      results.issues.push(`Client initialization failed: ${error.message}`);
      results.steps.clientInit = { success: false, error: error.message };
      console.log(`  ❌ Client initialization failed: ${error.message}\n`);
      results.success = false;
      return results;
    }

    // Step 3: Test Pinecone Connection
    console.log("Step 3: Testing Pinecone Connection...");
    console.log("-".repeat(60));

    try {
      const stats = await index.describeIndexStats();
      console.log(`  ✅ Pinecone connection successful`);
      console.log(`     Total vectors: ${stats.totalRecordCount || 0}`);
      console.log(`     Dimension: ${stats.dimension || "N/A"}\n`);
      results.steps.pineconeConnection = {
        success: true,
        totalVectors: stats.totalRecordCount,
        dimension: stats.dimension,
      };
    } catch (error) {
      results.issues.push(`Pinecone connection failed: ${error.message}`);
      results.steps.pineconeConnection = {
        success: false,
        error: error.message,
      };
      console.log(`  ❌ Pinecone connection failed: ${error.message}\n`);
      results.success = false;
      return results;
    }

    // Step 4: Fetch Sample Review from Firestore
    console.log("Step 4: Fetching Sample Review from Firestore...");
    console.log("-".repeat(60));

    let sampleReview;

    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const auth = getAuth(app);

      // Authenticate anonymously (required by Firestore security rules)
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const reviewsRef = collection(db, "reviews");
      let snapshot;
      try {
        const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(1));
        snapshot = await getDocs(q);
      } catch (orderByError) {
        // Fallback: try without orderBy
        snapshot = await getDocs(reviewsRef);
      }

      if (snapshot.empty) {
        results.issues.push("No reviews found in Firestore");
        results.steps.firestoreFetch = {
          success: false,
          error: "No reviews found",
        };
        console.log("  ⚠️  No reviews found in Firestore\n");
        results.success = false;
        return results;
      }

      const doc = snapshot.docs[0];
      sampleReview = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      };

      console.log(`  ✅ Sample review fetched (ID: ${sampleReview.id})`);
      console.log(`     Professor: ${sampleReview.professor || "MISSING"}`);
      console.log(`     Subject: ${sampleReview.subject || "MISSING"}`);
      console.log(
        `     Review length: ${(sampleReview.review || "").length} chars\n`
      );

      results.steps.firestoreFetch = {
        success: true,
        reviewId: sampleReview.id,
        hasProfessor: !!sampleReview.professor,
        hasSubject: !!sampleReview.subject,
        hasReview: !!sampleReview.review,
      };
    } catch (error) {
      results.issues.push(`Firestore fetch failed: ${error.message}`);
      results.steps.firestoreFetch = { success: false, error: error.message };
      console.log(`  ❌ Firestore fetch failed: ${error.message}\n`);
      results.success = false;
      return results;
    }

    // Step 5: Generate Embedding
    console.log("Step 5: Generating Embedding...");
    console.log("-".repeat(60));

    let embedding;

    try {
      // Create embedding input (same format as sync code)
      const professorName = (sampleReview.professor || "").trim();
      const subject = (sampleReview.subject || "").trim();
      const reviewText = (sampleReview.review || "").trim();

      const embeddingInput = [
        professorName && `Professor ${professorName}`,
        subject && `teaches ${subject}`,
        reviewText,
      ]
        .filter(Boolean)
        .join(". ");

      const finalInput = embeddingInput || reviewText || "Review";

      console.log(`  Input text length: ${finalInput.length} chars`);
      console.log(`  Input preview: ${finalInput.substring(0, 100)}...`);

      const embeddingResponse = await openai.embeddings.create({
        input: finalInput,
        model: "text-embedding-3-small",
      });

      embedding = embeddingResponse.data[0].embedding;

      console.log(`  ✅ Embedding generated`);
      console.log(`     Dimension: ${embedding.length}`);
      console.log(
        `     First 5 values: [${embedding
          .slice(0, 5)
          .map((v) => v.toFixed(4))
          .join(", ")}]\n`
      );

      results.steps.embeddingGeneration = {
        success: true,
        dimension: embedding.length,
        inputLength: finalInput.length,
      };
    } catch (error) {
      results.issues.push(`Embedding generation failed: ${error.message}`);
      results.steps.embeddingGeneration = {
        success: false,
        error: error.message,
      };
      console.log(`  ❌ Embedding generation failed: ${error.message}\n`);
      results.success = false;
      return results;
    }

    // Step 6: Test Pinecone Upsert
    console.log("Step 6: Testing Pinecone Upsert...");
    console.log("-".repeat(60));

    try {
      const testId = `test-sync-${Date.now()}`;
      const testVector = {
        id: testId,
        values: embedding,
        metadata: {
          review: sampleReview.review,
          subject: sampleReview.subject,
          stars: sampleReview.stars,
          professor: sampleReview.professor,
          createdAt:
            sampleReview.createdAt instanceof Date
              ? sampleReview.createdAt.toISOString()
              : new Date(sampleReview.createdAt).toISOString(),
        },
      };

      await index.upsert([testVector]);
      console.log(`  ✅ Test vector upserted (ID: ${testId})`);

      // Verify it was stored - wait a moment for Pinecone to index
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const verifyResponse = await index.fetch([testId]);
      const fetchedVector = verifyResponse.vectors?.[testId];

      if (fetchedVector) {
        console.log(`  ✅ Vector verified in Pinecone`);
        console.log(
          `     Metadata fields: ${Object.keys(
            fetchedVector.metadata || {}
          ).join(", ")}\n`
        );

        // Clean up test vector
        await index.deleteMany([testId]);
        console.log(`  ✅ Test vector cleaned up\n`);

        results.steps.pineconeUpsert = {
          success: true,
          testId,
          metadataFields: Object.keys(fetchedVector.metadata || {}),
        };
      } else {
        // Vector might not be immediately available, but upsert succeeded
        console.log(
          `  ⚠️  Vector upserted but not immediately available for verification`
        );
        console.log(`  This is normal - Pinecone may need a moment to index\n`);

        // Clean up test vector anyway
        try {
          await index.deleteMany([testId]);
          console.log(`  ✅ Test vector cleaned up\n`);
        } catch (cleanupError) {
          console.log(
            `  ⚠️  Could not clean up test vector: ${cleanupError.message}\n`
          );
        }

        results.steps.pineconeUpsert = {
          success: true,
          testId,
          note: "Upsert succeeded but vector not immediately available (normal)",
        };
      }
    } catch (error) {
      results.issues.push(`Pinecone upsert failed: ${error.message}`);
      results.steps.pineconeUpsert = { success: false, error: error.message };
      console.log(`  ❌ Pinecone upsert failed: ${error.message}\n`);
      results.success = false;
    }

    // Summary
    console.log("=".repeat(60));
    console.log("📋 VALIDATION SUMMARY");
    console.log("=".repeat(60));

    const allStepsPassed = Object.values(results.steps).every(
      (step) => step.success !== false
    );

    if (allStepsPassed && results.issues.length === 0) {
      console.log("✅ All sync steps validated successfully!\n");
      results.success = true;
    } else {
      console.log("❌ Some sync steps failed:\n");
      Object.entries(results.steps).forEach(([step, result]) => {
        const status = result.success ? "✅" : "❌";
        console.log(
          `  ${status} ${step}: ${
            result.success
              ? "PASSED"
              : `FAILED - ${result.error || "Unknown error"}`
          }`
        );
      });

      if (results.issues.length > 0) {
        console.log("\n  Issues found:");
        results.issues.forEach((issue) => console.log(`    - ${issue}`));
      }
      console.log();
      results.success = false;
    }

    return results;
  } catch (error) {
    console.error("❌ Validation failed with unexpected error:", error);
    results.success = false;
    results.issues.push(`Unexpected error: ${error.message}`);
    return results;
  }
}

// Run if called directly
if (require.main === module) {
  validateSyncProcess()
    .then((results) => {
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Validation failed:", error);
      process.exit(1);
    });
}

module.exports = { validateSyncProcess };
