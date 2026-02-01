'use server';

import { db } from '@/db';
import { conversations, messages, type MessagePart } from '@/db/schema';
import { eq, desc, lt, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

interface PaginatedMessages {
  messages: Array<{
    id: number;
    role: string;
    parts: MessagePart[];
    createdAt: Date;
    executionStatus: string | null;
  }>;
  nextCursor: number | null;
}

export async function createConversation(title?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      userId: session.user.id,
      title: title || 'New Conversation',
    })
    .returning();

  return conversation;
}

export async function getConversations(userId: string) {
  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(20);
}

export async function createMessage(
  conversationId: number,
  role: 'user' | 'assistant' | 'system',
  parts: MessagePart[],
  options?: {
    executionStatus?: string;
    sandboxId?: string;
    mcpSource?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation || conversation.userId !== session.user.id) {
    throw new Error('Unauthorized: conversation not found or access denied');
  }

  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      role,
      parts,
      executionStatus: options?.executionStatus || 'pending',
      sandboxId: options?.sandboxId,
      mcpSource: options?.mcpSource,
      metadata: options?.metadata,
    })
    .returning();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return message;
}

export async function getMessages(
  conversationId: number,
  cursor?: number,
  limit = 50
): Promise<PaginatedMessages> {
  const conditions = [eq(messages.conversationId, conversationId)];

  if (cursor) {
    conditions.push(lt(messages.id, cursor));
  }

  const results = await db
    .select({
      id: messages.id,
      role: messages.role,
      parts: messages.parts,
      createdAt: messages.createdAt,
      executionStatus: messages.executionStatus,
    })
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1);

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { messages: items, nextCursor };
}

export async function updateMessageExecutionStatus(
  messageId: number,
  status: 'pending' | 'approved' | 'executed' | 'rejected'
) {
  const [existing] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!existing) {
    throw new Error('Message not found');
  }

  if (existing.executionStatus === 'executed') {
    throw new Error('Cannot change status of already executed message');
  }

  await db
    .update(messages)
    .set({ executionStatus: status })
    .where(eq(messages.id, messageId));
}
