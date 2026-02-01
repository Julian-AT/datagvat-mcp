---
phase: 14-database-foundation-message-persistence
plan: 03
subsystem: api
tags: [vercel-blob, drizzle-orm, cursor-pagination, server-actions, nextjs-api-routes, zod]

# Dependency graph
requires:
  - phase: 14-01
    provides: Database schema with messages, conversations, and MessagePart types
  - phase: 14-02
    provides: Better-auth session management with guest mode
provides:
  - Message CRUD operations with cursor pagination (50/page default)
  - Vercel Blob integration for image uploads (public URLs with immutable naming)
  - Execution status tracking for replay attack prevention
  - Session validation for conversation ownership (chat routes only)
  - API routes for HTTP access to message persistence
affects: [14-04, Phase 18 (MCP tool execution), Phase 19 (image extraction), Phase 20 (chat UI)]

# Tech tracking
tech-stack:
  added: ["@vercel/blob@2.0.1", "zod (validation)", "Next.js 16 async params"]
  patterns:
    - "Cursor pagination with limit + 1 pattern"
    - "Server actions for database operations"
    - "Session validation for data ownership (not access control)"
    - "Replay attack prevention via execution_status column"

key-files:
  created:
    - docs/lib/blob.ts
    - docs/app/actions/messages.ts
    - docs/app/api/messages/route.ts
    - docs/app/api/messages/[conversationId]/route.ts
  modified:
    - docs/package.json
    - docs/.env.example

key-decisions:
  - "Use server actions for primary API (API routes for HTTP clients)"
  - "Cursor pagination with limit + 1 pattern for hasMore detection"
  - "Session validates conversation ownership only (not access control)"
  - "execution_status prevents replay attacks (enforced in Phase 18)"
  - "Vercel Blob with public access and immutable file naming"

patterns-established:
  - "Session scope pattern: validate conversation ownership, docs remain public"
  - "Replay attack prevention: check execution_status before tool execution"
  - "Cursor pagination: fetch limit + 1, slice to limit, use last ID as nextCursor"
  - "Blob uploads: conversations/{conversationId}/{filename} with random suffix"

# Metrics
duration: 3min
completed: 2026-02-01
---

# Phase 14 Plan 03: Message Persistence API Summary

**Message CRUD with cursor pagination, Vercel Blob image storage, and execution status tracking for replay attack prevention**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-01T07:54:29Z
- **Completed:** 2026-02-01T07:57:57Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Server actions for conversation and message CRUD operations with session validation
- Cursor-based pagination (50 messages/page default) for scalable message history
- Vercel Blob integration for image uploads with public URLs and immutable naming
- Replay attack prevention pattern via execution_status column validation
- HTTP API routes with Zod validation for external clients

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Vercel Blob and create upload utilities** - `bfba100` (feat)
2. **Task 2: Create message CRUD operations with cursor pagination and session validation** - `ab6b4ee` (feat)
3. **Task 3: Create message API routes for HTTP access** - `5ba6d00` (feat)

## Files Created/Modified
- `docs/lib/blob.ts` - Vercel Blob upload utilities (uploadImage, uploadImageFromBase64)
- `docs/app/actions/messages.ts` - Server actions for messages/conversations with cursor pagination
- `docs/app/api/messages/route.ts` - POST endpoint for creating messages with Zod validation
- `docs/app/api/messages/[conversationId]/route.ts` - GET endpoint for message history with pagination
- `docs/package.json` - Added @vercel/blob@2.0.1
- `docs/.env.example` - Added BLOB_READ_WRITE_TOKEN documentation

## Decisions Made

**1. Session scope clarified: Conversation ownership only**
- Session validation in createMessage/createConversation ensures users only access their own conversations
- This is for DATA OWNERSHIP, not access control
- Documentation routes remain public (no session checks)
- Phase 20 will add session checks to chat UI routes

**2. Replay attack prevention pattern established**
- updateMessageExecutionStatus includes check: if executionStatus === 'executed', throw error
- Pattern documented for Phase 18 enforcement during MCP tool execution
- Prevents malicious re-execution of tool calls from restored conversation history

**3. Cursor pagination with limit + 1 pattern**
- Fetch limit + 1 records to detect hasMore
- Slice to limit for returned items
- Use last item ID as nextCursor
- More efficient than COUNT queries for large datasets

**4. Vercel Blob public access with immutable naming**
- Files stored at conversations/{conversationId}/{filename}
- addRandomSuffix: true creates immutable URLs
- public access enables direct browser rendering without pre-signed URLs

**5. Server actions as primary API**
- Server actions (messages.ts) are primary interface for Next.js app
- API routes provide HTTP access for external clients or non-Next.js consumers
- Both use same validation logic (Zod schemas)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod validation for Next.js 16 and Zod API changes**
- **Found during:** Task 3 (API routes implementation)
- **Issue:** Next.js 16 requires async params (Promise<{ params }>), Zod z.record() requires 2 arguments, error.errors should be error.issues
- **Fix:** Updated GET route signature to await props.params, changed z.record(z.unknown()) to z.record(z.string(), z.unknown()), changed error.errors to error.issues
- **Files modified:** docs/app/api/messages/route.ts, docs/app/api/messages/[conversationId]/route.ts
- **Verification:** TypeScript compilation passes, no errors in API route files
- **Committed in:** 5ba6d00 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug - framework API compliance)
**Impact on plan:** Essential for Next.js 16 and Zod compatibility. No scope creep.

## Issues Encountered
None - all tasks executed as planned after fixing framework compatibility issues.

## User Setup Required

**External services require manual configuration.** See [14-03-USER-SETUP.md](./14-03-USER-SETUP.md) for:
- BLOB_READ_WRITE_TOKEN from Vercel dashboard (Storage → Blob)
- Verification commands

## Next Phase Readiness

**Ready for Phase 14-04 (additional message persistence features) and Phase 18 (MCP tool execution):**
- Message CRUD operations complete with session validation
- Cursor pagination ready for production scale
- Blob storage configured for image handling
- Execution status column ready for replay attack prevention enforcement

**Integration points documented:**
- Phase 18 will enforce execution_status checks before tool execution
- Phase 19 will use uploadImageFromBase64 to extract images from tool results
- Phase 20 will use these APIs from chat UI with session context

**Security pattern established:**
- Session validation ensures conversation ownership
- Execution status prevents replay attacks (enforced in Phase 18)
- Documentation routes remain public (Phase 20 will add UI-level session checks)

**API surface complete:**
- Server actions: createConversation, getConversations, createMessage, getMessages, updateMessageExecutionStatus
- HTTP routes: POST /api/messages, GET /api/messages/[conversationId]
- Blob utilities: uploadImage, uploadImageFromBase64

---
*Phase: 14-database-foundation-message-persistence*
*Completed: 2026-02-01*
