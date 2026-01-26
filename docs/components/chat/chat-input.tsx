'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  onStop?: () => void;
  isStreaming?: boolean;
  /** Initial value to prefill the input */
  initialValue?: string;
}

/**
 * Chat Input Component
 *
 * Handles user text input with send/stop functionality.
 * Manages input state and focus for smooth UX.
 * Supports prefilling via initialValue prop.
 */
export function ChatInput({
  onSend,
  disabled,
  onStop,
  isStreaming,
  initialValue = '',
}: ChatInputProps) {
  const [input, setInput] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      // Focus and select the prefilled text
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [initialValue]);

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
