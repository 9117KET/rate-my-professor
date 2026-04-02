---
name: new-service
description: Scaffold a new service file for this project. Use when adding business logic, a new data domain, or a new integration. Enforces the service layer pattern used throughout app/services/.
version: 1.0.0
disable-model-invocation: true
---

# New Service

Create a service for: $ARGUMENTS

## Step 1 — Read existing services first

Before writing, read at least one existing service to match the pattern:
- `app/services/reviewsService.js` — CRUD + Firestore pattern
- `app/services/rateLimiterService.js` — utility service pattern
- `app/services/bugReportService.js` — simple create + retrieve pattern

## Step 2 — Service structure

All services follow this structure:

```js
// app/services/<name>Service.js

import { db } from '@/lib/firebase';
import {
  collection, doc, getDoc, getDocs, addDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp
} from 'firebase/firestore';

// Custom error class for this service
class <Name>Error extends Error {
  constructor(message, code) {
    super(message);
    this.name = '<Name>Error';
    this.code = code;
  }
}

// Named exports — no default export
export async function createSomething(data, userId) {
  try {
    // validate
    // write to Firestore
    // if review data → trigger Pinecone sync
    // return result
  } catch (error) {
    if (error instanceof <Name>Error) throw error;
    throw new <Name>Error('Operation failed', 'OPERATION_FAILED');
  }
}

export async function getSomething(id, userId) {
  // ...
}
```

## Step 3 — Checklist

- [ ] File placed in `app/services/<name>Service.js`
- [ ] Custom error class defined and thrown for domain errors
- [ ] Named exports only (no default export)
- [ ] Ownership verified before update/delete operations (`userId` param)
- [ ] `serverTimestamp()` used for all Firestore timestamps
- [ ] If the service handles user-submitted text → call `moderateContent()` from `contentModerationService.js`
- [ ] If the service handles reviews → sync both Firestore and Pinecone
- [ ] Rate limiting delegated to the API route, not inside the service
- [ ] No `console.log` in production paths — use proper error throwing

## Step 4 — Register the service

After creating the service:
1. Import it in the relevant API route(s) or component(s)
2. If a new rate limit action is needed, add it to `app/services/rateLimiterService.js`
3. If new Firestore collection is created, add rules to `firestore.rules` and update CLAUDE.md
