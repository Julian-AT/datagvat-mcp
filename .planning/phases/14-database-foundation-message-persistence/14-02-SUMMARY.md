---
phase: 14-database-foundation-message-persistence
plan: 02
subsystem: auth
tags: [better-auth, drizzle-orm, postgres, session-management, guest-mode]

# Dependency graph
requires:
  - phase: 14-01
    provides: Auth tables (user, session, account, verification) in Drizzle schema
provides:
  - better-auth configuration with Drizzle adapter
  - Guest session creation helper (7-day expiry)
  - API handler for session management at /api/auth/*
  - Session infrastructure for conversation ownership tracking
affects: [14-03-message-api, 20-chat-ui, authentication]

# Tech tracking
tech-stack:
  added: [better-auth@1.4.18]
  patterns:
    - "Guest sessions via direct database insert (user with null email + session record)"
    - "Sessions for conversation ownership, NOT access control"
    - "Public documentation routes, session checks only in chat/playground"

key-files:
  created:
    - docs/lib/auth.ts
    - docs/app/api/auth/[...all]/route.ts
  modified:
    - docs/.env.example

key-decisions:
  - "Direct database session creation (better-auth doesn't expose createSession API)"
  - "Guest users identified by null email field"
  - "Sessions track conversation ownership, NOT access control"
  - "Documentation routes remain public (no session middleware)"

patterns-established:
  - "Guest session creation: Insert user with null email, then insert session with 7-day expiry"
  - "Session scope: Chat persistence only, Phase 20 will implement session checks in chat routes"
  - "better-auth provides infrastructure via toNextJsHandler for API routes"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 14 Plan 02: Session Management Summary

**better-auth guest session infrastructure with direct database insert pattern, enabling 7-day anonymous conversation persistence without authentication**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-01T07:48:44Z
- **Completed:** 2026-02-01T07:51:17Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- better-auth configuration with Drizzle adapter and 7-day session expiry
- Guest session creation helper using direct database insert (fallback for missing better-auth API)
- API route handler at /api/auth/* for session management (sign-out, get session)
- Environment variable documentation for BETTER_AUTH_SECRET

## Task Commits

Each task was committed atomically:

1. **Task 1: Install better-auth and configure for anonymous sessions** - `2331c3b` (chore)
2. **Task 2: Create better-auth configuration with guest session support** - `1a1a69d` (feat)
3. **Task 3: Create better-auth API handler for session management** - `86e1d1d` (feat, pre-existing commit)

## Files Created/Modified

### Created
- `docs/lib/auth.ts` - better-auth configuration with Drizzle adapter, 7-day session expiry, and createGuestSession helper
- `docs/app/api/auth/[...all]/route.ts` - Next.js API route handler exposing better-auth endpoints

### Modified
- `docs/.env.example` - Added BETTER_AUTH_SECRET with generation instructions, documented BETTER_AUTH_URL

## Decisions Made

**1. Direct Database Session Creation**
- **Context:** better-auth doesn't expose a `createSession` API method
- **Decision:** Create sessions directly via Drizzle insert into session table
- **Rationale:** Concrete fallback approach instead of relying on uncertain better-auth anonymous mode API
- **Implementation:** Generate UUID for session ID and token, set 7-day expiry, insert with user ID

**2. Guest User Pattern (Null Email)**
- **Decision:** Identify guest users by `email: null` in user table
- **Rationale:** Works within better-auth schema without custom fields, enables future "claim account" flow
- **Implementation:** createGuestSession() creates user with `email: null` and generated guest name

**3. Session Scope Limitation**
- **Decision:** Sessions for conversation ownership ONLY, NOT access control
- **Rationale:** Documentation remains public, only chat/playground need session validation
- **Implementation:** No middleware added, Phase 20 will check sessions in chat routes only

**4. Environment Variable Structure**
- **Decision:** Document BETTER_AUTH_SECRET generation command, make BETTER_AUTH_URL optional
- **Rationale:** Developer convenience (openssl command), defaults to localhost:3000
- **Implementation:** .env.example includes generation instructions and production domain note

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed session creation from API call to direct database insert**
- **Found during:** Task 2 (better-auth configuration)
- **Issue:** Plan specified `auth.api.createSession()` but better-auth doesn't expose this API method (TypeScript error: "Property 'createSession' does not exist")
- **Fix:** Implemented direct database insert pattern:
  - Import `session` table from schema
  - Generate UUIDs for session ID and token
  - Calculate 7-day expiry timestamp
  - Insert directly via `db.insert(session).values(...).returning()`
- **Files modified:** docs/lib/auth.ts
- **Verification:** TypeScript compilation passes, no errors in auth.ts
- **Committed in:** 1a1a69d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** Essential fix to implement guest sessions within better-auth constraints. Maintains plan intent (guest sessions with 7-day expiry) using concrete implementation. No scope creep.

## Issues Encountered

None - TypeScript compilation issue with better-auth API resolved via direct database insert pattern.

## User Setup Required

**External services require manual configuration.** Before testing session functionality:

1. **Create Neon Postgres database** (if not already done in Phase 14-01)
   - Sign up at https://neon.tech
   - Create new project
   - Copy connection string

2. **Set environment variables in `docs/.env.local`:**
   ```bash
   # Generate secret
   BETTER_AUTH_SECRET=$(openssl rand -base64 32)

   # Add to .env.local
   DATABASE_URL="postgresql://..."
   BETTER_AUTH_SECRET="generated-secret-here"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

3. **Run migrations** (if not already done):
   ```bash
   cd docs
   bun run db:generate
   bun run db:migrate
   ```

4. **Verification:**
   ```bash
   # Start dev server
   cd docs && bun dev

   # Test session endpoint (should return 401 or null session)
   curl http://localhost:3000/api/auth/session
   ```

## Authentication Scope Clarification

**IMPORTANT:** Sessions are for chat persistence (conversation ownership), NOT access control:

- **Public routes (no session check):**
  - `/docs/*` - All documentation pages
  - `/api/docs/*` - Documentation API endpoints
  - Landing pages, API reference, search

- **Session-tracked routes (Phase 20 implementation):**
  - `/app/chat` or `/app/playground` - Chat interface
  - `/api/messages/*` - Message CRUD validates conversation ownership

- **Guest session creation flow (Phase 20):**
  ```typescript
  // In chat UI component (future implementation):
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    // Create guest session on first visit
    const { user, session } = await createGuestSession();
    // Set session cookie via better-auth
  }
  ```

This phase establishes infrastructure only. Phase 20 (Chat UI) will implement session checks where needed.

## Session Creation Implementation

**Direct Database Insert Pattern:**

```typescript
export async function createGuestSession() {
  const guestId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const sessionToken = crypto.randomUUID();

  // Create guest user with null email
  const [guestUser] = await db.insert(user).values({
    id: guestId,
    name: `Guest_${guestId.slice(0, 8)}`,
    email: null,
    emailVerified: null,
  }).returning();

  // Create session directly in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const [guestSession] = await db.insert(session).values({
    id: sessionId,
    userId: guestUser.id,
    token: sessionToken,
    expiresAt,
  }).returning();

  return { user: guestUser, session: guestSession };
}
```

**Why Direct Insert:**
- better-auth doesn't expose `createSession` API method
- Provides concrete fallback for guest mode
- Works within existing better-auth schema
- Returns valid session object for cookie setting

**Future Enhancement (Phase 20):**
- Implement cookie setting via better-auth response helpers
- Add session validation in chat route middleware
- Enable "claim account" flow (guest → authenticated user)

## API Endpoints Available

better-auth handler exposes these endpoints at `/api/auth/*`:

- `GET /api/auth/session` - Get current session (returns user + session or null)
- `POST /api/auth/sign-out` - End current session (clears cookie)
- Additional better-auth endpoints (sign-in, sign-up) available for future v3.0 authentication

## Next Phase Readiness

**Ready for:**
- Phase 14-03: Message API can use `auth.api.getSession()` to get current user ID for conversation ownership
- Phase 20: Chat UI can call `createGuestSession()` on first visit and validate sessions

**Schema Ready:**
- Auth tables exist from Phase 14-01
- conversations.userId references user.id (foreign key configured)
- Session expiry handled by better-auth

**Security Notes:**
- HTTP-only cookies configured via better-auth defaults
- Sessions stored in database for server-side validation
- 7-day expiry with 24-hour update age (extends on activity)
- Secure flag enabled in production (via better-auth)

**Testing Blockers:**
- DATABASE_URL required for runtime testing (user must create Neon project)
- BETTER_AUTH_SECRET required for session signing (user must generate)

---
*Phase: 14-database-foundation-message-persistence*
*Completed: 2026-02-01*
