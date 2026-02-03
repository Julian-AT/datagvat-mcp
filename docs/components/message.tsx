'use client';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ToolUIPart } from 'ai';
import { useState } from 'react';
import type { ArtifactKind } from '@/components/artifact';
import type { Vote } from '@/lib/db/schema';
import type { ChatMessage } from '@/lib/types';
import { cn, sanitizeText } from '@/lib/utils';
import { useDataStream } from './data-stream-provider';
import { DocumentToolResult } from './document';
import { DocumentPreview } from './document-preview';
import { MessageContent } from './elements/message';
import { Response } from './elements/response';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from './elements/tool';
import { SparklesIcon } from './icons';
import { MessageActions } from './message-actions';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import { ToolApproval } from './tool-approval';
import { saveToolApprovalAction } from '@/app/[lang]/(chat)/actions';

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  userId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>['addToolApprovalResponse'];
  chatId: string;
  userId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter((part) => part.type === 'file');

  useDataStream();

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn('flex w-full items-start gap-2 md:gap-3', {
          'justify-end': message.role === 'user' && mode !== 'edit',
          'justify-start': message.role === 'assistant',
        })}
      >
        {message.role === 'assistant' && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn('flex flex-col', {
            'gap-2 md:gap-4': message.parts?.some((p) => p.type === 'text' && p.text?.trim()),
            'w-full':
              (message.role === 'assistant' &&
                (message.parts?.some((p) => p.type === 'text' && p.text?.trim()) ||
                  message.parts?.some(
                    (p) => p.type.startsWith('tool-') || p.type === 'dynamic-tool'
                  ))) ||
              mode === 'edit',
            'max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]':
              message.role === 'user' && mode !== 'edit',
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div className="flex flex-row justify-end gap-2" data-testid={'message-attachments'}>
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  attachment={{
                    name: attachment.filename ?? 'file',
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                  key={attachment.url}
                />
              ))}
            </div>
          )}

          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;

            if (type === 'reasoning') {
              const hasContent = part.text?.trim().length > 0;
              const isStreaming = 'state' in part && part.state === 'streaming';
              if (hasContent || isStreaming) {
                return (
                  <MessageReasoning
                    isLoading={isLoading || isStreaming}
                    key={key}
                    reasoning={part.text || ''}
                  />
                );
              }
            }

            if (type === 'text') {
              if (mode === 'view') {
                return (
                  <div key={key}>
                    <MessageContent
                      className={cn({
                        'wrap-break-word w-fit rounded-2xl px-3 py-2 text-right text-white':
                          message.role === 'user',
                        'bg-transparent px-0 py-0 text-left': message.role === 'assistant',
                      })}
                      data-testid="message-content"
                      style={message.role === 'user' ? { backgroundColor: '#006cff' } : undefined}
                    >
                      <Response>{sanitizeText(part.text)}</Response>
                    </MessageContent>
                  </div>
                );
              }

              if (mode === 'edit') {
                return (
                  <div className="flex w-full flex-row items-start gap-3" key={key}>
                    <div className="size-8" />
                    <div className="min-w-0 flex-1">
                      <MessageEditor
                        key={message.id}
                        message={message}
                        regenerate={regenerate}
                        setMessages={setMessages}
                        setMode={setMode}
                      />
                    </div>
                  </div>
                );
              }
            }

            // New AI SDK: dynamic tools use type "dynamic-tool" and expose toolName
            if (type === 'dynamic-tool') {
              const toolPart = part as {
                type: 'dynamic-tool';
                toolName: string;
                toolCallId: string;
                state: string;
                input: unknown;
                output?: unknown;
                errorText?: string;
                approval?: { id: string; approved?: boolean; reason?: string };
              };
              const { toolCallId, state, toolName } = toolPart;
              const approvalId = toolPart.approval?.id;
              const isDenied =
                state === 'output-denied' ||
                (state === 'approval-responded' && toolPart.approval?.approved === false);
              const widthClass = 'w-[min(100%,450px)]';

              // DEBUG: Log tool calls to trace approval flow
              console.log('[DEBUG] Dynamic tool detected:', {
                toolName,
                state,
                toolCallId,
                hasInput: !!toolPart.input,
                inputKeys: toolPart.input ? Object.keys(toolPart.input as Record<string, unknown>) : [],
                approvalId,
              });

              // Handle execute-python approval flow BEFORE generic switch
              if (toolName === 'execute-python' && state === 'approval-requested') {
                console.log('[DEBUG] Rendering ToolApproval component for execute-python');
                console.log('[DEBUG] Input:', toolPart.input);
                const input = toolPart.input as { code: string; files?: Array<{ path: string; content: string }> };

                return (
                  <ToolApproval
                    key={toolCallId}
                    toolCallId={toolCallId}
                    toolName="execute-python"
                    code={input.code}
                    files={input.files}
                    onApprove={async (toolCallId, approved, reason) => {
                      // Persist approval to database
                      await saveToolApprovalAction({
                        toolCallId,
                        chatId,
                        userId,
                        toolName: 'execute-python',
                        approved,
                        deniedReason: reason,
                        code: input.code,
                      });

                      // Send approval response to AI SDK
                      // When approved=false, AI SDK skips tool execution (no result generated)
                      // Verify AI SDK behavior: https://sdk.vercel.ai/docs/ai-sdk-ui/tool-approval
                      // The SDK's built-in approval flow handles execution prevention on denial
                      addToolApprovalResponse({
                        id: toolCallId,
                        approved,
                        reason,
                      });
                    }}
                  />
                );
              }

              // Handle execute-python approval-responded state
              if (toolName === 'execute-python' && state === 'approval-responded') {
                const isApproved = toolPart.approval?.approved === true;
                return (
                  <div className={widthClass} key={toolCallId}>
                    <Tool className="w-full" defaultOpen={true}>
                      <ToolHeader state={state as ToolUIPart['state']} type="tool-execute-python" />
                      <ToolContent>
                        <div className="px-4 py-3 text-muted-foreground text-sm">
                          {isApproved ? 'Code approved - executing...' : 'Execution denied by user'}
                        </div>
                      </ToolContent>
                    </Tool>
                  </div>
                );
              }

              // Handle execute-python output-denied state
              if (toolName === 'execute-python' && isDenied) {
                return (
                  <div className={widthClass} key={toolCallId}>
                    <Tool className="w-full" defaultOpen={true}>
                      <ToolHeader state="output-denied" type="tool-execute-python" />
                      <ToolContent>
                        <div className="px-4 py-3 text-muted-foreground text-sm">
                          Execution denied by user
                        </div>
                      </ToolContent>
                    </Tool>
                  </div>
                );
              }

              // Handle execute-python output-available state
              if (toolName === 'execute-python' && state === 'output-available') {
                return (
                  <div className={widthClass} key={toolCallId}>
                    <Tool className="w-full" defaultOpen={true}>
                      <ToolHeader state={state as ToolUIPart['state']} type="tool-execute-python" />
                      <ToolContent>
                        <ToolOutput
                          errorText={toolPart.errorText}
                          output={
                            <pre className="overflow-auto rounded border p-2 text-sm">
                              {typeof toolPart.output === 'object' && toolPart.output !== null
                                ? JSON.stringify(toolPart.output, null, 2)
                                : String(toolPart.output || '')}
                            </pre>
                          }
                        />
                      </ToolContent>
                    </Tool>
                  </div>
                );
              }

              switch (toolName) {
                case 'getWeather': {
                  if (state === 'output-available') {
                    return (
                      <div className={widthClass} key={toolCallId}>
                        <Weather
                          weatherAtLocation={
                            toolPart.output as React.ComponentProps<
                              typeof Weather
                            >['weatherAtLocation']
                          }
                        />
                      </div>
                    );
                  }
                  if (isDenied) {
                    return (
                      <div className={widthClass} key={toolCallId}>
                        <Tool className="w-full" defaultOpen={true}>
                          <ToolHeader state="output-denied" type="tool-getWeather" />
                          <ToolContent>
                            <div className="px-4 py-3 text-muted-foreground text-sm">
                              Weather lookup was denied.
                            </div>
                          </ToolContent>
                        </Tool>
                      </div>
                    );
                  }
                  if (state === 'approval-responded') {
                    return (
                      <div className={widthClass} key={toolCallId}>
                        <Tool className="w-full" defaultOpen={true}>
                          <ToolHeader state={state as ToolUIPart['state']} type="tool-getWeather" />
                          <ToolContent>
                            <ToolInput input={toolPart.input} />
                          </ToolContent>
                        </Tool>
                      </div>
                    );
                  }
                  return (
                    <div className={widthClass} key={toolCallId}>
                      <Tool className="w-full" defaultOpen={true}>
                        <ToolHeader state={state as ToolUIPart['state']} type="tool-getWeather" />
                        <ToolContent>
                          {(state === 'input-available' || state === 'approval-requested') && (
                            <ToolInput input={toolPart.input} />
                          )}
                          {state === 'approval-requested' && approvalId && (
                            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                              <button
                                className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                                onClick={() => {
                                  addToolApprovalResponse({
                                    id: approvalId,
                                    approved: false,
                                    reason: 'User denied weather lookup',
                                  });
                                }}
                                type="button"
                              >
                                Deny
                              </button>
                              <button
                                className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                                onClick={() => {
                                  addToolApprovalResponse({
                                    id: approvalId,
                                    approved: true,
                                  });
                                }}
                                type="button"
                              >
                                Allow
                              </button>
                            </div>
                          )}
                        </ToolContent>
                      </Tool>
                    </div>
                  );
                }

                case 'createDocument': {
                  if (
                    toolPart.output &&
                    typeof toolPart.output === 'object' &&
                    'error' in toolPart.output
                  ) {
                    return (
                      <div
                        className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
                        key={toolCallId}
                      >
                        Error creating document:{' '}
                        {String((toolPart.output as { error: unknown }).error)}
                      </div>
                    );
                  }
                  return (
                    <DocumentPreview
                      isReadonly={isReadonly}
                      key={toolCallId}
                      result={toolPart.output}
                    />
                  );
                }

                case 'updateDocument': {
                  if (
                    toolPart.output &&
                    typeof toolPart.output === 'object' &&
                    'error' in toolPart.output
                  ) {
                    return (
                      <div
                        className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
                        key={toolCallId}
                      >
                        Error updating document:{' '}
                        {String((toolPart.output as { error: unknown }).error)}
                      </div>
                    );
                  }
                  return (
                    <div className="relative" key={toolCallId}>
                      <DocumentPreview
                        args={{
                          ...(typeof toolPart.output === 'object' && toolPart.output !== null
                            ? toolPart.output
                            : {}),
                          isUpdate: true,
                        }}
                        isReadonly={isReadonly}
                        result={toolPart.output}
                      />
                    </div>
                  );
                }

                case 'requestSuggestions': {
                  return (
                    <Tool defaultOpen={true} key={toolCallId}>
                      <ToolHeader
                        state={state as ToolUIPart['state']}
                        type="tool-requestSuggestions"
                      />
                      <ToolContent>
                        {state === 'input-available' && <ToolInput input={toolPart.input} />}
                        {state === 'output-available' && (
                          <ToolOutput
                            errorText={toolPart.errorText}
                            output={
                              toolPart.output &&
                              typeof toolPart.output === 'object' &&
                              'error' in toolPart.output ? (
                                <div className="rounded border p-2 text-red-500">
                                  Error: {String((toolPart.output as { error: unknown }).error)}
                                </div>
                              ) : (
                                <DocumentToolResult
                                  isReadonly={isReadonly}
                                  result={
                                    toolPart.output as {
                                      id: string;
                                      title: string;
                                      kind: ArtifactKind;
                                    }
                                  }
                                  type="request-suggestions"
                                />
                              )
                            }
                          />
                        )}
                      </ToolContent>
                    </Tool>
                  );
                }

                default:
                  // Unknown dynamic tool: render generic tool UI
                  return (
                    <Tool defaultOpen={true} key={toolCallId}>
                      <ToolHeader
                        state={state as ToolUIPart['state']}
                        type={`tool-${toolName}` as 'tool-getWeather'}
                      />
                      <ToolContent>
                        {(state === 'input-available' || state === 'approval-requested') && (
                          <ToolInput input={toolPart.input} />
                        )}
                        {state === 'output-available' && toolPart.output !== undefined && (
                          <ToolOutput
                            errorText={toolPart.errorText}
                            output={
                              <pre className="overflow-auto rounded border p-2 text-sm">
                                {JSON.stringify(toolPart.output, null, 2)}
                              </pre>
                            }
                          />
                        )}
                        {state === 'output-error' && toolPart.errorText && (
                          <div className="rounded border p-2 text-red-500">
                            {toolPart.errorText}
                          </div>
                        )}
                      </ToolContent>
                    </Tool>
                  );
              }
            }

            return null;
          })}

          {!isReadonly && (
            <MessageActions
              chatId={chatId}
              isLoading={isLoading}
              key={`action-${message.id}`}
              message={message}
              setMode={setMode}
              vote={vote}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <SparklesIcon size={14} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Thinking</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
