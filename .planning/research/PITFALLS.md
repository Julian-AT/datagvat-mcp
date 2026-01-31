# Pitfalls Research

**Domain:** Interactive Data Playground with Code Execution
**Researched:** 2026-01-31
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Tool Approval Bypass Through Message Replay

**What goes wrong:**
User approves a tool call once, then the AI SDK replays stored messages containing tool calls without re-requesting approval. Guest users get unauthorized code execution by navigating back or refreshing the page.

**Why it happens:**
AI SDK 6's message persistence pattern stores tool calls in the `parts` array. When messages load from database, the SDK sees tool calls as "already approved" because they exist in message history. The `experimental_needsApproval` flag only triggers on NEW tool calls, not replayed ones.

**How to avoid:**
- NEVER persist approval state in the database
- Add `execution_status: "pending" | "approved" | "rejected" | "executed"` column to tool call records
- Filter out non-executed tool calls when loading message history
- Re-prompt for approval if `execution_status !== "executed"`
- Store tool call results separately from tool call requests
- Implement message loading that reconstructs UI state without triggering execution

**Warning signs:**
- Code executes on page refresh without new approval dialog
- Tool calls trigger when scrolling through old messages
- Guest users can re-run sandboxes by browser navigation
- Approval dialogs appear for already-executed code

**Phase to address:**
Phase 1 (Message Persistence) — Database schema MUST separate execution state from message content

---

### Pitfall 2: Sandbox Resource Exhaustion Without Cleanup

**What goes wrong:**
User creates multiple sandboxes during a session. Each sandbox persists in Daytona until manually destroyed. After 10-20 conversations, Daytona runs out of resources. New sandbox creation fails silently or with cryptic errors.

**Why it happens:**
Daytona CLI creates sandboxes but doesn't auto-destroy them. Developers forget to implement cleanup logic. Guest mode has no "session" concept, so there's no natural cleanup trigger. Error handling catches creation failures but doesn't diagnose "resource limit reached."

**How to avoid:**
- Implement sandbox lifecycle tracking in database (`sandbox_id`, `created_at`, `last_used_at`, `status`)
- Destroy sandbox after conversation ends (define "end" as 15 minutes of inactivity)
- Add background job that destroys sandboxes older than 1 hour
- Implement health check that verifies Daytona can create new sandboxes
- Surface Daytona resource limits in error messages
- Add admin UI to view and destroy orphaned sandboxes (even in guest mode)
- Test with 20+ sequential conversations to verify cleanup works

**Warning signs:**
- Daytona CLI `list` command shows many sandboxes
- Sandbox creation intermittently fails with no clear error
- Performance degrades over time during development
- Error logs show resource-related failures from Daytona

**Phase to address:**
Phase 2 (Sandbox Integration) — MUST implement cleanup before production deployment

---

### Pitfall 3: Multiple MCP Server Race Conditions on Startup

**What goes wrong:**
App starts data.gv.at MCP server and Daytona MCP server simultaneously via stdio. One fails to connect, but the app doesn't detect the failure until user tries to execute code. Error message is generic: "Tool not available." User assumes code execution is broken, but actually the MCP server never started.

**Why it happens:**
stdio transport is asynchronous. Process spawning can fail silently if the CLI isn't in PATH or has wrong permissions. Both servers write to stderr/stdout, causing log interleaving that hides startup errors. No health check verifies both servers are ready before marking app as "ready."

**How to avoid:**
- Spawn MCP servers sequentially, not in parallel
- Implement startup health check for each server (call a simple tool like `ping` or `list`)
- Add timeout for each server startup (fail fast after 10 seconds)
- Separate stderr/stdout streams per server using unique prefixes
- Display server connection status in UI before allowing chat
- Implement reconnection logic if server process dies mid-session
- Log full command with environment variables for debugging
- Test with Daytona CLI missing from PATH to verify error messages

**Warning signs:**
- "Connection refused" errors appear in user chat
- Tools list is incomplete (missing Daytona tools or data.gv.at tools)
- Server logs show mixed output from multiple processes
- Health check endpoint returns 200 but tools fail

**Phase to address:**
Phase 2 (Sandbox Integration) — Server initialization MUST have health checks

---

### Pitfall 4: Message Persistence Performance Collapse with Large Visualizations

