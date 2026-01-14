#!/usr/bin/env node

/**
 * Utility script to manually synchronize Firestore reviews with Pinecone vector store
 * Run with: node scripts/sync-pinecone-compat.js
 * Options:
 *   --alt-method: Use the alternative method (deleteAll + upsert)
 *   --help: Show help
 */

// Load environment variables first
// Try .env.local first (Next.js convention), then .env
console.log("Loading environment variables...");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Try .env.local first (Next.js convention)
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envLocalPath)) {
  console.log("Loading from .env.local...");
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log("Loading from .env...");
  dotenv.config({ path: envPath });
} else {
  console.log(
    "No .env or .env.local file found, using system environment variables"
  );
  dotenv.config(); // This will use system env vars
}

console.log("Environment variables loaded");

// Check if required env vars are present
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in .env file");
  process.exit(1);
}
if (!process.env.PINECONE_API_KEY) {
  console.error("ERROR: PINECONE_API_KEY is not set in .env file");
  process.exit(1);
}

console.log("Loading dependencies...");
const { OpenAI } = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
} = require("firebase/firestore");
const { getAuth, signInAnonymously } = require("firebase/auth");
console.log("Dependencies loaded");

const args = process.argv.slice(2);
const useAltMethod = args.includes("--alt-method");
const showHelp = args.includes("--help");

// Initialize Firebase using client SDK (same as the app)
// This will be initialized in the main function
let db;
let firebaseApp;

const initializeFirebase = async () => {
  try {
    console.log("Initializing Firebase...");

    // Check for required Firebase config
    if (
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ) {
      console.error(
        "ERROR: Firebase configuration is missing. Please set NEXT_PUBLIC_FIREBASE_* variables in .env.local"
      );
      process.exit(1);
    }

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    // Authenticate anonymously to access Firestore
    console.log("Authenticating anonymously...");
    await signInAnonymously(auth);
    console.log("Firebase initialized and authenticated successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    console.error("Error details:", error.message);
    throw error;
  }
};

if (showHelp) {
  console.log(`
Pinecone Synchronization Utility
================================

This script manually synchronizes your Firestore reviews with the Pinecone vector store.
It will ensure that all deleted reviews are removed from Pinecone and all current 
reviews have up-to-date embeddings.

Usage:
  node ${path.basename(__filename)} [options]

Options:
  --alt-method   Use the alternative method (deleteAll + upsert)
                 This is more reliable but deletes all vectors first
  --help         Show this help message

Environment:
  Make sure your .env file contains:
  - OPENAI_API_KEY
  - PINECONE_API_KEY
  - Firebase configuration
  `);
  process.exit(0);
}

// Simplified reimplementation of embeddingService and reviewsService for this script
const COLLECTION_NAME = "reviews";

const getClients = async () => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "",
  });

  return { openai, pc };
};

const getAllReviews = async () => {
  try {
    console.log("Fetching reviews from Firestore...");
    const reviewsRef = collection(db, COLLECTION_NAME);
    const q = query(reviewsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      reactions: doc.data().reactions || {
        thumbsUp: [],
        thumbsDown: [],
      },
    }));

    console.log(`Found ${reviews.length} reviews in Firestore`);
    return reviews;
  } catch (error) {
    console.error("Error getting reviews:", error);
    console.error("Error details:", error.message);
    throw error;
  }
};

