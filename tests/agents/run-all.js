/**
 * Master Test Runner - Runs All Diagnostic Agents
 *
 * Purpose: This script runs all diagnostic agents in sequence and provides
 * a comprehensive report of all issues found across the indexing system.
 *
 * Architecture: This follows a test orchestration pattern, coordinating
 * multiple specialized agents to provide a complete diagnostic picture.
 *
 * Problem-solving: By running all agents together, we can:
 * - Get a complete picture of the system health
 * - Identify root causes across different components
 * - Prioritize fixes based on impact
 * - Generate a comprehensive fix plan
 */

const { inspectFirestore } = require("./firestore-inspector");
const { inspectPinecone } = require("./pinecone-inspector");
const { validateSyncProcess } = require("./sync-validator");
const { testQueries } = require("./query-tester");
const { checkMetadataConsistency } = require("./metadata-consistency");

async function runAllDiagnostics() {
  const report = {
    timestamp: new Date().toISOString(),
    agents: {},
    criticalIssues: [],
    warnings: [],
    recommendations: [],
    overallHealth: "unknown",
  };

  console.log("🚀 Starting Comprehensive Diagnostic Suite\n");
  console.log("=".repeat(80));
  console.log("Running all diagnostic agents to identify indexing issues...");
  console.log("=".repeat(80));
  console.log();

  try {
    // Agent 1: Firestore Inspector
    console.log("\n" + "=".repeat(80));
    console.log("AGENT 1: Firestore Data Inspector");
    console.log("=".repeat(80));
    try {
      const firestoreReport = await inspectFirestore();
      report.agents.firestore = firestoreReport;

      if (firestoreReport.issues && firestoreReport.issues.length > 0) {
        firestoreReport.issues.forEach((issue) => {
          if (issue.includes("No reviews")) {
            report.criticalIssues.push(`Firestore: ${issue}`);
          } else {
            report.warnings.push(`Firestore: ${issue}`);
          }
        });
      }
    } catch (error) {
      report.agents.firestore = { error: error.message };
      report.criticalIssues.push(
        `Firestore inspection failed: ${error.message}`
      );
    }

    // Agent 2: Pinecone Inspector
    console.log("\n" + "=".repeat(80));
    console.log("AGENT 2: Pinecone Metadata Inspector");
    console.log("=".repeat(80));
    try {
      const pineconeReport = await inspectPinecone();
      report.agents.pinecone = pineconeReport;

      if (pineconeReport.issues && pineconeReport.issues.length > 0) {
        pineconeReport.issues.forEach((issue) => {
          if (issue.includes("No vectors") || issue.includes("MISSING")) {
            report.criticalIssues.push(`Pinecone: ${issue}`);
          } else {
            report.warnings.push(`Pinecone: ${issue}`);
          }
        });
      }
    } catch (error) {
      report.agents.pinecone = { error: error.message };
      report.criticalIssues.push(
        `Pinecone inspection failed: ${error.message}`
      );
    }

    // Agent 3: Sync Validator
    console.log("\n" + "=".repeat(80));
    console.log("AGENT 3: Sync Process Validator");
    console.log("=".repeat(80));
    try {
      const syncReport = await validateSyncProcess();
      report.agents.sync = syncReport;

      if (syncReport.issues && syncReport.issues.length > 0) {
        syncReport.issues.forEach((issue) => {
          report.criticalIssues.push(`Sync: ${issue}`);
        });
      }

      if (!syncReport.success) {
        report.criticalIssues.push("Sync process validation failed");
      }
    } catch (error) {
      report.agents.sync = { error: error.message };
      report.criticalIssues.push(`Sync validation failed: ${error.message}`);
    }

    // Agent 4: Query Tester
    console.log("\n" + "=".repeat(80));
    console.log("AGENT 4: Query Tester");
    console.log("=".repeat(80));
    try {
      const queryReport = await testQueries();
      report.agents.queries = queryReport;

      if (queryReport.issues && queryReport.issues.length > 0) {
        queryReport.issues.forEach((issue) => {
          if (issue.includes("missing") || issue.includes("MISSING")) {
            report.criticalIssues.push(`Query: ${issue}`);
          } else {
            report.warnings.push(`Query: ${issue}`);
          }
        });
      }

      if (!queryReport.success) {
        report.criticalIssues.push("Query testing failed");
      }
    } catch (error) {
      report.agents.queries = { error: error.message };
      report.criticalIssues.push(`Query testing failed: ${error.message}`);
    }

    // Agent 5: Metadata Consistency
    console.log("\n" + "=".repeat(80));
    console.log("AGENT 5: Metadata Consistency Checker");
    console.log("=".repeat(80));
    try {
      const consistencyReport = await checkMetadataConsistency();
      report.agents.consistency = consistencyReport;

      if (
        consistencyReport.schemaMismatches &&
        consistencyReport.schemaMismatches.length > 0
      ) {
        consistencyReport.schemaMismatches.forEach((mismatch) => {
          report.criticalIssues.push(
            `Schema: ${mismatch.issue} - ${mismatch.impact}`
          );
          if (mismatch.fix) {
            report.recommendations.push(mismatch.fix);
          }
        });
      }

      if (
        consistencyReport.missingFields &&
        consistencyReport.missingFields.length > 0
      ) {
        consistencyReport.missingFields.forEach((field) => {
          report.warnings.push(
            `Missing field: ${field.field} (${field.expectedBy})`
          );
        });
      }

      if (
        consistencyReport.recommendations &&
        consistencyReport.recommendations.length > 0
      ) {
        report.recommendations.push(...consistencyReport.recommendations);
      }
    } catch (error) {
      report.agents.consistency = { error: error.message };
      report.criticalIssues.push(`Consistency check failed: ${error.message}`);
    }

    // Final Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 COMPREHENSIVE DIAGNOSTIC REPORT");
    console.log("=".repeat(80));
    console.log();

    // Determine overall health
    if (report.criticalIssues.length === 0 && report.warnings.length === 0) {
      report.overallHealth = "healthy";
      console.log("✅ Overall System Health: HEALTHY");
    } else if (report.criticalIssues.length === 0) {
      report.overallHealth = "warning";
      console.log(
        "⚠️  Overall System Health: WARNING (non-critical issues found)"
      );
    } else {
      report.overallHealth = "critical";
      console.log("❌ Overall System Health: CRITICAL (critical issues found)");
    }

    console.log();

    // Critical Issues
    if (report.criticalIssues.length > 0) {
      console.log("🚨 CRITICAL ISSUES (" + report.criticalIssues.length + "):");
      console.log("-".repeat(80));
      report.criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      console.log();
    }

    // Warnings
    if (report.warnings.length > 0) {
      console.log("⚠️  WARNINGS (" + report.warnings.length + "):");
      console.log("-".repeat(80));
      report.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log();
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(
        "💡 RECOMMENDATIONS (" + report.recommendations.length + "):"
      );
      console.log("-".repeat(80));
      const uniqueRecommendations = [...new Set(report.recommendations)];
      uniqueRecommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
      console.log();
    }

    // Root Cause Analysis
    console.log("🔍 ROOT CAUSE ANALYSIS:");
    console.log("-".repeat(80));

    const rootCauses = [];

    // Check for data availability
    const firestoreCount = report.agents.firestore?.totalReviews || 0;
    const pineconeCount = report.agents.pinecone?.totalVectors || 0;

    if (firestoreCount === 0) {
      rootCauses.push("No data in Firestore - nothing to index");
    } else if (pineconeCount === 0) {
      rootCauses.push("No data in Pinecone - sync process is not working");
    } else if (firestoreCount !== pineconeCount) {
      rootCauses.push(
        `Data mismatch: ${firestoreCount} reviews in Firestore vs ${pineconeCount} vectors in Pinecone`
      );
    }

    // Check for schema issues
    const hasSchemaMismatch =
      report.agents.consistency?.schemaMismatches?.length > 0;
    if (hasSchemaMismatch) {
      rootCauses.push("Schema mismatch between sync code and query code");
    }

    // Check for sync failures
    const syncFailed = !report.agents.sync?.success;
    if (syncFailed) {
      rootCauses.push("Sync process is failing at one or more steps");
    }

    if (rootCauses.length === 0) {
      console.log("  ✅ No obvious root causes identified");
    } else {
      rootCauses.forEach((cause, index) => {
        console.log(`  ${index + 1}. ${cause}`);
      });
    }

    console.log();
    console.log("=".repeat(80));
    console.log(
      "Diagnostic complete. Review the issues above to fix indexing problems."
    );
    console.log("=".repeat(80));
    console.log();

    return report;
  } catch (error) {
    console.error("❌ Diagnostic suite failed:", error);
    report.criticalIssues.push(`Diagnostic suite error: ${error.message}`);
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  runAllDiagnostics()
    .then((report) => {
      const exitCode = report.overallHealth === "healthy" ? 0 : 1;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error("❌ Diagnostic suite failed:", error);
      process.exit(1);
    });
}

module.exports = { runAllDiagnostics };
