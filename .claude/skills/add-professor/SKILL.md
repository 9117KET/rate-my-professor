---
name: add-professor
description: Add one or more professors to the platform's professor list and autocomplete. Use when asked to add a professor, register a new professor, update the professor list, or fix a professor not appearing in the dropdown.
version: 1.0.0
disable-model-invocation: true
---

# Add Professor(s)

Professor(s) to add: $ARGUMENTS

## Step 1 — Read the current professor list

Read `app/utils/professorNames.js` to see the current list format and existing entries.

## Step 2 — Add to professorNames.js

The file exports an array of professor objects. Each entry follows this shape:
```js
{
  name: "Full Name",          // Displayed in UI, used in embeddings — must be exact
  subjects: ["Subject A", "Subject B"]  // Courses they teach
}
```

Rules:
- Use the professor's official name as it appears in Constructor University records
- Include all known subjects/courses they teach
- Keep alphabetical order within the array (by last name)
- The `name` field is used verbatim in Pinecone embeddings — consistency matters for RAG retrieval

## Step 3 — Verify the change

After editing `professorNames.js`:
1. Check the professor appears in the autocomplete by running dev server: `npm run dev`
2. Submit a test review for the new professor via the UI
3. Run `npm run sync-pinecone` to ensure their reviews will be indexed correctly

## Step 4 — If professor already has reviews in Firestore

If reviews already exist under this professor's name (possibly misspelled), check for consistency:
```bash
npm run test:metadata
```
This will surface any reviews whose professor name doesn't match the canonical list. Correct the Firestore documents manually if needed, then resync.

## Step 5 — Note on professor removal

Removing a professor from `professorNames.js` only removes them from the autocomplete — it does NOT delete their reviews from Firestore or Pinecone. If a full removal is needed, the reviews must be deleted manually and vectors cleaned up with `/api/delete-review-vectors`.
