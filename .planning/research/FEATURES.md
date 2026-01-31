# Feature Landscape: Interactive Data Playground (v2.2)

**Domain:** Interactive data playground for dataset exploration
**Researched:** 2026-01-31
**Confidence:** HIGH (verified with Jupyter, Colab, Observable, Hex patterns + AI SDK + MCP integration)

## Executive Summary

v2.2 adds an interactive data playground where users chat with AI to explore Austrian open datasets, execute Python code in sandboxes, create visualizations, and persist sessions. This is distinct from the existing docs RAG chat at `/try` (which answers questions about documentation).

**Core value:** Users ask "show me pollution trends in Vienna" → AI finds datasets via MCP tools → generates Python code with real data → executes in Daytona sandbox → displays charts inline in chat.

**Key architectural decisions:**
1. **Two-chat architecture:** Separate `/playground` (data exploration) from `/try` (docs Q&A)
2. **MCP multi-server orchestration:** Route tool calls between data.gv.at MCP (discovery) and Daytona MCP (execution)
3. **User approval required:** Never auto-execute code without explicit user consent (security best practice)
4. **Guest mode only:** No auth in v1, defer user accounts to v3.0
5. **Context-aware code generation:** AI sees dataset schema/preview before generating code

**Existing strengths to leverage:**
- 25 MCP tools for Austrian dataset discovery already built and working
- Documentation site infrastructure (Next.js, Vercel AI SDK already integrated at `/try`)
- Neon Postgres + Drizzle ORM can be added incrementally
- `/try` page demonstrates MCP tool integration patterns

## Table Stakes

Features users expect from interactive data playgrounds. Missing these = product feels incomplete.

### Core Chat Interface

| Feature | Why Expected | Complexity | User Value | Dependencies |
|---------|--------------|------------|------------|--------------|
| **Multi-turn conversation** | Users ask follow-up questions without repeating context | LOW | HIGH | AI SDK useChat hook |
| **Message persistence** | Return to previous explorations across sessions | MEDIUM | HIGH | Neon Postgres + Drizzle |
| **Streaming responses** | See AI thinking/generating code in real-time | LOW | MEDIUM | AI SDK streaming (already works in /try) |
| **Loading states** | Clear feedback during code execution (5-30s) | LOW | HIGH | AI SDK message state |
| **Error handling** | Code fails often; show clear, actionable errors | MEDIUM | HIGH | Sandbox error formatting |
| **Conversation history UI** | See past messages in sidebar or scrollable area | LOW | MEDIUM | React state + database query |

### Code Execution

| Feature | Why Expected | Complexity | User Value | Dependencies |
|---------|--------------|------------|------------|--------------|
| **Sandbox isolation** | Never run untrusted code in production environment | HIGH | CRITICAL | Daytona MCP integration |
| **User approval dialog** | Explicit consent before executing any code | LOW | CRITICAL | AI SDK experimental_needsApproval |
| **Code syntax highlighting** | Display generated code readably | LOW | MEDIUM | Shiki or Prism.js |
| **Execution timeout** | Prevent infinite loops/resource abuse | LOW | HIGH | Sandbox 30s timeout |
| **Python data libraries** | pandas, numpy, matplotlib expected pre-installed | MEDIUM | HIGH | Sandbox template config |
| **Standard output capture** | Show print() statements and console logs | MEDIUM | MEDIUM | Sandbox stdout piping |

### Visualization

| Feature | Why Expected | Complexity | User Value | Dependencies |
|---------|--------------|------------|------------|--------------|
| **Inline chart rendering** | Charts appear in chat, not as downloads | MEDIUM | HIGH | Base64 image encoding |
| **Multiple plot types** | Line, bar, scatter, histograms expected | LOW | MEDIUM | matplotlib/seaborn in sandbox |
| **Reasonable defaults** | Charts are readable without tweaking | LOW | MEDIUM | AI prompt engineering |
| **Image display** | Render base64 PNG/JPG in message bubbles | LOW | HIGH | React img with data URI |

### Dataset Integration

