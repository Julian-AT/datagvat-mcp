import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';

function ChatLoader() {
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto border rounded-lg shadow-sm">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading chat interface...</p>
        </div>
      </div>
    </div>
  );
}

export default function TryPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Try the MCP Server</h1>
        <p className="text-muted-foreground">
          Test the data.gv.at MCP Server interactively. Ask about Austrian datasets and see
          real-time tool invocations.
        </p>
      </div>
      <Suspense fallback={<ChatLoader />}>
        <ChatInterface />
      </Suspense>
    </main>
  );
}

export const metadata = {
  title: 'Try MCP Server',
  description: 'Interactive testing interface for data.gv.at MCP Server',
};
