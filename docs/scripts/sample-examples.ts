import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Code } from 'mdast';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

interface CodeExample {
  page: string;
  section: string;
  language: string;
  code: string;
  line: number;
  filename?: string;
}

const samplingStrata = {
  guides: { targetSamples: 5 },
  workflows: { targetSamples: 4 },
  tutorials: { targetSamples: 2 },
  examples: { targetSamples: 4 },
  advanced: { targetSamples: 3 },
  'best-practices': { targetSamples: 2 },
};

function classifyPage(relativePath: string): string {
  // Normalize path separators
  const normalized = relativePath.replace(/\\/g, '/');

  // Extract section from path - look for content/docs/{section}/
  const match = normalized.match(/content[/]docs[/]([^/]+)[/]/);
  if (match) {
    const section = match[1];
    // Map sections to strata
    if (section === 'getting-started') return 'tutorials';
    if (section === 'tools' || section === 'integration') return 'advanced';
    return section;
  }

  // Fallback
  return 'guides';
}

function extractCodeBlocks(filePath: string, content: string): CodeExample[] {
  const examples: CodeExample[] = [];
  const tree = remark().use(remarkMdx).parse(content);

  visit(tree, 'code', (node: Code) => {
    const lang = node.lang || '';

    // Filter to testable languages only
    const testableLanguages = ['typescript', 'ts', 'python', 'py', 'bash', 'sh'];
    if (!testableLanguages.includes(lang.toLowerCase())) {
      return;
    }

    // Normalize language names
    let normalizedLang = lang.toLowerCase();
    if (normalizedLang === 'ts') normalizedLang = 'typescript';
    if (normalizedLang === 'py') normalizedLang = 'python';
    if (normalizedLang === 'sh') normalizedLang = 'bash';

    examples.push({
      page: filePath.replace(/\\/g, '/').replace('docs/content/docs/', '/docs/'),
      section: classifyPage(filePath),
      language: normalizedLang,
      code: node.value,
      line: node.position?.start.line || 0,
      filename: node.meta || undefined,
    });
  });

  return examples;
}

function scanDirectory(dir: string, examples: CodeExample[] = []): CodeExample[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, examples);
    } else if (entry.name.endsWith('.mdx')) {
      const content = readFileSync(fullPath, 'utf-8');
      const blocks = extractCodeBlocks(fullPath, content);
      examples.push(...blocks);
    }
  }

  return examples;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function stratifiedSample(examples: CodeExample[]): CodeExample[] {
  const examplesBySection: Record<string, CodeExample[]> = {
    guides: [],
    workflows: [],
    tutorials: [],
    examples: [],
    advanced: [],
    'best-practices': [],
  };

  // Group examples by section
  for (const example of examples) {
    if (examplesBySection[example.section]) {
      examplesBySection[example.section].push(example);
    }
  }

  const sampledExamples: CodeExample[] = [];
  const actualStrata: Record<string, number> = {};

  // Sample from each stratum
  for (const [section, config] of Object.entries(samplingStrata)) {
    const sectionExamples = examplesBySection[section] || [];
    const shuffled = shuffleArray(sectionExamples);
    const sampled = shuffled.slice(0, config.targetSamples);

    sampledExamples.push(...sampled);
    actualStrata[section] = sampled.length;
  }

  return sampledExamples;
}

async function main() {
  const contentDir = join(process.cwd(), 'content', 'docs');

  console.log('Scanning documentation for code examples...');
  const allExamples = scanDirectory(contentDir);

  console.log(`Found ${allExamples.length} testable code examples`);

  // Count by section
  const bySectionCount: Record<string, number> = {};
  for (const example of allExamples) {
    bySectionCount[example.section] = (bySectionCount[example.section] || 0) + 1;
  }

  console.log('\nExamples by section:');
  for (const [section, count] of Object.entries(bySectionCount)) {
    console.log(`  ${section}: ${count}`);
  }

  console.log('\nApplying stratified random sampling...');
  const sampledExamples = stratifiedSample(allExamples);

  // Add sequential IDs
  const withIds = sampledExamples.map((ex, idx) => ({ id: idx + 1, ...ex }));

  // Count actual samples by section
  const actualStrata: Record<string, number> = {};
  for (const example of withIds) {
    actualStrata[example.section] = (actualStrata[example.section] || 0) + 1;
  }

  const output = {
    totalExamples: allExamples.length,
    sampledExamples: withIds.length,
    strata: actualStrata,
    examples: withIds,
  };

  const outputPath = join(
    process.cwd(),
    '..',
    '.planning',
    'phases',
    '24-final-polish-a-quality',
    'sampled-examples.json',
  );
  const { writeFileSync } = await import('node:fs');
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\nSampled ${withIds.length} examples:`);
  for (const [section, count] of Object.entries(actualStrata)) {
    console.log(`  ${section}: ${count}`);
  }
  console.log(`\nResults written to: ${outputPath}`);
}

main().catch(console.error);