| Feature | Why Expected | Complexity | User Value | Dependencies |
|---------|--------------|------------|------------|--------------|
| **Natural language discovery** | "pollution data" → AI finds relevant datasets | HIGH | HIGH | MCP search tools + LLM |
| **Dataset metadata in context** | AI sees schema before generating code | HIGH | HIGH | MCP preview tools → LLM context |
| **Data loading in sandbox** | Bridge MCP results to sandbox environment | HIGH | HIGH | Pass URLs or inline data to code |
| **Quality indicators** | Show data completeness/freshness before exploration | LOW | MEDIUM | MCP quality tools |

## Differentiators

Features that set this playground apart. Not expected, but create competitive advantage.

### MCP-Powered Discovery

| Feature | Value Proposition | Complexity | User Value | Priority |
|---------|-------------------|------------|------------|----------|
| **60,000+ Austrian datasets** | No other playground has this corpus pre-integrated | MEDIUM | HIGH | P0 |
| **Smart dataset ranking** | Quality scores + semantic relevance | HIGH | HIGH | P1 |
| **Bilingual search** | German/English queries work equally well | LOW | HIGH | P0 |
| **Domain-specific tools** | DOI eligibility, theme exploration, publisher filtering | MEDIUM | MEDIUM | P1 |
| **Related dataset suggestions** | "Users who viewed X also explored Y" | LOW | MEDIUM | P2 |

**Example flow:**
```
User: "Show me recent air quality data for Vienna"
  → AI calls search_datasets(query="air quality Vienna", theme="Umwelt", location="Wien")
  → AI calls analyze_quality(dataset_id="...") to check completeness
  → AI calls preview_data(distribution_id="...") to inspect schema
  → AI generates code: pd.read_csv(url), plot PM2.5 over time
  → User approves execution
  → Chart displays inline
```

### Context-Aware Code Generation

| Feature | Value Proposition | Complexity | User Value | Priority |
|---------|-------------------|------------|------------|----------|
| **Schema-aware code** | Generates correct column names from actual data | HIGH | HIGH | P0 |
| **Data type handling** | Knows if date column is string/datetime | HIGH | MEDIUM | P1 |
| **Error recovery** | Re-generates code when execution fails | MEDIUM | HIGH | P1 |
| **Incremental exploration** | Builds on previous code in conversation | MEDIUM | HIGH | P0 |
| **Best practices** | Handles missing values, scales axes appropriately | MEDIUM | MEDIUM | P2 |

**Why this matters:** Generic code playgrounds generate `df['column']` that fails. We generate `df['PM25_Mittelwert']` because AI saw the actual schema.

### Two-Chat Architecture

| Feature | Value Proposition | Complexity | User Value | Priority |
|---------|-------------------|------------|------------|----------|
| **Separate docs/data interfaces** | Different mental models (Q&A vs exploration) | MEDIUM | HIGH | P0 |
| **Different system prompts** | Docs assistant vs data analyst personas | LOW | MEDIUM | P0 |
| **Different tool routing** | /try uses no MCP tools, /playground uses 25+ | HIGH | HIGH | P0 |
| **Clear visual distinction** | Page headers, placeholders, colors differ | LOW | MEDIUM | P1 |

**Current state:**
- `/try` → Docs RAG chat (already exists, uses Vectra + OpenAI)
- `/playground` → Data exploration (new, uses MCP + Daytona)

**Critical:** Don't try to combine these interfaces. Users doing "How do I search datasets?" (docs) vs "Show me health data" (exploration) have different intents.

### Security-First Design

| Feature | Value Proposition | Complexity | User Value | Priority |
|---------|-------------------|------------|------------|----------|
| **Approval required** | No competitor requires explicit user consent | LOW | HIGH | P0 |
| **Code preview** | See exact code before execution | LOW | HIGH | P0 |
| **Sandbox audit logs** | Track what was executed when | MEDIUM | LOW | P3 |
| **Resource limits** | 30s timeout, memory caps | LOW | HIGH | P1 |
| **No persistent storage** | Sandbox is ephemeral, data doesn't leak | LOW | MEDIUM | P1 |

**Why this matters:** Jupyter/Colab auto-execute cells. ChatGPT auto-executes code. We require explicit approval → builds trust for enterprise use cases.

## Anti-Features

Features to deliberately NOT build. Common mistakes that bloat scope without user value.

### Anti-Feature 1: Real-Time Collaboration

