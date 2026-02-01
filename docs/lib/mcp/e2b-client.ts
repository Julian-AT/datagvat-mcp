import { Sandbox } from '@e2b/code-interpreter';
import type { E2BClientConfig, SandboxExecutionResult, ExecutionOptions, ProjectFile } from './types';

const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour (EXEC-06 requirement)
const EXECUTION_TIMEOUT_MS = 30 * 1000; // 30 seconds (EXEC-05)

export function createE2BClient(config: E2BClientConfig) {
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    createSandbox: () => createSandbox(config.apiKey, timeoutMs),
  };
}

export async function createSandbox(apiKey: string, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const sandbox = await Sandbox.create({
    apiKey,
    timeoutMs,
  });

  return {
    runCode: async (code: string, options?: ExecutionOptions): Promise<SandboxExecutionResult> => {
      if (options?.files && options.files.length > 0) {
        await sandbox.files.write(
          options.files.map(f => ({
            path: `/home/user/${f.path}`,
            data: f.content,
          }))
        );
      }

      const timeoutMs = options?.timeoutMs ?? EXECUTION_TIMEOUT_MS;

      const stdoutLines: string[] = [];
      const stderrLines: string[] = [];

      const execution = await sandbox.runCode(code, {
        timeoutMs,
        onStdout: (output) => stdoutLines.push(output.line),
        onStderr: (output) => stderrLines.push(output.line),
      });

      return {
        success: !execution.error,
        text: execution.text ?? '',
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
          .filter(r => r.png || r.svg || r.html)
          .map(r => ({
            formats: r.formats(),
            png: r.png,
            svg: r.svg,
            html: r.html,
          })),
      };
    },
    kill: async () => {
      await sandbox.kill();
    },
    sandboxId: sandbox.sandboxId,
  };
}
