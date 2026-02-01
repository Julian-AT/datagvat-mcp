import type { MCPClient } from '@ai-sdk/mcp';

export interface MCPHealthStatus {
  server: string;
  status: 'healthy' | 'unhealthy';
  toolCount?: number;
  latencyMs?: number;
  error?: string;
}

export async function checkMCPHealth(
  client: MCPClient,
  serverName: string
): Promise<MCPHealthStatus> {
  try {
    const startTime = Date.now();
    const tools = await client.tools();
    const latency = Date.now() - startTime;

    const toolCount = Object.keys(tools).length;

    return {
      server: serverName,
      status: 'healthy',
      toolCount,
      latencyMs: latency,
    };
  } catch (error) {
    return {
      server: serverName,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