**What:** Multiple users editing same conversation simultaneously
**Why NOT:**
- Exploratory data analysis is single-user by nature (individual hypotheses, trial-and-error)
- Requires WebSocket infrastructure, conflict resolution, presence indicators
- Auth required (who owns the conversation?)
- No competitor offers this (Jupyter/Colab have static sharing, not real-time co-editing)

**What to do instead:**
- Guest mode: One user per conversation
- Export conversation to .ipynb for sharing offline
- Defer collaboration to v3.0+ if user demand materializes

### Anti-Feature 2: Dashboard Builder

**What:** Drag-and-drop interface to arrange charts into dashboards
**Why NOT:**
- Different product paradigm (chat-first vs drag-and-drop)
- Requires state management for dashboard layouts, chart configurations
- Observable/Hex already do this well; we'd be playing catch-up
- Increases complexity 3x for marginal v1 value

**What to do instead:**
- Focus on exploratory chat interface (our differentiator)
- Generate good standalone visualizations
- Defer dashboards to v2.3+ or separate product if demand exists

### Anti-Feature 3: Multiple Programming Languages

**What:** Support R, Julia, JavaScript sandboxes
**Why NOT:**
- Each language needs different sandbox template, library ecosystem, runtime
- 95% of data analysis happens in Python (pandas, matplotlib are standard)
- Increases testing surface 3x
- Complicates MCP integration (different APIs for loading data)

**What to do instead:**
- Python-only for v1 (covers vast majority of use cases)
- If users demand R, add in v2.3+ as separate sandbox template
- Document how to export data for use in other tools

### Anti-Feature 4: Unlimited Execution Time

