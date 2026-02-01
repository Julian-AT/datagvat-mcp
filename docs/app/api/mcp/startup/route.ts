import { NextResponse } from 'next/server';
import { performStartupHealthCheck } from '@/lib/mcp/startup-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Startup health check API route.
 *
 * Purpose:
 * - Allows manual triggering of startup health checks via GET /api/mcp/startup
 * - Can be called by Next.js deployment warm-up hooks
 * - Logs MCP server status to Vercel deployment logs
 *
 * Note: This route triggers the check for logging side effects.
 * For health data responses, use GET /api/mcp/health instead.
 */
export async function GET() {
  await performStartupHealthCheck();

  return NextResponse.json({
    message: 'Startup health check triggered',
    timestamp: new Date().toISOString(),
  });
}
