#!/usr/bin/env bun
/**
 * Build-time documentation indexing script
 * Generates vector embeddings for MDX documentation with semantic chunking
 *
 * Usage: bun run scripts/index-docs.ts
 * Requires: OPENAI_API_KEY environment variable
 */

/**
 * Main indexing pipeline
 */
async function indexDocumentation() {
  const startTime = Date.now();

  console.log('🔍 Starting documentation indexing...\n');

  // Environment validation
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set. Skipping documentation indexing.');
    console.warn('   RAG features will not work until you:');
    console.warn('   1. Set OPENAI_API_KEY environment variable');
    console.warn('   2. Run: bun run build (to generate vector index)');
    console.warn('   Continuing with build...\n');
    return; // Skip indexing but don't fail the build
  }

  // Dynamic imports to avoid loading MDX when API key is missing
  try {
    const { docs } = await import('@/.source/server');
    const { chunkDocumentation } = await import('@/lib/rag/chunker');
    const { embedTexts } = await import('@/lib/rag/embedder');
    const { VectorStore } = await import('@/lib/rag/vector-store');

    // Initialize vector store
    console.log('📦 Initializing vector store...');
    const vectorStore = new VectorStore('.vector-index');
    await vectorStore.initialize();

    const stats = await vectorStore.getStats();
    console.log(`   Index path: ${stats.path}`);
    console.log(`   Index exists: ${stats.exists}\n`);

    // Load all documentation pages
    console.log('📄 Loading documentation pages...');
    const pages = await docs.getPages();
    console.log(`   Found ${pages.length} pages\n`);

    let totalChunks = 0;
    let totalTokens = 0;

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      try {
        // Load MDX content
        const content = await page.data.load();

        if (!content || typeof content.body !== 'string') {
          console.warn(`⚠️  Skipping ${page.url} - no body content`);
          continue;
        }

        // Chunk the document
        const chunks = chunkDocumentation(content.body, page.url, page.data.title || 'Untitled');

        if (chunks.length === 0) {
          console.warn(`⚠️  No chunks generated for ${page.url}`);
          continue;
        }

        // Batch embed all chunks from this document
        const texts = chunks.map((c) => c.text);
        const { embeddings, usage } = await embedTexts(texts);

        // Insert into vector store
        for (let j = 0; j < chunks.length; j++) {
          await vectorStore.insertChunk(embeddings[j], {
            url: chunks[j].url,
            title: chunks[j].title,
            section: chunks[j].section,
            text: chunks[j].text,
          });
        }

        totalChunks += chunks.length;
        totalTokens += usage.tokens;

        // Progress indicator
        const progress = ((i + 1) / pages.length) * 100;
        console.log(
          `   [${Math.round(progress)}%] ${page.data.title}: ${chunks.length} chunks, ${usage.tokens} tokens`
        );
      } catch (error) {
        console.error(
          `❌ Error processing ${page.url}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        // Continue processing other pages
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Indexing complete!');
    console.log(`   Pages indexed: ${pages.length}`);
    console.log(`   Total chunks: ${totalChunks}`);
    console.log(`   Total tokens: ${totalTokens.toLocaleString()}`);
    console.log(`   Duration: ${duration}s`);

    // Validate build time constraint
    const durationSec = Number.parseFloat(duration);
    if (durationSec > 30) {
      console.warn(`\n⚠️  WARNING: Indexing took ${duration}s (>30s target)`);
      console.warn('   This may impact the 5-minute build constraint');
    }
  } catch (error) {
    console.error('💥 Fatal error during indexing:', error);
    throw error; // Re-throw to be caught by outer handler
  }
}

// Execute
indexDocumentation().catch((error) => {
  console.error('💥 Fatal error during indexing:', error);
  process.exit(1);
});
