# Phase 14: Database Foundation & Message Persistence - Research

**Researched:** 2026-01-31
**Domain:** Neon Postgres with Drizzle ORM for AI chat message persistence using Vercel AI SDK 6 parts array pattern
**Confidence:** MEDIUM

## Summary

This phase implements message persistence for an AI chatbot using Neon Postgres (serverless PostgreSQL) with Drizzle ORM. The architecture follows Vercel AI SDK 6's parts array pattern for storing messages, where each message contains an array of parts (text, tool calls, tool results, images, etc.) stored as JSONB. Security is paramount, requiring execution status tracking to prevent tool approval bypass attacks through message replay.

The standard stack is well-established: Neon's serverless HTTP driver for edge compatibility, Drizzle ORM for type-safe database operations with version-controlled migrations, and Vercel Blob Storage for large image assets. Session management uses better-auth with Drizzle adapter for anonymous guest users who can maintain conversation history across browser sessions via HTTP-only cookies.

Key performance optimization: images over 500KB must store as blob URLs in JSONB (not inline base64) to meet the 2-second load time requirement for 50+ image conversations. Cursor-based pagination is recommended over offset pagination for better performance with large message histories.

**Primary recommendation:** Use Vercel AI SDK's UIMessage format with parts array stored in JSONB, extend with custom columns for execution tracking and MCP metadata, implement GIN indexes with jsonb_path_ops for query performance.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @neondatabase/serverless | Latest | Serverless PostgreSQL driver | HTTP-based, works in edge environments, no persistent connections needed |
| drizzle-orm | Latest | TypeScript ORM | Type-safe queries, excellent PostgreSQL support, migration system with version control |
| drizzle-kit | Latest | Migration CLI | Generates SQL migrations from schema, supports version control workflow |
| ai | Latest (v6+) | Vercel AI SDK | Industry standard for AI chat UIs, parts array pattern is proven solution |
| better-auth | Latest | Authentication library | Framework-agnostic, Drizzle adapter support, built-in session management |
| @vercel/blob | Latest | Blob storage SDK | Integrated with Vercel, CDN delivery, public URLs, cost-effective for media |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ws | Latest | WebSocket polyfill | Only if using Neon WebSocket driver in Node.js <v22 (not needed for HTTP driver) |
| pg | Latest | PostgreSQL client | Only if NOT using Neon's serverless driver (not recommended for this stack) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Neon Serverless | Standard pg + connection pooling | Neon HTTP driver better for Vercel edge, no connection limits |
| Drizzle ORM | Prisma | Drizzle has better PostgreSQL-specific features, lighter weight, better for JSONB |
| better-auth | NextAuth | better-auth has cleaner Drizzle integration, more flexible for anonymous sessions |
| Vercel Blob | AWS S3 direct | Vercel Blob simpler setup, integrated billing, CDN included |

**Installation:**
```bash
npm install @neondatabase/serverless drizzle-orm drizzle-kit ai better-auth @vercel/blob
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/
│   ├── schema.ts           # Drizzle schema definitions
│   ├── index.ts            # Database client instance
│   └── migrations/         # Generated SQL migrations
├── lib/
│   ├── auth.ts             # better-auth configuration
│   └── blob.ts             # Vercel Blob utilities
├── app/
│   ├── api/
│   │   ├── auth/[...all]/  # better-auth handler
│   │   └── chat/           # Chat API endpoints
│   └── actions/            # Server Actions (upload, etc.)
```

### Pattern 1: Vercel AI SDK Extended Schema
**What:** Start with Vercel's base chat schema and add custom columns for security and MCP features
**When to use:** Always for this phase - leverages proven patterns while adding required functionality

