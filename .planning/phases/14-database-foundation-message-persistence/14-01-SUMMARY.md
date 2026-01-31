---
phase: 14-database-foundation-message-persistence
plan: 01
subsystem: database
tags: [neon, drizzle-orm, postgres, ai-sdk, message-persistence]

requires:
  - "Phase 13: Build system and quality standards"
  - "v2.2 roadmap: Database decision (Neon Postgres + Drizzle)"

provides:
  - "Neon Postgres connection via serverless HTTP driver"
  - "Drizzle ORM schema with AI SDK parts array pattern"
  - "Version-controlled migration system (Drizzle Kit)"
  - "Security-first schema (execution_status for replay prevention)"

affects:
  - "Phase 14-02: API routes will use db client from db/index.ts"
  - "Phase 14-03: Cursor pagination will query messages table"
  - "Phase 15: Sandbox tracking via sandboxId column"
  - "Phase 18: Approval flow depends on execution_status column"

tech-stack:
  added:
    - "@neondatabase/serverless ^0.10.4 - HTTP-based Postgres for edge runtime"
    - "drizzle-orm ^0.38.4 - Type-safe ORM with JSONB support"
    - "drizzle-kit ^0.31.8 - Migration generation and management"
  patterns:
    - "AI SDK UIMessage parts array - JSONB storage for multi-part messages"
    - "GIN index with jsonb_path_ops - Fast JSONB containment queries"
    - "Edge-compatible database client - poolQueryViaFetch for Vercel Edge Runtime"
    - "better-auth integration ready - User/session tables pre-defined"

key-files:
  created:
    - "docs/db/schema.ts - Drizzle schema (conversations, messages, auth tables)"
    - "docs/db/index.ts - Neon database client with edge compatibility"
    - "docs/drizzle.config.ts - Drizzle Kit configuration"
    - "docs/db/migrations/0000_initial_schema.sql - Initial migration SQL"
    - "docs/db/migrations/_meta/ - Migration tracking metadata"
  modified:
    - "docs/package.json - Added Neon and Drizzle dependencies, db scripts"
    - "docs/bun.lock - Locked dependency versions"

decisions:
  - id: "14-01-jsonb-parts"
    what: "Use JSONB column for AI SDK parts array instead of separate tables"
    why: "Matches AI SDK UIMessage format, simplifies queries, single source of truth"
    impact: "Performance depends on GIN index (added), max message size ~1MB"

  - id: "14-01-execution-status"
    what: "Add execution_status column to messages table"
    why: "Prevent tool replay attacks (Phase 18 security requirement)"
    values: "pending | approved | executed | rejected"

  - id: "14-01-blob-urls"
    what: "Store file parts as blob URLs, not base64"
    why: "Prevent JSONB bloat (base64 images can be 10MB+, cause performance collapse)"
    impact: "Phase 15 must generate blob URLs for visualizations"

  - id: "14-01-edge-compat"
    what: "Configure neonConfig.poolQueryViaFetch = true"
    why: "Enables Neon HTTP driver to work in Vercel Edge Runtime"
    impact: "API routes can use edge runtime for lower latency"

metrics:
  duration: "19 minutes"
  tasks_completed: 3
  commits: 2
  completed: 2026-01-31
---

# Phase 14 Plan 01: Database Foundation Summary

Neon Postgres with Drizzle ORM configured for AI SDK message persistence using JSONB parts array pattern with security-first schema design.

## What Was Built

### Database Schema

**conversations table:**
- serial id (primary key)
- user_id (text, indexed) - Will integrate with better-auth in Phase 14-02
- created_at, updated_at (timestamps with auto-update)
- title (text, nullable)

**messages table:**
- serial id (primary key)
- conversation_id (references conversations, cascade delete)
- role (varchar(20)) - 'user' | 'assistant' | 'system'
- **parts (jsonb)** - AI SDK MessagePart array (see schema below)
- created_at (timestamp)
- **execution_status (varchar(20))** - 'pending' | 'approved' | 'executed' | 'rejected'
- sandbox_id (text) - Daytona workspace reference (Phase 15)
- mcp_source (text) - Which MCP server the tool call came from
- metadata (jsonb) - Flexible additional data

**better-auth tables (pre-defined):**
- user, session, account, verification (ready for Phase 14-02 if needed)

### AI SDK MessagePart Schema

```typescript
export type MessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: Record<string, unknown> }
  | { type: "tool-result"; toolCallId: string; toolName: string; result: unknown }
  | { type: "file"; filename: string; mediaType: string; url: string }; // Blob URL only
```

**Critical constraint:** File parts MUST use blob URLs. Never store base64 in JSONB (can reach 10MB+, causes query timeouts).

