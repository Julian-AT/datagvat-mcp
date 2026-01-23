import { embedSingle } from './embedder';
import { VectorStore } from './vector-store';

/**
 * Retrieved chunk with similarity score
 */
export interface RetrievedChunk {
  text: string;
  url: string;
  title: string;
  section: string;
  score: number; // cosine similarity 0-1
}

/**
 * Retrieval options for vector search
 */
export interface RetrievalOptions {
  topK?: number; // Number of chunks to retrieve (default: 5)
  threshold?: number; // Minimum similarity score (default: 0.75)
}

/**
 * Retrieve relevant documentation chunks for a query
 *
 * @param query - User question or search query
 * @param options - Retrieval parameters (topK, threshold)
 * @returns Array of retrieved chunks sorted by similarity (highest first)
 */
export async function retrieveContext(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  const { topK = 5, threshold = 0.75 } = options;

  // 1. Embed the query
  const queryEmbedding = await embedSingle(query);

  // 2. Query vector store
  const vectorStore = new VectorStore('.vector-index');
  const results = await vectorStore.queryChunks(queryEmbedding, topK);

  // 3. Filter by similarity threshold
  const filteredResults = results.filter((result) => result.score >= threshold);

  // Log retrieval metrics
  console.log(`[RAG] Retrieved ${filteredResults.length} chunks (threshold: ${threshold})`);
  if (filteredResults.length > 0) {
    console.log(`[RAG] Top similarity: ${filteredResults[0].score.toFixed(3)}`);
  } else {
    console.log(`[RAG] No chunks above threshold ${threshold} for query`);
  }

  // 4. Convert to RetrievedChunk format
  return filteredResults.map((result) => ({
    text: result.metadata.text,
    url: result.metadata.url,
    title: result.metadata.title,
    section: result.metadata.section,
    score: result.score,
  }));
}

/**
 * Format retrieved chunks as numbered citations for LLM prompt
 *
 * Creates a formatted context string with numbered citations [1], [2], etc.
 * that the LLM can reference in its response.
 *
 * @param chunks - Array of retrieved chunks to format
 * @returns Formatted context string with citations
 */
export function formatContextForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant documentation found.';
  }

  return chunks
    .map((chunk, index) => {
      const citationNumber = index + 1;
      return `[${citationNumber}] ${chunk.title} - ${chunk.section}
${chunk.text}
(Source: ${chunk.url})`;
    })
    .join('\n\n');
}
