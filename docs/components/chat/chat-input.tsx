'use client';

import { type FormEvent, useRef, useState } from 'react';

/**
 * Chat Input Component
 *
 * Handles user text input with send/stop functionality.
 * Manages input state and focus for smooth UX.
 */
export function ChatInput({
  onSend,
  disabled,
  onStop,
  isStreaming,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  onStop?: () => void;
  isStreaming?: boolean;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return;
    }

    onSend(trimmedInput);
    setInput('');

    // Focus input after send
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about Austrian datasets..."
        disabled={disabled}
        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {isStreaming && onStop ? (
        <button
          type="button"
          onClick={onStop}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      )}
    </form>
  );
}
