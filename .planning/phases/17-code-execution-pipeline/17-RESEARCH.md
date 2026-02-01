# Phase 17: Code Execution Pipeline - Research

**Researched:** 2026-02-01
**Domain:** Python code execution in E2B sandboxes, timeout enforcement, multi-file projects, error recovery
**Confidence:** HIGH

## Summary

Phase 17 implements the execution infrastructure that takes AI-generated Python code (from Phase 16) and runs it safely in E2B sandboxes with proper timeout enforcement, multi-file support, and automatic error recovery. Research confirms E2B Code Interpreter (@e2b/code-interpreter v2.3.3) provides production-ready sandboxing with comprehensive file operations, configurable timeouts, and execution context management.

The AI SDK's tool calling system (v6.0.64) enables automatic error recovery through multi-step generation with `stopWhen`, tool-error content parts for AI-driven retry, and `experimental_repairToolCall` for input validation failures. E2B's `runCode()` API supports per-execution timeout (default 60s, configurable via `timeoutMs`), stdout/stderr streaming callbacks, and persistent state across multiple executions within a sandbox session.

Multi-file project support is achieved through E2B's full filesystem API (`write()`, `read()`, `writeFiles()`, `makeDir()`) and working directory control via `CreateCodeContextOpts.cwd`. The 30-second timeout requirement maps to `runCode({ timeoutMs: 30000 })`, while the 1-hour sandbox lifecycle timeout (from Phase 15) is enforced at `Sandbox.create({ timeoutMs: 3600000 })`.

**Primary recommendation:** Implement execute-python tool with per-execution 30s timeout, lazy sandbox creation (only when AI calls tool), graceful error forwarding to AI via tool-error parts for automatic retry, and multi-file support via E2B's writeFiles() before runCode(). Pre-install common packages during sandbox creation is not needed - E2B code-interpreter template includes pandas, matplotlib, seaborn, plotly, and numpy by default.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @e2b/code-interpreter | ^2.3.3 | Secure Python sandbox execution | Purpose-built for AI agents, 200ms startup, full filesystem, visualization support |
| ai | ^6.0.64 | Tool calling orchestration | Multi-step generation, automatic error recovery, tool-error forwarding |
| zod | ^4.3.6 | Tool input schema validation | Type-safe tool definitions, already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @e2b/code-interpreter types | Included | TypeScript definitions for Execution, Result, ExecutionError | Development - full type safety for sandbox operations |
| AI SDK tool utilities | Included in ai | tool(), generateText(), streamText() | Tool definition and execution |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| E2B per-execution timeout | AI SDK timeout parameter | E2B: Granular control per code execution. AI SDK: Global timeout for entire conversation step |
| E2B runCode() | Custom subprocess + vm2 | E2B: OS-level isolation, visualization extraction, 200ms startup. Custom: Deprecated (vm2), slower, security gaps |
| Tool-error forwarding | Manual retry logic | Tool-error: AI automatically analyzes error and fixes. Manual: Hand-rolled retry, no AI context |
| E2B filesystem API | Upload files via base64 in code | Filesystem: Efficient binary transfer, proper permissions. Base64: Code bloat, memory overhead |

**Installation:**
```bash
# Already installed in project
npm install @e2b/code-interpreter@2.3.3
npm install ai@6.0.64
npm install zod@4.3.6
```

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── lib/
│   ├── mcp/
│   │   ├── e2b-client.ts           # E2B sandbox factory (Phase 15)
│   │   ├── aggregate-tools.ts      # Tool aggregation (Phase 16)
│   │   └── types.ts                # MCP types
│   └── sandbox/
│       ├── execution.ts            # Code execution orchestration
│       ├── multi-file.ts           # Multi-file project support
│       ├── timeout.ts              # Timeout enforcement utilities
│       └── recovery.ts             # Error recovery patterns
├── app/
│   └── api/
│       └── chat/
│           └── route.ts            # AI SDK streamText with tools
```

### Pattern 1: Lazy Sandbox Creation with 30s Execution Timeout

**What:** Create sandbox only when AI calls execute-python tool, enforce 30s timeout per execution
**When to use:** Phase 17 - all code execution requests
**Why this approach:** Avoids 200ms startup cost for non-code queries, enforces EXEC-05 requirement

**Example:**
```typescript
// Source: E2B TypeScript definitions + AI SDK docs
import { Sandbox } from '@e2b/code-interpreter';
import { tool } from 'ai';
import { z } from 'zod/v4';

