# Phase 14: Database Foundation & Message Persistence - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Neon Postgres database setup with Drizzle ORM for persisting AI chat conversations using AI SDK 6 parts array pattern. Security-first schema design to prevent approval bypass attacks through execution state tracking. Guest users can maintain conversation history across browser sessions.

</domain>

<decisions>
## Implementation Decisions

### Database Schema Design
- Extend Vercel's AI SDK chat schema (not custom, not vanilla)
- Use Vercel's base schema from their examples as foundation
- Add custom columns beyond Vercel's base (execution tracking, sandbox management, MCP metadata)
- Use Drizzle migrations with version control (not schema push, not raw SQL)

### Image Storage Strategy
- Store all visualization images in Vercel Blob Storage
- Use public blob URLs (guest mode is open, CDN performance, no signed URL overhead)
- Store blob URLs in JSONB parts array, not inline base64
- Images never stored directly in Neon Postgres

### Session Management
- Use better-auth library for session infrastructure
- Anonymous sessions for guest users (no signup required in v2.2)
- Session persistence strategy: flexible (7 days preferred, but Claude decides optimal duration)
- HTTP-only cookies for session security

### Pagination Approach
- Load 50 messages per page maximum (from success criteria)
- Message ordering: newest first preferred (standard chat UX)

### Claude's Discretion
- Specific custom column names and types (execution_status, sandbox_id, mcp_source, etc.)
- Database index strategy (JSONB GIN indexes, B-tree indexes on timestamps/user_id)
- Cursor vs offset pagination approach (base on Neon Postgres + Drizzle best practices)
- Eager vs lazy loading of message parts (base on performance testing)
- Image upload timing (immediate vs extract-then-upload vs Daytona preview)
- Exact session duration (7 days preferred, but optimize based on UX/security balance)
- Message loading direction (newest first vs oldest first vs bidirectional)

</decisions>

<specifics>
## Specific Ideas

- **Vercel AI SDK patterns**: Use their proven chat schema as foundation - they've solved the parts array storage pattern already
- **better-auth**: Research this library for session management - user specifically wants this over custom cookies
- **Security focus**: execution_status column is critical to prevent tool approval replay attacks (highlighted in research PITFALLS.md)
- **Performance constraint**: "User conversation with 50+ images loads in under 2 seconds" requires blob URLs, not inline base64 in JSONB
- **Code quality**: Follow project coding standards (minimal comments, self-explanatory code, no AI slop)
- **UI review**: Use web-design-guidelines skill for accessibility and UX validation (though Phase 14 is database-only, note for future UI phases)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-database-foundation-message-persistence*
*Context gathered: 2026-01-31*
