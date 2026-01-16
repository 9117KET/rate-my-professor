# Diagnostic Test Suite

This directory contains diagnostic agents designed to identify root causes of indexing issues in the Rate My Professor application.

## Overview

The diagnostic suite consists of specialized "regional agents" that each focus on a specific aspect of the indexing system:

1. **Firestore Inspector** - Examines data in Firestore
2. **Pinecone Inspector** - Examines metadata in Pinecone vector database
3. **Sync Validator** - Tests the sync process from Firestore to Pinecone
4. **Query Tester** - Tests query/search functionality
5. **Metadata Consistency Checker** - Identifies schema mismatches

## Architecture

Each agent follows a diagnostic pattern:

- **Isolation**: Each agent tests one specific component
- **Reporting**: Detailed output with issues and recommendations
- **Non-destructive**: Agents don't modify data (except sync-validator which creates a test vector and cleans it up)

## Usage

### Run All Agents

```bash
npm run test:diagnostics
```

This runs all agents in sequence and provides a comprehensive report.

### Run Individual Agents

```bash
# Firestore Inspector
node tests/agents/firestore-inspector.js

# Pinecone Inspector
node tests/agents/pinecone-inspector.js

# Sync Validator
node tests/agents/sync-validator.js

# Query Tester
node tests/agents/query-tester.js

# Metadata Consistency Checker
node tests/agents/metadata-consistency.js
```

## Prerequisites

1. Environment variables must be set:

   - `OPENAI_API_KEY` or `OPENAI_API_KEY_NEW`
   - `PINECONE_API_KEY`
   - Firebase configuration variables (for Firestore access)

2. Node.js dependencies installed:
   ```bash
   npm install
   ```

## Understanding the Results

### Critical Issues

Issues that prevent the system from working correctly. These must be fixed.

### Warnings

Non-critical issues that might cause problems but don't prevent basic functionality.

### Recommendations

Suggested fixes based on the diagnostic findings.

## Common Issues Found

### Schema Mismatches

- **Problem**: Code expects `metadata.name` but sync writes `metadata.professor`
- **Impact**: Professor name matching fails in chat queries
- **Fix**: Update chat route to use `metadata.professor` or update sync to write `metadata.name`

### Missing Fields

- **Problem**: Chat route expects `metadata.department` but it's not written by sync
- **Impact**: Department shows as "N/A" in responses
- **Fix**: Add department field to sync metadata if available in Firestore

### Sync Failures

- **Problem**: Sync process fails at one or more steps
- **Impact**: New reviews aren't indexed
- **Fix**: Check API keys, network connectivity, and error logs

## File Structure

```
tests/
├── agents/
│   ├── firestore-inspector.js      # Inspects Firestore data
│   ├── pinecone-inspector.js       # Inspects Pinecone metadata
│   ├── sync-validator.js            # Tests sync process
│   ├── query-tester.js              # Tests query functionality
│   ├── metadata-consistency.js      # Checks schema consistency
│   └── run-all.js                   # Master runner for all agents
└── README.md                         # This file
```

## Real-Life Application

Think of these agents like medical specialists:

- Each agent is like a specialist doctor examining one part of the body
- The master runner is like a general practitioner coordinating all specialists
- The final report is like a comprehensive medical diagnosis

This approach helps identify root causes systematically rather than guessing at problems.

## Key Takeaways

1. **Isolation**: Testing components separately makes it easier to find issues
2. **Comprehensive**: Multiple agents provide a complete picture
3. **Actionable**: Reports include specific recommendations for fixes
4. **Repeatable**: Run tests anytime to verify system health

## Learning Resources

- [Pinecone Vector Database Documentation](https://docs.pinecone.io/)
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Test-Driven Development Principles](https://en.wikipedia.org/wiki/Test-driven_development)
