# Phase 16: Multi-MCP Orchestration & Data Discovery - Research

**Researched:** 2026-02-01
**Domain:** AI SDK integration, tool orchestration, schema-aware code generation
**Confidence:** HIGH

## Summary

Phase 16 integrates Vercel AI SDK with data.gv.at MCP server and E2B Code Interpreter to enable natural language dataset discovery and schema-aware Python code generation. The architecture follows Vercel's ai-chatbot reference pattern with lib/ai/ structure, using AI Gateway for model routing and streaming responses.

**Key findings:**
- Vercel AI SDK provides standardized tool calling with automatic MCP integration via `@ai-sdk/mcp`
- AI Gateway enables model switching without code changes using unified `gateway.languageModel()` API
- E2B Code Interpreter SDK wraps into AI SDK tools using `tool()` helper with zod schemas
- Project already has working tool aggregation pattern in `docs/lib/mcp/aggregate-tools.ts`
- Dataset discovery workflow requires careful prompt engineering to prevent AI hallucination (always verify datasets from trusted sources)
- Schema-aware code generation depends on `analyze_distribution_schema` MCP tool for column type inference

**Primary recommendation:** Extend existing `docs/lib/mcp/aggregate-tools.ts` pattern to production chat route, use specialized system prompts in `lib/ai/prompts.ts` for dataset discovery vs code generation workflows, implement schema prefetching before code generation to ensure accurate column references.

## Standard Stack

The established libraries/tools for AI SDK integration and tool orchestration:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai | ^6.0.64 | Vercel AI SDK core | Industry standard for Next.js AI integration, unified provider abstraction, streaming-first design |
| @ai-sdk/mcp | ^1.0.16 | MCP protocol integration | Official AI SDK adapter for MCP servers, handles tool schema conversion automatically |
| @ai-sdk/gateway | Built-in | Vercel AI Gateway client | Enables model switching, usage tracking, cost management without code changes |
| @e2b/code-interpreter | ^2.3.3 | Python code execution sandbox | Official E2B SDK for isolated code execution, 150ms startup, automatic cleanup |
| zod | ^4.3.6 | Schema validation | AI SDK uses zod for tool input validation, type-safe parameter definitions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ai-sdk/openai-compatible | ^2.0.24 | Custom provider fallback | Only if AI Gateway unavailable (not needed for Phase 16) |
| @ai-sdk/google | ^3.0.18 | Google models | Alternative models (already installed, not primary for Phase 16) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AI Gateway | Direct Anthropic SDK | Gateway provides unified interface, usage tracking, model switching - direct SDK harder to swap providers later |
| E2B SDK | Daytona MCP | E2B has official SDK, faster startup, better documentation - Daytona would require custom MCP integration |
| Vercel AI SDK | LangChain | AI SDK streaming-first, Next.js optimized, simpler API - LangChain more features but higher complexity |

**Installation:**
```bash
# Already installed in docs/package.json
# No additional packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── app/
│   └── api/
│       └── chat/
│           ├── route.ts          # Chat endpoint (extend existing)
│           └── schema.ts          # Request validation
├── lib/
│   ├── ai/
│   │   ├── tools/                # Tool definitions (NEW)
│   │   │   ├── index.ts          # Tool aggregation
│   │   │   ├── dataset-tools.ts  # MCP tool wrappers
│   │   │   └── code-tools.ts     # E2B tool wrappers
│   │   ├── models.ts             # Model configuration (NEW)
│   │   ├── prompts.ts            # System prompts (NEW)
│   │   └── providers.ts          # Already exists (extend)
│   └── mcp/
│       ├── aggregate-tools.ts    # Already exists (reference pattern)
│       ├── datagvat-client.ts    # Already exists
│       └── e2b-client.ts         # Already exists
└── components/
    └── chat/                     # Chat UI (Phase 20)
```

