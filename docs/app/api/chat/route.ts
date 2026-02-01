import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  streamText,
} from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { datasetDiscoveryPrompt } from "@/lib/ai/prompts";
import { ChatSDKError } from "@/lib/errors";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { getAvailableTools } from "@/lib/mcp/aggregate-tools";
import { createGuestSession } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  saveMessages,
  getMessagesByChatId,
  saveChat,
  getChatById,
  deleteChatById,
  updateMessage,
  type DBMessage,
} from "@/lib/db/queries";
import { anthropic } from "@ai-sdk/anthropic";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    console.error("Schema validation error:", error);
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedVisibilityType } = requestBody;

    // 1. Ensure guest session exists
    let session = await auth.api.getSession({
      headers: await headers(),
    });

    let userId: string;

    if (!session?.user) {
      const guestData = await createGuestSession();
      userId = guestData.user.id;
    } else {
      userId = session.user.id;
    }

    // 2. Determine if this is a tool approval flow
    const isToolApprovalFlow = Boolean(messages);

    // 3. Get or create chat
    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];

    if (chat) {
      // Chat exists, load history if NOT tool approval flow
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      // New chat - create it
      await saveChat({
        id,
        userId: userId,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
    }

    // 4. Build UI messages array
    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    // 5. Save user message if present
    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    // 6. Convert to model messages format
    const modelMessages = await convertToModelMessages(uiMessages);

    // 7. Stream AI response
    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: anthropic("claude-sonnet-4-20250514"),
          system: datasetDiscoveryPrompt,
          messages: modelMessages,
          tools: await getAvailableTools(id),
        });

        dataStream.merge(result.toUIMessageStream());
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        // Save messages after streaming completes
        if (isToolApprovalFlow) {
          // Tool approval flow: update existing messages or create new ones
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts as any,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role as "user" | "assistant" | "system",
                    parts: finishedMsg.parts as any,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          // Normal flow: save all finished messages
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role as "user" | "assistant" | "system",
              parts: currentMessage.parts as any,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => "Oops, an error occurred!",
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          // ignore redis errors
        }
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (!chat || chat.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
