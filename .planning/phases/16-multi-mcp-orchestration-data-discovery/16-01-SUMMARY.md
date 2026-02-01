---
phase: 16-multi-mcp-orchestration-data-discovery
plan: "01"
subsystem: ai-configuration
tags:
  - ai-sdk
  - claude-sonnet
  - system-prompts
  - dataset-discovery
  - anti-hallucination
requires:
  - 15-03-sandbox-lifecycle
provides:
  - claude-sonnet-4.5-default
  - dataset-discovery-prompt
  - schema-aware-generation
affects:
  - 16-02-tool-aggregation
  - 16-03-chat-endpoint
  - 20-chat-ui
tech-stack:
  added: []
  patterns:
    - anti-hallucination-prompts
    - schema-aware-code-generation
    - production-quality-standards
key-files:
  created: []
  modified:
    - docs/lib/ai/models.ts
    - docs/lib/ai/prompts.ts
decisions:
  - id: model-claude-sonnet-4.5
    what: Set claude-sonnet-4.5 as DEFAULT_CHAT_MODEL
    why: Superior tool calling reliability and multi-step reasoning for MCP orchestration
    alternatives: gemini-2.5-flash-lite (previous), claude-opus-4.5 (more capable but slower/expensive)
    impact: Phase 16 dataset discovery and code generation workflows optimized for Claude's tool calling strengths
  - id: unified-prompt
    what: Single datasetDiscoveryPrompt handles both discovery and code generation
    why: CONTEXT.md specified single general-purpose agent for Phase 16 scope
    alternatives: Separate prompts per workflow (deferred to future phases if specialization needed)
    impact: Simpler prompt management, cohesive workflow in single conversation
  - id: anti-hallucination-priority
    what: Enforce "always verify datasets from trusted sources" workflow
    why: Prevent AI from using unverified/hallucinated dataset names or URLs
    alternatives: Allow exploratory approach (too risky for production)
    impact: Users always get verified data.gv.at datasets, no 404 errors from hallucinated URLs
  - id: schema-prefetch-via-prompt
    what: System prompt instructs AI to call analyze_distribution_schema before pandas code
    why: More flexible than automatic prefetch, AI determines when schema needed
    alternatives: Automatic prefetch (less flexible), no schema check (error-prone)
    impact: AI generates pandas code with exact column names, prevents KeyError at runtime
metrics:
  duration: 2 minutes
  completed: 2026-02-01
---

# Phase 16 Plan 01: AI Model Configuration & Dataset Discovery Prompt Summary

**One-liner:** Claude Sonnet 4.5 default with anti-hallucination prompt enforcing search-first workflow and schema-aware production code generation

## What Was Done

### Task 1: Update Default Model to Claude Sonnet 4.5
**Commit:** 9ef5007

Updated `DEFAULT_CHAT_MODEL` constant from `google/gemini-2.5-flash-lite` to `anthropic/claude-sonnet-4.5`.

**Files modified:**
- `docs/lib/ai/models.ts` - Changed default model constant

**Rationale:** Phase 16 requires Claude Sonnet 4.5 for optimal tool calling and multi-step reasoning with dataset discovery and code generation workflows (AI-02 requirement from 16-RESEARCH.md). Gemini is fast but Claude Sonnet has superior tool calling reliability for MCP orchestration.

**Verification:** grep confirmed DEFAULT_CHAT_MODEL set to anthropic/claude-sonnet-4.5, chatModels array unchanged (users can still switch models via UI).

### Task 2: Create Unified Dataset Discovery System Prompt
**Commit:** 07fa15e

Added `datasetDiscoveryPrompt` export to `docs/lib/ai/prompts.ts` following Vercel ai-chatbot pattern.

**Files modified:**
- `docs/lib/ai/prompts.ts` - New datasetDiscoveryPrompt export (64 lines)

**Key features:**