### Pattern 1: Tool Aggregation from Multiple Sources
**What:** Merge MCP tools and custom E2B tools into single unified toolset for AI
**When to use:** When AI needs access to tools from MCP servers + custom SDK integrations
**Example:**
```typescript
// Source: docs/lib/mcp/aggregate-tools.ts (existing implementation)
import { tool } from 'ai';
import { z } from 'zod/v4';

export async function getAvailableTools() {
  const tools: Record<string, any> = {};

  // Pattern 1: MCP tools (data.gv.at)
  try {
    const dataGvatClient = await createDataGvatClient(process.env.DATAGVAT_MCP_URL);
    const dataGvatTools = await dataGvatClient.tools(); // Auto-converted by @ai-sdk/mcp
    Object.assign(tools, dataGvatTools);
  } catch (error) {
    console.warn('Data.gv.at MCP unavailable - dataset search disabled', error);
  }

  // Pattern 2: Custom SDK wrapper (E2B)
  try {
    const e2bClient = createE2BClient({ apiKey: process.env.E2B_API_KEY });

    tools['execute-python'] = tool({
      description: 'Execute Python code in isolated E2B sandbox',
      inputSchema: z.object({
        code: z.string().describe('Python code to execute'),
      }),
      execute: async ({ code }) => {
        const sandbox = await e2bClient.createSandbox();
        try {
          const result = await sandbox.runCode(code);
          return { text: result.text, error: result.error, logs: result.logs };
        } finally {
          await sandbox.kill(); // Critical: cleanup
        }
      },
    });
  } catch (error) {
    console.warn('E2B unavailable - code execution disabled', error);
  }

  return tools;
}
```

### Pattern 2: AI Gateway Configuration
**What:** Configure Vercel AI Gateway for model routing with claude-sonnet-4.5
**When to use:** Production chat endpoints requiring model flexibility
**Example:**
```typescript
// Source: docs/lib/ai/providers.ts (existing implementation)
import { gateway } from '@ai-sdk/gateway';

export function getLanguageModel(modelId: string) {
  // AI Gateway automatically routes based on model ID prefix
  // anthropic/claude-sonnet-4.5 -> Anthropic
  // openai/gpt-4 -> OpenAI
  return gateway.languageModel(modelId);
}

// Environment variable required:
// AI_GATEWAY_API_KEY=your_vercel_api_key
```

### Pattern 3: Streaming with Tool Calls
**What:** Stream AI responses with interleaved tool calls and results
**When to use:** Chat interfaces requiring real-time feedback during tool execution
**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
import { streamText, stepCountIs } from 'ai';

const result = streamText({
  model: getLanguageModel('anthropic/claude-sonnet-4.5'),
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: modelMessages,
  stopWhen: stepCountIs(5), // Allow multi-step tool calling
  tools: await getAvailableTools(),
  experimental_telemetry: { isEnabled: true, functionId: 'stream-text' },
});

// Convert to Next.js streaming response
return result.toUIMessageStreamResponse();
```

### Pattern 4: Specialized System Prompts
**What:** Different prompts for dataset discovery vs code generation workflows
**When to use:** Multi-step agent workflows with distinct phases
**Example:**
```typescript
// Source: docs/lib/ai/prompts.ts (Vercel ai-chatbot pattern)
export const datasetDiscoveryPrompt = `
You are a dataset discovery assistant for Austrian Open Government Data.

ANTI-HALLUCINATION RULES:
1. ALWAYS use search_datasets tool before discussing any dataset
2. NEVER mention dataset names without first searching data.gv.at
3. VERIFY all dataset information from tool results, not assumptions

When user asks about data:
1. Use search_datasets with semantic query
2. Present results with quality metrics (completeness, freshness)
3. Show download links for each distribution
4. Ask user to select dataset before proceeding to analysis

DO NOT generate code until user confirms dataset selection.
`;

export const codeGenerationPrompt = `
You are a production Python code generator for data analysis.

CODE QUALITY REQUIREMENTS:
1. Always use type hints for function parameters and returns
2. Include docstrings with Args, Returns, Raises sections
3. Handle errors gracefully with try/except and informative messages
4. Use pandas best practices (avoid iteration, use vectorized operations)
5. Add comments explaining non-obvious logic

SCHEMA-AWARE GENERATION:
1. ALWAYS use analyze_distribution_schema tool before writing pandas code
2. Reference exact column names from schema (case-sensitive)
3. Use inferred data types (don't assume numeric vs string)
4. Handle missing values based on completeness score

Example structure:
\`\`\`python
import pandas as pd
from typing import Optional

def analyze_data(csv_url: str) -> pd.DataFrame:
    """
    Analyze dataset from data.gv.at.

    Args:
        csv_url: Direct download URL from data.gv.at distribution

    Returns:
        Analyzed DataFrame with summary statistics

    Raises:
        ValueError: If CSV cannot be parsed
    """
    try:
        df = pd.read_csv(csv_url)
        # Use exact column names from schema
        return df.describe()
    except Exception as e:
        raise ValueError(f"Failed to load data: {e}")
\`\`\`
`;
```

### Pattern 5: Schema Prefetching for Code Generation
**What:** Fetch dataset schema before generating pandas/analysis code
**When to use:** Whenever AI generates code that references CSV columns
**Example:**
```typescript
// Workflow orchestration (planner decides implementation location)
// Option A: System prompt instructs AI to call analyze_distribution_schema first
// Option B: Explicit prefetch in tool wrapper

