'use client';

import { useChat } from '@ai-sdk/react';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';

/**
 * Main Chat Interface Component
 *
 * Integrates useChat hook with custom message rendering and input components.
 * Manages chat state, error handling, and streaming status.
 */
export function ChatInterface() {
  const { messages, sendMessage, status, error, stop, clearError } = useChat({
    api: '/api/chat',
    onError: (err) => console.error('Chat error:', err),
  });

  const isStreaming = status === 'streaming';
  const isReady = status === 'ready';

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto border rounded-lg shadow-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg font-medium mb-2">
              Welcome to the data.gv.at MCP Testing Interface
            </p>
            <p className="text-sm">
              Ask questions about Austrian open datasets and see real-time tool invocations.
            </p>
          </div>
        )}
        <MessageList messages={messages} />

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/90">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => clearError()}
            className="text-destructive hover:text-destructive/80 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t p-4">
        <ChatInput
          onSend={(text) => sendMessage(text)}
          disabled={!isReady}
          onStop={isStreaming ? () => stop() : undefined}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