**Example:**
```typescript
// Source: Official AI SDK documentation + Project requirements
import { pgTable, serial, text, timestamp, jsonb, varchar, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Base conversation tracking
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // from better-auth session
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).$onUpdate(() => new Date()),
  title: text('title'),
}, (table) => [
  index('user_conversations_idx').on(table.userId),
  index('conversation_created_idx').on(table.createdAt),
]);

// Messages with AI SDK parts array pattern
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: serial('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
  parts: jsonb('parts').$type<MessagePart[]>().notNull(), // AI SDK parts array
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),

  // Custom columns for security and MCP
  executionStatus: varchar('execution_status', { length: 20 }).default('pending'), // 'pending' | 'approved' | 'executed' | 'rejected'
  sandboxId: text('sandbox_id'), // Daytona sandbox reference
  mcpSource: text('mcp_source'), // Which MCP server provided the tool
  metadata: jsonb('metadata'), // Flexible storage for additional data
}, (table) => [
  index('conversation_messages_idx').on(table.conversationId),
  index('message_created_idx').on(table.createdAt),
  // GIN index for fast JSONB queries
  index('message_parts_gin_idx').on(table.parts).using('gin').op('jsonb_path_ops'),
]);

// Type definition for parts array (matches AI SDK UIMessage)
export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: Record<string, unknown> }
  | { type: 'tool-result'; toolCallId: string; toolName: string; result: unknown }
  | { type: 'file'; filename: string; mediaType: string; url: string }; // blob URL, not base64
```

### Pattern 2: Cursor-Based Pagination for Message History
**What:** Use cursor pagination instead of offset for loading message pages
**When to use:** Always for message history - better performance and no duplicate/skip issues

**Example:**
```typescript
// Source: Drizzle ORM documentation
import { desc, lt } from 'drizzle-orm';

export async function getMessageHistory(
  conversationId: number,
  cursor?: number,
  limit = 50
) {
  const conditions = cursor
    ? lt(messages.id, cursor)
    : undefined;

  return await db
    .select()
    .from(messages)
    .where(conditions)
    .orderBy(desc(messages.createdAt)) // Newest first
    .limit(limit);
}
```

### Pattern 3: Execution Status State Machine
**What:** Track tool execution lifecycle to prevent replay attacks
**When to use:** Required for all messages with tool calls

**Example:**
```typescript
// Source: Project security requirements
export const executionStates = {
  PENDING: 'pending',     // Tool call created, awaiting user approval
  APPROVED: 'approved',   // User approved, ready to execute
  EXECUTED: 'executed',   // Successfully executed
  REJECTED: 'rejected',   // User rejected
} as const;

// Prevent replay: check execution_status before running tool
async function executeToolCall(messageId: number, toolCallId: string) {
  const message = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  // Critical security check
  if (message[0].executionStatus !== 'approved') {
    throw new Error('Tool call not approved or already executed');
  }

  // Execute tool...

  // Mark as executed to prevent replay
  await db
    .update(messages)
    .set({ executionStatus: 'executed' })
    .where(eq(messages.id, messageId));
}
```

### Pattern 4: Blob URL Storage for Images
**What:** Store large images in Vercel Blob, save public URLs in JSONB parts array
**When to use:** All images over 500KB (requirement for 2-second load time)