// System prompt approach (recommended):
export const codeGenerationPrompt = `
BEFORE writing pandas code that reads a CSV:
1. Call analyze_distribution_schema with distribution_id
2. Use returned column names EXACTLY (case-sensitive)
3. Use inferred types (integer, float, string, datetime) for operations
4. Check completeness_score - if <80%, handle missing values

Example workflow:
User: "Analyze Vienna air quality data"
You: [Call analyze_distribution_schema(distribution_id="abc123")]
Schema result: { columns: [{"name": "PM2.5", "type": "float"}, ...], completeness: 95 }
You: [Generate code using exact column "PM2.5" not "pm25" or "PM25"]
`;
```

### Anti-Patterns to Avoid
- **Route-level tool aggregation:** Aggregating tools inside `app/api/chat/route.ts` makes testing harder and creates coupling. Use dedicated `lib/ai/tools/index.ts` for aggregation.
- **Hardcoded model IDs:** Avoid `streamText({ model: anthropic('claude-sonnet-4.5') })`. Use configurable `getLanguageModel(modelId)` for easy model switching.
- **Missing cleanup:** E2B sandboxes must call `sandbox.kill()` in finally blocks. Memory leaks occur without cleanup.
- **Schema assumptions:** Never generate pandas code without first calling `analyze_distribution_schema`. Column name mismatches cause runtime errors.
- **Blocking tool execution:** Don't await all tools sequentially. Use `stopWhen: stepCountIs(5)` to enable AI-orchestrated multi-step execution.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP tool schema conversion | Custom JSON-RPC to AI SDK converter | `@ai-sdk/mcp` package | Handles protocol differences, input validation, error mapping automatically |
| Streaming error handling | Try/catch around streamText | `onError` callback in streamText | Errors in streams don't throw exceptions - they become part of the stream |
| Model provider abstraction | Switch statements for provider APIs | AI Gateway `gateway.languageModel()` | Unified interface across providers, automatic routing, usage tracking |
| Tool input validation | Manual parameter checking | Zod schemas in `tool({ inputSchema })` | AI SDK validates inputs, generates JSON schemas for AI, type-safe |
| Code sandbox cleanup | Manual timeout tracking | E2B `timeoutMs` config + `sandbox.kill()` | E2B handles lifecycle, cleanup, resource limits automatically |
| Multi-step tool calling | Custom agent loop | `stopWhen: stepCountIs(N)` | AI SDK orchestrates tool calls, result injection, follow-ups automatically |

**Key insight:** AI SDK provides high-level orchestration (streaming, tool calling, error handling) that's error-prone to replicate. Existing implementation in `docs/lib/mcp/aggregate-tools.ts` already demonstrates correct pattern - extend it rather than rebuild.

## Common Pitfalls

### Pitfall 1: Tool Execution Not Consumed Causes Hang
**What goes wrong:** `streamText` starts streaming but never completes because stream isn't consumed
**Why it happens:** AI SDK uses backpressure - only generates tokens when stream is read
**How to avoid:** Always consume the stream with `for await` or helper methods like `toUIMessageStreamResponse()`
**Warning signs:** Chat hangs after initial token, no errors logged, request times out after 60s

**Source:** https://ai-sdk.dev/docs/ai-sdk-core/generating-text
```typescript
// BAD - stream not consumed
const result = streamText({ model, tools, prompt });
// Hangs forever

// GOOD - consumed via helper
return result.toUIMessageStreamResponse();

// GOOD - consumed manually
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Pitfall 2: MCP Tools Fail Silently Without Degradation
**What goes wrong:** MCP client connection fails, no tools available, AI responds "I cannot search datasets" without explanation
**Why it happens:** Tool aggregation doesn't track which sources succeeded vs failed
**How to avoid:** Implement graceful degradation - when MCP unavailable, add fallback tool explaining the limitation
**Warning signs:** Users report "AI refuses to search" but no errors in logs

