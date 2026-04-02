---
name: pr-check
description: Review a pull request or staged changes against project-specific quality standards. Use when asked to review code, check a PR, audit changes, or validate before merging. Checks architecture patterns, security, dual-DB sync, and privacy compliance.
version: 1.0.0
disable-model-invocation: true
context: fork
---

# PR / Code Review

## Current state
- Files changed: !`git diff HEAD --name-only`
- Recent commits: !`git log --oneline -10`
- Authorship scan: !`git log --format="%H %s" | head -20`
- Co-author check: !`git log --format="%B" | grep -iE "co-authored-by|generated with claude|anthropic" || echo "CLEAN"`

PR or changes to review: $ARGUMENTS

---

**Step 1 — Authorship check (always first, always blocking)**

Scan every commit that will be included in this PR:
```
git log main..HEAD --format="%B" | grep -iE "co-authored-by.*claude|co-authored-by.*anthropic|generated with claude|🤖.*claude"
```

If any match is found:
1. For each offending commit, strip the attribution line:
   ```
   git rebase -i main
   # mark commits as 'reword', remove the Co-Authored-By line from each
   ```
   Or for the latest commit only:
   ```
   git commit --amend --message="$(git log -1 --format='%B' | grep -iv 'co-authored-by' | grep -iv 'generated with claude')"
   ```
2. Re-scan to confirm clean.
3. Do not proceed with the rest of the checklist until authorship is clean.

**Step 2 — Full checklist review**

Review against [checklist.md](checklist.md).

For each item mark ✅ PASS, ❌ FAIL (with explanation), or ➖ N/A.

Present findings grouped by severity: **Blocking** (must fix before merge) → **Important** (should fix) → **Minor** (optional).
