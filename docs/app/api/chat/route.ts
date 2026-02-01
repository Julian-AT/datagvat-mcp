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

// Process visualizations asynchronously and save to database
async function processVisualizationsAsync(vizId: string, conversationId: number | undefined) {
  if (!conversationId) {
    console.error('[ProcessViz] No conversation ID available');
    return;
  }

  if (!visualizationCache.has(vizId)) {
    console.error('[ProcessViz] Visualization not in cache:', vizId);
    return;
  }

  const cachedVisualizations = visualizationCache.get(vizId)!;
  console.log('[ProcessViz] Processing', cachedVisualizations.length, 'visualizations');

  const visualizationParts: MessagePart[] = [];

  for (let i = 0; i < cachedVisualizations.length; i++) {
    const viz = cachedVisualizations[i];

    if (viz.png) {
      try {
        const url = await uploadImageFromBase64(
          viz.png,
          `viz-${Date.now()}-${i}.png`,
          conversationId
        );
        visualizationParts.push({
          type: 'visualization',
          format: 'png',
          url,
          metadata: { formats: viz.formats }
        });
        console.log('[ProcessViz] Uploaded PNG:', url);
      } catch (error) {
        console.error('[ProcessViz] Failed to upload PNG:', error);
      }
    }

    if (viz.svg) {
      try {
        const url = await uploadImageFromBase64(
          viz.svg,
          `viz-${Date.now()}-${i}.svg`,
          conversationId
        );
        visualizationParts.push({
          type: 'visualization',
          format: 'svg',
          url,
          metadata: { formats: viz.formats }
        });
        console.log('[ProcessViz] Uploaded SVG:', url);
      } catch (error) {
        console.error('[ProcessViz] Failed to upload SVG:', error);
      }
    }

    if (viz.html) {
      try {
        const url = await uploadVisualization(
          viz.html,
          `viz-${Date.now()}-${i}.html`,
          conversationId,
          'text/html'
        );
        visualizationParts.push({
          type: 'visualization',
          format: 'html',
          url,
          metadata: { formats: viz.formats }
        });
        console.log('[ProcessViz] Uploaded HTML:', url);
      } catch (error) {
        console.error('[ProcessViz] Failed to upload HTML:', error);
      }
    }
  }

  // Save visualization parts as a separate message
  if (visualizationParts.length > 0) {
    try {
      await db.insert(messagesTable).values({
        conversationId,
        role: 'assistant',
        parts: visualizationParts,
      });
      console.log('[ProcessViz] Saved', visualizationParts.length, 'visualization parts to DB');
    } catch (error) {
      console.error('[ProcessViz] Failed to save to DB:', error);
    }
  }

  // Clean up cache
  visualizationCache.delete(vizId);
  console.log('[ProcessViz] Cleaned up cache for', vizId);
}

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

    // Ensure conversation exists before streaming (needed for visualization uploads)
    if (!activeConversationId) {
      const conversation = await createConversationForUser(currentUserId, 'New Conversation');
      activeConversationId = conversation.id;
      console.log('[Chat] Created new conversation:', activeConversationId);
    }

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

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        // Get tools with conversationId for visualization upload
        const tools = await getAvailableTools(activeConversationId);

        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: datasetDiscoveryPrompt,
          messages: modelMessages,
          stopWhen: stepCountIs(20),
          tools,
          experimental_telemetry: {
            isEnabled: true,
            functionId: "stream-text",
          },
          experimental_transform: ({ tools, stopStream }) => {
            return new TransformStream({
              transform(chunk, controller) {
                try {
                  // Log all chunks to debug
                  if (chunk.type === 'tool-call') {
                    console.log('[Transform] Tool call:', chunk.toolName);
                  }

                  if (chunk.type === 'tool-result' && chunk.toolName === 'execute-python') {
                    console.log('[Transform] Tool result for execute-python');

                    // The field is 'output', not 'result'
                    const result = chunk.output as any;

                    try {
                      const resultStr = JSON.stringify(result, null, 2);
                      console.log('[Transform] Output structure:', resultStr.substring(0, 500));
                    } catch (e) {
                      console.log('[Transform] Could not stringify output:', e);
                    }

                    console.log('[Transform] Has visualizations field?', result && 'visualizations' in result);
                    console.log('[Transform] Visualizations:', result?.visualizations);

                    if (result?.visualizations?.[0]?.id) {
                      const vizId = result.visualizations[0].id;
                      console.log('[Transform] Found visualization ID:', vizId, 'cache has:', visualizationCache.has(vizId));

                      // Process asynchronously
                      if (visualizationCache.has(vizId)) {
                        console.log('[Transform] Scheduling async upload for:', vizId);
                        void processVisualizationsAsync(vizId, activeConversationId).catch(err => {
                          console.error('[Transform] Failed to process visualizations:', err);
                        });
                      }
                    } else {
                      console.log('[Transform] No visualization ID found in output');
                    }
                  }
                } catch (error) {
                  console.error('[Transform] Error processing chunk:', error);
                }

                // Pass through unchanged
                controller.enqueue(chunk);
              }
            });
          },
          onFinish: async ({ text, toolCalls, toolResults }) => {
            // Save messages after stream completes
            console.log('onFinish called with:', {
              toolResultsCount: toolResults?.length,
              toolNames: toolResults?.map(r => r.toolName),
              hasVisualizations: toolResults?.some(r =>
                r.toolName === 'execute-python' &&
                r.output &&
                typeof r.output === 'object' &&
                'visualizations' in r.output
              )
            });

            try {
              // Conversation should already exist (created before streaming)
              const convId = activeConversationId!;
              console.log('[onFinish] Using conversation:', convId);

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
                  const visualizationParts: MessagePart[] = [];

                  // Check if this is an execute-python result with cached visualizations
                  if (toolResult.toolName === 'execute-python' &&
                      typeof toolResult.output === 'object' &&
                      toolResult.output !== null &&
                      'visualizations' in toolResult.output) {
                    const result = toolResult.output as any;

                    if (Array.isArray(result.visualizations) && result.visualizations.length > 0) {
                      const vizMetadata = result.visualizations[0];
                      console.log('[Chat Route] Processing visualizations:', {
                        vizMetadata,
                        hasCacheId: !!vizMetadata.id,
                        cacheHasKey: vizMetadata.id ? visualizationCache.has(vizMetadata.id) : false,
                        cacheSize: visualizationCache.size
                      });

                      // Retrieve actual visualization data from cache
                      if (vizMetadata.id && visualizationCache.has(vizMetadata.id)) {
                        const cachedVisualizations = visualizationCache.get(vizMetadata.id);
                        console.log('[Chat Route] Retrieved from cache:', {
                          vizId: vizMetadata.id,
                          visualizationCount: cachedVisualizations.length,
                          hasData: cachedVisualizations.map(v => ({ png: !!v.png, svg: !!v.svg, html: !!v.html }))
                        });

                        // Upload each visualization to blob storage
                        for (let i = 0; i < cachedVisualizations.length; i++) {
                          const viz = cachedVisualizations[i];

                          // Upload PNG
                          if (viz.png) {
                            try {
                              const url = await uploadImageFromBase64(
                                viz.png,
                                `viz-${Date.now()}-${i}.png`,
                                convId
                              );
                              visualizationParts.push({
                                type: 'visualization',
                                format: 'png',
                                url,
                                metadata: { formats: viz.formats }
                              });
                            } catch (error) {
                              console.error('Failed to upload PNG visualization:', error);
                            }
                          }

                          // Upload SVG
                          if (viz.svg) {
                            try {
                              const url = await uploadImageFromBase64(
                                viz.svg,
                                `viz-${Date.now()}-${i}.svg`,
                                convId
                              );
                              visualizationParts.push({
                                type: 'visualization',
                                format: 'svg',
                                url,
                                metadata: { formats: viz.formats }
                              });
                            } catch (error) {
                              console.error('Failed to upload SVG visualization:', error);
                            }
                          }

                          // Upload HTML
                          if (viz.html) {
                            try {
                              const url = await uploadVisualization(
                                viz.html,
                                `viz-${Date.now()}-${i}.html`,
                                convId,
                                'text/html'
                              );
                              visualizationParts.push({
                                type: 'visualization',
                                format: 'html',
                                url,
                                metadata: { formats: viz.formats }
                              });
                            } catch (error) {
                              console.error('Failed to upload HTML visualization:', error);
                            }
                          }
                        }

                        // Clean up cache after processing
                        visualizationCache.delete(vizMetadata.id);
                      }
                    }
                  }

                  // Store tool result (now without base64 data)
                  responseParts.push({
                    type: 'tool-result',
                    toolCallId: toolResult.toolCallId,
                    toolName: toolResult.toolName,
                    result: toolResult.output,
                  });

                  // Add visualization parts separately
                  responseParts.push(...visualizationParts);
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
