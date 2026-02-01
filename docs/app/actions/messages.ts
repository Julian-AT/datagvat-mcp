'use server';

import { db } from '@/db';
import { chat, message, type MessagePart } from '@/db/schema';
import { eq, desc, lt, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

interface PaginatedMessages {
  messages: Array<{
    id: string;
    role: string;
    parts: MessagePart[];
    createdAt: Date;
  }>;
  nextCursor: string | null;
}

export async function createChat(title?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const [newChat] = await db
    .insert(chat)
    .values({
      userId: session.user.id,
      title: title || 'New Chat',
    })
    .returning();

  return newChat;
}

export async function getChats(userId: string) {
  return await db
    .select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.createdAt))
    .limit(20);
}

export async function createMessage(
  chatId: string,
  role: 'user' | 'assistant' | 'system',
  parts: MessagePart[],
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const [existingChat] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId))
    .limit(1);

  if (!existingChat || existingChat.userId !== session.user.id) {
    throw new Error('Unauthorized: chat not found or access denied');
  }

  const [msg] = await db
    .insert(message)
    .values({
      chatId,
      role,
      parts,
    })
    .returning();

  return msg;
}

export async function getMessages(
  chatId: string,
  cursor?: string,
  limit = 50
): Promise<PaginatedMessages> {
  const conditions = [eq(message.chatId, chatId)];

  if (cursor) {
    conditions.push(lt(message.id, cursor));
  }

  const results = await db
    .select({
      id: message.id,
      role: message.role,
      parts: message.parts,
      createdAt: message.createdAt,
    })
    .from(message)
    .where(and(...conditions))
    .orderBy(desc(message.createdAt))
    .limit(limit + 1);

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { messages: items, nextCursor };
}
