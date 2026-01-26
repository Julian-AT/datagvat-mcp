'use client';

import { useChat } from '@ai-sdk/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';

interface ChatInterfaceProps {
  /** Optional initial query to prefill the input */
  initialQuery?: string;
}

/**
 * Main Chat Interface Component
 *
 * Integrates useChat hook with custom message rendering and input components.
 * Manages chat state, error handling, and streaming status.
 * Supports initial query via props or URL parameter (?q=...).
 */
export function ChatInterface({ initialQuery }: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const [prefillValue, setPrefillValue] = useState<string>('');

  const { messages, sendMessage, status, error, stop, clearError } = useChat({
    api: '/api/chat',
    onError: (err) => console.error('Chat error:', err),
  });

  const isStreaming = status === 'streaming';
  const isReady = status === 'ready';

  // Handle initial query from props or URL params
  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    const query = initialQuery || queryFromUrl;

    if (query && messages.length === 0) {
      setPrefillValue(query);
    }
  }, [searchParams, initialQuery, messages.length]);

  // Clear prefill after it's been used
  const handleSend = (text: string) => {
    setPrefillValue('');
    sendMessage(text);
  };

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
            {prefillValue && (
              <p className="text-sm mt-4 text-primary">
                Query ready: Press Enter or click Send to try "{prefillValue}"
              </p>
            )}
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
          onSend={handleSend}
          disabled={!isReady}
          onStop={isStreaming ? () => stop() : undefined}
          isStreaming={isStreaming}
          initialValue={prefillValue}
        />
      </div>
    </div>
  );
}