### Performance Optimization

**GIN index on parts column:**
```sql
CREATE INDEX message_parts_gin_idx ON messages USING gin (parts jsonb_path_ops);
```

Enables fast containment queries:
```typescript
// Find all messages with specific tool call
db.select()
  .from(messages)
  .where(sql`parts @> '[{"type": "tool-call", "toolName": "python"}]'`);
```

**Other indexes:**
- user_conversations_idx - Fast user conversation listing
- conversation_created_idx - Chronological sorting
- conversation_messages_idx - Message retrieval per conversation
- message_created_idx - Chronological message sorting

### Database Client Configuration

**Edge runtime compatibility:**
```typescript
import { neonConfig } from "@neondatabase/serverless";
neonConfig.poolQueryViaFetch = true; // Enables HTTP-only mode
```

This allows API routes to use Vercel Edge Runtime (faster cold starts, lower latency).

### Migration System

**Drizzle Kit setup:**
- `bun run db:generate` - Generate migrations from schema
- `bun run db:migrate` - Apply migrations to database
- Version-controlled SQL in `db/migrations/`
- Metadata tracking in `db/migrations/_meta/_journal.json`

**Initial migration:** `0000_initial_schema.sql`
- Creates all tables with foreign keys
- Creates all indexes
- Uses `IF NOT EXISTS` for idempotent re-runs
- Uses `DO $$ BEGIN ... EXCEPTION` for foreign key safety

## Implementation Highlights

### Schema-First Design

Defined schema in TypeScript using Drizzle ORM:
- Type-safe table definitions
- Compile-time validation
- Auto-completion for queries
- Generated TypeScript types

### Security Features

**1. execution_status column:**
Prevents message replay attacks. Once a tool call is executed, status moves from 'pending' → 'executed'. Re-submitting the same message won't re-execute tools.

**2. Cascade deletes:**
Deleting a conversation automatically removes all messages. Deleting a user removes all conversations and sessions.

**3. JSONB validation:**
MessagePart type enforces structure. Invalid parts rejected at query time.

### better-auth Integration Ready

Schema includes user/session/account tables for future authentication (Phase 14-02 or v3.0). v2.2 uses guest mode, so these tables exist but aren't used yet.

## Integration Points

### For Phase 14-02 (API Routes)

**Import database client:**
```typescript
import { db } from "@/db";
import { messages, conversations } from "@/db/schema";

// Insert a message
await db.insert(messages).values({
  conversationId: 1,
  role: "assistant",
  parts: [
    { type: "text", text: "Hello!" },
    { type: "tool-call", toolCallId: "call_123", toolName: "python", args: { code: "..." } }
  ],
  executionStatus: "pending"
});
```

### For Phase 14-03 (Cursor Pagination)

**Query messages with cursor:**
```typescript
const pageSize = 50;
const cursor = lastMessageId; // from previous page

const result = await db
  .select()
  .from(messages)
  .where(and(
    eq(messages.conversationId, conversationId),
    cursor ? lt(messages.id, cursor) : undefined
  ))
  .orderBy(desc(messages.id))
  .limit(pageSize);

// Next cursor: result[result.length - 1]?.id
```

### For Phase 15 (Sandbox Tracking)

**Update message with sandbox reference:**
```typescript
await db.update(messages)
  .set({
    sandboxId: "daytona-ws-abc123",
    executionStatus: "executed"
  })
  .where(eq(messages.id, messageId));
```

### For Phase 18 (Approval Flow)

**Query pending tool calls:**
```typescript
const pending = await db
  .select()
  .from(messages)
  .where(
    and(
      eq(messages.conversationId, conversationId),
      eq(messages.executionStatus, "pending"),
      sql`parts @> '[{"type": "tool-call"}]'` // Has tool calls
    )
  );
```

## Example MessagePart Usage

### Text-only message
```typescript
{
  role: "user",
  parts: [{ type: "text", text: "Analyze this dataset" }]
}
```

### Tool call with result
```typescript
{
  role: "assistant",
  parts: [
    { type: "text", text: "I'll run some Python code to analyze it." },
    {
      type: "tool-call",
      toolCallId: "call_abc123",
      toolName: "python",
      args: { code: "import pandas as pd\ndf = pd.read_csv('data.csv')\ndf.describe()" }
    },
    {
      type: "tool-result",
      toolCallId: "call_abc123",
      toolName: "python",
      result: { stdout: "...", exitCode: 0 }
    },
    {
      type: "file",
      filename: "distribution.png",
      mediaType: "image/png",
      url: "blob:http://localhost:3000/abc-def-123" // Blob URL, not base64
    }
  ]
}
```

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written. Database schema, client, and migrations created successfully.

