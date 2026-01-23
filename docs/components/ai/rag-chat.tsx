'use client';
import { type UIMessage, type UseChatHelpers, useChat } from '@ai-sdk/react';
import { Presence } from '@radix-ui/react-presence';
import { DefaultChatTransport } from 'ai';
import Link from 'fumadocs-core/link';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { BookOpenIcon, Loader2, RefreshCw, Send, X } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type SyntheticEvent,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/cn';
import { Markdown } from './markdown';

interface Citation {
  number: string;
  url: string;
  title: string;
  section: string;
}

interface RetrievedChunk {
  text: string;
  url: string;
  title: string;
  section: string;
  score: number;
}

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  chat: UseChatHelpers<UIMessage>;
} | null>(null);

function useChatContext() {
  return use(Context)?.chat;
}

function Header() {
  // biome-ignore lint/style/noNonNullAssertion: Context guaranteed to exist within RAGChatProvider
  const { setOpen } = use(Context)!;

  return (
    <div className="sticky top-0 flex items-start gap-2">
      <div className="flex-1 p-3 border rounded-xl bg-fd-card text-fd-card-foreground">
        <p className="text-sm font-medium mb-2">Ask AI about Documentation</p>
        <p className="text-xs text-fd-muted-foreground">
          Get answers with citations from the docs
        </p>
      </div>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className={cn(
          buttonVariants({
            size: 'icon-sm',
            color: 'secondary',
            className: 'rounded-full',
          })
        )}
        onClick={() => setOpen(false)}
      >
        <X />
      </button>
    </div>
  );
}

function RAGChatActions() {
  const chat = useChatContext();
  const isLoading = chat?.status === 'streaming';
  const messages = chat?.messages ?? [];

  if (messages.length === 0) {
    return null;
  }

  return (
    <>
      {!isLoading && messages[messages.length - 1]?.role === 'assistant' && (
        <button
          type="button"
          className={cn(
            buttonVariants({
              color: 'secondary',
              size: 'sm',
              className: 'rounded-full gap-1.5',
            })
          )}
          onClick={() => chat?.regenerate?.()}
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
      )}
      <button
        type="button"
        className={cn(
          buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'rounded-full',
          })
        )}
        onClick={() => chat?.setMessages?.([])}
      >
        Clear Chat
      </button>
    </>
  );
}

const StorageKeyInput = '__rag_chat_input';
function RAGChatInput(props: ComponentProps<'form'>) {
  const chat = useChatContext();
  const [input, setInput] = useState(() => localStorage.getItem(StorageKeyInput) ?? '');
  const isLoading = chat?.status === 'streaming' || chat?.status === 'submitted';
  const onStart = (e?: SyntheticEvent) => {
    e?.preventDefault();
    void chat?.sendMessage?.({ text: input });
    setInput('');
  };

  localStorage.setItem(StorageKeyInput, input);

  useEffect(() => {
    if (isLoading) {
      document.getElementById('nd-rag-input')?.focus();
    }
  }, [isLoading]);

  return (
    <form {...props} className={cn('flex items-start pe-2', props.className)} onSubmit={onStart}>
      <Input
        value={input}
        placeholder={isLoading ? 'AI is answering...' : 'Ask about the documentation...'}
        autoFocus
        className="p-3"
        disabled={chat?.status === 'streaming' || chat?.status === 'submitted'}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === 'Enter') {
            onStart(event);
          }
        }}
      />
      {isLoading ? (
        <button
          key="bn"
          type="button"
          className={cn(
            buttonVariants({
              color: 'secondary',
              className: 'transition-all rounded-full mt-2 gap-2',
            })
          )}
          onClick={() => chat?.stop?.()}
        >
          <Loader2 className="size-4 animate-spin text-fd-muted-foreground" />
          Abort Answer
        </button>
      ) : (
        <button
          key="bn"
          type="submit"
          className={cn(
            buttonVariants({
              color: 'secondary',
              className: 'transition-all rounded-full mt-2',
            })
          )}
          disabled={input.length === 0}
        >
          <Send className="size-4" />
        </button>
      )}
    </form>
  );
}

function List(props: Omit<ComponentProps<'div'>, 'dir'>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    function callback() {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'instant',
      });
    }

    const observer = new ResizeObserver(callback);
    callback();

    const element = containerRef.current?.firstElementChild;

    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn('fd-scroll-container overflow-y-auto min-w-0 flex flex-col', props.className)}
    >
      {props.children}
    </div>
  );
}

function Input(props: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLDivElement>(null);
  const shared = cn('col-start-1 row-start-1', props.className);

  return (
    <div className="grid flex-1">
      <textarea
        id="nd-rag-input"
        {...props}
        className={cn(
          'resize-none bg-transparent placeholder:text-fd-muted-foreground focus-visible:outline-none',
          shared
        )}
      />
      <div ref={ref} className={cn(shared, 'break-all invisible')}>
        {`${props.value?.toString() ?? ''}\n`}
      </div>
    </div>
  );
}

function extractCitations(content: string, chunks: RetrievedChunk[]): Citation[] {
  const citations: Citation[] = [];
  const regex = /\[(\d+)\]/g;
  const seen = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    const index = Number.parseInt(match[1], 10) - 1;
    if (chunks[index] && !seen.has(match[1])) {
      citations.push({
        number: match[1],
        url: chunks[index].url,
        title: chunks[index].title,
        section: chunks[index].section,
      });
      seen.add(match[1]);
    }
  }

  return citations;
}

