---
name: add-api-route
description: Create a new Next.js API route for this project. Use when the user asks to add an endpoint, create a route, build an API, or add a new backend feature. Enforces withCors, createErrorResponse, rate limiting, and auth patterns.
version: 1.0.0
disable-model-invocation: true
---

# Add API Route

Create a new API route at: $ARGUMENTS

## Step 1 — Read before writing

Read these files to understand current conventions:
- `app/utils/cors.js` — `withCors()` wrapper
- `app/utils/errorHandler.js` — `createErrorResponse()`
- `app/services/rateLimiterService.js` — rate limit action types
- An existing route for reference (e.g. `app/api/report-bug/route.js`)

## Step 2 — Determine requirements

Answer these before writing code:
1. What HTTP methods does this route handle?
2. Does it require a user ID (`x-anonymous-user-id` header)?
3. Does it require a Bearer token (admin/cron/sync routes)?
4. What rate limit action type applies? (CHAT / REVIEW_SUBMISSION / REPLY_SUBMISSION / BUG_REPORT / CONTENT_MODERATION — or define a new one)
5. Should it live in `app/api/` or `api/` (legacy)?
6. Does it touch reviews? If yes, Pinecone sync is required.

## Step 3 — Required route skeleton

Every route in this project must follow this pattern:

```js
import { withCors } from '@/utils/cors';
import { createErrorResponse } from '@/utils/errorHandler';
import { checkRateLimit } from '@/services/rateLimiterService';

export const POST = withCors(async (request) => {
  try {
    // 1. Extract and validate user identity
    const userId = request.headers.get('x-anonymous-user-id');
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // 2. Rate limit check
    const rateLimit = await checkRateLimit(userId, 'ACTION_TYPE');
    if (!rateLimit.allowed) {
      return Response.json(
        { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
        { status: 429 }
      );
    }

    // 3. Parse body
    const body = await request.json();

    // 4. Delegate to service — NO business logic in routes
    // const result = await myService.doSomething(body, userId);

    return Response.json({ success: true, data: result });
  } catch (error) {
    return createErrorResponse(error, request);
  }
});
```

For Bearer-token-protected routes (admin/cron/sync), replace the userId check with:
```js
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Step 4 — Create the service

If the route needs business logic, create `app/services/<name>Service.js` first.
**Routes are thin controllers — zero business logic inside the route file.**

## Step 5 — Checklist before finishing

- [ ] Wrapped with `withCors()`
- [ ] All errors handled with `createErrorResponse()`
- [ ] Rate limiting applied
- [ ] No business logic in the route
- [ ] If touching reviews → Pinecone sync triggered
- [ ] New env vars added to `.env.local` example and CLAUDE.md
