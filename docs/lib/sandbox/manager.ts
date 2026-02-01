import { createE2BClient } from '@/lib/mcp/e2b-client';
import type { SandboxExecutionResult, ExecutionOptions } from '@/lib/mcp/types';

type SandboxWrapper = {
  runCode: (code: string, options?: ExecutionOptions) => Promise<SandboxExecutionResult>;
  kill: () => Promise<void>;
  sandboxId: string;
};

export interface TrackedSandbox {
  sandbox: SandboxWrapper;
  messageId: string;
}

/**
 * Create a sandbox for a message
 *
 * Note: Sandbox tracking removed in Phase 17.1 - Vercel schema has no sandboxId column.
 * Phase 18 (Tool Approval Flow) will implement proper sandbox lifecycle tracking.
 */
export async function createTrackedSandbox(
  messageId: string
): Promise<TrackedSandbox> {
  const e2bClient = createE2BClient({
    apiKey: process.env.E2B_API_KEY || '',
    timeoutMs: 60 * 60 * 1000, // 1 hour (EXEC-06) - E2B auto-terminates
  });

  const sandbox = await e2bClient.createSandbox();

  // Removed: sandboxId tracking (no column in Vercel schema)
  // Phase 18 will add proper sandbox tracking with approval flow

  return { sandbox, messageId };
}

/**
 * Cleanup sandbox for a message
 * No-op: Sandbox tracking deferred to Phase 18
 */
export async function cleanupSandbox(messageId: string): Promise<void> {
  // No-op: Sandbox tracking deferred to Phase 18
  return;
}

/**
 * Cleanup stale sandbox for a message
 * No-op: Sandbox tracking deferred to Phase 18
 */
export async function cleanupStaleSandbox(messageId: string): Promise<void> {
  // No-op: Sandbox tracking deferred to Phase 18
  return;
}

/**
 * Get sandbox ID for a message
 * No-op: Sandbox tracking deferred to Phase 18
 */
export async function getSandboxForMessage(messageId: string): Promise<string | null> {
  // No-op: Sandbox tracking deferred to Phase 18
  return null;
}
