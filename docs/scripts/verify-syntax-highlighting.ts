#!/usr/bin/env tsx
/**
 * Syntax Highlighting Verification Script
 *
 * Verifies that all code blocks in MDX files have valid language declarations
 * that are supported by Shiki syntax highlighter.
 *
 * Usage: npx tsx ./scripts/verify-syntax-highlighting.ts
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

// Known valid languages supported by Shiki
const VALID_LANGUAGES = [
  'typescript',
  'python',
  'json',
  'bash',
  'javascript',
  'yaml',
  'toml',
  'markdown',
  'tsx',
  'jsx',
  'sh',
  'shell',
  'ts',
  'js',
  'py',
  'yml',
  'text',
  'plaintext',
  'css',
  'html',
  'xml',
  'sql',
  'dockerfile',
  'diff',
];

interface CodeBlockInfo {
  file: string;
  line: number;
  lang: string | null;
  valid: boolean;
}

interface ValidationResult {
  totalBlocks: number;
  validBlocks: number;
  invalidBlocks: CodeBlockInfo[];
  languageCounts: Record<string, number>;
}

async function extractCodeBlocks(filePath: string, content: string): Promise<CodeBlockInfo[]> {
  const blocks: CodeBlockInfo[] = [];

  const processor = remark().use(remarkMdx);
  const tree = processor.parse(content);

  visit(tree, 'code', (node: any) => {
    const lang = node.lang || null;
    const valid = lang ? VALID_LANGUAGES.includes(lang.toLowerCase()) : false;

    blocks.push({
      file: filePath,
      line: node.position?.start?.line || 0,
      lang,
      valid,
    });
  });

  return blocks;
}

async function getAllMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (entry.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

async function main() {
  console.log('Syntax Highlighting Verification');
  console.log('=================================\n');

  const contentDir = join(process.cwd(), 'content', 'docs');
  const mdxFiles = await getAllMdxFiles(contentDir);
  const allBlocks: CodeBlockInfo[] = [];
  const languageCounts: Record<string, number> = {};

  console.log(`Scanning ${mdxFiles.length} MDX files...\n`);

  for (const filePath of mdxFiles) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const blocks = await extractCodeBlocks(filePath, content);
      allBlocks.push(...blocks);

      for (const block of blocks) {
        if (block.lang) {
          languageCounts[block.lang] = (languageCounts[block.lang] || 0) + 1;
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not parse ${filePath}`);
    }
  }

  const invalidBlocks = allBlocks.filter(b => !b.valid);

  const result: ValidationResult = {
    totalBlocks: allBlocks.length,
    validBlocks: allBlocks.filter(b => b.valid).length,
    invalidBlocks,
    languageCounts,
  };

  // Print results
  console.log(`Total code blocks: ${result.totalBlocks}`);
  console.log(`Valid blocks: ${result.validBlocks}`);
  console.log(`Invalid blocks: ${result.invalidBlocks.length}\n`);

  console.log('Languages found:');
  const sortedLanguages = Object.entries(result.languageCounts)
    .sort(([, a], [, b]) => b - a);

  for (const [lang, count] of sortedLanguages) {
    const status = VALID_LANGUAGES.includes(lang.toLowerCase()) ? '✓' : '✗';
    console.log(`  ${status} ${lang}: ${count}`);
  }

  if (result.invalidBlocks.length > 0) {
    console.log('\n❌ Issues found:');
    for (const block of result.invalidBlocks) {
      console.log(`  ${block.file}:${block.line} - Invalid language: "${block.lang || '(empty)'}"`);
    }
    console.log('\nSuggestion: Use one of the supported languages or add the language to VALID_LANGUAGES array.');
    process.exit(1);
  } else {
    console.log('\n✓ All code blocks have valid syntax highlighting languages');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Error running syntax highlighting verification:', error);
  process.exit(1);
});
