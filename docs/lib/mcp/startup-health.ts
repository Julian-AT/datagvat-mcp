import { createDataGvatClient } from '@/lib/mcp/datagvat-client';
import { createE2BClient } from '@/lib/mcp/e2b-client';
import { checkMCPHealth } from '@/lib/mcp/health-checker';

/**
 * Performs health checks on both MCP servers during app startup.
 * Logs results to server console but does not throw errors.
 *
 * This function is designed to run during Next.js app initialization
 * to verify MCP server connectivity before handling user requests.
 */
export async function performStartupHealthCheck(): Promise<void> {
  try {
    console.log('[MCP Startup] Checking MCP server health...');

    const startTime = Date.now();

    // Check both services in parallel (same pattern as /api/mcp/health/route.ts)
    const results = await Promise.allSettled([
      // Check data.gv.at MCP server
      (async () => {
        const url = process.env.DATAGVAT_MCP_URL || '';
        const bearerToken = process.env.DATAGVAT_MCP_BEARER_TOKEN;
        if (!url) {
          console.warn('[MCP Startup] data.gv.at: DATAGVAT_MCP_URL not configured');
          return { server: 'data.gv.at', status: 'unhealthy' as const, error: 'URL not configured' };
        }
        const client = await createDataGvatClient(url, bearerToken);
        return await checkMCPHealth(client, 'data.gv.at');
      })(),

      // Check E2B sandbox service
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

    // Extract health statuses from settled promises
    const healthStatuses = results.map(r =>
      r.status === 'fulfilled' ? r.value : r.reason
    );

    // Log individual service results
    for (const status of healthStatuses) {
      if (status.status === 'healthy') {
        const details = [];
        if (status.latencyMs !== undefined) details.push(`${status.latencyMs}ms`);
        if (status.toolCount !== undefined) details.push(`${status.toolCount} tools`);
        const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';
        console.log(`[MCP Startup] ${status.server}: healthy${detailStr}`);
      } else {
        console.warn(`[MCP Startup] ${status.server}: unhealthy - ${status.error || 'Unknown error'}`);
      }
    }

    // Log summary
    const healthyCount = healthStatuses.filter(s => s.status === 'healthy').length;
    const totalDuration = Date.now() - startTime;
    console.log(`[MCP Startup] Health check complete - ${healthyCount}/${healthStatuses.length} services healthy (${totalDuration}ms)`);

  } catch (error) {
    // Log unexpected errors but don't throw - startup should continue
    console.error('[MCP Startup] Unexpected error during health check:', error);
  }
}