**What goes wrong:**
User generates 10+ matplotlib visualizations in one conversation. Each base64 image is 500KB-2MB. Message table row size exceeds Postgres's toast limits. Queries become slow (5+ seconds to load conversation). Database backups fail. App becomes unusable.

**Why it happens:**
AI SDK 6 `parts` array stores everything in JSONB column. Base64 images are strings, so they go directly into the database. Postgres JSONB has a practical limit around 1-2GB per row, but performance degrades well before that. Indexes on JSONB columns don't help with blob data. Neon's free tier has connection limits that amplify slow queries.

**How to avoid:**
- NEVER store base64 images in message table
- Store images in blob storage (S3, Cloudflare R2, or filesystem)
- Save image URL/path in `parts` array, not the image itself
- Implement size limit: if image > 100KB, automatically move to blob storage
- Add database migration to separate existing images before scaling
- Use `pg_notify` triggers to alert when message size exceeds threshold
- Test with 50-image conversation to verify performance stays under 1 second
- Implement pagination for message loading (don't load entire conversation)

**Warning signs:**
- Conversation loading time increases with each message
- Database query logs show slow JSONB operations
- Browser dev tools show multi-MB responses from `/api/messages` endpoint
- Postgres logs show "tuple size exceeds TOAST limit" warnings

**Phase to address:**
Phase 1 (Message Persistence) — Image storage strategy MUST be designed before schema creation

---

### Pitfall 5: Daytona CLI Dependency Without Graceful Degradation

**What goes wrong:**
User visits the playground. Daytona CLI isn't installed on the server. App crashes on startup or shows blank page. Even if Daytona isn't needed for browsing datasets, the entire app is unusable because server initialization failed.

**Why it happens:**
Server code assumes Daytona CLI is available at startup. It spawns the MCP server during initialization. If spawning fails, the entire Next.js API route fails to load. Error boundary doesn't catch it because it's a server-side failure. Guest users who only want to browse datasets are blocked by a feature they're not using.

**How to avoid:**
- Make Daytona integration OPTIONAL at runtime
- Detect Daytona CLI availability during startup (check PATH, verify version)
- If Daytona unavailable, disable only code execution features
- Display clear UI message: "Code execution unavailable — Daytona CLI not configured"
- Allow all other features (dataset search, preview) to work normally
- Provide setup instructions in error message with environment variables
- Test with Daytona CLI missing to verify app still serves documentation
- Add `DAYTONA_ENABLED` environment variable for explicit opt-in

**Warning signs:**
- App won't start without Daytona installed
- Documentation site returns 500 errors
- Environment variable errors appear in production logs
- Guest users report "site down" when only code execution is broken

**Phase to address:**
Phase 2 (Sandbox Integration) — Graceful degradation MUST be implemented before enabling code execution

---

### Pitfall 6: Tool Call Context Loss Across Sessions

**What goes wrong:**
User approves code execution, sees results, then closes browser. Returns later, sees conversation history including past visualizations, but can't re-run or modify previous code. The sandbox ID is lost. Clicking "re-run this code" creates a NEW sandbox with none of the previous libraries or data files. User confusion: "Where did my dataset go?"

**Why it happens:**
Sandbox ID isn't persisted in message metadata. Guest mode has no authentication, so there's no "session" to restore. Message history shows RESULTS but not the execution context. Each new sandbox starts from clean slate. Previous environment (installed packages, uploaded CSV files) is gone.

**How to avoid:**
- Store `sandbox_id` in message metadata for every tool call
- Persist sandbox environments to Daytona's storage layer
- Implement "restore sandbox" flow that recreates environment from history
- Show clear UI indicator when re-running code: "Creating new environment"
- For guest mode, store minimal session data in localStorage (sandbox_id, created_at)
- Add "export conversation" feature that includes sandbox setup instructions
- Display warning before re-running old code: "Previous files won't be available"
- Test conversation restoration after browser restart

**Warning signs:**
- Users report "my dataset disappeared"
- Code that worked before now fails with "file not found"
- Re-running old code produces different results
- Support requests: "How do I get back to my analysis?"

**Phase to address:**
Phase 3 (Visualization & Execution) — Sandbox context tracking needed before public beta

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing images in database JSONB | Simple schema, no file storage setup | Database bloat, slow queries, backup failures | Never — move to blob storage before MVP |
| Single shared sandbox for all users | Reduced Daytona resource usage | Security risk (user A sees user B's data), race conditions | Never — isolation is non-negotiable |
| Skipping tool approval in development | Faster testing iteration | Approval bypass bugs reach production | Only with `NODE_ENV === "test"` guard |
| No sandbox cleanup logic | Simpler code, faster MVP | Resource exhaustion, production failures | Only if planning to add before 10 users |
| Polling for sandbox status | Avoid WebSocket complexity | High server load, slow user feedback | Acceptable if polling interval > 2 seconds |
| Synchronous message loading | Simple query, no pagination | App freezes with 100+ message conversations | Acceptable for MVP if limiting to 50 messages |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Daytona CLI | Assuming CLI is in PATH | Check PATH at startup, provide clear error with setup instructions |
| Daytona MCP stdio | Spawning server without health check | Verify server responds before marking ready, implement reconnection |
| Vercel AI Gateway | Hardcoding model name | Use environment variable for model selection, support multiple providers |
| Neon Postgres | Using default connection pool size | Configure pool size for serverless (min: 0, max: 10 for free tier) |
| AI SDK useChat | Calling `append()` without checking loading state | Disable send button when `isLoading === true`, queue messages if needed |
| MCP tool calls | Not handling tool call errors in UI | Display tool errors inline with message, offer retry option |
| Base64 images | Embedding in `<img src="data:...">` without size limit | Check size, show "image too large" warning if > 5MB |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading entire conversation history | First chat loads fast, 100th message loads slowly | Implement pagination (last 50 messages), lazy load older messages | After 100+ messages in conversation |
| No database indexes on message queries | Queries fast at first, slow after 1000 messages | Add indexes on `conversation_id`, `created_at`, `user_id` | After 1000 conversations |
| Spawning new sandbox per message | Works fine with 5 users, fails at 50 concurrent | Reuse sandbox across messages in same conversation | After 20 concurrent users |
| Synchronous tool call approval | User waits 2 seconds, acceptable | Use optimistic UI updates, process approval async | User perception, not actual breakage |
| Storing tool call responses in memory | Fast for first session, memory leak over time | Store in database, implement proper cleanup | After 12 hours of uptime |
| No rate limiting on sandbox creation | Fine during development, abused in production | Rate limit: max 5 sandboxes per IP per hour | First spam/abuse incident |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Replaying tool calls from database without re-approval | Guest user can execute arbitrary code by refreshing page | Store execution state separately, never auto-execute persisted tool calls |
| Shared sandbox between users | User A's data visible to user B, potential data exfiltration | One sandbox per conversation, isolate by conversation ID |
| No timeout on code execution | Infinite loop consumes Daytona resources indefinitely | Enforce 30-second timeout per execution, kill process after |
| Allowing network access from sandbox | User code can exfiltrate data to external servers | Configure Daytona network policy: no outbound except approved domains |
| Storing API keys in message history | Keys leak if database compromised | Never log API keys, redact from tool call parameters |
| No input validation on code | User injects shell commands via Python string escaping | Validate code syntax before execution, run in restricted environment |
| Persistent sandbox storage | User A leaves malicious file, user B's sandbox might access it | Ephemeral sandboxes only, destroy all files after session |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent sandbox creation failure | User thinks code executed, sees no output, confused | Show explicit status: "Creating sandbox..." → "Executing..." → "Complete" |
| No progress indicator for long-running code | User waits 15 seconds, thinks app is frozen | Stream status updates: "Installing pandas..." → "Loading data..." |
| Approval dialog doesn't show code preview | User approves without knowing what will execute | Display full code in dialog with syntax highlighting |
| Error messages use technical jargon | "stdio transport error" → user has no idea what to do | Translate to user terms: "Code execution unavailable — try again later" |
| Lost visualizations on page refresh | User refreshes, all charts disappear | Persist visualization URLs, reload from database |
| No way to export results | User can't save analysis outside the app | Add "Download as JSON" / "Share conversation" buttons |
| Tool approval dialog blocks entire UI | User can't review previous results while approving | Use modal that allows scrolling background conversation |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Code execution:** Often missing cleanup logic — verify sandboxes get destroyed after 1 hour
- [ ] **Tool approval:** Often missing replay protection — verify refreshing page doesn't re-execute
- [ ] **Message persistence:** Often missing image storage strategy — verify 50-image conversation doesn't slow down
- [ ] **MCP server connection:** Often missing health checks — verify startup fails gracefully if Daytona unavailable
- [ ] **Error handling:** Often missing user-friendly messages — verify all error paths show actionable guidance
- [ ] **Sandbox isolation:** Often missing per-conversation sandboxes — verify user A can't access user B's data
- [ ] **Network access:** Often missing Daytona network policy — verify sandbox can't connect to arbitrary domains
- [ ] **Resource limits:** Often missing timeout enforcement — verify infinite loop terminates after 30 seconds
- [ ] **Graceful degradation:** Often missing Daytona-optional mode — verify docs site works without Daytona CLI
- [ ] **Session restoration:** Often missing sandbox context — verify re-running old code shows clear warning

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Tool approval bypass | HIGH | 1. Add `execution_status` column with migration 2. Deploy database schema change 3. Clear all cached messages 4. Force logout all sessions (if auth added) |
| Sandbox resource exhaustion | MEDIUM | 1. Manual cleanup: `daytona sandbox list \| xargs daytona sandbox destroy` 2. Deploy cleanup job 3. Monitor for 24 hours |
| Multiple MCP server failures | LOW | 1. Restart server processes 2. Check CLI PATH configuration 3. Add health check logging 4. Deploy fix |
| Database performance collapse | HIGH | 1. Stop writes 2. Migrate images to blob storage 3. Vacuum database 4. Add indexes 5. Resume writes — downtime 1-2 hours |
| Daytona CLI missing | LOW | 1. Install Daytona CLI 2. Configure PATH 3. Restart server — no data loss |
| Tool call context loss | MEDIUM | 1. Add `sandbox_id` to message metadata 2. Backfill existing messages (set to null) 3. Update UI to show warning |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Tool approval bypass | Phase 1 (Database schema design) | Verify page refresh doesn't re-execute code |
| Sandbox resource exhaustion | Phase 2 (Sandbox integration) | Run 20 conversations, verify cleanup works |
| Multiple MCP server race conditions | Phase 2 (Sandbox integration) | Start app 10 times, verify both servers connect |
| Message persistence performance | Phase 1 (Database schema design) | Load 50-image conversation in < 1 second |
| Daytona CLI dependency | Phase 2 (Sandbox integration) | Start app without Daytona, verify docs work |
| Tool call context loss | Phase 3 (Visualization & execution) | Refresh page, verify sandbox state warning appears |
| Shared sandbox security risk | Phase 2 (Sandbox integration) | Create 2 conversations, verify isolated sandboxes |
| No timeout on code execution | Phase 3 (Visualization & execution) | Run infinite loop, verify termination after 30s |
| Network access from sandbox | Phase 2 (Sandbox integration) | Attempt external HTTP request, verify blocked |
| Silent sandbox creation failure | Phase 3 (Visualization & execution) | Disable Daytona, verify clear error message |

## Sources

**Research basis:**
- Technical context: PROJECT.md milestone requirements (code execution, user approval, message persistence)
- Security patterns: Industry best practices for sandboxed code execution (isolation, timeouts, network policies)
- Integration patterns: stdio transport reliability, process lifecycle management
- Performance patterns: Database JSONB limitations with large binary data (Postgres documentation)
- UX patterns: Tool approval flows in AI assistants (OpenAI Code Interpreter, GitHub Copilot patterns)

**Confidence level:**
HIGH — Pitfalls derived from:
1. Documented technical constraints (Daytona CLI, AI SDK 6, Neon Postgres free tier)
2. Known security principles (sandbox isolation, approval bypass prevention)
3. Standard integration challenges (stdio transport, process management)
4. Performance characteristics (database blob storage, JSONB limits)

**Key assumptions verified:**
- AI SDK 6 `parts` array stores tool calls in JSONB (confirmed in project context)
- Daytona uses CLI for MCP server (confirmed in milestone requirements)
- Guest mode = no authentication (confirmed in project context)
- Neon Postgres free tier used (confirmed in technical stack)

**Areas needing validation:**
- Exact Daytona resource limits (depends on configuration)
- Daytona network policy configuration options (verify during Phase 2)
- Neon connection pool size recommendations for serverless (test during Phase 1)
- AI SDK tool approval state persistence behavior (test during Phase 1)

---
*Pitfalls research for: Interactive Data Playground with Code Execution*
*Researched: 2026-01-31*
