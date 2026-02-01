import { Sandbox } from '@e2b/code-interpreter';
import type { E2BClientConfig, SandboxExecutionResult } from './types';

const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour (EXEC-06 requirement)

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
    runCode: async (code: string): Promise<SandboxExecutionResult> => {
      const execution = await sandbox.runCode(code);

      return {
        text: execution.text ?? '',
        error: execution.error ? `${execution.error.name}: ${execution.error.value}` : undefined,
        logs: execution.logs?.stdout,
      };
    },
    kill: async () => {
      await sandbox.kill();
    },
    sandboxId: sandbox.sandboxId,
  };
}
