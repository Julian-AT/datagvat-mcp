import { createOpenAI } from '@ai-sdk/openai-compatible';
import { embedMany, embed } from 'ai';

/**
 * Initialize OpenAI client for embeddings
 * Uses OpenAI-compatible API (supports Anthropic, OpenAI, etc.)
 */
function getEmbeddingModel() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable not set. Required for documentation indexing.'
    );
  }

  const openai = createOpenAI({
    apiKey,
    baseURL: 'https://api.openai.com/v1',
  });

  return openai.embedding('text-embedding-3-small');
}

/**
 * Batch embed multiple text chunks
 * Uses OpenAI text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
 *
 * @param texts - Array of text strings to embed
 * @returns Object with embeddings array and usage metadata
 */
export async function embedTexts(texts: string[]): Promise<{
  embeddings: number[][];
  usage: { tokens: number };
}> {
  if (texts.length === 0) {
    return { embeddings: [], usage: { tokens: 0 } };
  }

  const model = getEmbeddingModel();

  const result = await embedMany({
    model,
    values: texts,
    maxRetries: 2,
    maxParallelCalls: 3, // Rate limit handling
  });

  return {
    embeddings: result.embeddings,
    usage: {
      tokens: result.usage?.tokens || 0,
    },
  };
}

/**
 * Embed a single text string
 * Wrapper around embedTexts for convenience
 *
 * @param text - Text string to embed
 * @returns 1536-dimensional embedding vector
 */
export async function embedSingle(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }

  const model = getEmbeddingModel();

  const result = await embed({
    model,
    value: text,
  });

  return result.embedding;
}
