"use server";

import { auth } from "@/lib/auth";
import { saveChat, getChatById, getChatsByUserId } from "@/lib/db/queries";
import { generateId } from "ai";
import { headers } from "next/headers";

export async function createChatAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const chatId = generateId();
  await saveChat({
    id: chatId,
    userId: session.user.id,
    title: "New Chat",
    visibility: "private"
  });

  return { chatId };
}

export async function getChatAction(chatId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const chat = await getChatById({ id: chatId });

  // Verify ownership
  if (chat?.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  return chat;
}

export async function getChatHistoryAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await getChatsByUserId({ userId: session.user.id });
}
