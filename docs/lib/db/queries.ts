import { db } from "@/db";
import { messages, conversations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { MessagePart } from "@/db/schema";
import { ChatSDKError } from "@/lib/errors";

export interface DBMessage {
  id?: number;
  conversationId: number;
  role: string;
  parts: MessagePart[];
  createdAt: Date;
  executionStatus?: string | null;
  sandboxId?: string | null;
  mcpSource?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function saveMessages({ messages: msgs }: { messages: DBMessage[] }) {
  try {
    return await db.insert(messages).values(msgs);
  } catch (error) {
    console.error("Failed to save messages:", error);
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: number }) {
  try {
    const results = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    return results;
  } catch (error) {
    console.error("Failed to get messages:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get messages");
  }
}

export async function getConversationById({ id }: { id: number }) {
  try {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    return conversation;
  } catch (error) {
    console.error("Failed to get conversation:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get conversation");
  }
}

export async function saveConversation({
  userId,
  title,
}: {
  userId: string;
  title: string;
}) {
  try {
    const [conversation] = await db
      .insert(conversations)
      .values({ userId, title })
      .returning();

    return conversation;
  } catch (error) {
    console.error("Failed to save conversation:", error);
    throw new ChatSDKError("bad_request:database", "Failed to save conversation");
  }
}