export function createExecutePythonTool() {
  return tool({
    description: 'Execute Python code in isolated sandbox with 30-second timeout',
    inputSchema: z.object({
      code: z.string().describe('Python code to execute'),
      files: z.array(z.object({
        path: z.string().describe('File path relative to working directory'),
        content: z.string().describe('File content'),
      })).optional().describe('Additional files needed for multi-file projects'),
    }),
    execute: async ({ code, files }, { abortSignal }) => {
      // Lazy sandbox creation - only when tool is called
      const sandbox = await Sandbox.create({
        apiKey: process.env.E2B_API_KEY,
        timeoutMs: 60 * 60 * 1000, // 1-hour sandbox lifecycle (EXEC-06)
      });

      try {
        // Multi-file support - write files before execution
        if (files && files.length > 0) {
          await sandbox.filesystem.writeFiles(
            files.map(f => ({ path: f.path, data: f.content }))
          );
        }

        // Execute with 30-second timeout (EXEC-05 requirement)
        const execution = await sandbox.runCode(code, {
          timeoutMs: 30 * 1000, // 30 seconds
          onStdout: (output) => {
            console.log('[Python stdout]', output.line);
          },
          onStderr: (output) => {
            console.warn('[Python stderr]', output.line);
          },
        });

        // Return structured result for AI to interpret
        return {
          success: !execution.error,
          text: execution.text,
          error: execution.error ? {
            name: execution.error.name,
            value: execution.error.value,
            traceback: execution.error.traceback,
          } : undefined,
          logs: {
            stdout: execution.logs.stdout,
            stderr: execution.logs.stderr,
          },
          results: execution.results.map(r => ({
            formats: r.formats(),
            text: r.text,
            png: r.png, // Base64-encoded visualizations
            svg: r.svg,
            html: r.html,
          })),
        };
      } finally {
        // Always cleanup sandbox (lazy lifecycle)
        await sandbox.kill();
      }
    },
  });
}
```

### Pattern 2: AI-Driven Error Recovery via Tool-Error Forwarding

**What:** Let AI automatically retry failed executions by forwarding ExecutionError as tool-error content part
**When to use:** Phase 17 - automatic error recovery (EXEC-09 requirement)
**Why this approach:** AI SDK's multi-step generation with tool-error parts enables AI to analyze error and regenerate fixed code without manual retry logic

**Example:**
```typescript
// Source: AI SDK tool calling documentation
import { streamText } from 'ai';
import { getLanguageModel } from '@/lib/ai/providers';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: getLanguageModel('claude-sonnet-4.5'),
    messages,
    tools: {
      'execute-python': createExecutePythonTool(),
    },
    stopWhen: stepCountIs(5), // Allow up to 5 steps for error recovery
    onStepFinish: async ({ text, toolCalls, toolResults, finishReason }) => {
      // Log error recovery attempts
      const toolErrors = toolResults.filter(tr => tr.error);
      if (toolErrors.length > 0) {
        console.log('[Error Recovery]', toolErrors.length, 'tools failed, AI retrying...');
      }
    },
  });

  return result.toDataStreamResponse();
}
```

**How error recovery works:**
1. AI calls execute-python tool with code
2. Execution fails (e.g., `NameError: name 'pd' is not defined`)
3. Tool returns error in result: `{ success: false, error: { name: 'NameError', ... } }`
4. AI SDK forwards error as tool-error content part to next generation step
5. AI analyzes error context and generates fixed code: `import pandas as pd\n...`
6. Execute-python tool runs fixed code successfully
7. Stops when `finishReason === 'stop'` or `stepCountIs(5)` limit reached

### Pattern 3: Multi-File Project Support

**What:** Accept multiple files in tool input, write to sandbox filesystem before execution, support imports
**When to use:** Phase 17 - multi-file mini-apps (EXEC-07, EXEC-08 requirements)
**Why this approach:** E2B's writeFiles() creates proper directory structure, Python imports work naturally

**Example:**
```typescript
// Source: E2B Filesystem API + Python best practices
import { Sandbox } from '@e2b/code-interpreter';

