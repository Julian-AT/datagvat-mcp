import { createMCPClient } from '@ai-sdk/mcp';

export async function createDataGvatClient(url: string) {
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
