/**
 * Firestore Data Inspector Agent
 *
 * Purpose: This agent inspects the Firestore database to understand what data
 * actually exists and what structure it has. This helps identify if the problem
 * is with data availability, data structure, or data quality.
 *
 * Architecture: This is a diagnostic tool that follows a data inspection pattern.
 * It queries Firestore directly and reports on the structure and content of reviews.
 *
 * Problem-solving: By examining the actual data structure, we can identify:
 * - Missing required fields
 * - Incorrect field names
 * - Data quality issues
 * - Schema mismatches with what Pinecone expects
 */

// Load environment variables - try .env.local first (Next.js convention), then .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
require("dotenv").config();

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

async function inspectFirestore() {
  try {
    console.log("🔍 Firestore Data Inspector Agent Starting...\n");
    console.log("=".repeat(60));

    // Debug: Check environment variables
    console.log("🔧 Environment Check:");
    console.log(`  Project ID: ${firebaseConfig.projectId || "MISSING"}`);
    console.log(`  API Key: ${firebaseConfig.apiKey ? "Present" : "MISSING"}`);
    console.log(`  Auth Domain: ${firebaseConfig.authDomain || "MISSING"}\n`);

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Authenticate anonymously (required by Firestore security rules)
    console.log("🔐 Authenticating...");
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
        console.log("  ✅ Anonymous authentication successful\n");
      } else {
        console.log("  ✅ Already authenticated\n");
      }
    } catch (authError) {
      console.log(`  ⚠️  Authentication failed: ${authError.message}`);
      console.log("  Continuing anyway...\n");
    }

    // Try to get reviews without orderBy first (in case createdAt index doesn't exist)
    console.log("📖 Attempting to fetch reviews...");
    let snapshot;
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch (orderByError) {
      console.log(`  ⚠️  OrderBy query failed: ${orderByError.message}`);
      console.log("  Trying without orderBy...");
      // Fallback: try without orderBy
      try {
        const reviewsRef = collection(db, "reviews");
        snapshot = await getDocs(reviewsRef);
      } catch (fetchError) {
        console.log(`  ❌ Fetch failed: ${fetchError.message}`);
        throw fetchError;
      }
    }

    const totalReviews = snapshot.size;
    console.log(`\n📊 Total Reviews in Firestore: ${totalReviews}\n`);

    if (totalReviews === 0) {
      console.log("⚠️  WARNING: No reviews found in Firestore!");
      console.log(
        "   This could be the root cause - there's no data to index.\n"
      );
      return {
        totalReviews: 0,
        issues: ["No reviews found in Firestore"],
      };
    }

    // Analyze review structure
    const reviews = [];
    const fieldFrequency = {};
    const sampleReviews = [];

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const review = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || null,
      };

      reviews.push(review);

      // Track field frequency
      Object.keys(data).forEach((key) => {
        fieldFrequency[key] = (fieldFrequency[key] || 0) + 1;
      });

      // Collect sample reviews (first 5)
      if (index < 5) {
        sampleReviews.push(review);
      }
    });

    console.log("📋 Field Frequency Analysis:");
    console.log("-".repeat(60));
    Object.entries(fieldFrequency)
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        const percentage = ((count / totalReviews) * 100).toFixed(1);
        console.log(
          `  ${field.padEnd(20)}: ${count
            .toString()
            .padStart(4)} (${percentage}%)`
        );
      });

    // Check for required fields
    console.log("\n🔎 Required Field Check:");
    console.log("-".repeat(60));
    const requiredFields = [
      "professor",
      "subject",
      "review",
      "stars",
      "userId",
    ];
    const missingFields = [];

    requiredFields.forEach((field) => {
      const count = fieldFrequency[field] || 0;
      const percentage = ((count / totalReviews) * 100).toFixed(1);
      const status = count === totalReviews ? "✅" : "❌";
      console.log(
        `  ${status} ${field.padEnd(
          15
        )}: ${count}/${totalReviews} (${percentage}%)`
      );

      if (count < totalReviews) {
        missingFields.push({
          field,
          missing: totalReviews - count,
          percentage: 100 - parseFloat(percentage),
        });
      }
    });

    // Analyze data quality
    console.log("\n📊 Data Quality Analysis:");
    console.log("-".repeat(60));

    const qualityIssues = [];

    // Check for empty strings
    const emptyProfessors = reviews.filter(
      (r) => !r.professor || r.professor.trim() === ""
    ).length;
    const emptySubjects = reviews.filter(
      (r) => !r.subject || r.subject.trim() === ""
    ).length;
    const emptyReviews = reviews.filter(
      (r) => !r.review || r.review.trim() === ""
    ).length;

    if (emptyProfessors > 0) {
      console.log(`  ⚠️  Empty professor names: ${emptyProfessors}`);
      qualityIssues.push(`Empty professor names: ${emptyProfessors}`);
    }
    if (emptySubjects > 0) {
      console.log(`  ⚠️  Empty subjects: ${emptySubjects}`);
      qualityIssues.push(`Empty subjects: ${emptySubjects}`);
    }
    if (emptyReviews > 0) {
      console.log(`  ⚠️  Empty review text: ${emptyReviews}`);
      qualityIssues.push(`Empty review text: ${emptyReviews}`);
    }

    if (qualityIssues.length === 0) {
      console.log("  ✅ No obvious data quality issues found");
    }

    // Show sample reviews
    console.log("\n📝 Sample Reviews (First 5):");
    console.log("-".repeat(60));
    sampleReviews.forEach((review, index) => {
      console.log(`\n  Review ${index + 1} (ID: ${review.id}):`);
      console.log(`    Professor: ${review.professor || "MISSING"}`);
      console.log(`    Subject: ${review.subject || "MISSING"}`);
      console.log(`    Stars: ${review.stars || "MISSING"}`);
      console.log(`    Review: ${(review.review || "").substring(0, 100)}...`);
      console.log(`    Created: ${review.createdAt || "MISSING"}`);
      console.log(`    User ID: ${review.userId || "MISSING"}`);
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 SUMMARY");
    console.log("=".repeat(60));

    const issues = [];
    if (missingFields.length > 0) {
      issues.push(
        `Missing required fields: ${missingFields
          .map((f) => f.field)
          .join(", ")}`
      );
    }
    if (qualityIssues.length > 0) {
      issues.push(...qualityIssues);
    }

    const report = {
      totalReviews,
      fieldFrequency,
      missingFields,
      qualityIssues,
      issues,
      sampleReviews: sampleReviews.map((r) => ({
        id: r.id,
        professor: r.professor,
        subject: r.subject,
        stars: r.stars,
        hasReview: !!r.review,
      })),
    };

    if (issues.length === 0) {
      console.log("✅ No critical issues found in Firestore data");
    } else {
      console.log("❌ Issues found:");
      issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    console.log("\n");

    return report;
  } catch (error) {
    console.error("❌ Error inspecting Firestore:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  inspectFirestore()
    .then((report) => {
      console.log("✅ Inspection complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Inspection failed:", error);
      process.exit(1);
    });
}

module.exports = { inspectFirestore };