async function executeMultiFileProject(
  entryPoint: string,
  files: Array<{ path: string; content: string }>
) {
  const sandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY!,
    timeoutMs: 60 * 60 * 1000,
  });

  try {
    // Write all project files
    await sandbox.filesystem.writeFiles(
      files.map(f => ({
        path: `/home/user/${f.path}`, // Absolute paths
        data: f.content,
      }))
    );

    // Create code context with working directory
    const context = await sandbox.createCodeContext({
      cwd: '/home/user', // Set working directory for imports
      language: 'python',
    });

    // Execute entry point with context
    const execution = await sandbox.runCode(entryPoint, {
      context,
      timeoutMs: 30 * 1000,
    });

    return {
      success: !execution.error,
      text: execution.text,
      error: execution.error,
      logs: execution.logs,
    };
  } finally {
    await sandbox.kill();
  }
}

// Usage example - AI generates this structure:
const projectFiles = [
  {
    path: 'utils.py',
    content: 'def calculate_mean(data):\n    return sum(data) / len(data)',
  },
  {
    path: 'main.py',
    content: 'from utils import calculate_mean\nresult = calculate_mean([1, 2, 3])\nprint(result)',
  },
];

await executeMultiFileProject(
  'from main import *', // Or: await sandbox.filesystem.read('/home/user/main.py')
  projectFiles
);
```

**Import patterns supported:**
- **Relative imports:** `from .utils import calculate_mean` (requires package structure)
- **Absolute imports:** `from utils import calculate_mean` (cwd in sys.path)
- **Flat imports:** All files in same directory, import by module name

**Directory organization strategies:**
- **Flat structure:** All .py files in `/home/user/` (simplest, works for 2-5 files)
- **Package structure:** `/home/user/myproject/__init__.py` (for 5+ files, proper modules)
- **Progressive complexity:** Start flat, AI upgrades to package when needed

### Pattern 4: Timeout Enforcement and Error Messaging

**What:** Enforce 30-second execution timeout, provide clear timeout messages to user and AI
**When to use:** Phase 17 - EXEC-05 requirement (30-second timeout)
**Why this approach:** E2B `timeoutMs` parameter handles timeout enforcement, clear error messages enable AI to optimize code or suggest chunking

**Example:**
```typescript
// Source: E2B RunCodeOpts interface
import { Sandbox, type ExecutionError } from '@e2b/code-interpreter';

const EXECUTION_TIMEOUT_MS = 30 * 1000; // 30 seconds (EXEC-05)

async function executeWithTimeout(sandbox: Sandbox, code: string) {
  try {
    const execution = await sandbox.runCode(code, {
      timeoutMs: EXECUTION_TIMEOUT_MS,
    });

    if (execution.error) {
      return {
        success: false,
        error: {
          name: execution.error.name,
          message: execution.error.value,
          traceback: execution.error.traceback,
          isTimeout: execution.error.name === 'TimeoutError',
        },
        userMessage: execution.error.name === 'TimeoutError'
          ? `Code execution exceeded 30-second limit. Consider:\n- Breaking into smaller chunks\n- Reducing dataset size\n- Optimizing loops`
          : execution.error.value,
      };
    }

    return {
      success: true,
      text: execution.text,
      logs: execution.logs,
      results: execution.results,
    };
  } catch (error) {
    // Handle sandbox-level timeouts (rare - requestTimeoutMs)
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        success: false,
        error: { name: 'TimeoutError', message: 'Execution timeout' },
        userMessage: 'Code execution timed out after 30 seconds.',
      };
    }
    throw error;
  }
}
```

**Timeout handling strategy (per CONTEXT.md - Claude's discretion):**
1. **First timeout:** Return clear error to AI, let AI attempt to optimize code
2. **Second timeout:** AI suggests breaking into smaller operations or reducing scope
3. **Third timeout:** Hard stop - inform user the operation is too complex for 30s limit

### Pattern 5: Stdout/Stderr Streaming for User Visibility

**What:** Stream stdout/stderr output during execution for debugging visibility
**When to use:** Phase 17 - user sees stdout/stderr (success criterion 6)
**Why this approach:** E2B provides `onStdout` and `onStderr` callbacks, enable real-time visibility

**Example:**
```typescript
// Source: E2B RunCodeOpts callbacks
import { Sandbox, type OutputMessage } from '@e2b/code-interpreter';

