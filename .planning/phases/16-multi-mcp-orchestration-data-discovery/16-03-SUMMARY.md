---
phase: 16-multi-mcp-orchestration-data-discovery
plan: 03
subsystem: api
tags: [ai-sdk, message-persistence, drizzle-orm, streaming, tool-execution, nextjs-api-routes]

# Dependency graph
requires:
  - phase: 14-03
    provides: Message CRUD operations with cursor pagination and JSONB parts storage
  - phase: 16-01
    provides: MCP client infrastructure (data.gv.at + E2B)
  - phase: 16-02
    provides: Tool aggregation combining data.gv.at and E2B tools
provides:
  - Chat route with full message persistence (load history + save on finish)
  - Conversation continuity across sessions with tool interaction history
  - AI SDK onFinish integration for saving text, tool_calls, and tool_results
  - Automatic conversation creation on first message
affects: [Phase 18 (approval flow needs persisted tool calls), Phase 19 (image extraction from persisted results), Phase 20 (chat UI loads conversation history)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Load conversation history before streaming (getMessages → merge with new messages)"
    - "onFinish callback pattern for post-stream persistence"
    - "Graceful persistence failures (don't break streaming)"
    - "Tool interaction preservation in JSONB parts array"

key-files:
  created: []
  modified:
    - docs/app/api/chat/route.ts
    - docs/app/api/chat/schema.ts

key-decisions:
  - "Load historical messages and merge with new messages before AI processing"
  - "Use onFinish callback to save messages after stream completes"
  - "Convert AI SDK StepResult (text, toolCalls, toolResults) to MessagePart JSONB format"
  - "Create conversation automatically on first message if no conversationId provided"
  - "Wrap persistence in try/catch to continue stream even if save fails"
  - "Note: User prefers UUIDs over serial IDs for future phases (security + Vercel compatibility)"

patterns-established:
  - "Message persistence pattern: load at start, save in onFinish, never block streaming"
  - "Tool interaction preservation: toolCalls with input, toolResults with output"
  - "Graceful degradation: log persistence errors, continue serving user"

# Metrics
duration: 30min
completed: 2026-02-01
---

# Phase 16 Plan 03: Chat Persistence Integration Summary

**Chat route with full message persistence - conversations load from database, stream responses, and save tool interactions in JSONB parts array**

## Performance

- **Duration:** 30 min
- **Started:** 2026-02-01T09:20:32Z
- **Completed:** 2026-02-01T09:51:08Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Conversation history loads from database before AI processing (50 messages via cursor pagination)
- User messages and assistant responses save after stream completes via onFinish callback
- Tool calls and tool results preserved in JSONB parts array (toolName, input/output, toolCallId)
- Automatic conversation creation on first message when no conversationId provided
- Graceful error handling ensures persistence failures don't break streaming experience

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify Phase 14 message persistence functions exist** - `e55e9b5` (chore)
2. **Task 2: Implement message persistence in chat route** - `df066b0` (feat)
3. **Task 3: Human verification checkpoint** - `cd8d806` (chore)

## Files Created/Modified
- `docs/app/api/chat/route.ts` - Integrated getMessages (load history), createMessage (save in onFinish), createConversation (auto-create)
- `docs/app/api/chat/schema.ts` - Added conversationId field (optional for first message)

## Decisions Made

**1. Load conversation history before AI processing**
- Call getMessages(conversationId, 50) at request start to load historical messages
- Convert database messages to UI message format with parts array
- Merge historical messages with new user message before convertToModelMessages
- Enables AI to maintain context across sessions

**2. Save messages in onFinish callback**
- Use AI SDK's onFinish callback with { text, toolCalls, toolResults } destructuring
- Save user message first (from uiMessages array)
- Convert StepResult to MessagePart format:
  - text → { type: 'text', text }
  - toolCalls → { type: 'tool-call', toolCallId, toolName, args: input }
  - toolResults → { type: 'tool-result', toolCallId, toolName, result: output }
- Save assistant response with all parts
- Pattern ensures tool interactions preserved for replay attack prevention (Phase 18)

**3. Automatic conversation creation**
- If no conversationId in request, create new conversation in onFinish
- Default title: "New Conversation"
- Simplifies client logic (no need to create conversation before first message)

**4. Graceful persistence failures**
- Wrap all createMessage calls in try/catch
- Log errors but don't throw (stream continues even if database unavailable)
- User experience preserved even during database outages

**5. Type mapping from AI SDK to MessagePart**
- AI SDK StepResult uses `input` and `output` properties
- MessagePart uses `args` and `result` properties
- Cast input to `Record<string, unknown>` for type compatibility

**6. User preference noted: UUIDs for future phases**
- Current implementation uses serial IDs (Phase 14 schema decision)
- User prefers UUIDs for better security (non-enumerable) and Vercel compatibility
- Action item for future schema migration (not blocking Phase 16)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. TypeScript compilation errors during implementation**
- **Issue:** Initial implementation imported non-existent `CoreMessage` type from AI SDK
- **Resolution:** Removed import, used UI message format for database message conversion
- **Issue:** Accessed `response.text`, `response.toolCalls`, `response.toolResults` (wrong object structure)
- **Resolution:** Used correct onFinish signature: `({ text, toolCalls, toolResults })`
- **Issue:** Used `toolCall.args` and `toolResult.result` (wrong property names)
- **Resolution:** Changed to `toolCall.input` and `toolResult.output` per AI SDK types
- **Verification:** TypeScript compilation passes with no errors in chat route

## User Setup Required

None - uses existing Phase 14 database infrastructure (DATABASE_URL, BETTER_AUTH_SECRET).

## Next Phase Readiness

**Ready for Phase 18 (Approval Flow & Security):**
- Tool calls persisted with toolCallId, toolName, and input args
- Tool results persisted with output data
- execution_status column ready for approval workflow (pending → approved → executed)
- Replay attack prevention enabled via execution_status checks

**Ready for Phase 19 (Image Extraction):**
- Tool results stored in JSONB parts array
- Can extract image data from Python execution results
- uploadImageFromBase64 ready to convert base64 to Blob URLs

**Ready for Phase 20 (Chat UI):**
- getMessages API loads conversation history with all message types
- Cursor pagination supports infinite scroll (50 messages/page)
- Tool calls and tool results render in message stream

**Integration verified:**
- User confirmed messages persist across page refreshes
- Tool interactions preserved in database
- JSONB parts array contains text, tool-call, and tool-result entries

**User feedback:**
- Current implementation works correctly for Phase 16 goals
- Future improvement: Migrate to UUIDs for conversationId/messageId (better security, Vercel compatibility)

---
*Phase: 16-multi-mcp-orchestration-data-discovery*
*Completed: 2026-02-01*
