import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createE2BClient } from '@/lib/mcp/e2b-client';
import type { SandboxExecutionResult, ExecutionOptions } from '@/lib/mcp/types';

type SandboxWrapper = {
  runCode: (code: string, options?: ExecutionOptions) => Promise<SandboxExecutionResult>;
  kill: () => Promise<void>;
  sandboxId: string;
};

export interface TrackedSandbox {
  sandbox: SandboxWrapper;
  messageId: number;
}

export async function createTrackedSandbox(
  messageId: number
): Promise<TrackedSandbox> {
  const e2bClient = createE2BClient({
    apiKey: process.env.E2B_API_KEY || '',
    timeoutMs: 60 * 60 * 1000, // 1 hour (EXEC-06) - E2B auto-terminates
  });

  const sandbox = await e2bClient.createSandbox();

  await db
    .update(messages)
    .set({
      sandboxId: sandbox.sandboxId,
    })
    .where(eq(messages.id, messageId));

  return { sandbox, messageId };
}

export async function cleanupSandbox(messageId: number): Promise<void> {
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });

  if (!message?.sandboxId) {
    return;
  }

  await db
    .update(messages)
    .set({
      sandboxId: null,
    })
    .where(eq(messages.id, messageId));
}

export async function cleanupStaleSandbox(messageId: number): Promise<void> {
  await db
    .update(messages)
    .set({
      sandboxId: null,
    })
    .where(
      and(
        eq(messages.id, messageId),
        sql`sandbox_id IS NOT NULL`,
        sql`created_at < NOW() - INTERVAL '1 hour'`
      )
    );
}

export async function getSandboxForMessage(messageId: number): Promise<string | null> {
  await cleanupStaleSandbox(messageId);

  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    columns: {
      sandboxId: true,
    },
  });

  return message?.sandboxId || null;
}
