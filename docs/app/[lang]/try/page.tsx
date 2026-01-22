import { ChatInterface } from '@/components/chat/chat-interface';

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
      <ChatInterface />
    </main>
  );
}

export const metadata = {
  title: 'Try MCP Server',
  description: 'Interactive testing interface for data.gv.at MCP Server',
};