const syncWithStandardMethod = async () => {
  try {
    const { openai, pc } = await getClients();
    const index = pc.Index("rag");

    // Step 1: Get all reviews from Firestore
    const reviews = await getAllReviews();
    const firestoreIds = reviews.map((review) => review.id);
    console.log(`Found ${reviews.length} reviews in Firestore`);

    // Step 2: Try to get all existing vector IDs from Pinecone
    try {
      const existingVectors = await index.listVectors();
      const pineconeIds =
        existingVectors?.vectors?.map((vector) => vector.id) || [];
      console.log(`Found ${pineconeIds.length} vectors in Pinecone`);

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
      } else {
        console.log(
          "No vectors to delete - all Pinecone vectors have matching Firestore documents"
        );
      }
    } catch (listError) {
      console.warn(
        "Unable to list vectors from Pinecone. Falling back to alternative method:",
        listError.message
      );
      // If listVectors is not available, fall back to the alternative method
      return syncWithAlternativeMethod();
    }

    // Step 5: Create or update embeddings for current reviews with enhanced context
    // Enhanced embedding includes professor name, subject, and review text for better semantic matching
    console.log("Creating embeddings for reviews...");

    // Process in batches to avoid rate limits
    const BATCH_SIZE = 50;
    const processedData = [];

    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      const batch = reviews.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
          reviews.length / BATCH_SIZE
        )} (${batch.length} reviews)`
      );

      const batchResults = await Promise.all(
        batch.map(async (review) => {
          try {
            // Create enhanced embedding input: "Professor [name] teaches [subject]. [review text]"
            const professorName = (review.professor || "").trim();
            const subject = (review.subject || "").trim();
            const reviewText = (review.review || "").trim();

            const embeddingInput = [
              professorName && `Professor ${professorName}`,
              subject && `teaches ${subject}`,
              reviewText,
            ]
              .filter(Boolean)
              .join(". ");

            const finalInput = embeddingInput || reviewText || "Review";

            const response = await openai.embeddings.create({
              input: finalInput,
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
              error.message
            );
            return null;
          }
        })
      );

      const successfulResults = batchResults.filter(
        (result) => result !== null
      );
      processedData.push(...successfulResults);

      // Small delay between batches
      if (i + BATCH_SIZE < reviews.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `Successfully generated ${processedData.length} embeddings out of ${reviews.length} reviews`
    );

    // Step 6: Upsert to Pinecone
    if (processedData.length > 0) {
      console.log(`Upserting ${processedData.length} vectors to Pinecone`);
      await index.upsert(processedData);
    }

    return true;
  } catch (error) {
    console.error("Error syncing with Pinecone:", error);
    throw error;
  }
};

const syncWithAlternativeMethod = async () => {
  try {
    const { openai, pc } = await getClients();
    const index = pc.Index("rag");

    // Get all reviews from Firestore
    const reviews = await getAllReviews();
    console.log(`Found ${reviews.length} reviews in Firestore`);

    // First, delete all vectors in the index to ensure clean state
    try {
      console.log("Deleting all vectors from Pinecone index...");
      console.log(
        "This may take a moment depending on the number of vectors..."
      );

      // Add timeout wrapper for deleteAll operation
      const deletePromise = index.deleteAll();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error("Delete operation timed out after 60 seconds")),
          60000
        )
      );

      await Promise.race([deletePromise, timeoutPromise]);
      console.log("Cleared all vectors from Pinecone index");
    } catch (deleteError) {
      console.warn(
        "Error or timeout clearing Pinecone index:",
        deleteError.message
      );
      console.log(
        "Continuing with upsert anyway - new vectors will overwrite old ones"
      );
      // Continue with the upsert even if deletion fails
    }

    // Create embeddings for each review with enhanced context
    console.log("Creating embeddings for reviews...");

    // Process in batches to avoid rate limits
    const BATCH_SIZE = 50;
    const processedData = [];

    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      const batch = reviews.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
          reviews.length / BATCH_SIZE
        )}`
      );

      const batchResults = await Promise.all(
        batch.map(async (review) => {
          try {
            // Enhanced embedding input: "Professor [name] teaches [subject]. [review text]"
            const professorName = (review.professor || "").trim();
            const subject = (review.subject || "").trim();
            const reviewText = (review.review || "").trim();

            const embeddingInput = [
              professorName && `Professor ${professorName}`,
              subject && `teaches ${subject}`,
              reviewText,
            ]
              .filter(Boolean)
              .join(". ");

            const finalInput = embeddingInput || reviewText || "Review";

            const response = await openai.embeddings.create({
              input: finalInput,
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
              error.message
            );
            return null;
          }
        })
      );

      const successfulResults = batchResults.filter(
        (result) => result !== null
      );
      processedData.push(...successfulResults);

      if (i + BATCH_SIZE < reviews.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `Successfully generated ${processedData.length} embeddings out of ${reviews.length} reviews`
    );

    // Upsert to Pinecone
    if (processedData.length > 0) {
      console.log(`Upserting ${processedData.length} vectors to Pinecone`);
      await index.upsert(processedData);
    }

    return true;
  } catch (error) {
    console.error("Error syncing with Pinecone:", error);
    throw error;
  }
};

async function main() {
  console.log("Starting Pinecone synchronization...");
  console.log("Checking environment variables...");
  console.log(
    "OPENAI_API_KEY:",
    process.env.OPENAI_API_KEY ? "Set" : "Missing"
  );
  console.log(
    "PINECONE_API_KEY:",
    process.env.PINECONE_API_KEY ? "Set" : "Missing"
  );
  console.log(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Set" : "Missing"
  );

  try {
    // Initialize Firebase first
    await initializeFirebase();

    console.log(
      `Using ${useAltMethod ? "alternative" : "standard"} sync method`
    );

    if (useAltMethod) {
      console.log("Calling syncWithAlternativeMethod...");
      await syncWithAlternativeMethod();
    } else {
      console.log("Calling syncWithStandardMethod...");
      await syncWithStandardMethod();
    }

    console.log("✅ Synchronization completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Synchronization failed:", error);
    console.error("Error message:", error.message);
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

main();