**Example:**
```typescript
// Source: Vercel Blob documentation + project requirements
import { put } from '@vercel/blob';

async function handleImageUpload(file: File, conversationId: number) {
  // Upload to Vercel Blob with public access
  const blob = await put(`conversations/${conversationId}/${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true, // Ensures unique URLs, immutable pattern
  });

  // Store blob URL in message part, NOT inline base64
  const imagePart: MessagePart = {
    type: 'file',
    filename: file.name,
    mediaType: file.type,
    url: blob.url, // Public CDN URL
  };

  return imagePart;
}
```

### Pattern 5: Anonymous Session Management with better-auth
**What:** Use better-auth with Drizzle adapter for cookie-based anonymous sessions
**When to use:** Phase 14 guest mode (no user accounts yet)

**Example:**
```typescript
// Source: better-auth documentation
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    // Use better-auth default (24h fresh, 7d max recommended)
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24h
  },
  // Anonymous session support
  // Note: better-auth anonymous plugin availability unclear from research
  // May need custom implementation or await plugin confirmation
});
```

### Anti-Patterns to Avoid

- **Storing base64 images in JSONB:** Bloats database, destroys query performance, prevents CDN caching. Always use Vercel Blob with URLs.
- **Offset pagination for large message histories:** Creates duplicate/skip issues during concurrent writes, poor performance at high offsets. Use cursor pagination.
- **Missing executionStatus checks:** Allows tool replay attacks where malicious users re-execute approved tools by replaying messages. Always validate state.
- **Using json type instead of jsonb:** Cannot create GIN indexes, slower queries, no compression. Always use jsonb for structured data.
- **Schema push in production:** Loses migration history, no rollback capability, dangerous for teams. Always use drizzle-kit generate + migrate.
- **Persistent connections in serverless:** Neon HTTP driver avoids connection pooling issues in Vercel functions. Don't use standard pg driver.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT + cookie handling | better-auth with Drizzle adapter | Handles session refresh, expiry, CSRF protection, cookie security (httpOnly, secure, sameSite) |
| Database migrations | Manual SQL scripts or schema.prisma push | drizzle-kit generate + migrate | Version control, team collaboration, rollback capability, SQL review before apply |
| Message pagination | Simple OFFSET/LIMIT queries | Cursor-based pagination pattern | Avoids duplicate/skip issues, better performance, works with real-time updates |
| JSONB indexing | B-tree indexes or no indexes | GIN indexes with jsonb_path_ops | 10-100x faster JSONB containment queries, smaller index size |
| Image storage | Store base64 in database | Vercel Blob with public URLs | CDN delivery, cost-effective, no database bloat, better caching |
| SQL injection prevention | Manual query escaping | Drizzle ORM parameterized queries | Type-safe, automatic escaping, TypeScript inference |
| Connection pooling | Custom pool management | @neondatabase/serverless HTTP driver | Serverless-optimized, no connection limits, works in edge |

**Key insight:** AI chat applications have solved problems (JSONB storage, cursor pagination, session management, security patterns) that are complex to implement correctly. The standard stack handles these with battle-tested solutions. Custom implementations introduce bugs, security holes, and performance issues that the ecosystem has already solved.

## Common Pitfalls

### Pitfall 1: Path Expression Mismatch in JSONB Queries
**What goes wrong:** Queries fail silently or throw errors when message structure doesn't match expected paths
**Why it happens:** AI SDK parts array is flexible - not all messages have all part types (e.g., tool calls only in some messages)
**How to avoid:** Use lax mode (default) in PostgreSQL JSON path queries, validate critical fields at application layer
**Warning signs:** Empty query results when you expect data, "key does not exist" errors in logs

### Pitfall 2: Execution Status Race Conditions
**What goes wrong:** Same tool call executes multiple times if approval check and status update aren't atomic
**Why it happens:** User clicks "approve" multiple times, or concurrent requests process same message
**How to avoid:** Use database transaction with SELECT FOR UPDATE, or optimistic locking with version column
**Warning signs:** Duplicate tool executions in logs, user reports tools running twice

### Pitfall 3: Anonymous Session Ambiguity with better-auth
**What goes wrong:** better-auth may not have built-in anonymous/guest session support
**Why it happens:** Research found no explicit anonymous plugin in better-auth documentation (404s, missing pages)
**How to avoid:** Test better-auth anonymous capabilities early, prepare fallback to custom session table if needed
**Warning signs:** better-auth requires authenticated user for session creation, guest users can't maintain conversations

### Pitfall 4: Neon Connection String Misconfiguration
**What goes wrong:** Database connections fail in production or edge environments
**Why it happens:** Forgot sslmode=require, using WebSocket driver instead of HTTP for edge, missing channel_binding parameter
**How to avoid:** Use Neon's recommended connection string format: `postgresql://[user]:[password]@[host]/[db]?sslmode=require&channel_binding=require`, enable poolQueryViaFetch for edge
**Warning signs:** Connection timeouts in Vercel edge functions, SSL handshake failures

### Pitfall 5: Blob URL Timing Issues
**What goes wrong:** Message saved with empty image URL because blob upload happens after message insert
**Why it happens:** Async upload to Vercel Blob not awaited before creating message record
**How to avoid:** Upload blobs first, await upload completion, then create message with blob URL
**Warning signs:** Messages with missing images, null URLs in parts array, broken image links