1. **Anti-hallucination rules:**
   - ALWAYS call search_datasets tool before discussing any dataset
   - NEVER mention dataset names without first searching data.gv.at
   - VERIFY all dataset information from tool results, not assumptions

2. **Dataset discovery workflow:**
   - Call search_datasets with semantic query
   - Present results with quality metrics (completeness 0-100, freshness, publisher)
   - Ask user to confirm dataset selection
   - After confirmation, call analyze_distribution_schema

3. **Code generation workflow:**
   - MANDATORY: Call analyze_distribution_schema(distribution_id) first
   - Use EXACT column names (case-sensitive)
   - Generate production-quality Python code with type hints, docstrings, error handling
   - Handle missing values if completeness < 80%

4. **Quality metrics guidance:**
   - Completeness score interpretation
   - Freshness indicators
   - Publisher reliability (official sources preferred)

**Verification:** grep confirmed prompt contains CRITICAL ANTI-HALLUCINATION RULES, references search_datasets, analyze_distribution_schema, and analyze_dataset_quality tools. Single unified prompt handles both workflows per CONTEXT.md decision.

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

### Model Selection: Claude Sonnet 4.5
**Context:** Phase 16 requires reliable multi-step tool calling for dataset discovery → schema analysis → code generation workflows.

**Decision:** Use anthropic/claude-sonnet-4.5 as default (upgraded from gemini-2.5-flash-lite).

**Rationale:**
- Superior tool calling reliability (16-RESEARCH.md findings)
- Strong multi-step reasoning for orchestrating MCP tools
- Balance of speed, intelligence, cost (Opus more capable but slower/expensive)

**Impact:** Users get reliable dataset discovery and schema-aware code generation. Model configurable via UI if users prefer alternatives (Gemini for speed, Opus for complex analysis).

### Unified Prompt Architecture
**Context:** 16-CONTEXT.md specified single general-purpose agent for Phase 16, not multiple specialized agents.

**Decision:** Single datasetDiscoveryPrompt handles both discovery and code generation workflows.

