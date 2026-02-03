import { geolocation } from '@vercel/functions';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from 'ai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';
import { generateTitleFromUserMessage } from '@/app/[lang]/(chat)/actions';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import { getLanguageModel } from '@/lib/ai/providers';
import { auth } from '@/lib/auth';
import { guestRegex, isProductionEnvironment } from '@/lib/constants';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from '@/lib/db/queries';
import type { DBMessage } from '@/lib/db/schema';
import { ChatSDKError } from '@/lib/errors';
import { getAvailableTools } from '@/lib/mcp/aggregate-tools';
import type { ChatMessage, UserType } from '@/lib/types';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { type PostRequestBody, postRequestBodySchema } from './schema';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { openSandbox } from '@/lib/ai/tools/open-sandbox';

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
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } = requestBody;

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = guestRegex.test(session.user.email) ? 'guest' : 'regular';

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === 'user') {
      await saveChat({
        id,
        userId: session.user.id,
        title: 'New chat',
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === 'user') {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: 'user',
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const isReasoningModel =
      selectedChatModel.includes('reasoning') || selectedChatModel.includes('thinking');

    const modelMessages = await convertToModelMessages(uiMessages);

    const tools = await getAvailableTools(id);

    console.log('[DEBUG] Available tools:', Object.keys(tools));
    console.log('[DEBUG] execute-python has needsApproval:',
      tools['execute-python']?.spec?.needsApproval ||
      tools['execute-python']?.needsApproval ||
      'property not found'
    );


    
    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: modelMessages,
          stopWhen: stepCountIs(20),
          providerOptions: isReasoningModel
            ? {
                anthropic: {
                  thinking: { type: 'enabled', budgetTokens: 10_000 },
                },
              }
            : undefined,
          tools: {
            ...tools,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({ session, dataStream }),
            openSandbox: openSandbox({ session, dataStream }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: 'data-chat-title', data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        const messagesToSave = finishedMessages.map((msg) => ({
          ...msg,
          parts: msg.parts.filter((part) => {
            if ('state' in part) {
              const approvalStates = ['approval-requested', 'approval-responded'];
              return !approvalStates.includes(part.state as string);
            }
            return true;
          }),
        }));

        if (isToolApprovalFlow) {
          for (const cleanedMsg of messagesToSave) {
            const existingMsg = uiMessages.find((m) => m.id === cleanedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: cleanedMsg.id,
                parts: cleanedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: cleanedMsg.id,
                    role: cleanedMsg.role,
                    parts: cleanedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (messagesToSave.length > 0) {
          await saveMessages({
            messages: messagesToSave.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => 'Oops, an error occurred!',
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
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(streamId, () => sseStream);
          }
        } catch (_) {
          // ignore redis errors
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get('x-vercel-id');

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes('AI Gateway requires a valid credit card on file to service requests')
    ) {
      return new ChatSDKError('bad_request:activate_gateway').toResponse();
    }

    console.error('Unhandled error in chat API:', error, { vercelId });
    return new ChatSDKError('offline:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
