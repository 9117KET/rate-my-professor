/**
 * Environment Variable Checker
 *
 * Quick utility to verify environment variables are loading correctly
 */

// Load environment variables - try .env.local first (Next.js convention), then .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
require("dotenv").config();

console.log("🔍 Environment Variable Checker\n");
console.log("=".repeat(60));

const requiredVars = {
  OpenAI: ["OPENAI_API_KEY", "OPENAI_API_KEY_NEW"],
  Pinecone: ["PINECONE_API_KEY"],
  Firebase: [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ],
};

let allPresent = true;

Object.entries(requiredVars).forEach(([category, vars]) => {
  console.log(`\n${category}:`);
  console.log("-".repeat(60));

  vars.forEach((varName) => {
    const value = process.env[varName];
    const status = value ? "✅" : "❌";
    const display = value
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)} (${
          value.length
        } chars)`
      : "MISSING";

    console.log(`  ${status} ${varName.padEnd(35)}: ${display}`);

    if (!value) {
      allPresent = false;
    }
  });
});

console.log("\n" + "=".repeat(60));
if (allPresent) {
  console.log("✅ All required environment variables are present!");
} else {
  console.log("❌ Some environment variables are missing!");
  console.log(
    "\n💡 Tip: Make sure your .env.local file is in the rate-my-professor directory"
  );
}

process.exit(allPresent ? 0 : 1);
