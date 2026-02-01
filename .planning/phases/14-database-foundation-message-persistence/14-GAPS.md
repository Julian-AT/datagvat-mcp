# Phase 14: Gap Analysis

**Created:** 2026-02-01
**Type:** Architecture correction
**Severity:** HIGH - Blocks execution

## Identified Gaps

### GAP-1: Incorrect Directory Structure References
**Severity:** HIGH
**Impact:** Plans reference non-existent `docs/src/` paths

**Current state:**
- Plans 14-01, 14-02, 14-03 reference `docs/src/db/`, `docs/src/lib/`
- Actual Next.js App Router structure uses `docs/db/`, `docs/lib/`
- No `src/` directory exists in docs (correct for App Router)

**Required fix:**
- Update all plan file paths from `docs/src/*` to `docs/*`
- Verify 14-01 already executed correctly (files in `docs/db/`, not `docs/src/db/`)
- Update 14-02 and 14-03 plans before execution

**Files affected:**
- `.planning/phases/14-database-foundation-message-persistence/14-02-PLAN.md`
- `.planning/phases/14-database-foundation-message-persistence/14-03-PLAN.md`

### GAP-2: Authentication Scope Too Broad
**Severity:** HIGH
**Impact:** Docs will require auth when they should be public

**Current understanding:**
- Phase 14 implements session management for entire docs site
- User clarified: Only AI playground/chats need auth, not documentation

**Required fix:**
- Clarify that better-auth session is ONLY for chat persistence (conversation ownership)
- Documentation pages at `/docs/*` remain public (no auth check)
- Only `/app/playground` or `/app/chat` routes need session validation
- Guest sessions track conversation ownership, NOT access control

**Files affected:**
- `.planning/phases/14-database-foundation-message-persistence/14-02-PLAN.md` (session scope clarification)
- Future Phase 16 or 20 (chat UI with session detection)

### GAP-3: better-auth Already Partially Implemented
**Severity:** MEDIUM
**Impact:** Plan 14-02 may duplicate work or conflict with existing code

**Current state:**
- `docs/db/schema.ts` already contains better-auth tables (user, session, account, verification)
- These were added during 14-01 execution
- 14-02 plan still lists "add auth tables to schema" as a task

**Required fix:**
- Update 14-02 to recognize auth tables exist
- Focus on:
  1. Creating `lib/auth.ts` configuration
  2. Creating API handler at `app/api/auth/[...all]/route.ts`
  3. Testing session creation/validation
- Skip schema modifications (already done)

**Files affected:**
- `.planning/phases/14-database-foundation-message-persistence/14-02-PLAN.md`

## User Requirements (From Conversation)

1. **Directory structure:** Next.js App Router uses `app/` and `lib/`, NOT `src/`
2. **Auth scope:** Docs are public, only chat/playground needs sessions
3. **Environment ready:** DATABASE_URL, BETTER_AUTH_SECRET, AI_GATEWAY_API_KEY all configured

## Recommended Fix Strategy

**Approach:** Update plans 14-02 and 14-03 in-place, preserving wave structure and dependencies.

**Plan 14-01:** ✓ Already executed correctly (schema in `docs/db/`, not `docs/src/db/`)

**Plan 14-02:** Requires updates
- Change all `docs/src/lib/auth.ts` → `docs/lib/auth.ts`
- Change all `docs/src/db/schema.ts` → `docs/db/schema.ts`
- Remove "add auth tables" task (already done)
- Add clarification: Session is for chat ownership, NOT access control
- Keep API handler creation task

**Plan 14-03:** Requires updates
- Change all `docs/src/` references to `docs/`
- Verify API route paths use `app/api/`, not `src/api/`

## Success Criteria After Fixes

- [ ] All plan file paths match actual Next.js App Router structure
- [ ] Auth scope clearly documented (chat persistence only)
- [ ] No duplicate work (recognize completed 14-01 tasks)
- [ ] Plans executable with user's environment variables
- [ ] Documentation routes remain public
