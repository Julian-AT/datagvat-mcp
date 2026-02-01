import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  streamText,
} from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { datasetDiscoveryPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
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
  convertToUIMessages,
} from "@/lib/db/queries";
import { anthropic } from "@ai-sdk/anthropic";


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
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
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

    const { messages: uiMessages, chatId } = requestBody;

    // 2. Ensure chat exists
    let existingChat = await getChatById({ id: chatId });
    if (!existingChat) {
      await saveChat({
        id: chatId,
        userId: userId,
        title: uiMessages[0]?.parts?.[0]?.text?.slice(0, 100) || "New Chat",
        visibility: "private"
      });
    }

    // 3. CRITICAL: Load conversation history from database
    const dbMessages = await getMessagesByChatId({ id: chatId });
    const historicalMessages = convertToUIMessages(dbMessages);

    // 4. Merge historical messages with new message
    const allMessages = [...historicalMessages, ...uiMessages];

    // 5. Save user message BEFORE streaming starts (fixes data loss on stream failure)
    const userMessage = {
      id: generateId(),
      chatId,
      role: "user" as const,
      parts: uiMessages[0].parts,
      attachments: [],
      createdAt: new Date()
    };
    await saveMessages({ messages: [userMessage] });

    // 6. Stream response with ALL messages (historical + new)
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          model: anthropic("claude-sonnet-4-20250514"),
          system: datasetDiscoveryPrompt,
          messages: allMessages,  // Include full conversation history
          tools: await getAvailableTools(chatId),
          maxSteps: 10
        });

        writer.merge(result.toUIMessageStream());
      },
      onFinish: async ({ messages: finishedMessages }) => {
        // 7. Save assistant response after stream completes
        const assistantMessage = {
          id: generateId(),
          chatId,
          role: "assistant" as const,
          parts: finishedMessages[finishedMessages.length - 1].parts,
          attachments: [],
          createdAt: new Date()
        };

        try {
          await saveMessages({ messages: [assistantMessage] });
        } catch (error) {
          console.error("Failed to save assistant message:", error);
          // Don't throw - message already streamed to user
        }
      }
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
    console.log(error);

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