**What:** Let code run for 5+ minutes without timeout
**Why NOT:**
- Resource abuse risk on free tier (crypto mining, denial of service)
- Poor UX (user waiting 5 minutes doesn't know if code is stuck)
- Cost explosion (Daytona sandbox costs scale with time)
- No feedback mechanism (progress bars require code instrumentation)

**What to do instead:**
- 30-second timeout for v1 (covers 95% of exploratory queries)
- Clear error message: "Execution timed out. Try sampling the dataset."
- Defer long-running jobs to v2.4+ with queue system and email notifications

### Anti-Feature 5: Public Sharing with URLs

**What:** Share conversation via public link like Observable notebooks
**Why NOT:**
- Requires auth (who owns the conversation? who can edit?)
- Storage costs (who pays to host public conversations?)
- Moderation (spam, inappropriate content, GDPR)
- Privacy (user might share sensitive queries accidentally)

**What to do instead:**
- Export to .ipynb (user controls where to share)
- "Copy conversation" button (paste into email/Slack)
- Defer public sharing to v2.3+ when auth exists

### Anti-Feature 6: Interactive Widgets

**What:** Sliders, dropdowns to adjust parameters like Jupyter widgets
**Why NOT:**
- Doesn't fit chat paradigm (widget state vs conversation history)
- Complex state management (widget values ↔ code ↔ outputs)
- Implementation complexity (need widget library, state sync, re-execution logic)
- Chat-based re-generation is simpler: "Now show me for year 2023"

**What to do instead:**
- Re-run with new parameters via new message
- AI generates modified code based on conversation history
- Keeps interaction model simple (chat, not GUI)

### Anti-Feature 7: Data Upload

**What:** Let users upload their own CSV/Excel files
**Why NOT:**
- Storage required (where do files go? how long?)
- Privacy/security (PII in uploaded data? malicious files?)
- Scope creep (we're about Austrian open data discovery, not generic analysis)
- Competes with Jupyter/Colab who do this better

**What to do instead:**
- Focus on 60,000+ Austrian datasets (our differentiator)
- Document how to use Jupyter for private data analysis
- If upload is critical, defer to v3.0+ with auth and storage strategy

## Feature Dependencies

```
Foundation (Existing v2.1):
├── Next.js documentation site
├── Vercel AI SDK (already used in /try)
├── 25 MCP tools for data.gv.at
├── /try page demonstrates tool integration
└── Neon Postgres + Drizzle ORM (new addition)

Chat Interface:
├── Depends on: AI SDK useChat hook (exists)
├── Depends on: Neon Postgres (new)
├── Depends on: Drizzle ORM (new)
├── Enables: Conversation history
└── Enables: Multi-turn exploration

Code Execution:
├── Depends on: Daytona MCP integration (new)
├── Depends on: User approval dialog (new)
├── Depends on: Sandbox configuration (new)
├── Requires: Chat interface (for displaying code)
└── Enables: Visualization rendering

Visualization:
├── Depends on: Code execution (generates images)
├── Depends on: Base64 encoding in sandbox
├── Depends on: React image rendering
└── Independent of: Dataset discovery (can render any image)

Dataset Integration:
├── Depends on: Existing 25 MCP tools (exists)
├── Depends on: Multi-server MCP orchestration (new)
├── Depends on: Tool call routing logic (new)
├── Enhances: Code generation (provides context)
└── Enables: Austrian data focus (differentiator)

Two-Chat Architecture:
├── Depends on: Different routes (/try vs /playground)
├── Depends on: Different system prompts
├── Depends on: Tool routing (docs RAG vs MCP)
└── Prevents: User confusion between Q&A and exploration
```

### Critical Path (Must Build in Order)

1. **Neon Postgres + Drizzle setup** → Enables message persistence
2. **Daytona MCP integration** → Enables code execution
3. **User approval dialog** → Enables safe execution
4. **Chat interface on /playground** → Enables interaction
5. **Multi-MCP orchestration** → Enables dataset discovery + execution
6. **Base64 visualization** → Enables inline charts

**Can build in parallel:**
- Chat UI (frontend) while setting up database (backend)
- Daytona integration while building approval dialog
- Visualization rendering while testing code execution

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate "AI-powered Austrian dataset exploration."

- [x] Chat interface at `/playground` with useChat — Core interaction paradigm
- [x] Message persistence (Neon Postgres + Drizzle) — Essential for multi-turn exploration
- [x] User approval dialog before code execution — Security requirement
- [x] Daytona sandbox integration — Core functionality (code execution)
- [x] Inline visualization rendering (base64 images) — Primary output format
- [x] MCP multi-server orchestration — Route between data.gv.at and Daytona
- [x] Context-aware code generation — AI sees dataset schema before generating code
- [x] Error handling with clear messages — Execution fails often
- [x] Loading states during execution — Provide feedback (5-30s waits)
- [x] Two-chat architecture — Separate /playground from /try

**Success criteria:**
- User can ask "show me pollution data" → get working chart in <2 minutes
- Conversation persists across page reload
- Code never executes without explicit approval
- 80% of generated code runs successfully on first try
- Visualizations render inline without manual download

### Add After Validation (v1.x)

Features to add once core is working and users validate the concept.

- [ ] Conversation export to .ipynb — User feedback on shareability
- [ ] Code syntax highlighting — Polish for readability
- [ ] Conversation threading — Power users want to branch explorations
- [ ] Dataset quality indicators inline — Show completeness/freshness before code generation
- [ ] Suggested follow-up questions — "Also try: Show trend over time"
- [ ] Execution history sidebar — See all code runs in conversation
- [ ] Sandbox template customization — Add specialized libraries on request

### Future Consideration (v2.3+)

Features to defer until product-market fit is established.

- [ ] User authentication — Required for private conversations
- [ ] Public sharing with URLs — Requires auth + storage + moderation
- [ ] Multiple sandbox templates (R, Julia) — Different language ecosystems
- [ ] Dashboard builder from conversation — Different product paradigm
- [ ] Real-time collaboration — Complex engineering
- [ ] Data upload (user CSV files) — Storage + privacy concerns
- [ ] Interactive widgets — Complex state management
- [ ] Long-running jobs (>30s) — Queue system required

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Chat interface at /playground | HIGH | MEDIUM | P0 |
| Message persistence (DB) | HIGH | MEDIUM | P0 |
| Daytona sandbox integration | HIGH | HIGH | P0 |
| User approval dialog | HIGH | LOW | P0 |
| Multi-MCP orchestration | HIGH | HIGH | P0 |
| Inline visualizations | HIGH | MEDIUM | P0 |
| Context-aware code generation | HIGH | HIGH | P0 |
| Two-chat architecture | HIGH | MEDIUM | P0 |
| Error handling | HIGH | LOW | P0 |
| Loading states | MEDIUM | LOW | P0 |
| Code syntax highlighting | LOW | LOW | P1 |
| Conversation export | MEDIUM | MEDIUM | P1 |
| Quality indicators inline | MEDIUM | LOW | P1 |
| Conversation threading | LOW | MEDIUM | P2 |
| Suggested follow-up questions | MEDIUM | LOW | P2 |
| Sandbox customization | MEDIUM | HIGH | P2 |
| User authentication | LOW (v1) | HIGH | P3 |
| Public sharing URLs | LOW (v1) | HIGH | P3 |
| Multiple languages (R, Julia) | LOW | HIGH | P3 |
| Dashboard builder | LOW | HIGH | P3 |
| Data upload | LOW | HIGH | P3 |

**Priority key:**
- P0: Must have for launch (table stakes + core differentiators)
- P1: Should have, add shortly after launch (polish)
- P2: Nice to have, add based on user feedback (power user features)
- P3: Future consideration, defer until PMF (requires auth or paradigm shift)

## Competitor Feature Analysis

| Feature | Jupyter/Colab | Observable | ChatGPT Code Interpreter | Our Approach (v2.2) |
|---------|--------------|------------|---------------------------|---------------------|
| **Code execution** | ✓ Cell-based | ✓ Cell-based | ✓ Hidden from user | ✓ Chat-based with preview |
| **Visualizations** | ✓ Inline matplotlib | ✓ Reactive D3 | ✓ Auto-rendered | ✓ Inline base64 images |
| **Persistence** | ✓ Manual save | ✓ Auto-save | ✓ Conversation history | ✓ Database-backed |
| **Data access** | Manual upload/URL | Manual import | Manual upload only | ✓ MCP-powered discovery |
| **User approval** | ✗ Auto-executes | ✗ Auto-executes | ✗ Auto-executes | ✓ Explicit approval required |
| **Multi-language** | ✓ 40+ languages | ✓ JS only | ✗ Python only | Python only (v1) |
| **Collaboration** | ✓ Via sharing | ✓ Real-time | ✗ No sharing | ✗ Guest mode (v1) |
| **Dataset discovery** | ✗ Manual search | ✗ Manual import | ✗ Upload only | ✓ AI-powered 60K+ datasets |
| **Chat interface** | ✗ Cell-based | ✗ Cell-based | ✓ Chat-first | ✓ Chat-first |
| **Schema awareness** | ✗ User inspects | ✓ Reactive cells | ✓ Limited | ✓ MCP preview → context |

### Key Differentiators

**vs Jupyter/Colab:**
- We have chat-first interface (not cell-based notebook)
- We require user approval (they auto-execute)
- We integrate 60K+ datasets (they require manual data loading)

**vs Observable:**
- We focus on Python data analysis (they focus on JavaScript visualization)
- We have chat interface (they have reactive cells)
- We integrate Austrian open data (they have no corpus)

**vs ChatGPT Code Interpreter:**
- We require explicit approval (they auto-execute)
- We show code before execution (they hide implementation)
- We integrate 60K+ datasets (they only support upload)
- We provide schema context to LLM (they work blind)

**Unique to us:**
1. MCP-powered dataset discovery (no competitor has this)
2. Context-aware code generation (AI sees schema first)
3. Austrian open data focus (domain-specific value)
4. Security-first (approval required)

## UX Pattern Distinctions

### Docs RAG Chat (Already Exists at /try)

**Purpose:** Answer questions about documentation and MCP tools
**Use cases:**
- "How do I search for datasets?"
- "What parameters does preview_data accept?"
- "Show me examples of quality analysis"

**Architecture:**
- Route: `/try`
- System prompt: "You are a documentation assistant for the Austria MCP server..."
- Tools: RAG retrieval (Vectra vector DB + OpenAI embeddings)
- LLM: Claude Sonnet 4 via Vercel AI Gateway
- No code execution
- No MCP tool calls
- Persistence: Optional (ephemeral sessions OK)

**Output:** Text responses with source citations linking to documentation pages

### Data Playground Chat (New Feature for v2.2)

**Purpose:** Explore datasets and create visualizations
**Use cases:**
- "Show me air quality trends in Vienna"
- "Compare unemployment rates across Austrian cities"
- "What's the correlation between pollution and weather?"

**Architecture:**
- Route: `/playground`
- System prompt: "You are a data analysis assistant with access to 60,000+ Austrian datasets..."
- Tools: 25 MCP tools (data.gv.at) + Daytona code execution
- LLM: Claude Sonnet 4 via Vercel AI Gateway
- Code execution required (Daytona MCP)
- Multi-MCP orchestration (route tool calls)
- Persistence: Required (Neon Postgres + Drizzle)

**Output:** Generated Python code + execution results + inline visualizations

### Critical Distinction

**These are fundamentally different interfaces with different mental models.**

| Aspect | Docs RAG (/try) | Data Playground (/playground) |
|--------|-----------------|-------------------------------|
| Intent | Learn how to use the system | Explore actual data |
| Input | Questions about documentation | Natural language data queries |
| Output | Text explanations | Code + charts |
| Tools | RAG retrieval only | MCP discovery + code execution |
| Persistence | Optional | Required |
| Security | No risk (no execution) | High risk (arbitrary code) |

**Don't try to combine these.** Users asking "How do I search datasets?" (docs) vs "Show me health data" (exploration) have completely different intents and expectations.

**Navigation approach:**
- Keep `/try` for documentation Q&A (v2.1 investment)
- Add `/playground` for data exploration (v2.2 new feature)
- Clear visual distinction: Different page headers, different placeholder text, different system prompts

**Header examples:**
- `/try`: "Ask questions about the Austria MCP documentation"
- `/playground`: "Explore 60,000+ Austrian datasets with AI"

## Implementation Patterns

### Multi-MCP Server Orchestration

**Challenge:** Route tool calls between data.gv.at MCP (25 tools) and Daytona MCP (sandbox execution)

**Architecture:**
```typescript
// Server: /api/playground/route.ts
import { createMCPClient } from '@mcp/client'
import { streamText } from 'ai'

const datagovClient = createMCPClient({
  transport: 'stdio',
  command: 'python',
  args: ['-m', 'mcp']
})

const daytonaClient = createMCPClient({
  transport: 'stdio',
  command: 'daytona',
  args: ['mcp']
})

// Register all tools from both servers
const allTools = [
  ...datagovClient.listTools(),
  ...daytonaClient.listTools()
]

// Route tool calls based on tool name
async function executeTool(toolName: string, args: any) {
  if (toolName.startsWith('datagov_')) {
    return await datagovClient.executeTool(toolName, args)
  } else if (toolName === 'execute_code') {
    return await daytonaClient.executeTool(toolName, args)
  }
  throw new Error(`Unknown tool: ${toolName}`)
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: 'anthropic/claude-sonnet-4',
    messages,
    tools: allTools,
    onToolCall: async (toolCall) => {
      return await executeTool(toolCall.toolName, toolCall.args)
    }
  })

  return result.toDataStreamResponse()
}
```

### User Approval Dialog

**Pattern:** AI SDK `experimental_needsApproval` flag

```typescript
// Server: /api/playground/route.ts
const result = await streamText({
  model: 'anthropic/claude-sonnet-4',
  messages,
  tools: {
    execute_code: {
      description: 'Execute Python code in Daytona sandbox',
      parameters: z.object({
        code: z.string(),
        language: z.literal('python')
      }),
      execute: async ({ code }) => {
        return await daytonaClient.executeTool('execute_code', { code })
      },
      experimental_needsApproval: true  // Requires user confirmation
    }
  }
})

// Client: components/playground-chat.tsx
import { useChat } from 'ai/react'

export function PlaygroundChat() {
  const { messages, input, handleInputChange, handleSubmit, handleApproval } = useChat({
    api: '/api/playground'
  })

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {message.content}

          {/* Show approval dialog for code execution */}
          {message.needsApproval && (
            <div className="approval-dialog">
              <h3>Approve code execution?</h3>
              <pre><code>{message.toolCall.args.code}</code></pre>
              <button onClick={() => handleApproval(message.id, true)}>
                Execute
              </button>
              <button onClick={() => handleApproval(message.id, false)}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Message Persistence

**Pattern:** AI SDK 6 parts array with Drizzle ORM

```typescript
// Schema: db/schema.ts
import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core'

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow()
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id),
  role: text('role', { enum: ['user', 'assistant', 'system'] }),
  parts: jsonb('parts').$type<Array<{type: string, content: string}>>(),
  createdAt: timestamp('created_at').defaultNow()
})