const roleName: Record<string, string> = {
  user: 'you',
  assistant: 'fumadocs',
};

function Message({ message, ...props }: { message: UIMessage } & ComponentProps<'div'>) {
  let markdown = '';
  let chunks: RetrievedChunk[] = [];

  for (const part of message.parts ?? []) {
    if (part.type === 'text') {
      markdown += part.text;
    }
  }

  // Extract chunks from message data (streamed via toDataStreamResponse)
  if (message.data) {
    // biome-ignore lint/suspicious/noExplicitAny: Data stream protocol doesn't have static typing
    const data = message.data as any;
    if (data.sources && Array.isArray(data.sources)) {
      chunks = data.sources as RetrievedChunk[];
    }
  }

  const citations = extractCitations(markdown, chunks);

  return (
    <div {...props}>
      <p
        className={cn(
          'mb-1 text-sm font-medium text-fd-muted-foreground',
          message.role === 'assistant' && 'text-fd-primary'
        )}
      >
        {roleName[message.role] ?? 'unknown'}
      </p>
      <div className="prose text-sm">
        <Markdown text={markdown} />
      </div>
      {citations.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-fd-muted-foreground">Sources:</p>
          {citations.map((citation) => (
            <Link
              key={citation.url}
              href={citation.url}
              className="text-xs rounded-lg border p-2 hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <span className="font-medium">
                [{citation.number}] {citation.title}
              </span>
              {citation.section && (
                <span className="text-fd-muted-foreground"> — {citation.section}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function RAGChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const chat = useChat({
    id: 'rag',
    transport: new DefaultChatTransport({
      api: '/api/rag',
    }),
  });

  return (
    <Context value={useMemo(() => ({ chat, open, setOpen }), [chat, open])}>{children}</Context>
  );
}

export function RAGChatTrigger() {
  // biome-ignore lint/style/noNonNullAssertion: Context guaranteed to exist within RAGChatProvider
  const { open, setOpen } = use(Context)!;

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({
          variant: 'secondary',
        }),
        'fixed bottom-4 gap-3 w-24 start-[calc(--spacing(4)+var(--removed-body-scroll-bar-size,0px))] text-fd-muted-foreground rounded-2xl shadow-lg z-20 transition-[translate,opacity]',
        open && 'translate-y-10 opacity-0'
      )}
      onClick={() => setOpen(true)}
    >
      <BookOpenIcon className="size-4.5" />
      Ask AI
    </button>
  );
}

export function RAGChatPanel() {
  // biome-ignore lint/style/noNonNullAssertion: Context guaranteed to exist within RAGChatProvider
  const { open, setOpen } = use(Context)!;
  const chat = useChatContext();

  const onKeyPress = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      e.preventDefault();
    }

    if (e.key === '/' && (e.metaKey || e.ctrlKey) && !open) {
      setOpen(true);
      e.preventDefault();
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress);
    return () => window.removeEventListener('keydown', onKeyPress);
  }, []);

  return (
    <>
      <style>
        {`
        @keyframes rag-chat-open {
          from {
            width: 0px;
          }
          to {
            width: var(--rag-chat-width);
          }
        }
        @keyframes rag-chat-close {
          from {
            width: var(--rag-chat-width);
          }
          to {
            width: 0px;
          }
        }`}
      </style>
      <Presence present={open}>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Backdrop overlay for modal dismissal */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop overlay for modal dismissal */}
        <div
          data-state={open ? 'open' : 'closed'}
          className="fixed inset-0 z-30 backdrop-blur-xs bg-fd-overlay data-[state=open]:animate-fd-fade-in data-[state=closed]:animate-fd-fade-out lg:hidden"
          onClick={() => setOpen(false)}
        />
      </Presence>
      <Presence present={open}>
        <div
          className={cn(
            'overflow-hidden z-30 bg-fd-popover text-fd-popover-foreground [--rag-chat-width:400px] xl:[--rag-chat-width:460px]',
            'max-lg:fixed max-lg:inset-x-2 max-lg:top-4 max-lg:border max-lg:rounded-2xl max-lg:shadow-xl',
            'lg:sticky lg:top-0 lg:h-dvh lg:border-s lg:ms-auto lg:in-[#nd-docs-layout]:[grid-area:toc] lg:in-[#nd-notebook-layout]:row-span-full lg:in-[#nd-notebook-layout]:col-start-5',
            open
              ? 'animate-fd-dialog-in lg:animate-[rag-chat-open_200ms]'
              : 'animate-fd-dialog-out lg:animate-[rag-chat-close_200ms]'
          )}
        >
          <div className="flex flex-col p-2 size-full max-lg:max-h-[80dvh] lg:w-(--rag-chat-width) xl:p-4">
            <Header />
            <List
              className="px-3 py-4 flex-1 overscroll-contain"
              style={{
                maskImage:
                  'linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)',
              }}
            >
              <div className="flex flex-col gap-4">
                {chat?.messages
                  ?.filter((msg) => msg.role !== 'system')
                  .map((item) => (
                    <Message key={item.id} message={item} />
                  ))}
              </div>
            </List>
            <div className="rounded-xl border bg-fd-card text-fd-card-foreground has-focus-visible:ring-2 has-focus-visible:ring-fd-ring">
              <RAGChatInput />
              <div className="flex items-center gap-1.5 p-1 empty:hidden">
                <RAGChatActions />
              </div>
            </div>
          </div>
        </div>
      </Presence>
    </>
  );
}
