'use client';

import type { UIMessage } from '@ai-sdk/react';

/**
 * Message List Component
 *
 * Renders chat messages with support for text, tool-call, and tool-result parts.
 * Handles layout for user vs assistant messages with distinct styling.
 */
export function MessageList({ messages }: { messages: UIMessage[] }) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
          >
            {/* Role Label */}
            <div className="text-xs font-medium mb-1 opacity-70">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>

            {/* Message Parts */}
            <div className="space-y-2">
              {message.parts.map((part, idx) => {
                // Text content
                if (part.type === 'text') {
                  return (
                    <div
                      key={`${message.id}-text-${idx}`}
                      className="prose prose-sm dark:prose-invert max-w-none"
                    >
                      <p className="whitespace-pre-wrap m-0">{part.text}</p>
                    </div>
                  );
                }

                // Tool call
                if (part.type === 'tool-call') {
                  return (
                    <div
                      key={`${message.id}-tool-call-${part.toolCallId}`}
                      className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-sm"
                    >
                      <div className="flex items-center gap-1 font-medium mb-1">
                        <span>🔧</span>
                        <span>Calling tool: {part.toolName}</span>
                      </div>
                      <pre className="text-xs overflow-x-auto bg-black/5 p-2 rounded">
                        {JSON.stringify(part.args, null, 2)}
                      </pre>
                    </div>
                  );
                }

                // Tool result
                if (part.type === 'tool-result') {
                  return (
                    <div
                      key={`${message.id}-tool-result-${part.toolCallId}`}
                      className="bg-green-500/10 border border-green-500/20 rounded p-2 text-sm"
                    >
                      <div className="flex items-center gap-1 font-medium mb-1">
                        <span>✅</span>
                        <span>Tool result: {part.toolName}</span>
                      </div>
                      <pre className="text-xs overflow-x-auto max-h-40 overflow-y-auto bg-black/5 p-2 rounded">
                        {JSON.stringify(part.result, null, 2)}
                      </pre>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
