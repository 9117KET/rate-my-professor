#!/usr/bin/env node

/**
 * Utility script to manually synchronize Firestore reviews with Pinecone vector store
 * Run with: node scripts/sync-pinecone.js
 * Options:
 *   --alt-method: Use the alternative method (deleteAll + upsert)
 *   --help: Show help
 *
 * Note: This script uses ES modules and requires Node.js 14+ with ES module support
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the embedding service (ES module)
const embeddingServiceModule = await import(
  join(__dirname, "../app/services/embeddingService.js")
);
const { embeddingService } = embeddingServiceModule;

const args = process.argv.slice(2);
const useAltMethod = args.includes("--alt-method");
const showHelp = args.includes("--help");

if (showHelp) {
  console.log(`
Pinecone Synchronization Utility
================================

This script manually synchronizes your Firestore reviews with the Pinecone vector store.
It will ensure that all deleted reviews are removed from Pinecone and all current 
reviews have up-to-date embeddings.

Usage:
  node scripts/sync-pinecone.js [options]

Options:
  --alt-method   Use the alternative method (deleteAll + upsert)
                 This is more reliable but deletes all vectors first
  --help         Show this help message

Environment:
  Make sure your .env file contains:
  - OPENAI_API_KEY
  - PINECONE_API_KEY
  - Firebase configuration (NEXT_PUBLIC_FIREBASE_*)
  `);
  process.exit(0);
}

async function main() {
  console.log("Starting Pinecone synchronization...");

  try {
    console.log(
      `Using ${useAltMethod ? "alternative" : "standard"} sync method`
    );

    if (useAltMethod) {
      await embeddingService.syncFirestoreWithPineconeFallback();
    } else {
      await embeddingService.syncFirestoreWithPinecone();
    }

    console.log("✅ Synchronization completed successfully");
  } catch (error) {
    console.error("❌ Synchronization failed:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

main();
