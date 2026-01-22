import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

interface MetaJson {
  pages?: string[];
}

function getAllMetaJsonFiles(dir: string): string[] {
  const results: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...getAllMetaJsonFiles(fullPath));
    } else if (item === 'meta.json') {
      results.push(fullPath);
    }
  }

  return results;
}

function getAllMdxFiles(dir: string): string[] {
  const results: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...getAllMdxFiles(fullPath));
    } else if (item.endsWith('.mdx') || item.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

// Get all meta.json files
const contentDir = join(process.cwd(), 'content', 'docs');
const metaFiles = getAllMetaJsonFiles(contentDir);

// Build set of referenced files
const referencedFiles = new Set<string>();

for (const metaFile of metaFiles) {
  const content = JSON.parse(readFileSync(metaFile, 'utf-8')) as MetaJson;
  const dir = metaFile.replace('/meta.json', '').replace('\\meta.json', '');

  if (content.pages) {
    for (const page of content.pages) {
      // Skip separators and external links
      if (page.startsWith('---') || page.startsWith('external:')) {
        continue;
      }

      // Add possible file paths
      referencedFiles.add(join(dir, page + '.mdx'));
      referencedFiles.add(join(dir, page + '.md'));
      referencedFiles.add(join(dir, page, 'index.mdx'));
      referencedFiles.add(join(dir, page, 'index.md'));
    }
  }
}

// Get all actual MDX/MD files
const allMdxFiles = getAllMdxFiles(contentDir);

// Find unreferenced files
const unusedFiles: string[] = [];

for (const mdxFile of allMdxFiles) {
  if (!referencedFiles.has(mdxFile)) {
    // Check if it's an index file that might be implicit
    if (mdxFile.endsWith('/index.mdx') || mdxFile.endsWith('/index.md') ||
        mdxFile.endsWith('\\index.mdx') || mdxFile.endsWith('\\index.md')) {
      continue;
    }

    unusedFiles.push(mdxFile.replace(contentDir + '/', '').replace(contentDir + '\\', ''));
  }
}

// Output results
if (unusedFiles.length === 0) {
  console.log('✓ No unused MDX files found');
} else {
  console.log(`Found ${unusedFiles.length} potentially unused files:\n`);
  unusedFiles.forEach(file => console.log(`  - ${file}`));

  console.log('\n⚠️  Review these files before deletion:');
  console.log('  - May be referenced dynamically');
  console.log('  - May be work in progress');
  console.log('  - May be legal/archived content to keep');
}

// Write to file for review
const outputPath = join(
  process.cwd(),
  '..',
  '.planning',
  'phases',
  '10-navigation-simplification---streamline-from-8-tabs-to-3,-fix-duplicate-titles,-polish-readme-and-repository-structure',
  'unused-files.txt'
);
writeFileSync(outputPath, unusedFiles.join('\n'));

console.log(`\n📝 Results written to: ${outputPath}`);