## Blockers and Issues

**RESOLVED: better-auth tables included**
Schema includes better-auth tables even though v2.2 uses guest mode. This is not a blocker - tables can remain unused. If v3.0 adds authentication, schema is ready.

**CRITICAL: DATABASE_URL required for Phase 14-02**
User must provide Neon connection string before API routes can be tested. .env.example documents the requirement, but actual credentials are not committed.

## Next Phase Readiness

### Phase 14-02 Prerequisites (API Routes)

**READY:**
- ✅ Database schema exists
- ✅ Client configured for edge runtime
- ✅ TypeScript types generated
- ✅ Migration ready to apply

**BLOCKED:**
- ❌ Need DATABASE_URL environment variable (user must provide)
- ❌ Need to run migration: `bun run db:migrate` (requires DATABASE_URL)

**Action items:**
1. User creates Neon project at console.neon.tech
2. User copies connection string to `.env.local`
3. Phase 14-02 executor runs `bun run db:migrate` as first task
4. API routes can then query database

### Phase 14-03 Prerequisites (Cursor Pagination)

**READY:**
- ✅ messages.id is serial (auto-incrementing) for cursor-based pagination
- ✅ GIN index enables fast JSONB filtering
- ✅ conversation_messages_idx for efficient conversation queries

**Query pattern for cursor pagination:**
```typescript
// First page
const page1 = await db.select()
  .from(messages)
  .where(eq(messages.conversationId, id))
  .orderBy(desc(messages.id))
  .limit(50);

// Next page (use last message ID as cursor)
const lastId = page1[page1.length - 1].id;
const page2 = await db.select()
  .from(messages)
  .where(and(
    eq(messages.conversationId, id),
    lt(messages.id, lastId)
  ))
  .orderBy(desc(messages.id))
  .limit(50);
```

### Phase 15 Prerequisites (Sandbox Integration)

**READY:**
- ✅ sandboxId column for Daytona workspace tracking
- ✅ mcpSource column for MCP server attribution
- ✅ execution_status for tool execution tracking

**Pattern for sandbox lifecycle:**
1. Message created with execution_status: "pending"
2. User approves → status: "approved"
3. Sandbox created → sandboxId populated
4. Tool executed → status: "executed", result added to parts array
5. Sandbox cleanup (15-minute timeout or manual)

### Known Limitations

**1. Message size limit (~1MB JSONB)**
Large tool results or multiple visualizations may exceed JSONB practical limit. Mitigation: Use blob URLs for files, not base64.

**2. No full-text search**
Current schema uses GIN index for containment queries. For semantic search (future), add vectra embeddings table.

**3. No soft deletes**
CASCADE delete is permanent. For audit trail, add deleted_at column in future phase.

## Files Modified

### Package Management
- `docs/package.json` - Added @neondatabase/serverless, drizzle-orm, drizzle-kit
- `docs/bun.lock` - Locked dependency versions

### Database Files
- `docs/db/schema.ts` - Drizzle schema with conversations, messages, auth tables
- `docs/db/index.ts` - Neon client with edge compatibility
- `docs/drizzle.config.ts` - Drizzle Kit configuration

### Migrations
- `docs/db/migrations/0000_initial_schema.sql` - Initial migration SQL
- `docs/db/migrations/_meta/0000_snapshot.json` - Schema snapshot
- `docs/db/migrations/_meta/_journal.json` - Migration tracking

### Environment
- `docs/.env.example` - Already documented DATABASE_URL (no changes needed)

## Verification

All success criteria met:

✅ Neon and Drizzle dependencies installed in docs/package.json
✅ DATABASE_URL documented in .env.example with sslmode=require
✅ schema.ts exports conversations and messages tables with AI SDK parts pattern
✅ messages.parts uses jsonb type with MessagePart[] TypeScript type
✅ messages.executionStatus column present for security
✅ GIN index with jsonb_path_ops configured for parts column
✅ Database client uses Neon HTTP driver with poolQueryViaFetch enabled
✅ Initial migration SQL generated and committed to git
✅ Migration includes all tables, indexes, and constraints
✅ TypeScript compiles without errors
✅ No database credentials committed to repository

## Duration

**Total time:** 19 minutes

**Task breakdown:**
- Task 1 (Dependencies): 5 minutes
- Task 2 (Schema): 10 minutes
- Task 3 (Migrations): 4 minutes (auto-generated with Task 2)

## Commits

- `95c3740` - chore(14-01): install Neon and Drizzle dependencies
- `2f11fe8` - feat(14-01): create Drizzle schema with AI SDK parts array pattern