// Server: /api/playground/route.ts
export async function POST(req: Request) {
  const { messages, conversationId } = await req.json()

  // Load conversation history from DB
  const history = await db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)

  const result = await streamText({
    model: 'anthropic/claude-sonnet-4',
    messages: [...history, ...messages],
    // ... tools, etc
  })

  // Save new messages to DB
  await db.insert(messages).values({
    conversationId,
    role: 'assistant',
    parts: result.parts,
    createdAt: new Date()
  })

  return result.toDataStreamResponse()
}
```

### Context-Aware Code Generation

**Pattern:** Pass MCP tool results to LLM context

```typescript
// Server: /api/playground/route.ts
const result = await streamText({
  model: 'anthropic/claude-sonnet-4',
  messages,
  tools: {
    search_datasets: {
      execute: async (args) => {
        const results = await datagovClient.executeTool('search_datasets', args)
        return results  // Returns list of dataset IDs + metadata
      }
    },
    preview_data: {
      execute: async (args) => {
        const preview = await datagovClient.executeTool('preview_data', args)
        // preview contains: schema (column names + types), sample rows
        return preview
      }
    },
    execute_code: {
      execute: async ({ code }) => {
        // AI has already seen dataset schema from preview_data call
        // So generated code uses correct column names
        return await daytonaClient.executeTool('execute_code', { code })
      },
      experimental_needsApproval: true
    }
  },
  systemPrompt: `You are a data analyst. When user asks for data:
    1. Use search_datasets to find relevant datasets
    2. Use preview_data to inspect schema and sample rows
    3. Generate Python code using EXACT column names from schema
    4. Use execute_code to run the code

    Example:
    User: "Show air quality in Vienna"
    1. search_datasets(query="air quality vienna", theme="Umwelt")
    2. preview_data(distribution_id="...") → sees columns: ["Station", "PM25_Mittelwert", "Datum"]
    3. Generate code: df = pd.read_csv(url); df["PM25_Mittelwert"].plot()
       NOT: df["pm25"].plot()  (wrong column name would fail)
  `
})
```

### Inline Visualization Rendering

**Pattern:** Base64 image encoding in sandbox → display in chat

```python
# In Daytona sandbox (executed code):
import matplotlib.pyplot as plt
import base64
from io import BytesIO

