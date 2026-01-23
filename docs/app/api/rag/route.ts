/**
 * RAG Chat API Route
 *
 * Retrieves relevant documentation chunks via vector search and streams
 * AI responses grounded in actual documentation with source citations.
 *
 * Features:
 * - Rate limiting (5 requests/minute per IP)
 * - Vector retrieval with similarity threshold filtering (0.75)
 * - Streaming responses with numbered citations [1], [2], etc.
 * - Off-topic query detection and redirection
 * - Source metadata for client-side citation rendering
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { retrieveContext, formatContextForPrompt } from '@/lib/rag/retriever';

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
 * POST /api/rag
 *
 * Accepts messages array and streams AI responses grounded in documentation.
 *
 * Request body:
 * ```json
 * {
 *   "messages": [
 *     { "role": "user", "content": "How do I search for datasets about Vienna?" }
 *   ]
 * }
 * ```
 *
 * Response: Streaming text with citations and source metadata
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
        }
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
        }
      );
    }

    // 3. Check API key configuration
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[RAG] ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: 'ANTHROPIC_API_KEY not configured. Please add to .env.local file.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Extract last user message for retrieval
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'Last message must be from user',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userMessage = lastMessage.content;

    // 5. Retrieve relevant documentation chunks
    const chunks = await retrieveContext(userMessage, {
      topK: 5,
      threshold: 0.75,
    });

    // 6. Handle no relevant chunks found
    if (chunks.length === 0) {
      // Return immediate response without streaming
      return new Response(
        JSON.stringify({
          content: "I don't have information about that in the documentation.",
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 7. Format context for prompt
    const context = formatContextForPrompt(chunks);

    // 8. Build system prompt with context and rules
    const systemPrompt = `You are a documentation assistant for the Austria MCP server.

Context from documentation:
${context}

Rules:
- Answer questions using ONLY the provided context above
- Cite sources using [1], [2] etc. matching the context numbering
- If the context doesn't contain the answer, say "I don't have information about that in the documentation."
- DO NOT make up information not in the context
- Provide code examples from context when relevant
- Focus on Austrian data (data.gv.at) and MCP server features
- Redirect off-topic questions: "This chat is for Austria MCP documentation. Please visit [relevant section] for that topic."

Format responses with:
- Clear, concise answers
- Code examples when applicable
- Citation numbers [1], [2] after relevant statements
- Links to documentation sections for deeper reading`;

    // 9. Configure model
    const baseURL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1';
    const anthropic = createOpenAICompatible({
      name: 'anthropic',
      baseURL,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    const model = anthropic('claude-3-5-sonnet-20241022');

    // 10. Stream response with citations
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      maxSteps: 1, // No tool calling for RAG endpoint
      onFinish: ({ usage, finishReason }) => {
        console.log(`[RAG] usage=${JSON.stringify(usage)} finishReason=${finishReason}`);
      },
    });

    // 11. Return streaming response with source metadata
    return result.toDataStreamResponse({
      data: {
        sources: chunks.map((chunk, idx) => ({
          number: idx + 1,
          url: chunk.url,
          title: chunk.title,
          section: chunk.section,
        })),
      },
    });
  } catch (error) {
    // Global error handler
    console.error('[RAG] Request failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