### Pitfall 6: GIN Index Misuse
**What goes wrong:** GIN index created but queries don't use it, or wrong operator class chosen
**Why it happens:** Used default jsonb_ops when jsonb_path_ops is better for containment queries, or query pattern doesn't match index
**How to avoid:** Use jsonb_path_ops for @> queries (most common), verify with EXPLAIN ANALYZE
**Warning signs:** Slow JSONB queries despite GIN index, EXPLAIN shows sequential scan

### Pitfall 7: Migration File Conflicts
**What goes wrong:** Multiple developers generate migrations for same schema changes, conflicts on merge
**Why it happens:** drizzle-kit generate creates timestamped files locally, no coordination
**How to avoid:** Coordinate schema changes, regenerate migration after pulling others' changes, review migration SQL before commit
**Warning signs:** Git conflicts in migrations directory, duplicate migration files with different timestamps

## Code Examples

Verified patterns from official sources:

### Database Client Setup (Neon + Drizzle)
```typescript
// Source: Neon documentation + Drizzle docs
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// For edge environments (Vercel Edge Functions, Cloudflare Workers)
import { neonConfig } from '@neondatabase/serverless';
neonConfig.poolQueryViaFetch = true; // Enable HTTP-only mode
```

### Drizzle Migration Workflow
```typescript
// Source: Drizzle Kit documentation
// 1. Define or update schema in src/db/schema.ts

// 2. Generate migration SQL
// Terminal: npx drizzle-kit generate

// 3. Review generated SQL in src/db/migrations/

// 4. Apply migration
// Terminal: npx drizzle-kit migrate

// OR apply at runtime (not recommended for production)
import { migrate } from 'drizzle-orm/neon-http/migrator';
await migrate(db, { migrationsFolder: './src/db/migrations' });
```

### Creating GIN Index for JSONB Parts
```typescript
// Source: Drizzle ORM indexes documentation
import { pgTable, jsonb, index } from 'drizzle-orm/pg-core';

export const messages = pgTable('messages', {
  parts: jsonb('parts').$type<MessagePart[]>().notNull(),
}, (table) => [
  // jsonb_path_ops: smaller index, faster for @> containment queries
  index('message_parts_gin_idx')
    .on(table.parts)
    .using('gin')
    .op('jsonb_path_ops'),
]);

// Query that uses this index
const userMessages = await db
  .select()
  .from(messages)
  .where(sql`${messages.parts} @> '[{"type": "text"}]'::jsonb`);
```

### Timestamp Columns with Auto-Update
```typescript
// Source: Drizzle ORM timestamp documentation
import { timestamp } from 'drizzle-orm/pg-core';

export const conversations = pgTable('conversations', {
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .$onUpdate(() => new Date())
    .notNull(),
});
```

### Message Loading with Cursor Pagination
```typescript
// Source: Drizzle ORM pagination guide
import { desc, lt, eq } from 'drizzle-orm';

interface PaginatedMessages {
  messages: Message[];
  nextCursor: number | null;
}

export async function loadMessages(
  conversationId: number,
  cursor?: number,
  limit = 50
): Promise<PaginatedMessages> {
  const conditions = [eq(messages.conversationId, conversationId)];

  if (cursor) {
    conditions.push(lt(messages.id, cursor));
  }

  const results = await db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1); // Fetch one extra to determine if there's more

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { messages: items, nextCursor };
}
```

