import { geolocation } from "@vercel/functions";
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
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { datasetDiscoveryPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { getAvailableTools } from "@/lib/mcp/aggregate-tools";
import { createMessage, getMessages, createConversation } from "@/app/actions/messages";
import type { MessagePart } from "@/db/schema";
import { createGuestSession } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { conversations, messages as messagesTable } from "@/db/schema";
import { eq } from "drizzle-orm";


export const maxDuration = 60;

// Helper functions for chat route that bypass session checks
// (session is already validated at request start)
async function createConversationForUser(userId: string, title?: string) {
  const [conversation] = await db
    .insert(conversations)
    .values({
      userId,
      title: title || 'New Conversation',
    })
    .returning();
  return conversation;
}

async function createMessageForConversation(
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
  const [message] = await db
    .insert(messagesTable)
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

    console.log(json);
    requestBody = postRequestBodySchema.parse(json);
    console.log(requestBody);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  console.log(requestBody);

  try {
    // Ensure guest session exists for message persistence
    let session = await auth.api.getSession({
      headers: await headers(),
    });

    let currentUserId: string;

    if (!session?.user) {
      // Create guest session for anonymous users
      const guestData = await createGuestSession();
      currentUserId = guestData.user.id;
      // Note: Session cookie needs to be set for future requests
      // For now, we pass userId directly to avoid async session lookup issues
    } else {
      currentUserId = session.user.id;
    }

    const { messages, message, selectedChatModel, conversationId } = requestBody;

    const isToolApprovalFlow = Boolean(messages);

    const uiMessages = isToolApprovalFlow
    ? (messages as ChatMessage[])
    : [message as ChatMessage];

    // Load conversation history from database if conversationId provided
    let historicalMessages: ChatMessage[] = [];
    let activeConversationId = conversationId;

    if (conversationId) {
      try {
        const { messages: loadedMessages } = await getMessages(conversationId, 50);
        // Convert database messages to UI message format
        historicalMessages = loadedMessages.map(msg => ({
          id: generateUUID(),
          role: msg.role as 'user' | 'assistant',
          parts: msg.parts,
          createdAt: msg.createdAt.toISOString(),
        })) as ChatMessage[];
      } catch (error) {
        console.error('Failed to load conversation history:', error);
        // Continue without history rather than failing the request
      }
    }

    // Combine historical messages with new messages
    const allUIMessages = [...historicalMessages, ...uiMessages];
    const modelMessages = await convertToModelMessages(allUIMessages);

    // Aggregate tools from data.gv.at MCP and E2B
    const tools = await getAvailableTools();

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: datasetDiscoveryPrompt,
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          tools,
          experimental_telemetry: {
            isEnabled: true,
            functionId: "stream-text",
          },
          onFinish: async ({ text, toolCalls, toolResults }) => {
            // Save messages after stream completes
            try {
              // Create conversation if this is first message
              let convId = activeConversationId;
              if (!convId) {
                const conversation = await createConversationForUser(currentUserId, 'New Conversation');
                convId = conversation.id;
              }

              // Save user message
              const userMessage = uiMessages[uiMessages.length - 1];
              await createMessageForConversation(
                convId,
                'user',
                userMessage.parts as MessagePart[]
              );

              // Save assistant response
              // Convert response to MessagePart format
              const responseParts: MessagePart[] = [];

              // Add text content
              if (text) {
                responseParts.push({ type: 'text', text });
              }

              // Add tool calls
              if (toolCalls && toolCalls.length > 0) {
                for (const toolCall of toolCalls) {
                  responseParts.push({
                    type: 'tool-call',
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    args: toolCall.input as Record<string, unknown>,
                  });
                }
              }

              // Add tool results
              if (toolResults && toolResults.length > 0) {
                for (const toolResult of toolResults) {
                  responseParts.push({
                    type: 'tool-result',
                    toolCallId: toolResult.toolCallId,
                    toolName: toolResult.toolName,
                    result: toolResult.output,
                  });
                }
              }

              await createMessageForConversation(
                convId,
                'assistant',
                responseParts
              );

              console.log(`Messages saved to conversation ${convId}`);
            } catch (error) {
              // Don't fail the stream if persistence fails
              console.error('Failed to save messages:', error);
            }
          },
        });

        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
      },
      generateId: generateUUID,
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
