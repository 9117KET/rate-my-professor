#!/usr/bin/env node

/**
 * Utility script to manually synchronize Firestore reviews with Pinecone vector store
 * Run with: node scripts/sync-pinecone-compat.js
 * Options:
 *   --alt-method: Use the alternative method (deleteAll + upsert)
 *   --help: Show help
 */

require("dotenv").config();
const path = require("path");
const { OpenAI } = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");
const firebaseAdmin = require("firebase-admin");
const fs = require("fs");

const args = process.argv.slice(2);
const useAltMethod = args.includes("--alt-method");
const showHelp = args.includes("--help");

// Load Firebase credentials from a JSON file
let serviceAccount;
try {
  const credentialsPath = path.resolve(
    process.cwd(),
    "firebase-credentials.json"
  );
  if (fs.existsSync(credentialsPath)) {
    serviceAccount = require(credentialsPath);
  } else {
    // Try to create from environment variables
    serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    };
  }
} catch (error) {
  console.error("Error loading Firebase credentials:", error);
  process.exit(1);
}

// Initialize Firebase
let db;
try {
  const app = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
  });
  db = firebaseAdmin.firestore(app);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  process.exit(1);
}

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
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      reactions: doc.data().reactions || {
        thumbsUp: 0,
        thumbsDown: 0,
        love: 0,
      },
    }));
  } catch (error) {
    console.error("Error getting reviews:", error);
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

    // Step 5: Create or update embeddings for current reviews
    console.log("Creating embeddings for reviews...");
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
      await index.deleteAll();
      console.log("Cleared all vectors from Pinecone index");
    } catch (deleteError) {
      console.error("Error clearing Pinecone index:", deleteError);
      // Continue with the upsert even if deletion fails
    }

    // Create embeddings for each review
    console.log("Creating embeddings for reviews...");
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

  try {
    console.log(
      `Using ${useAltMethod ? "alternative" : "standard"} sync method`
    );

    if (useAltMethod) {
      await syncWithAlternativeMethod();
    } else {
      await syncWithStandardMethod();
    }

    console.log("✅ Synchronization completed successfully");
  } catch (error) {
    console.error("❌ Synchronization failed:", error);
    process.exit(1);
  }
}

main();
