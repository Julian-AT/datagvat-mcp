import { NextResponse } from 'next/server';
import { createDataGvatClient } from '@/lib/mcp/datagvat-client';
import { createE2BClient } from '@/lib/mcp/e2b-client';
import { checkMCPHealth } from '@/lib/mcp/health-checker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const results = await Promise.allSettled([
    (async () => {
      const client = await createDataGvatClient(process.env.DATAGVAT_MCP_URL || '');
      return await checkMCPHealth(client, 'data.gv.at');
    })(),
    (async () => {
      const client = createE2BClient({ apiKey: process.env.E2B_API_KEY || '' });
      try {
        const startTime = Date.now();
        const sandbox = await client.createSandbox();
        await sandbox.kill();
        return {
          server: 'E2B',
          status: 'healthy' as const,
          latencyMs: Date.now() - startTime,
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

  const healthStatuses = results.map(r => r.status === 'fulfilled' ? r.value : r.reason);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    servers: healthStatuses,
    allHealthy: healthStatuses.every(s => s.status === 'healthy'),
  });
}