### Vercel Blob Upload with Server Action
```typescript
// Source: Vercel Blob documentation
'use server';

import { put } from '@vercel/blob';

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File;

  // Upload to blob storage
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true, // Ensures immutability
  });

  // Returns: { url: string, downloadUrl: string, pathname: string }
  return blob.url;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Content as single string field | Parts array with multiple types | AI SDK v4 → v6 (2024) | Supports tool calls, images, reasoning in structured format |
| Standard pg driver | Neon serverless HTTP driver | 2023-2024 | Eliminates connection pooling issues in serverless, works in edge |
| Prisma for PostgreSQL | Drizzle ORM gaining adoption | 2023-2024 | Lighter weight, better PostgreSQL features, superior JSONB support |
| Inline base64 images | Blob storage URLs | Industry shift 2023+ | CDN delivery, better performance, lower database costs |
| Offset pagination | Cursor pagination | Best practice since ~2020 | Consistent results during concurrent writes, better performance |

**Deprecated/outdated:**
- **Vercel AI SDK content field:** Replaced by parts array for richer message types (v4 → v6 transition)
- **Standard pg with PgBouncer for serverless:** Neon HTTP driver solves connection issues directly
- **drizzle-kit push for production:** Migration generation workflow is now standard practice
- **JSON type in PostgreSQL:** JSONB is superior for querying, indexing, and storage efficiency

## Open Questions

Things that couldn't be fully resolved:

1. **better-auth Anonymous Session Support**
   - What we know: better-auth has Drizzle adapter, session management, and plugin ecosystem
   - What's unclear: No explicit anonymous/guest plugin found in documentation (multiple 404s on docs site)
   - Recommendation: Implement minimal test early in phase to validate anonymous session capability. If unsupported, fall back to custom session table or research alternative libraries (lucia, iron-session). Document decision in phase implementation.

2. **Optimal Session Duration for Guest Users**
   - What we know: better-auth supports configurable session expiry, 7-day preference from CONTEXT.md
   - What's unclear: Best practice for anonymous users (shorter for security vs longer for UX)
   - Recommendation: Start with 7 days as specified, monitor in Phase 14 and adjust in later phase if needed. Consider implementing session extension on activity.

3. **Message Loading Direction Preference**
   - What we know: Cursor pagination works both directions, newest-first is common for chat
   - What's unclear: User may want oldest-first for review, or bidirectional for context loading
   - Recommendation: Implement newest-first as stated in CONTEXT.md, design query functions to support direction parameter for future flexibility.

4. **Execution Status Atomic Update Pattern**
   - What we know: Need to prevent replay attacks via execution status tracking
   - What's unclear: Best atomicity pattern (SELECT FOR UPDATE vs optimistic locking vs version column)
   - Recommendation: Use database transaction with SELECT FOR UPDATE for approval → execution transition. Test race condition handling during implementation.

5. **AI SDK Version and Parts Array Evolution**
   - What we know: Parts array is current pattern, supports text/tool-call/tool-result/file types
   - What's unclear: AI SDK versioning and breaking changes frequency (documentation showed multiple redirects, possible domain migration)
   - Recommendation: Pin AI SDK version in package.json, monitor changelog for breaking changes before upgrading.

## Sources

### Primary (HIGH confidence)
- Drizzle ORM documentation (https://orm.drizzle.team) - Schema definition, migrations, JSONB indexes, pagination
- PostgreSQL JSONB documentation (https://www.postgresql.org/docs/current/) - GIN indexes, JSON functions, query patterns
- Vercel Blob documentation (https://vercel.com/docs/storage/vercel-blob) - Upload patterns, public URLs, caching, limits
- Neon documentation (https://neon.com/docs/guides/drizzle) - Serverless driver setup, connection configuration

### Secondary (MEDIUM confidence)
- Vercel AI SDK documentation (https://ai-sdk.dev/) - UIMessage format, parts array structure, chat patterns
  - Note: Multiple redirects from sdk.vercel.ai → ai-sdk.dev suggests recent migration, some docs incomplete
- better-auth documentation (https://www.better-auth.com/docs) - Session management, Drizzle adapter, basic setup
  - Note: Multiple 404s on plugin/config pages, documentation appears incomplete or under construction

### Tertiary (LOW confidence)
- WebSearch results on cursor vs offset pagination - General best practices (not PostgreSQL-specific)
- WebSearch results on tool execution security patterns - No authoritative sources found
- WebSearch results on better-auth anonymous sessions - No results confirming feature exists

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Neon, Drizzle, Vercel Blob well-documented with clear setup patterns
- Architecture: MEDIUM - AI SDK parts array pattern verified but some details unclear (UIMessage type definitions incomplete), better-auth anonymous support uncertain
- Pitfalls: MEDIUM - JSONB and Drizzle pitfalls verified from official docs, security patterns derived from requirements (not found in wild)

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - AI SDK and better-auth evolving, Drizzle/PostgreSQL stable)
