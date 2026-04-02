# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Non-Negotiable Rules

### Commit & PR Authorship
**Never include any Claude or AI attribution in commits or PRs.** This means:
- No `Co-Authored-By: Claude ...` in commit messages
- No `Generated with Claude Code` in PR bodies
- No `🤖` attribution lines anywhere

Commit messages contain only: subject line + optional body. Nothing else.

---

## Commands

### Dev & Build
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
```

### Vector Sync
```bash
npm run sync-pinecone              # Standard Firestore → Pinecone sync
npm run sync-pinecone:full         # Full reset: delete all vectors + fresh upsert
node scripts/check-embeddings.js   # Verify embedding consistency
```

### Diagnostics & Tests
```bash
npm run test:diagnostics   # Run all diagnostic agents
npm run test:firestore     # Firestore connection + data check
npm run test:pinecone      # Pinecone index stats + vector structure
npm run test:queries       # End-to-end embedding query test
npm run test:sync          # Firestore/Pinecone consistency check
npm run test:metadata      # Metadata alignment check
```

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Material-UI 6, Framer Motion
- **Backend**: Next.js API Routes (thin controllers) + service layer
- **Databases**: Firebase Firestore (source of truth) + Pinecone (vector search)
- **AI**: OpenAI `text-embedding-3-small` (embeddings) + `gpt-4-turbo` (chat)
- **Deployment**: Vercel + Firebase

### Directory Structure
```
app/
├── api/                          # Thin API route controllers
│   ├── chat/route.js             # Streaming RAG chat
│   ├── sync-review/route.js      # Single-review embedding sync
│   ├── sync-embeddings/route.js  # Bulk sync (Bearer: API_SECRET_KEY)
│   ├── delete-review-vectors/    # Vector deletion
│   ├── report-bug/route.js       # Bug submission (rate limited)
│   ├── cron/sync-pinecone/       # Scheduled sync (Bearer: CRON_SECRET_KEY)
│   └── admin/bug-reports/        # Admin retrieval (Bearer: ADMIN_API_SECRET)
├── components/                   # Modal-heavy UI (each manages its own state)
├── services/                     # All business logic lives here
├── utils/                        # Shared helpers (error, cors, validation)
└── lib/firebase.js               # Firebase init
scripts/                          # Manual maintenance scripts
tests/agents/                     # Operational/integration diagnostic scripts
```

### Service Layer (app/services/)
| File | Responsibility |
|------|---------------|
| `embeddingService.js` | OpenAI embeddings + Pinecone upsert/query/delete |
| `reviewsService.js` | Review CRUD, reactions, replies, GDPR deletion |
| `rateLimiterService.js` | In-memory rate limiting (NodeCache, 1-hr TTL) |
| `chatService.js` | Chat history persistence to Firestore |
| `bugReportService.js` | Bug report creation + admin retrieval |
| `contentModerationService.js` | Text validation, word-boundary profanity check |
| `userTrackingService.js` | Anonymous UUID identity + privacy consent |
| `tipsService.js` | Tips CRUD with ownership verification |

---

## Key Implementation Details

### RAG Chat Flow
1. User message received at `POST /api/chat`
2. Rate check: 50 messages/hour per user (`x-anonymous-user-id` header required)
3. "Best rated" queries → computed rankings shortcut (bypasses Pinecone)
4. Otherwise: embed query → Pinecone top-5 semantic search → inject context into system prompt
5. GPT-4-turbo generates response → streamed back via `ReadableStream`

### Dual-Database Sync Strategy
- **On review write**: `POST /api/sync-review` triggered automatically
- **Scheduled**: `/api/cron/sync-pinecone` every 6 hours (Vercel cron)
- **Manual reset**: `npm run sync-pinecone:full` (deleteAll + upsert)
- Pinecone vector IDs: `${reviewId}#${chunkIndex}`
- Chunks: ~1200 chars, 2-sentence overlap, sentence-boundary aware

