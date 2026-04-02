---
name: project-conventions
description: Code style, naming conventions, and patterns for the Rate My Professor project. Applied automatically when writing or reviewing any code in this codebase.
version: 1.0.0
user-invocable: false
---

# Project Conventions

Apply these automatically when writing or reviewing any code in this codebase.

## Naming
- React components: PascalCase files and exports (`SubmitReviewModal.js`)
- Services: camelCase functions, file named `<domain>Service.js`
- API routes: directory-based (`app/api/<name>/route.js`)
- Utilities: camelCase files (`errorHandler.js`, `textChunker.js`)
- Constants/env vars: UPPER_SNAKE_CASE

## File placement
- Business logic → `app/services/`
- UI components → `app/components/`
- API endpoints → `app/api/<name>/route.js`
- Shared helpers → `app/utils/`
- Firebase init → `app/lib/firebase.js`
- Maintenance scripts → `scripts/`
- Diagnostic tests → `tests/agents/`

## Imports
- Use `@/` alias for all app-relative imports (`@/services/reviewsService`)
- Firebase Firestore functions imported from `firebase/firestore` (modular SDK)
- MUI imports tree-shaken: `import { Button } from '@mui/material'` not barrel imports

## API response shape
```js
// Success
return Response.json({ success: true, data: result });
// Error (via createErrorResponse or manual)
return Response.json({ error: 'message' }, { status: 4xx });
```

## Firestore patterns
- Always use `serverTimestamp()` for `createdAt`/`updatedAt` fields
- Use `orderBy('createdAt', 'desc')` for listing collections
- Verify ownership before update/delete: `if (doc.userId !== userId) throw error`
- Collections: reviews, professors, chats, tips, bug_reports, users

## What NOT to do
- No `console.log` in production code paths
- No default exports from service files (named exports only)
- No business logic in API route files
- No direct Pinecone calls outside `embeddingService.js`
- No hardcoded strings for professor names — use `professorNames.js`
- No `any` workarounds — handle errors properly
- No backwards-compatibility shims for removed code