async function executeWithLogging(sandbox: Sandbox, code: string) {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  const execution = await sandbox.runCode(code, {
    timeoutMs: 30 * 1000,
    onStdout: (output: OutputMessage) => {
      stdoutLines.push(output.line);
      console.log(`[stdout ${output.timestamp}]`, output.line);
    },
    onStderr: (output: OutputMessage) => {
      stderrLines.push(output.line);
      console.error(`[stderr ${output.timestamp}]`, output.line);
    },
    onResult: (result) => {
      console.log('[Result]', result.formats());
    },
  });

  return {
    success: !execution.error,
    text: execution.text,
    error: execution.error,
    logs: {
      stdout: stdoutLines,
      stderr: stderrLines,
    },
    // Return logs in result so AI and user can see output
    debugOutput: {
      stdout: stdoutLines.join('\n'),
      stderr: stderrLines.join('\n'),
    },
  };
}
```

**Output presentation options (per CONTEXT.md - Claude's discretion):**
- **Real-time streaming:** Use callbacks to stream to client during execution (requires SSE/WebSocket)
- **Buffered output:** Collect all output, return after execution completes (simpler, works with standard HTTP)
- **Smart streaming:** Stream for long-running operations (>5s), buffer for quick executions

### Anti-Patterns to Avoid

- **Global sandbox instance:** Never reuse sandbox across requests in serverless - cold starts lose state, leaks resources
- **Missing timeout parameter:** Always specify `timeoutMs` in runCode() - default 60s may be too long for requirement
- **Ignoring ExecutionError.traceback:** Traceback contains full Python error context - forward to AI for better error recovery
- **Synchronous file writes:** E2B filesystem operations are async - await writeFiles() before runCode()
- **Base64-encoding files in code string:** Use filesystem.write() for binary data - code string should contain logic only

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code execution timeout | setTimeout() + process.kill() | E2B runCode({ timeoutMs }) | E2B: Clean resource cleanup, handles edge cases. Custom: Race conditions, orphaned processes |
| Multi-file project structure | String concatenation of files | E2B filesystem.writeFiles() | Filesystem: Proper permissions, directory creation. String concat: Import resolution fails, no working directory |
| Error recovery retry logic | try/catch loop with counter | AI SDK tool-error forwarding + stopWhen | AI SDK: AI analyzes error and fixes. Manual retry: No context, dumb retry |
| Stdout/stderr capture | subprocess stdout piping | E2B onStdout/onStderr callbacks | E2B: Timestamped, separated by stream. Subprocess: Interleaving issues, buffer deadlocks |
| Visualization extraction | Parse matplotlib output files | E2B Result.png, Result.svg | E2B: Automatic base64 encoding, multiple formats. Manual: File I/O, format detection |
| Sandbox lifecycle | Manual Docker container management | E2B Sandbox.create() + kill() | E2B: 200ms startup, managed networking, automatic cleanup. Docker: 2-5s startup, network config, orphan containers |

**Key insight:** Code execution sandboxing is deceptively complex - timeout enforcement, multi-file imports, output streaming, and resource cleanup each have subtle edge cases. E2B solves these with battle-tested infrastructure; custom solutions inevitably have gaps that cause production issues.

## Common Pitfalls

### Pitfall 1: Not Forwarding Errors to AI for Recovery

**What goes wrong:** Errors logged server-side but not returned to AI, preventing automatic retry
**Why it happens:** Forgetting that AI SDK needs error in tool result to trigger recovery
**How to avoid:** Always return error details in tool result, not just throw or log
**Warning signs:** AI never retries failed code, user sees same error repeatedly

**Example:**
```typescript
// ❌ BAD - Error not forwarded to AI
execute: async ({ code }) => {
  try {
    const execution = await sandbox.runCode(code);
    return { text: execution.text };
  } catch (error) {
    console.error('Execution failed:', error);
    throw error; // AI doesn't see this
  }
}

