import { Sandbox } from '@e2b/code-interpreter';
import { uploadImageFromBase64, uploadHtml } from '@/lib/blob';

const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour sandbox lifetime
const EXECUTION_TIMEOUT_MS = 30 * 1000; // 30 second execution timeout (E2B-05 requirement)

export type ExecutionOutput = {
  type: 'stdout' | 'stderr' | 'visualization';
  content: string;
  timestamp: string;
};

export type ExecutionResult = {
  success: boolean;
  outputs: ExecutionOutput[];
  error?: string;
  e2bSandboxId?: string;
};

/**
 * Execute Python code in E2B sandbox with streaming output and visualization upload.
 *
 * Key features:
 * - Reuses existing sandbox via e2bSandboxId (RESEARCH.md Pitfall 3)
 * - Streams output via onStdout/onStderr callbacks
 * - 30-second execution timeout (E2B-05 requirement)
 * - Uploads visualizations to Vercel Blob (VIZ-03 requirement)
 * - Persistent workspace model (doesn't kill sandbox after execution)
 */
export async function executeSandboxCode({
  code,
  e2bSandboxId,
  chatId,
  onOutput,
}: {
  code: string;
  e2bSandboxId?: string;
  chatId: string;
  onOutput?: (output: { type: string; content: string }) => void;
}): Promise<ExecutionResult> {
  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;
  const outputs: ExecutionOutput[] = [];

  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      outputs: [
        {
          type: 'stderr',
          content: 'Error: E2B_API_KEY not configured',
          timestamp: new Date().toISOString(),
        },
      ],
      error: 'E2B_API_KEY not configured',
    };
  }

  try {
    // Reuse existing sandbox or create new one (RESEARCH.md Pitfall 3)
    if (e2bSandboxId) {
      try {
        sandbox = await Sandbox.connect(e2bSandboxId, { apiKey });
      } catch {
        // Sandbox died or expired, create new one
        sandbox = await Sandbox.create({ apiKey, timeoutMs: DEFAULT_TIMEOUT_MS });
      }
    } else {
      sandbox = await Sandbox.create({ apiKey, timeoutMs: DEFAULT_TIMEOUT_MS });
    }

    const stdoutLines: string[] = [];
    const stderrLines: string[] = [];

    const execution = await sandbox.runCode(code, {
      timeoutMs: EXECUTION_TIMEOUT_MS,
      onStdout: (output) => {
        const line = output.line;
        stdoutLines.push(line);
        const outputEntry = {
          type: 'stdout' as const,
          content: line,
          timestamp: new Date().toISOString(),
        };
        outputs.push(outputEntry);
        onOutput?.(outputEntry);
      },
      onStderr: (output) => {
        const line = output.line;
        stderrLines.push(line);
        const outputEntry = {
          type: 'stderr' as const,
          content: line,
          timestamp: new Date().toISOString(),
        };
        outputs.push(outputEntry);
        onOutput?.(outputEntry);
      },
    });

    // Handle execution errors
    if (execution.error) {
      let errorMessage = execution.error.value;
      if (execution.error.name === 'TimeoutError') {
        errorMessage +=
          '\n\nCode execution exceeded 30-second limit. Consider:\n- Breaking into smaller chunks\n- Reducing dataset size\n- Optimizing loops or vectorizing operations';
      }
      outputs.push({
        type: 'stderr',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      });
      onOutput?.({ type: 'stderr', content: `Error: ${errorMessage}` });
    }

    // Handle visualizations (upload to blob storage - VIZ-03 requirement)
    const visualizationResults = execution.results.filter(
      (r) => r.png || r.svg || r.html
    );

    if (visualizationResults.length > 0) {
      for (const viz of visualizationResults) {
        // Upload PNG if present (most common for matplotlib)
        if (viz.png) {
          try {
            const url = await uploadImageFromBase64(
              viz.png,
              `sandbox-viz-${Date.now()}.png`,
              chatId
            );

            const vizOutput = {
              type: 'visualization' as const,
              content: url,
              timestamp: new Date().toISOString(),
            };
            outputs.push(vizOutput);
            onOutput?.({ type: 'visualization', content: url });
          } catch (uploadError) {
            console.error('Failed to upload PNG visualization:', uploadError);
          }
        }

        // Upload SVG if present
        if (viz.svg) {
          try {
            const url = await uploadImageFromBase64(
              viz.svg,
              `sandbox-viz-${Date.now()}.svg`,
              chatId
            );

            const vizOutput = {
              type: 'visualization' as const,
              content: url,
              timestamp: new Date().toISOString(),
            };
            outputs.push(vizOutput);
            onOutput?.({ type: 'visualization', content: url });
          } catch (uploadError) {
            console.error('Failed to upload SVG visualization:', uploadError);
          }
        }

        // Upload HTML if present (interactive visualizations like plotly)
        if (viz.html) {
          try {
            const url = await uploadHtml(
              viz.html,
              `sandbox-viz-${Date.now()}.html`,
              chatId
            );

            const vizOutput = {
              type: 'visualization' as const,
              content: url,
              timestamp: new Date().toISOString(),
            };
            outputs.push(vizOutput);
            onOutput?.({ type: 'visualization', content: url });
          } catch (uploadError) {
            console.error('Failed to upload HTML visualization:', uploadError);
          }
        }
      }
    }

    return {
      success: !execution.error,
      outputs,
      e2bSandboxId: sandbox.sandboxId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown execution error';

    outputs.push({
      type: 'stderr',
      content: `Error: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      outputs,
      error: errorMessage,
      e2bSandboxId: sandbox?.sandboxId,
    };
  }
  // DON'T kill sandbox - reuse it (CONTEXT.md: persistent workspace model)
  // Sandbox cleanup happens when user closes artifact or after timeout (1 hour)
}
