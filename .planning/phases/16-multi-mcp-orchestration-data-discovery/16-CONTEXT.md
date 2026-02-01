# Phase 16: Multi-MCP Orchestration & Data Discovery - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

AI coordinates tools from both data.gv.at MCP server and E2B Code Interpreter (via custom tools), enabling users to discover Austrian datasets through natural language and generate schema-aware Python code for analysis. This phase establishes the foundation for chat-based data exploration.

**Scope:** Tool aggregation, AI Gateway integration, dataset discovery workflows, and schema-aware code generation. Visualization rendering and approval flows are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Architecture Foundation
- **Single MCP server**: data.gv.at via HTTP transport (from Phase 15)
- **E2B integration**: Direct SDK usage with custom AI SDK tool wrappers (not MCP)
- **Reference architecture**: Follow Vercel ai-chatbot patterns (lib/ai/ structure)
  - lib/ai/tools/ for tool definitions
  - lib/ai/models.ts for model configuration
  - lib/ai/prompts.ts for agent system prompts

### Tool Presentation to AI
- **Unified toolset**: AI receives clean, merged tool list from data.gv.at MCP + custom E2B tools
- **No prefixing**: Tools presented as single cohesive toolset without source labels
- **Tool aggregation**: Implementation location decided by planner (lib/ai/tools/ or /api/chat route)

### Dataset Discovery Flow
- **Anti-hallucination priority**: Always verify data from trusted sources before analysis
- **Search workflow**: Implementation must prevent AI from using unverified or hallucinated data
- **Quality metrics**: Planner decides how to surface completeness/freshness data
- **Dataset selection**: Planner decides whether AI auto-picks or presents options to user
- **Download links**: Planner decides presentation (always show, on-demand, styled UI)

### Schema-Aware Code Generation
- **Schema discovery**: Planner decides approach (always fetch, exploratory iteration, or smart inference)
- **Missing schema handling**: Planner decides fallback strategy (discovery code, ask user, best-effort)
- **Code quality**: Generate **production-quality** Python code with error handling, type hints, docstrings
- **Column name handling**: Planner decides validation approach (exact, fuzzy, or validation with fallback)

### AI Gateway Configuration
- **Model selection**: Configurable via lib/ai/models.ts (support switching between Claude models dynamically)
- **Initial model**: claude-sonnet-4.5 (can change via config, not hardcoded)
- **System prompts**: Specialized prompts per agent type in lib/ai/prompts.ts (following Vercel pattern)
- **Agent architecture**: Planner decides single general-purpose vs specialized agents for Phase 16 scope
- **AI parameters**: Planner decides temperature/maxTokens configuration approach (default, task-specific, or per-agent)

### Claude's Discretion
- Error handling strategy (descriptive errors vs silent degradation vs proactive status)
- Tool context verbosity (brief vs detailed workflow guide vs tool descriptions only)
- MCP client lifecycle management (singleton vs per-request vs connection pooling)
- E2B tool wrapper implementation details
- Exact tool aggregation location (route vs dedicated endpoint)
- Directory structure (pure Vercel pattern vs hybrid MCP/AI separation)
- Schema discovery implementation approach
- Missing schema fallback strategy
- Column name validation approach
- Dataset selection UX (AI picks vs user picks)
- Download link presentation
- Quality metrics presentation
- Agent specialization scope (single vs multiple agents in Phase 16)
- AI parameter tuning strategy

</decisions>

<specifics>
## Specific Ideas

**Reference implementations:**
- Vercel ai-chatbot structure: https://github.com/vercel/ai-chatbot
  - lib/ai/tools/ — tool definitions
  - lib/ai/models.ts — model configuration
  - lib/ai/prompts.ts — agent system prompts

**Key architectural inputs from Phase 15:**
- One MCP server (data.gv.at via HTTP), not two
- E2B is direct SDK integration with custom tools, not MCP
- This simplifies multi-MCP orchestration significantly

**Code quality requirement:**
- Production-quality Python code (error handling, type hints, docstrings)
- Not exploratory/quick scripts

**Anti-hallucination priority:**
- System must prevent AI from using unverified data sources
- Always verify datasets come from data.gv.at trusted sources

**Model flexibility:**
- AI Gateway allows easy model switching
- Configuration-driven, not hardcoded
- Start with claude-sonnet-4.5

</specifics>

<deferred>
## Deferred Ideas

**Enhanced E2B capabilities** — Phase 17 or later
- Currently only runCode is supported (simple tasks)
- E2B offers much more flexibility: file system ops, multi-file projects, longer sessions
- Research opportunity: Investigate E2B advanced features for complex workflows, better DX/UX
- Consider dedicated phase for E2B feature expansion

**Visualization rendering** — Phase 19
- Inline chart display, base64 extraction, preview URLs

**Tool approval flow** — Phase 18
- User approval dialog before code execution
- Security layer for execution state tracking

**Multi-agent evolution** — Future phase
- Phase 16 establishes foundation
- Consider specialized agents (dataset-discovery, code-generation, visualization) in future iterations
- Progressive specialization approach

</deferred>

---

*Phase: 16-multi-mcp-orchestration-data-discovery*
*Context gathered: 2026-02-01*
