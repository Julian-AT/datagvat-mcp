import { LocalIndex } from 'vectra';
import path from 'node:path';

/**
 * Metadata stored with each vector chunk
 */
export interface ChunkMetadata {
  url: string;
  title: string;
  section: string;
  text: string;
}

/**
 * Vector store wrapper around Vectra LocalIndex
 * Provides type-safe interface for documentation vector storage
 */
export class VectorStore {
  private index: LocalIndex;
  private indexPath: string;

  constructor(indexPath: string = '.vector-index') {
    this.indexPath = path.resolve(indexPath);
    this.index = new LocalIndex(this.indexPath);
  }

  /**
   * Initialize the vector index (create if not exists)
   * Configures metadata fields for filtering and storage
   */
  async initialize(): Promise<void> {
    const exists = await this.index.isIndexCreated();

    if (!exists) {
      await this.index.createIndex({
        version: 1,
        metadata_config: {
          indexed: ['url', 'title', 'section'], // Enable filtering on these fields
        },
      });
    }
  }

  /**
   * Insert a chunk with embedding and metadata
   * @param embedding - 1536-dimensional vector from text-embedding-3-small
   * @param metadata - Chunk metadata (url, title, section, text)
   */
  async insertChunk(
    embedding: number[],
    metadata: ChunkMetadata
  ): Promise<void> {
    await this.index.insertItem({
      vector: embedding,
      metadata,
    });
  }

  /**
   * Query for similar chunks using cosine similarity
   * @param embedding - Query vector (1536 dimensions)
   * @param topK - Number of results to return
   * @returns Array of results sorted by similarity score (0-1, higher = more similar)
   */
  async queryChunks(
    embedding: number[],
    topK: number = 5
  ): Promise<Array<{ score: number; metadata: ChunkMetadata }>> {
    const results = await this.index.queryItems(embedding, topK);

    return results.map((result) => ({
      score: result.score,
      metadata: result.item.metadata as ChunkMetadata,
    }));
  }

  /**
   * Get index statistics for validation
   * @returns Index size and configuration details
   */
  async getStats(): Promise<{
    exists: boolean;
    path: string;
    version?: number;
  }> {
    const exists = await this.index.isIndexCreated();

    return {
      exists,
      path: this.indexPath,
      version: exists ? 1 : undefined,
    };
  }
}