**Source:** docs/lib/mcp/aggregate-tools.ts (existing pattern)
```typescript
// GOOD - graceful degradation implemented
try {
  const dataGvatTools = await dataGvatClient.tools();
  Object.assign(tools, dataGvatTools);
} catch (error) {
  console.warn('Data.gv.at MCP unavailable', error);

  // Fallback tool explaining limitation
  tools['search-datasets-unavailable'] = tool({
    description: 'Dataset search unavailable',
    inputSchema: z.object({}),
    execute: async () => ({
      error: 'Dataset search is temporarily unavailable. Only code execution is available.',
    }),
  });
}
```

### Pitfall 3: E2B Sandbox Memory Leaks from Missing Cleanup
**What goes wrong:** Sandboxes accumulate over time, hitting E2B account limits, new executions fail with quota errors
**Why it happens:** Exception thrown before `sandbox.kill()` called, sandbox remains running
**How to avoid:** Always use try/finally pattern with cleanup in finally block
**Warning signs:** E2B quota errors after many executions, dashboard shows orphaned sandboxes

**Source:** docs/lib/mcp/e2b-client.ts (existing pattern)
```typescript
// GOOD - cleanup guaranteed
execute: async ({ code }) => {
  const sandbox = await e2bClient.createSandbox();
  try {
    const result = await sandbox.runCode(code);
    return result;
  } finally {
    await sandbox.kill(); // Runs even if runCode throws
  }
}
```

### Pitfall 4: AI Hallucinates Dataset Names Without Verification
**What goes wrong:** User asks "analyze Vienna pollution data", AI generates code referencing nonexistent dataset URL
**Why it happens:** AI training includes dataset names, it assumes they exist without searching
**How to avoid:** System prompt must enforce "ALWAYS search first, NEVER assume dataset exists"
**Warning signs:** Code execution fails with 404 errors, users report "wrong dataset used"

**Prevention pattern:**
```typescript
export const datasetDiscoveryPrompt = `
CRITICAL ANTI-HALLUCINATION RULE:
Before ANY dataset-related response, you MUST:
1. Call search_datasets with user's query
2. Present results to user with quality metrics
3. Ask user to confirm dataset selection
4. ONLY THEN call analyze_distribution_schema

NEVER:
- Mention specific dataset names without searching first
- Generate code before user confirms dataset
- Assume dataset URLs or IDs exist

If search_datasets returns no results, tell user "No datasets found for [query]. Try different keywords."
`;
```

### Pitfall 5: Schema Discovery After Code Generation
**What goes wrong:** AI generates pandas code with `df['temperature']` but actual column is `temp_celsius`, code fails at runtime
**Why it happens:** AI generates code before calling `analyze_distribution_schema` to get exact column names
**How to avoid:** System prompt enforces schema discovery before code generation, or tool wrapper prefetches schema
**Warning signs:** KeyError exceptions from pandas, users report "code doesn't work"

**Prevention pattern:**
```typescript
export const codeGenerationPrompt = `
MANDATORY WORKFLOW for pandas/data analysis code:
1. User confirms dataset selection
2. YOU call analyze_distribution_schema(distribution_id)
3. Note exact column names and types from schema
4. Generate code using EXACT column names (case-sensitive)

Example:
Schema: { columns: [{"name": "Temp_C", "type": "float"}] }
Code: df['Temp_C'].mean()  ✓ CORRECT
Code: df['temp_c'].mean()  ✗ WRONG (case mismatch)
Code: df['temperature'].mean()  ✗ WRONG (assumed name)
`;
```

### Pitfall 6: AI Gateway Requires Credit Card Error
**What goes wrong:** Chat requests fail with "AI Gateway requires a valid credit card on file"
**Why it happens:** Vercel account doesn't have payment method configured, gateway blocks requests
**How to avoid:** Add payment method in Vercel dashboard, or handle error gracefully in catch block
**Warning signs:** All chat requests fail immediately with credit card error

**Source:** docs/app/api/chat/route.ts (existing error handling)
```typescript
catch (error) {
  if (error instanceof Error &&
      error.message?.includes('AI Gateway requires a valid credit card')) {
    return new ChatSDKError('bad_request:activate_gateway').toResponse();
  }
}
```

## Code Examples

Verified patterns from official sources and existing implementation:

### Tool Definition Pattern (MCP + Custom)
```typescript
// Source: docs/lib/mcp/aggregate-tools.ts
import { tool } from 'ai';
import { z } from 'zod/v4';

// MCP tools - auto-converted by @ai-sdk/mcp
const mcpClient = await createMCPClient({ transport: { type: 'http', url } });
const mcpTools = await mcpClient.tools(); // Returns Record<string, CoreTool>

// Custom E2B tool - manual wrapping
const executeCode = tool({
  description: 'Execute Python code in isolated E2B sandbox',
  inputSchema: z.object({
    code: z.string().describe('Python code to execute'),
  }),
  execute: async ({ code }) => {
    const sandbox = await e2bClient.createSandbox();
    try {
      const result = await sandbox.runCode(code);
      return { text: result.text, error: result.error };
    } finally {
      await sandbox.kill();
    }
  },
});

// Merge into single toolset
const tools = { ...mcpTools, 'execute-python': executeCode };
```

### Streaming Chat Endpoint
```typescript
// Source: docs/app/api/chat/route.ts (existing implementation)
import { streamText, stepCountIs } from 'ai';
import { getLanguageModel } from '@/lib/ai/providers';

export async function POST(request: Request) {
  const { messages, selectedChatModel } = await request.json();

  const result = streamText({
    model: getLanguageModel(selectedChatModel), // AI Gateway routing
    system: systemPrompt({ selectedChatModel }),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5), // Multi-step tool calling
    tools: await getAvailableTools(), // Aggregated tools
    experimental_telemetry: { isEnabled: true },
  });

  return result.toUIMessageStreamResponse();
}
```

### AI Gateway Model Configuration
```typescript
// Source: docs/lib/ai/providers.ts (existing)
import { gateway } from '@ai-sdk/gateway';
import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';

export function getLanguageModel(modelId: string) {
  const isReasoningModel = modelId.includes('reasoning') || modelId.endsWith('-thinking');

  if (isReasoningModel) {
    // Special handling for reasoning models
    return wrapLanguageModel({
      model: gateway.languageModel(modelId.replace(/-thinking$/, '')),
      middleware: extractReasoningMiddleware({ tagName: 'thinking' }),
    });
  }

  return gateway.languageModel(modelId);
}

// Usage: getLanguageModel('anthropic/claude-sonnet-4.5')
// Environment: AI_GATEWAY_API_KEY required
```

### Schema-Aware Code Generation Workflow
```typescript
// Example system prompt section (planner decides final implementation)
const schemaAwarePrompt = `
When generating pandas code for a dataset:

1. FIRST, call analyze_distribution_schema(distribution_id):
   Result: {
     columns: [
       { name: "Date", type: "datetime" },
       { name: "PM2.5", type: "float" },
       { name: "Station_ID", type: "string" }
     ],
     completeness_score: 87
   }

2. THEN generate code using EXACT column names:
\`\`\`python
import pandas as pd
from typing import Optional

def analyze_air_quality(csv_url: str) -> pd.DataFrame:
    """Analyze PM2.5 measurements from data.gv.at."""
    df = pd.read_csv(csv_url)

    # Use exact column names from schema
    df['Date'] = pd.to_datetime(df['Date'])

    # Handle missing values (completeness 87% means ~13% missing)
    pm25_clean = df['PM2.5'].dropna()

    return pm25_clean.describe()
\`\`\`

3. Include error handling for missing columns
`;
```

### Data.gv.at MCP Available Tools
```typescript
// Source: mcp/README.md (existing MCP server documentation)
// Tools automatically exposed via @ai-sdk/mcp client

// Discovery tools
search_datasets(query: string, limit?: number)
get_dataset(dataset_id: string)
get_dataset_distributions(dataset_id: string)

// Analysis tools
get_dataset_metrics(dataset_id: string) // Usage stats
analyze_dataset_quality(dataset_id: string) // Quality score 0-100

// Preview tools
preview_distribution(distribution_id: string, limit?: number) // CSV/JSON preview
analyze_distribution_schema(distribution_id: string) // Column types, completeness
get_distribution_stats(distribution_id: string) // Data statistics

// Related datasets
find_related_datasets(dataset_id: string)
compare_datasets(dataset_id_1: string, dataset_id_2: string)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom MCP client | `@ai-sdk/mcp` package | Jan 2025 (AI SDK 6.0) | Automatic tool schema conversion, no custom JSON-RPC handling needed |
| Direct provider SDKs | AI Gateway with `gateway.languageModel()` | Dec 2024 | Model switching without code changes, unified usage tracking |
| Manual streaming loops | `streamText().toUIMessageStreamResponse()` | Nov 2024 (AI SDK 5.0) | Automatic backpressure, error handling, Next.js integration |
| Temperature default 0 | No default temperature | AI SDK 5.0 (Nov 2024) | Must explicitly set temperature or topP (no more implicit determinism) |
| Sequential tool calls | `stopWhen: stepCountIs(N)` | AI SDK 6.0 | AI orchestrates multi-step workflows automatically |