### Firestore Collections
| Collection | Purpose |
|------------|---------|
| `reviews` | Professor reviews (source of truth) |
| `professors` | Known professors list |
| `chats` | User conversation history |
| `tips` | Community tips |
| `bug_reports` | Submitted bug reports |
| `users` | Privacy settings + consent |

### Pinecone Index
- Index name: `rag`
- Dimensions: 1536 (`text-embedding-3-small`)
- Metadata per vector: `{ reviewId, chunkIndex, chunk, professor, subject, stars, createdAt }`

### Rate Limits (rateLimiterService.js)
| Action | Limit |
|--------|-------|
| CHAT | 50/hour |
| REVIEW_SUBMISSION | 10/day |
| REPLY_SUBMISSION | 20/hour |
| BUG_REPORT | 5/hour |
| CONTENT_MODERATION | 20/hour |

### Environment Variables
```
# Server-only secrets
OPENAI_API_KEY          # sk- or sk-proj- format — validated at runtime
PINECONE_API_KEY
API_SECRET_KEY          # Bearer token for /api/sync-embeddings
CRON_SECRET_KEY         # Bearer token for /api/cron/sync-pinecone
ADMIN_API_SECRET        # Bearer token for /api/admin/bug-reports
IP_HASH_SALT            # Production IP anonymization salt

# Public Firebase config (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

# Optional
NEXT_PUBLIC_APP_VERSION
NEXT_PUBLIC_SITE_URL    # Used for CORS allowlist in production
```

---

## Development Patterns

### Adding a New Feature
1. Create a service in `app/services/` for business logic
2. Create a thin API route in `app/api/` — wrap with `withCors()` and use `createErrorResponse()`
3. Call the service from the component or route — don't put logic in components
4. If the feature touches reviews, sync both Firestore and Pinecone

### Error Handling
```js
// In API routes (server)
import { createErrorResponse } from '@/utils/errorHandler';
return createErrorResponse(error, request);

// In components (client)
import { formatClientError } from '@/utils/clientErrorHandler';
```

### CORS
```js
import { withCors } from '@/utils/cors';
export const GET = withCors(async (req) => { ... });
```

### Rate Limiting
```js
import { checkRateLimit } from '@/services/rateLimiterService';
const result = await checkRateLimit(userId, 'CHAT');
if (!result.allowed) return 429 response;
```

### Content Moderation
Always call `moderateContent()` from `contentModerationService.js` before saving user-submitted text (reviews, replies, tips).

### Anonymous User Identity
Users are identified by Firebase anonymous auth UID (preferred) or UUID4 in localStorage (fallback). Always pass the user ID in `x-anonymous-user-id` header for chat requests. Use `getOrCreateUserId()` from `userTrackingService.js`.

### Firestore Security Rules
- All operations require `isSignedIn()` (Firebase anonymous auth counts)
- Users can only read/write their own data
- Reviews: readable by all signed-in users; writable/deletable only by owner
- Bug reports: create-only by authenticated users (no client-side delete/update)

### Adding New Professors
Edit `app/utils/professorNames.js` — this drives the autocomplete in `SubmitReviewModal`.

---

## Common Gotchas

- **OpenAI key format**: The chat route validates `sk-` or `sk-proj-` prefix — other formats will be rejected at runtime, not build time.
- **Pinecone cold start**: First query after inactivity may be slow. The `getClients()` call in `embeddingService.js` caches the client.
- **Chunked vectors**: One review can produce multiple Pinecone vectors (`reviewId#0`, `reviewId#1`, …). Deleting a review must call `/api/delete-review-vectors` to clean up all chunks.
- **Streaming + Vercel**: Chat responses use `ReadableStream`. Vercel Edge/Serverless timeout is 60s — long responses may be cut off on free plans.
- **Rate limiter is in-memory**: `NodeCache` resets on cold start. This is intentional (lightweight), but limits don't persist across serverless function instances.
- **No unit test framework**: All tests are operational/diagnostic scripts in `tests/agents/`. Add new diagnostics there, not Jest/Vitest tests.
