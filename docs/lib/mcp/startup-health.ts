import { createDataGvatClient } from '@/lib/mcp/datagvat-client';
import { createE2BClient } from '@/lib/mcp/e2b-client';
import { checkMCPHealth } from '@/lib/mcp/health-checker';

export async function performStartupHealthCheck(): Promise<void> {
  try {
    console.log('[MCP Startup] Checking MCP server health...');

    const startTime = Date.now();

    const results = await Promise.allSettled([
      (async () => {
        const url = process.env.DATAGVAT_MCP_URL || '';
        const bearerToken = process.env.DATAGVAT_MCP_BEARER_TOKEN;
        if (!url) {
          console.warn('[MCP Startup] data.gv.at: DATAGVAT_MCP_URL not configured');
          return {
            server: 'data.gv.at',
            status: 'unhealthy' as const,
            error: 'URL not configured',
          };
        }
        const client = await createDataGvatClient(url, bearerToken);
        return await checkMCPHealth(client, 'data.gv.at');
      })(),

      (async () => {
        const apiKey = process.env.E2B_API_KEY || '';
        if (!apiKey) {
          console.warn('[MCP Startup] E2B: E2B_API_KEY not configured');
          return { server: 'E2B', status: 'unhealthy' as const, error: 'API key not configured' };
        }

        const client = createE2BClient({ apiKey });
        try {
          const checkStart = Date.now();
          const sandbox = await client.createSandbox();
          await sandbox.kill();
          return {
            server: 'E2B',
            status: 'healthy' as const,
            latencyMs: Date.now() - checkStart,
          };
        } catch (error) {
          return {
            server: 'E2B',
            status: 'unhealthy' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })(),
    ]);

    const healthStatuses = results.map((r) => (r.status === 'fulfilled' ? r.value : r.reason));

    for (const status of healthStatuses) {
      if (status.status === 'healthy') {
        const details = [];
        if (status.latencyMs !== undefined) details.push(`${status.latencyMs}ms`);
        if (status.toolCount !== undefined) details.push(`${status.toolCount} tools`);
        const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';
        console.log(`[MCP Startup] ${status.server}: healthy${detailStr}`);
      } else {
        console.warn(
          `[MCP Startup] ${status.server}: unhealthy - ${status.error || 'Unknown error'}`
        );
      }
    }

    const healthyCount = healthStatuses.filter((s) => s.status === 'healthy').length;
    const totalDuration = Date.now() - startTime;
    console.log(
      `[MCP Startup] Health check complete - ${healthyCount}/${healthStatuses.length} services healthy (${totalDuration}ms)`
    );
  } catch (error) {
    console.error('[MCP Startup] Unexpected error during health check:', error);
  }
}