// ✅ GOOD - Error forwarded as tool result
execute: async ({ code }) => {
  const execution = await sandbox.runCode(code, { timeoutMs: 30000 });
  return {
    success: !execution.error,
    text: execution.text,
    error: execution.error ? {
      name: execution.error.name,
      message: execution.error.value,
      traceback: execution.error.traceback, // Full context for AI
    } : undefined,
  };
}
```

### Pitfall 2: Creating Sandbox Before Knowing Code Will Execute

**What goes wrong:** 200ms sandbox creation cost on every chat request, even for dataset search queries
**Why it happens:** Creating sandbox at tool registration time instead of tool execution time
**How to avoid:** Lazy sandbox creation - create in execute() function only when tool is called
**Warning signs:** Slow response times for simple queries, high E2B costs

### Pitfall 3: Missing Per-Execution Timeout

**What goes wrong:** Long-running code blocks other operations, violates 30-second requirement
**Why it happens:** Forgetting to specify `timeoutMs` in runCode(), relying on default 60s
**How to avoid:** Always set `timeoutMs: 30000` in runCode() options
**Warning signs:** Executions taking >30 seconds, users reporting "slow" code execution

### Pitfall 4: Not Cleaning Up Sandbox on Error

**What goes wrong:** Failed executions leak sandboxes, drain E2B credits, exhaust concurrent sandbox limit
**Why it happens:** Missing finally block or try/catch around sandbox.kill()
**How to avoid:** Always use try/finally pattern with sandbox.kill() in finally
**Warning signs:** E2B dashboard shows orphaned sandboxes, "concurrent sandbox limit" errors

**Example:**
```typescript
// ❌ BAD - Sandbox leaks on error
execute: async ({ code }) => {
  const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });
  const execution = await sandbox.runCode(code); // If this throws, sandbox never killed
  await sandbox.kill();
  return { text: execution.text };
}

// ✅ GOOD - Sandbox always cleaned up
execute: async ({ code }) => {
  const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });
  try {
    const execution = await sandbox.runCode(code);
    return { text: execution.text };
  } finally {
    await sandbox.kill(); // Always runs, even on error
  }
}
```

### Pitfall 5: Flat File Structure for Complex Projects

**What goes wrong:** Import resolution fails when AI generates packages with `__init__.py` and relative imports
**Why it happens:** Writing all files to `/home/user/` without preserving directory structure from tool input
**How to avoid:** Preserve path structure from tool input, create directories as needed
**Warning signs:** `ModuleNotFoundError`, `ImportError: attempted relative import with no known parent package`

**Example:**
```typescript
// ❌ BAD - Loses directory structure
const files = [
  { path: 'mypackage/__init__.py', content: '' },
  { path: 'mypackage/utils.py', content: 'def foo(): pass' },
];
await sandbox.filesystem.writeFiles(
  files.map(f => ({
    path: `/home/user/${f.path.split('/').pop()}`, // Flattens to utils.py
    data: f.content,
  }))
);

// ✅ GOOD - Preserves package structure
await sandbox.filesystem.writeFiles(
  files.map(f => ({
    path: `/home/user/${f.path}`, // Keeps mypackage/utils.py
    data: f.content,
  }))
);
```

### Pitfall 6: Ignoring Stdout/Stderr Context

**What goes wrong:** AI generates code with runtime warnings/errors invisible to user
**Why it happens:** Only returning execution.text, ignoring execution.logs
**How to avoid:** Always include stdout/stderr in tool result for debugging
**Warning signs:** Users report "code doesn't work" but execution.error is undefined

## Code Examples

Verified patterns from official sources:

### Complete Execute-Python Tool with All Features

```typescript
// Source: E2B TypeScript definitions + AI SDK documentation
import { Sandbox, type Execution, type ExecutionError } from '@e2b/code-interpreter';
import { tool } from 'ai';
import { z } from 'zod/v4';

const EXECUTION_TIMEOUT_MS = 30 * 1000; // 30 seconds (EXEC-05)
const SANDBOX_LIFECYCLE_MS = 60 * 60 * 1000; // 1 hour (EXEC-06)

