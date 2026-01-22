/**
 * Streaming Chat API Route
 *
 * Bridges Vercel AI SDK with MCP tools, enabling Claude to dynamically invoke
 * MCP server tools and stream results to client.
 *
 * Features:
 * - Rate limiting (5 requests/minute per IP)
 * - Dynamic MCP tool loading and conversion
 * - Streaming responses with tool calling
 * - Environment-based API configuration
 */

import { convertToModelMessages, streamText } from 'ai';
import { openaiCompatible } from '@ai-sdk/openai-compatible';
import { mcpClient } from '@/lib/mcp/client';
import { convertMCPTools } from '@/lib/mcp/tools';

// Vercel function timeout (max 30s for streaming)
export const maxDuration = 30;

/**
 * Simple in-memory rate limiter
 *
 * Tracks request counts per IP address with 1-minute sliding window.
 */
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60_000, // 1 minute
} as const;

/**
 * Check if IP address has exceeded rate limit
 *
 * @param ip - Client IP address
 * @returns true if limit exceeded, false otherwise
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);

  if (!record || now > record.resetAt) {
    // No record or expired - reset
    rateLimiter.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    });
    return false;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return true;
  }

  // Increment count
  record.count += 1;
  return false;
}

/**
 * Extract client IP from request headers
 *
 * Checks x-forwarded-for (proxy/load balancer) first, falls back to 'unknown'.
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be comma-separated list, take first
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

/**
 * POST /api/chat
 *
 * Accepts messages array and streams AI responses with MCP tool calling.
 *
 * Request body:
 * ```json
 * {
 *   "messages": [
 *     { "role": "user", "content": "Search for Vienna population datasets" }
 *   ]
 * }
 * ```
 *
 * Response: Streaming text/event-stream with tool calls and results
 */
export async function POST(req: Request) {
  try {
    // 1. Rate limiting
    const clientIP = getClientIP(req);
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Maximum ${RATE_LIMIT.maxRequests} requests per minute. Please wait and try again.`,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'Request body must contain messages array',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 3. Check API key configuration
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Chat] ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: 'ANTHROPIC_API_KEY not configured. Please add to .env.local file.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 4. Load MCP tools dynamically
    let tools = {};
    try {
      const mcpTools = await mcpClient.listTools();
      tools = convertMCPTools(mcpTools);
      console.log(`[Chat] Loaded ${mcpTools.length} MCP tools`);
    } catch (error) {
      // Log error but continue - chat works without tools
      console.warn('[Chat] Failed to load MCP tools:', error);
    }

    // 5. Configure model
    const baseURL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
    const model = openaiCompatible('claude-3-5-sonnet-20241022', {
      baseURL,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    // 6. Stream response with tool calling
    const result = streamText({
      model,
      system:
        'You are a helpful assistant for exploring Austrian open data from data.gv.at. Use the available tools to search and retrieve dataset information.',
      messages: convertToModelMessages(messages),
      tools,
      maxSteps: 5, // Allow multi-step tool calling
      onFinish: ({ finishReason, usage }) => {
        console.log(`[Chat] Finished: ${finishReason}, tokens:`, usage);
      },
    });

    // 7. Return streaming response
    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      onError: (error) => {
        console.error('[Chat] Streaming error:', error);
        return 'An error occurred while processing your request. Please try again.';
      },
    });
  } catch (error) {
    // Global error handler
    console.error('[Chat] Request failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
