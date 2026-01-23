import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import type { Heading, Paragraph, Code, List, Root } from 'mdast';

/**
 * Chunk represents a semantically coherent section of documentation
 */
export interface Chunk {
  text: string;
  url: string;
  title: string;
  section: string;
}

/**
 * Extract plain text from MDX AST node
 */
function extractText(node: any): string {
  if (node.type === 'text') {
    return node.value;
  }

  if (node.type === 'code') {
    return `\`\`\`${node.lang || ''}\n${node.value}\n\`\`\``;
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('');
  }

  return '';
}

/**
 * Slugify heading text for URL anchors
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Chunk MDX documentation by H2/H3 semantic boundaries
 * Preserves context by using heading structure as natural break points
 *
 * @param mdxContent - Raw MDX content string
 * @param docUrl - Document URL (e.g., '/docs/getting-started/quickstart')
 * @param docTitle - Document title from frontmatter
 * @returns Array of chunks with semantic boundaries at H2/H3 headings
 */
export function chunkDocumentation(
  mdxContent: string,
  docUrl: string,
  docTitle: string
): Chunk[] {
  const chunks: Chunk[] = [];
  let currentSection = docTitle; // Start with doc title
  let currentContent: string[] = [];

  try {
    const tree = unified()
      .use(remarkParse)
      .use(remarkMdx)
      .parse(mdxContent) as Root;

    visit(tree, (node) => {
      // New section on H2 or H3 heading
      if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
        // Save previous section if it has content
        if (currentContent.length > 0) {
          const text = currentContent.join('\n\n').trim();
          if (text.length >= 200) {
            // Filter tiny chunks (<200 chars)
            chunks.push({
              text,
              url: `${docUrl}#${slugify(currentSection)}`,
              title: docTitle,
              section: currentSection,
            });
          }
        }

        // Start new section
        const headingNode = node as Heading;
        currentSection = extractText(headingNode);
        currentContent = [currentSection]; // Include heading in chunk text
      } else if (
        node.type === 'paragraph' ||
        node.type === 'code' ||
        node.type === 'list'
      ) {
        // Accumulate content for current section
        const textNode = node as Paragraph | Code | List;
        const text = extractText(textNode);
        if (text.trim().length > 0) {
          currentContent.push(text.trim());
        }
      }
    });

    // Push final section
    if (currentContent.length > 0) {
      const text = currentContent.join('\n\n').trim();
      if (text.length >= 200) {
        chunks.push({
          text,
          url: `${docUrl}#${slugify(currentSection)}`,
          title: docTitle,
          section: currentSection,
        });
      }
    }

    // Add overlap between chunks (100 tokens ≈ 400 chars)
    const chunksWithOverlap: Chunk[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // For all but first chunk, prepend tail of previous chunk
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        const overlapText = prevChunk.text.slice(-400); // Last ~400 chars
        chunk.text = `${overlapText}\n\n---\n\n${chunk.text}`;
      }

      chunksWithOverlap.push(chunk);
    }

    return chunksWithOverlap;
  } catch (error) {
    console.error(
      `Error chunking document ${docUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return [];
  }
}