export function createExecutePythonTool() {
  return tool({
    description: `Execute Python code in isolated E2B sandbox with 30-second timeout.
Supports multi-file projects with imports. Pre-installed packages: pandas, matplotlib, seaborn, plotly, numpy.
Use 'files' parameter for multi-file projects.`,
    inputSchema: z.object({
      code: z.string().describe('Python code to execute'),
      files: z.array(z.object({
        path: z.string().describe('File path relative to /home/user (e.g., utils.py or mypackage/helpers.py)'),
        content: z.string().describe('File content'),
      })).optional().describe('Additional files for multi-file projects'),
      workingDirectory: z.string().optional().describe('Working directory for imports (default: /home/user)'),
    }),
    execute: async ({ code, files, workingDirectory }, { abortSignal }) => {
      // Lazy sandbox creation (EXEC-01, EXEC-05, EXEC-07)
      const sandbox = await Sandbox.create({
        apiKey: process.env.E2B_API_KEY!,
        timeoutMs: SANDBOX_LIFECYCLE_MS,
      });

      try {
        // Multi-file support (EXEC-07, EXEC-08)
        if (files && files.length > 0) {
          await sandbox.filesystem.writeFiles(
            files.map(f => ({
              path: `/home/user/${f.path}`,
              data: f.content,
            }))
          );
        }

        // Create execution context with working directory
        const context = await sandbox.createCodeContext({
          cwd: workingDirectory || '/home/user',
          language: 'python',
        });

        // Capture stdout/stderr for visibility (Success Criterion 6)
        const stdoutLines: string[] = [];
        const stderrLines: string[] = [];

        // Execute with timeout (EXEC-05)
        const execution = await sandbox.runCode(code, {
          context,
          timeoutMs: EXECUTION_TIMEOUT_MS,
          onStdout: (output) => {
            stdoutLines.push(output.line);
          },
          onStderr: (output) => {
            stderrLines.push(output.line);
          },
        });

        // Format result for AI (EXEC-09 - error recovery)
        const result = {
          success: !execution.error,
          text: execution.text,
          error: execution.error ? {
            name: execution.error.name,
            message: execution.error.value,
            traceback: execution.error.traceback,
            isTimeout: execution.error.name === 'TimeoutError',
          } : undefined,
          logs: {
            stdout: stdoutLines,
            stderr: stderrLines,
          },
          visualizations: execution.results
            .filter(r => r.png || r.svg)
            .map(r => ({
              formats: r.formats(),
              png: r.png, // Base64-encoded
              svg: r.svg,
            })),
        };

        // Add timeout guidance for AI
        if (result.error?.isTimeout) {
          result.error.message += '\n\nConsider: Breaking into smaller chunks, reducing dataset size, or optimizing loops.';
        }

        return result;
      } finally {
        // Always cleanup (EXEC-06)
        await sandbox.kill();
      }
    },
  });
}
```

### AI SDK Integration with Error Recovery

```typescript
// Source: AI SDK tool calling patterns
import { streamText } from 'ai';
import { getLanguageModel } from '@/lib/ai/providers';
import { datasetDiscoveryPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: getLanguageModel('claude-sonnet-4.5'),
    system: datasetDiscoveryPrompt,
    messages,
    tools: {
      'execute-python': createExecutePythonTool(),
      // Other tools from aggregate-tools.ts
    },
    stopWhen: stepCountIs(5), // Allow up to 5 retry attempts (EXEC-09)
    maxRetries: 2, // Retry on API failures
    onStepFinish: async ({ text, toolCalls, toolResults, finishReason, usage }) => {
      // Log error recovery attempts
      const failedTools = toolResults.filter(tr => !tr.result.success);
      if (failedTools.length > 0) {
        console.log(`[Error Recovery] ${failedTools.length} tools failed, AI retrying...`);
        failedTools.forEach(ft => {
          console.log(`  - ${ft.toolName}:`, ft.result.error?.name);
        });
      }

      // Success criterion 7 - timeout message
      const timeouts = toolResults.filter(tr => tr.result.error?.isTimeout);
      if (timeouts.length > 0) {
        console.warn(`[Timeout] ${timeouts.length} executions exceeded 30 seconds`);
      }
    },
  });

  return result.toDataStreamResponse();
}
```

### Multi-File Project Example

```typescript
// Source: Python package structure best practices + E2B filesystem API
// Example: AI generates this tool call for complex analysis

