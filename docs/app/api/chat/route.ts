import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { datasetDiscoveryPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { getAvailableTools } from "@/lib/mcp/aggregate-tools";
import type { MessagePart } from "@/db/schema";
import { createGuestSession } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  saveMessages,
  getMessagesByChatId,
  saveConversation
} from "@/lib/db/queries";


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

    const { messages, message, selectedChatModel, conversationId } = requestBody;

    const uiMessages = messages ? (messages as ChatMessage[]) : [message as ChatMessage];

    // 2. Ensure conversation exists
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const conversation = await saveConversation({
        userId,
        title: "New Conversation",
      });
      activeConversationId = conversation.id;
    }

    // 3. Load conversation history
    let historicalMessages: ChatMessage[] = [];

    if (conversationId) {
      try {
        const dbMessages = await getMessagesByChatId({ id: conversationId });
        historicalMessages = dbMessages.map(msg => ({
          id: String(msg.id),
          role: msg.role as 'user' | 'assistant',
          parts: msg.parts,
          createdAt: msg.createdAt.toISOString(),
        })) as ChatMessage[];
      } catch (error) {
        console.error('Failed to load conversation history:', error);
        // Continue without history rather than failing the request
      }
    }

    // 4. IMMEDIATE PERSISTENCE: Save user message BEFORE streaming
    const userMessage = uiMessages[uiMessages.length - 1];
    await saveMessages({
      messages: [{
        conversationId: activeConversationId,
        role: "user",
        parts: userMessage.parts as MessagePart[],
        createdAt: new Date(),
      }],
    });

    // 5. Combine historical + new messages
    const allUIMessages = [...historicalMessages, ...uiMessages];
    const modelMessages = await convertToModelMessages(allUIMessages);

    // 6. Stream response (NO experimental_transform)
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const tools = await getAvailableTools();

        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: datasetDiscoveryPrompt,
          messages: modelMessages,
          tools,
          stopWhen: stepCountIs(20),
          experimental_telemetry: {
            isEnabled: true,
            functionId: "stream-text",
          },
        });

        writer.merge(result.toUIMessageStream({ sendReasoning: true }));
      },
      onFinish: async ({ messages: finishedMessages }) => {
        // 7. Save assistant response after stream completes
        const assistantMessage = finishedMessages[finishedMessages.length - 1];

        try {
          await saveMessages({
            messages: [{
              conversationId: activeConversationId,
              role: "assistant",
              parts: assistantMessage.parts as MessagePart[],
              createdAt: new Date(),
            }],
          });
        } catch (error) {
          // Log but don't fail stream if persistence fails
          console.error("Failed to save assistant message:", error);
        }
      },
      generateId: generateUUID,
      onError: () => "An error occurred while processing your request.",
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
