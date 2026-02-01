import { createMCPClient } from '@ai-sdk/mcp';
import { createResilientMCPClient } from './reconnection';

async function createDataGvatClientOnce(url: string) {
  try {
    const client = await createMCPClient({
      transport: {
        type: 'http',
        url,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });

    return client;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create data.gv.at MCP client: ${message}`);
  }
}

export async function createDataGvatClient(url: string) {
  const resilientClient = createResilientMCPClient({
    createClient: () => createDataGvatClientOnce(url),
    reconnectionConfig: {
      maxRetries: 5,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
    },
    onStateChange: (state) => {
      console.log(`[data.gv.at MCP] Connection state: ${state}`);
    },
  });

  return resilientClient.getClient();
}