const toolCall = {
  toolName: 'execute-python',
  input: {
    files: [
      {
        path: 'analysis/__init__.py',
        content: '',
      },
      {
        path: 'analysis/preprocessing.py',
        content: `
import pandas as pd

def clean_data(df):
    """Remove rows with missing values"""
    return df.dropna()

def normalize_columns(df, columns):
    """Normalize specified columns to 0-1 range"""
    for col in columns:
        df[col] = (df[col] - df[col].min()) / (df[col].max() - df[col].min())
    return df
`,
      },
      {
        path: 'analysis/visualization.py',
        content: `
import matplotlib.pyplot as plt
import seaborn as sns

def create_correlation_heatmap(df):
    """Generate correlation heatmap"""
    plt.figure(figsize=(10, 8))
    sns.heatmap(df.corr(), annot=True, cmap='coolwarm')
    plt.title('Feature Correlations')
    plt.tight_layout()
    return plt
`,
      },
      {
        path: 'main.py',
        content: `
from analysis.preprocessing import clean_data, normalize_columns
from analysis.visualization import create_correlation_heatmap
import pandas as pd

# Load dataset
df = pd.read_csv('/home/user/data.csv')

# Clean and normalize
df = clean_data(df)
df = normalize_columns(df, ['age', 'income'])

# Create visualization
plot = create_correlation_heatmap(df)
plot.show()

print(f"Processed {len(df)} records")
`,
      },
    ],
    code: 'exec(open("main.py").read())',
    workingDirectory: '/home/user',
  },
};