**Rationale:**
- Simpler prompt management
- Cohesive workflow in single conversation (user doesn't switch agents)
- Future phases can introduce specialization if needed (progressive evolution)

**Alternatives considered:**
- Separate datasetDiscoveryPrompt and codeGenerationPrompt (more modular but adds complexity)
- Agent routing logic to switch prompts mid-conversation (deferred to future phases)

**Impact:** Phase 16 uses single prompt, easier to maintain and test. If specialization needed later (Phase 17+), can split into dedicated agents.

### Anti-Hallucination Priority
**Context:** AI training includes Austrian dataset names, risk of hallucinating non-existent datasets or outdated URLs.

**Decision:** Enforce "ALWAYS search first, NEVER assume dataset exists" workflow via critical rules in prompt.

**Rationale:**
- Prevents 404 errors from hallucinated dataset URLs
- Ensures users always get verified data.gv.at datasets
- Quality metrics (completeness, freshness) help users choose best dataset

**Alternatives considered:**
- Allow exploratory approach (let AI generate code with assumed datasets) - rejected as too risky for production
- Automatic dataset validation in tool wrapper - rejected as less transparent to users

**Impact:** Every dataset mentioned by AI is verified to exist in data.gv.at. Users see quality metrics before committing to analysis. No runtime errors from wrong dataset URLs.

### Schema-Aware Code Generation
**Context:** Pandas requires exact column names (case-sensitive). AI can't assume column names without schema discovery.

**Decision:** System prompt enforces "call analyze_distribution_schema before pandas code" workflow.

**Rationale:**
- More flexible than automatic prefetch (AI determines when schema needed)
- Uses exact column names from schema, prevents KeyError at runtime
- Handles data quality issues (missing values if completeness < 80%)

**Alternatives considered:**
- Automatic schema prefetch in tool wrapper - less flexible, fetches even when not needed
- No schema check - error-prone, generates code with assumed column names
- Fuzzy column matching fallback - added complexity, deferred to future if user feedback shows need

**Impact:** AI generates pandas code with exact column names, proper data type handling, and missing value strategies based on completeness score. Production-quality code with type hints, docstrings, error handling.

## Tech Stack

### Configuration Files
- `docs/lib/ai/models.ts` - Model defaults and available models list
- `docs/lib/ai/prompts.ts` - System prompts for AI workflows

### Patterns Established
- **Anti-hallucination prompts:** Critical rules enforcing tool-first verification
- **Schema-aware code generation:** Always fetch schema before writing pandas code
- **Production-quality standards:** Type hints, docstrings, error handling in generated code

## Integration Points

### Upstream Dependencies
- Phase 15-03: E2B sandbox infrastructure (execution environment for generated code)
- Phase 15-01: data.gv.at MCP client (provides search_datasets, analyze_distribution_schema tools)

### Downstream Dependencies
- Phase 16-02: Tool aggregation will expose MCP tools to AI with this prompt
- Phase 16-03: Chat endpoint will use datasetDiscoveryPrompt as system message
- Phase 20: Chat UI will display dataset search results and code execution

### Tool References
Prompt instructs AI to use these tools (provided by data.gv.at MCP server):
- `search_datasets` - Semantic dataset discovery
- `analyze_dataset_quality` - Quality metrics (completeness score 0-100)
- `analyze_distribution_schema` - Column names, types, completeness

## Testing & Verification

### Verification Steps Completed
1. ✅ grep confirmed DEFAULT_CHAT_MODEL = 'anthropic/claude-sonnet-4.5'
2. ✅ grep confirmed datasetDiscoveryPrompt export exists
3. ✅ grep confirmed CRITICAL ANTI-HALLUCINATION RULES present
4. ✅ grep confirmed search_datasets, analyze_distribution_schema, analyze_dataset_quality references
5. ✅ TypeScript compilation succeeded (npx tsc --noEmit)
6. ✅ Node module loading verified (DEFAULT_CHAT_MODEL accessible)
7. ✅ Single unified prompt confirmed (1 discovery workflow + 1 code generation workflow)

### Manual Testing Required
- **Model switching:** Verify UI can override DEFAULT_CHAT_MODEL with other models
- **Prompt effectiveness:** Test with sample queries ("Vienna air quality") to verify search-first workflow
- **Schema usage:** Verify AI calls analyze_distribution_schema before pandas code generation
- **Quality metrics:** Verify AI presents completeness scores when showing dataset results

### Blockers
- ❌ DATAGVAT_MCP_URL required for tool testing (FastMCP server deployment needed)
- ❌ E2B_API_KEY required for code execution testing (get from https://e2b.dev/dashboard)
- ❌ AI_GATEWAY_API_KEY required for Claude Sonnet access (Vercel AI Gateway setup)

## Next Phase Readiness

### Completed Deliverables
- ✅ AI model defaults configured (claude-sonnet-4.5)
- ✅ Dataset discovery prompt with anti-hallucination rules
- ✅ Schema-aware code generation workflow defined
- ✅ Production-quality code requirements documented
- ✅ Quality metrics guidance included

### Ready for Next Phase
Phase 16-02 (Tool Aggregation) can proceed:
- Model configuration complete
- System prompt ready for use in chat endpoint
- Tool references documented (search_datasets, analyze_distribution_schema, analyze_dataset_quality)

### Open Items
None - Phase 16-01 complete. Next phase will implement tool aggregation to expose MCP tools with this prompt.

## Performance

**Execution time:** 2 minutes
**Tasks completed:** 2/2
**Commits:** 2 (per-task commits)
**Files modified:** 2 (models.ts, prompts.ts)

---

*Phase: 16-multi-mcp-orchestration-data-discovery*
*Plan: 01*
*Completed: 2026-02-01*
*Subsystem: ai-configuration*