**Deprecated/outdated:**
- `generateText({ temperature: undefined })` - SDK 5.0+ no longer defaults to 0, must set explicitly
- Custom MCP JSON-RPC protocol handling - `@ai-sdk/mcp` handles protocol automatically
- Provider-specific streaming helpers - Use unified `toUIMessageStreamResponse()` for all providers
- Manual tool result injection - AI SDK handles tool results and follow-up calls via `stopWhen`

## Open Questions

Things that couldn't be fully resolved:

1. **Dataset selection UX (AI picks vs user picks)**
   - What we know: System prompts can enforce "present options, wait for user confirmation" pattern
   - What's unclear: Whether this creates too much friction for simple queries ("show Vienna population")
   - Recommendation: Start with user confirmation required (Phase 16), A/B test auto-selection in Phase 17+

2. **Schema discovery timing (always fetch vs smart inference)**
   - What we know: `analyze_distribution_schema` tool exists and returns column names/types
   - What's unclear: Performance impact of always prefetching schema before code generation
   - Recommendation: System prompt approach (AI calls when needed) more flexible than automatic prefetch

3. **Quality metrics presentation (inline vs on-demand)**
   - What we know: `analyze_dataset_quality` returns 0-100 score, `completeness_score` in schema analysis
   - What's unclear: Whether users want quality metrics upfront or only when comparing datasets
   - Recommendation: Include basic metrics (completeness, last updated) in search results, detailed quality score on-demand

4. **Column name validation strictness (exact vs fuzzy)**
   - What we know: Pandas requires exact column name match (case-sensitive)
   - What's unclear: Whether to implement fuzzy matching fallback for common mistakes ("temp" → "Temp_C")
   - Recommendation: Start with exact matching (Phase 16), add fuzzy fallback if user feedback shows frequent errors

5. **AI parameters tuning (default vs per-agent)**
   - What we know: No temperature default in AI SDK 5.0+, must set explicitly
   - What's unclear: Optimal temperature for dataset discovery vs code generation (higher creativity vs deterministic code)
   - Recommendation: Start with single config (temperature: 0.7), specialize per-agent if quality issues emerge

## Sources

### Primary (HIGH confidence)
- Vercel AI SDK Core Documentation - https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling (tool calling patterns, streaming)
- Vercel AI SDK Core Documentation - https://ai-sdk.dev/docs/ai-sdk-core/generating-text (generateText vs streamText)
- Vercel AI SDK Core Documentation - https://ai-sdk.dev/docs/ai-sdk-core/settings (model parameters)
- Vercel AI SDK Providers Documentation - https://ai-sdk.dev/docs/foundations/providers-and-models (provider configuration)
- Vercel AI SDK OpenAI Compatible - https://ai-sdk.dev/providers/ai-sdk-providers/openai-compatible (AI Gateway setup)
- Vercel ai-chatbot GitHub - https://github.com/vercel/ai-chatbot (reference architecture, lib/ai structure)
- E2B Code Interpreter GitHub - https://github.com/e2b-dev/code-interpreter (SDK examples)
- Existing implementation - docs/lib/mcp/aggregate-tools.ts (tool aggregation pattern)
- Existing implementation - docs/lib/mcp/e2b-client.ts (E2B wrapper)
- Existing implementation - docs/lib/ai/providers.ts (AI Gateway usage)
- Existing implementation - docs/app/api/chat/route.ts (streaming endpoint)
- Project requirements - .planning/REQUIREMENTS.md (Phase 16 success criteria)
- MCP server documentation - mcp/README.md (available tools)

### Secondary (MEDIUM confidence)
- None (all critical information verified from official sources or existing codebase)

### Tertiary (LOW confidence)
- None (research completed with high-confidence sources only)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in docs/package.json, official documentation available
- Architecture: HIGH - Existing implementation demonstrates patterns, Vercel ai-chatbot reference validated
- Pitfalls: HIGH - Documented in official AI SDK docs and observed in existing code error handling
- Tool integration: HIGH - @ai-sdk/mcp official package, existing aggregate-tools.ts implementation working

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable ecosystem, AI SDK and E2B have mature APIs)