// Tool execution result:
{
  success: true,
  text: "Processed 1523 records",
  logs: {
    stdout: ["Processed 1523 records"],
    stderr: [],
  },
  visualizations: [
    {
      formats: ["png", "svg"],
      png: "iVBORw0KGgoAAAANSUhEUgAA...", // Base64
      svg: "<svg>...</svg>",
    },
  ],
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual retry loops | AI SDK tool-error forwarding | 2025 (AI SDK 6.0) | AI analyzes error context and fixes code automatically |
| Global timeout only | Per-execution timeout | 2024 (E2B v2.0) | Granular control - long analysis doesn't block quick queries |
| Single-file code strings | Multi-file filesystem API | 2024 (E2B v2.0) | Proper package structure, import resolution, working directories |
| Parse stdout from logs | Structured Execution object | 2024 (E2B v2.0) | Separated stdout/stderr, timestamped, structured results |
| Manual base64 encoding | Automatic visualization extraction | 2024 (E2B v2.0) | Result.png, Result.svg - multiple formats, proper encoding |
| subprocess + vm2 | E2B Code Interpreter | 2023 (vm2 deprecated) | OS-level isolation, 200ms startup, managed networking |

**Deprecated/outdated:**
- **vm2:** Deprecated 2023, use E2B or Firecracker-based solutions
- **Manual timeout with setTimeout():** Use E2B runCode({ timeoutMs })
- **String concatenation for multi-file:** Use E2B filesystem.writeFiles()
- **Ignoring tool-error parts:** AI SDK automatically forwards for recovery

## Open Questions

Things that couldn't be fully resolved:

1. **Pre-installed Package List**
   - What we know: E2B code-interpreter template includes "common data science packages"
   - What's unclear: Complete list of pre-installed packages and versions
   - Recommendation: **Assume pandas, matplotlib, seaborn, plotly, numpy are available**. For other packages, let AI install on-demand via pip install in code. Document package list in Phase 17 verification.

2. **Sandbox Reuse Strategy**
   - What we know: E2B supports reconnecting to running sandboxes (pause/resume)
   - What's unclear: Should Phase 17 reuse sandbox per conversation or create fresh per execution?
   - Recommendation: **Fresh per execution** for simplicity and guaranteed clean state. Reuse optimization can be added later if 200ms startup becomes bottleneck (unlikely given user perception thresholds).

3. **Error Recovery Aggressiveness**
   - What we know: AI SDK supports up to N steps via stopWhen(stepCountIs(N))
   - What's unclear: How many retry attempts before giving up? 3? 5? 10?
   - Recommendation: **5 steps maximum** (stopWhen(stepCountIs(5))). Balances error recovery with preventing infinite loops. User can always ask AI to try again manually.

4. **Stdout/Stderr Streaming Implementation**
   - What we know: E2B provides onStdout/onStderr callbacks during execution
   - What's unclear: Stream to client in real-time (SSE) or buffer and return after execution?
   - Recommendation: **Buffer for Phase 17** - simpler implementation, works with standard HTTP. Real-time streaming can be added in Phase 20 (Chat Interface & Polish) if needed for UX.

5. **Generated File Persistence**
   - What we know: CONTEXT.md states "preserve all generated files" (CSVs, visualizations)
   - What's unclear: How long to persist? Store in database? Download via API?
   - Recommendation: **Return file list in tool result, extract with filesystem.read() if user requests download**. Phase 19 (Visualization Rendering) will handle visualization display; other files can be lazy-loaded on user request.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- E2B Code Interpreter SDK: https://github.com/e2b-dev/code-interpreter (verified 2026-02-01)
- E2B Sandbox Persistence: https://e2b.dev/docs/sandbox/persistence (verified 2026-02-01)
- AI SDK Tool Calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling (verified 2026-02-01)
- AI SDK generateText Reference: https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text (verified 2026-02-01)

**TypeScript Definitions (Verified):**
- @e2b/code-interpreter v2.3.3: `/docs/node_modules/@e2b/code-interpreter/dist/index.d.ts`
  - Sandbox.create() API
  - runCode() options: timeoutMs, onStdout, onStderr, onResult, onError
  - Execution result structure: text, error, logs, results
  - ExecutionError: name, value, traceback
  - Filesystem API: write(), read(), writeFiles(), makeDir()
  - Context API: createCodeContext({ cwd, language })

**Package Versions (from package.json):**
- @e2b/code-interpreter: ^2.3.3 (installed)
- ai: ^6.0.64 (installed)
- zod: ^4.3.6 (installed)

**Current Implementation (Phase 15/16):**
- E2B client: `/docs/lib/mcp/e2b-client.ts` (basic sandbox creation)
- Tool aggregation: `/docs/lib/mcp/aggregate-tools.ts` (execute-python tool stub)
- Chat route: `/docs/app/api/chat/route.ts` (AI SDK streamText integration)

### Secondary (MEDIUM confidence)

- E2B pre-installed packages: Inferred from documentation mentions of "pandas, matplotlib, seaborn, plotly" (not comprehensive list verified)
- Error recovery best practices: Based on AI SDK documentation patterns (no official "best practices" guide)
- Multi-file project structure: Based on Python packaging conventions (PEP 420, PEP 328) applied to E2B filesystem

### Tertiary (LOW confidence - requires validation)

- Optimal retry count (5 steps): Based on reasoning about UX balance, not empirical data
- Stdout/stderr buffering vs streaming: Decision based on implementation complexity, not user research
- Sandbox reuse trade-offs: Startup time (200ms) vs complexity - needs performance testing to validate

## Metadata

**Confidence breakdown:**
- E2B timeout configuration: HIGH - Verified in TypeScript definitions (timeoutMs parameter documented)
- AI SDK error recovery: HIGH - Official documentation with code examples
- Multi-file support: HIGH - E2B filesystem API verified in TypeScript definitions
- Pre-installed packages: MEDIUM - Documentation mentions common packages but no comprehensive list
- Error recovery aggressiveness: MEDIUM - Pattern based on AI SDK capabilities, specific count (5) is recommendation
- Stdout/stderr streaming: MEDIUM - Technical capability confirmed, implementation strategy is recommendation
- Sandbox reuse strategy: MEDIUM - Both approaches viable, recommendation based on complexity analysis

**Research date:** 2026-02-01
**Valid until:** 2026-02-15 (14 days - E2B and AI SDK are actively developed, check for updates before Phase 17 execution)

**Critical dependencies:**
- E2B API key required (E2B_API_KEY environment variable)
- Phase 15 completion (sandbox setup and storage)
- Phase 16 completion (AI code generation with correct schemas)
- Database schema includes sandbox tracking fields (from Phase 15)

**Recommended pre-Phase-17 validation:**
- Test E2B runCode() with 30-second timeout in local development
- Verify multi-file project execution with package imports
- Test tool-error forwarding with intentionally broken code
- Measure sandbox creation time (should be ~200ms)
- Verify stdout/stderr callbacks receive output during execution
