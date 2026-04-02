# PR Review Checklist

## Commit & PR Authorship — BLOCKING
- [ ] No `Co-Authored-By: Claude` or `Co-Authored-By: Anthropic` in any commit message
- [ ] No `Generated with Claude Code` footer in the PR body
- [ ] No `🤖 Generated with [Claude Code](...)` line anywhere in the PR
- [ ] PR title contains no AI/Claude references
- [ ] All commit messages contain only the subject line + optional body — nothing else

> If any of these fail, the PR must be updated before merge. Run:
> `git log --format="%B" | grep -i "co-authored-by\|claude code\|anthropic"`
> to scan all commits in the branch.

## Architecture
- [ ] API routes are thin controllers — no business logic inside route files
- [ ] Business logic is in `app/services/`, not in components or routes
- [ ] All API routes wrapped with `withCors()` from `utils/cors.js`
- [ ] All errors handled with `createErrorResponse()` from `utils/errorHandler.js`
- [ ] Components use `formatClientError()` for user-facing error display

## Dual-Database Sync
- [ ] Any new/updated/deleted review triggers Pinecone sync (`/api/sync-review` or `embeddingService`)
- [ ] If a review is deleted, its vectors are also deleted (`/api/delete-review-vectors`)
- [ ] No direct Pinecone mutations outside of `embeddingService.js`

## Security & Privacy
- [ ] No API keys, secrets, or credentials hardcoded or logged
- [ ] User-submitted text passed through `moderateContent()` before saving
- [ ] Rate limiting applied for any user-writable endpoint
- [ ] Ownership check before update/delete (userId comparison)
- [ ] New Firestore collections have rules in `firestore.rules`
- [ ] IP addresses or PII hashed/anonymized where collected
- [ ] Anonymous user system respected — no forced registration

## Authentication
- [ ] Firestore operations only happen after `ensureAuthenticated()` resolves
- [ ] `x-anonymous-user-id` header validated server-side before use
- [ ] Admin/cron/sync routes protected with Bearer token check

## Environment Variables
- [ ] Any new env vars documented in CLAUDE.md
- [ ] New server-only vars NOT prefixed with `NEXT_PUBLIC_`
- [ ] New public vars prefixed with `NEXT_PUBLIC_` and declared in `next.config.mjs`

## Frontend
- [ ] `'use client'` directive on all interactive components
- [ ] MUI components used for UI — not raw HTML
- [ ] Loading and error states handled in components
- [ ] No business logic in components

## Code Quality
- [ ] No `console.log` left in production paths
- [ ] No TODO comments left unresolved
- [ ] Consistent naming: services → camelCase functions, components → PascalCase
- [ ] No unnecessary abstractions or premature generalization

## Deployment
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes without errors
- [ ] New cron jobs registered in `vercel.json`
- [ ] New Firestore indexes added to `firestore.indexes.json` if needed
