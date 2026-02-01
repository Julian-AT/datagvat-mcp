import { createMCPClient } from '@ai-sdk/mcp';
import { createResilientMCPClient } from './reconnection';

async function createDataGvatClientOnce(url: string, bearerToken?: string) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }

    const client = await createMCPClient({
      transport: {
        type: 'http',
        url,
        headers,
      },
    });

    return client;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create data.gv.at MCP client: ${message}`);
  }
}

export async function createDataGvatClient(url: string, bearerToken?: string) {
  const resilientClient = createResilientMCPClient({
    createClient: () => createDataGvatClientOnce(url, bearerToken),
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