# User's plotting code
df['PM25'].plot()

# Encode to base64 (added by AI automatically)
buf = BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode('utf-8')

# Return as output
print(f"IMAGE:{img_base64}")
```

```typescript
// Client: components/message.tsx
export function Message({ message }) {
  // Parse output for base64 images
  const imageMatch = message.content.match(/IMAGE:([A-Za-z0-9+/=]+)/)

  if (imageMatch) {
    return (
      <div className="message">
        <img
          src={`data:image/png;base64,${imageMatch[1]}`}
          alt="Generated visualization"
        />
      </div>
    )
  }

  return <div className="message">{message.content}</div>
}
```

## Success Metrics

### Core Functionality (Must Work)

- [ ] Chat interface loads on /playground without errors
- [ ] Messages persist across page reload (database queries work)
- [ ] User approval dialog appears before code execution
- [ ] Code executes in Daytona sandbox (not local environment)
- [ ] Visualizations render inline as base64 images
- [ ] MCP tools (search, preview, quality) callable from chat
- [ ] Error messages display clearly when code fails
- [ ] Loading states show during 5-30s execution waits

### User Experience (Quality Indicators)

- [ ] 80% of generated code runs successfully on first try (measured by error rate)
- [ ] Average time from query to chart: <90 seconds (measured by timestamps)
- [ ] Code uses correct column names 95% of time (measured by schema match)
- [ ] Zero hallucinated datasets (AI only references real data.gv.at IDs)
- [ ] Conversations load in <500ms (database query performance)

### Security (Non-Negotiable)

- [ ] No code executes without explicit user approval (manual testing)
- [ ] Sandboxes are isolated (no access to production DB/secrets)
- [ ] 30-second timeout enforced (no infinite loops)
- [ ] Approval dialog shows code preview before execution

## Open Questions

### Database Strategy

**Question:** Neon Postgres or alternative (Supabase, PlanetScale)?
**Action:**
- Neon chosen for v2.2 (serverless, generous free tier, Drizzle ORM support)
- Verify Neon connection pooling works with Next.js App Router
- Test query performance for conversation history (<500ms target)

### MCP Multi-Server Orchestration

**Question:** How to route tool calls between multiple MCP servers?
**Options:**
1. AI SDK custom tool executor (manually route based on tool name)
2. MCP protocol multiplexer (forward to correct server)
3. Single MCP server that proxies to others

**Action:**
- Start with Option 1 (AI SDK custom executor) — simplest to implement
- Monitor for performance issues (two stdio processes)
- Consider Option 2 if latency >2s

### Sandbox Template Configuration

**Question:** Which Python libraries to pre-install in Daytona sandbox?
**Must-haves:**
- pandas, numpy (data manipulation)
- matplotlib, seaborn (visualization)
- requests, httpx (data fetching)

**Nice-to-haves:**
- scikit-learn (ML)
- geopandas (geographic data)
- plotly (interactive charts)

**Action:**
- Start with must-haves only for v1
- Add nice-to-haves based on user requests in v1.x
- Document how users can request library additions

### Conversation Threading

**Question:** Support branching conversations (explore multiple hypotheses)?
**Defer to v1.x:**
- Complex UX (how to visualize branches?)
- Complex DB schema (tree structure vs linear messages)
- Low priority for v1 MVP

**Action:**
- Build linear conversations for v1
- Add threading in v1.1 if users explicitly request it

### Code Execution Output Limits

**Question:** How much stdout/stderr to capture?
**Options:**
1. First 1000 lines (prevent spam)
2. First 10KB (size limit)
3. All output (risk: massive DataFrames)

**Action:**
- Limit to 10KB stdout + 10KB stderr for v1
- Truncate with message: "Output truncated. Use df.head() to limit output."

## Sources

**HIGH Confidence (Official Documentation + Product Analysis):**
- Jupyter.org: Multi-language kernels, interactive widgets, notebook format
- Google Colab: AI code generation, data inspector, GPU support, Drive integration
- ObservableHQ.com: AI integration, reactive visualizations, database connectivity
- Hex.tech: AI-powered analysis, collaborative notebooks
- Vercel AI SDK Chat: https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot (useChat hook, streaming)
- Vercel AI SDK Approval: https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot#experimental_needsApproval (user consent pattern)
- Vercel AI SDK Parts: https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#parts (message persistence)
- Daytona MCP: Code execution via CLI stdio transport
- MCP Protocol: Multi-server orchestration patterns

**MEDIUM Confidence (Established Patterns):**
- Base64 image encoding for inline visualization (standard web practice)
- 30-second timeout for exploratory queries (prevents abuse, covers 95% of use cases)
- Chat-first interface for data exploration (ChatGPT Code Interpreter demonstrates viability)
- Two-chat architecture (separation of concerns: Q&A vs exploration)

**Existing Project Context (HIGH Confidence):**
- v2.1: 25 MCP tools for data.gv.at already built and working
- v2.1: Documentation site with Next.js + Vercel AI SDK at /try
- v2.1: RAG chat demonstrates AI SDK integration patterns
- PROJECT.md: Explicit scope for v2.2 (guest mode only, no auth)

**Confidence Assessment:**
- Table stakes features: HIGH (well-established in notebook/playground domain)
- Differentiators: MEDIUM-HIGH (MCP integration is novel, but technical feasibility validated)
- Anti-features: HIGH (learned from competitor analysis and common product mistakes)
- UX patterns: HIGH (clear distinction between docs Q&A and data exploration)
- Implementation patterns: MEDIUM-HIGH (AI SDK and MCP are new integrations, but patterns documented)

---
*Feature research for: Interactive Data Playground for Austrian Open Data (v2.2)*
*Researched: 2026-01-31*
