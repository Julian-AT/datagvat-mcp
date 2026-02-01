import { db } from "@/db";
import { chat, message, type Chat, type Message, type MessagePart, type Attachment } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { generateId } from "ai";
import { ChatSDKError } from "@/lib/errors";
import type { UIMessage } from "ai";

// DBMessage type for inserting messages
export type DBMessage = {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
  attachments: Attachment[];
  createdAt: Date;
};

/**
 * Save a new chat
 * From Vercel ai-chatbot pattern
 */
export async function saveChat({
  id,
  userId,
  title,
  visibility = "private"
}: {
  id: string;
  userId: string;
  title: string;
  visibility?: "private" | "public";
}) {
  try {
    return await db.insert(chat).values({
      id,
      userId,
      title,
      visibility,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Failed to save chat:", error);
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

/**
 * Save one or more messages (array handling)
 * From Vercel ai-chatbot pattern
 */
export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error("Failed to save messages:", error);
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

/**
 * Get all messages for a chat, ordered by creation time
 * From Vercel ai-chatbot pattern
 */
export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error("Failed to get messages:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get messages");
  }
}

/**
 * Get a single chat by ID
 * From Vercel ai-chatbot pattern
 */
export async function getChatById({ id }: { id: string }) {
  try {
    const chats = await db
      .select()
      .from(chat)
      .where(eq(chat.id, id))
      .limit(1);
    return chats[0] || null;
  } catch (error) {
    console.error("Failed to get chat:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get chat");
  }
}

/**
 * Get all chats for a user, ordered by most recent first
 * From Vercel ai-chatbot pattern - for chat history sidebar
 */
export async function getChatsByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get chats");
  }
}

/**
 * Converts database messages to AI SDK UIMessage format
 * This is CRITICAL for conversation history to work correctly
 *
 * From Vercel ai-chatbot pattern - fixes Issue 1 (chat memory not working)
 * Without this conversion, the LLM only sees the new message, not conversation history
 */
export function convertToUIMessages(dbMessages: Message[]): UIMessage[] {
  return dbMessages.map((msg) => {
    const contentArray = msg.parts.map((part) => {
      if (part.type === "text") {
        return { type: "text", text: part.text };
      }
      if (part.type === "tool-call") {
        return {
          type: "tool-call",
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.args
        };
      }
      if (part.type === "tool-result") {
        return {
          type: "tool-result",
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          result: part.result
        };
      }
      if (part.type === "file" || part.type === "visualization") {
        return {
          type: "file",
          data: part.url,
          mimeType: part.type === "visualization" ? "image/png" : "application/octet-stream"
        };
      }
      return part;
    });

    return {
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: contentArray as any,
      parts: contentArray as any, // UIMessage requires parts property
      createdAt: msg.createdAt
    } as UIMessage;
  });
}
