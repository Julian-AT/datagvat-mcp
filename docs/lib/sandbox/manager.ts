import { createE2BClient } from '@/lib/mcp/e2b-client';
import type { ExecutionOptions, SandboxExecutionResult } from '@/lib/mcp/types';

type SandboxWrapper = {
  runCode: (code: string, options?: ExecutionOptions) => Promise<SandboxExecutionResult>;
  kill: () => Promise<void>;
  sandboxId: string;
};

export interface TrackedSandbox {
  sandbox: SandboxWrapper;
  messageId: string;
}

export async function createTrackedSandbox(messageId: string): Promise<TrackedSandbox> {
  const e2bClient = createE2BClient({
    apiKey: process.env.E2B_API_KEY || '',
    timeoutMs: 60 * 60 * 1000,
  });

  const sandbox = await e2bClient.createSandbox();

  return { sandbox, messageId };
}

export async function cleanupSandbox(_messageId: string): Promise<void> {
  return;
}

export async function cleanupStaleSandbox(_messageId: string): Promise<void> {
  return;
}

export async function getSandboxForMessage(_messageId: string): Promise<string | null> {
  return null;
}
