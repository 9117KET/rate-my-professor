---
name: debug-rag
description: Debug RAG (Retrieval Augmented Generation) and vector search issues. Use when chat returns wrong answers, reviews aren't being found, embeddings are out of sync, Pinecone queries fail, or the AI doesn't know about a professor/review.
version: 1.0.0
disable-model-invocation: true
---

# Debug RAG / Vector Search

Issue: $ARGUMENTS

## Current system state
- Git branch: !`git branch --show-current`
- Recent changes: !`git log --oneline -10`

## Step 1 — Identify the layer failing

The RAG pipeline has 4 layers. Check each:

```
User query
    ↓
1. Embedding (OpenAI text-embedding-3-small)
    ↓
2. Pinecone query (index: "rag", top-5 results)
    ↓
3. Context injection (system prompt)
    ↓
4. GPT-4-turbo response
```

## Step 2 — Run diagnostics

```bash
# Check environment variables are set
npm run test:diagnostics

# Check Pinecone index stats (how many vectors, index health)
npm run test:pinecone

# Check Firestore/Pinecone consistency (orphaned vectors, missing vectors)
npm run test:sync

# Check metadata alignment
npm run test:metadata

# Test a specific query end-to-end
npm run test:queries
```

## Step 3 — Common issues and fixes

### Problem: Professor not found in chat
**Cause**: Review exists in Firestore but not synced to Pinecone  
**Fix**: `npm run sync-pinecone` — if still missing, `npm run sync-pinecone:full`

### Problem: Outdated review content returned
**Cause**: Review was edited but Pinecone vector wasn't updated  
**Fix**: Force re-sync of the specific review via `POST /api/sync-review` with `{ reviewId }`, or run full sync

### Problem: Deleted review still appears in chat
**Cause**: Vector deletion failed — `reviewId#0`, `reviewId#1` chunks still in Pinecone  
**Fix**: Call `POST /api/delete-review-vectors` with `{ reviewId }` directly, or run full sync

### Problem: "I don't have information about X" despite reviews existing
**Check**: Is the professor name in `app/utils/professorNames.js`? Embedding search uses professor name in the vector text — exact name match matters.  
**Check**: Run `npm run test:queries` to see what Pinecone actually returns for that query.

### Problem: Chat rate limit hit unexpectedly
**Cause**: In-memory NodeCache reset on cold start losing count, or genuine 50/hour limit  
**Fix**: Rate limiter is intentionally in-memory. Wait for reset or increase `CHAT` limit in `rateLimiterService.js`

### Problem: `sk-` key validation error at runtime
**Cause**: `OPENAI_API_KEY` doesn't start with `sk-` or `sk-proj-`  
**Fix**: Check `.env.local` — the chat route validates the key prefix before calling OpenAI

### Problem: Streaming response cut off
**Cause**: Vercel serverless 60s timeout  
**Fix**: Shorten system prompt context, reduce top-k from 5 to 3 in `embeddingService.queryReviews()`

## Step 4 — Inspect the embedding pipeline directly

Read these files to trace the exact flow:
- `app/api/chat/route.js` — where the query is processed and streamed
- `app/services/embeddingService.js` — `queryReviews()` function specifically
- `scripts/sync-pinecone-compat.js` — how embeddings are created and upserted

## Step 5 — Force full resync (last resort)

```bash
npm run sync-pinecone:full
# This deletes ALL Pinecone vectors and rebuilds from Firestore
# Safe to run — Firestore is the source of truth
```
