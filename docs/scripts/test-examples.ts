import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface SampledExample {
  id: number;
  page: string;
  section: string;
  language: string;
  code: string;
  line: number;
  filename?: string;
}

interface SamplingOutput {
  totalExamples: number;
  sampledExamples: number;
  strata: Record<string, number>;
  examples: SampledExample[];
}

function generateTestChecklist(data: SamplingOutput): string {
  const markdown: string[] = [];

  // Header
  markdown.push('# Code Example Test Results');
  markdown.push('');
  markdown.push('**Test Date:** [To be filled]');
  markdown.push('**Tester:** [To be filled]');
  markdown.push('**Status:** 0/20 tested');
  markdown.push('');

  // Instructions
  markdown.push('## Instructions');
  markdown.push('');
  markdown.push('For each example below:');
  markdown.push('1. Copy the code exactly as shown');
  markdown.push(
    '2. Run in appropriate environment (Node.js for TS, Python venv for Python, bash shell)',
  );
  markdown.push('3. Mark ✓ PASS if runs without errors, ✗ FAIL if errors');
  markdown.push('4. Document any issues in notes');
  markdown.push('');
  markdown.push('**Environments:**');
  markdown.push('- TypeScript: `node` (or `npx tsx` for TypeScript files)');
  markdown.push(
    '- Python: Fresh virtual environment with `pip install datagvat-mcp` (or dev install)',
  );
  markdown.push('- Bash: Standard bash/zsh shell');
  markdown.push('');
  markdown.push('---');
  markdown.push('');

  // Generate checklist for each example
  for (const example of data.examples) {
    // Clean up page path for display
    const displayPage = example.page
      .replace(/^.*[/\\]content[/\\]docs[/\\]/, '/docs/')
      .replace(/\\/g, '/')
      .replace('.mdx', '');

    markdown.push(`## Example ${example.id}: ${example.section} (${example.language})`);
    markdown.push('');
    markdown.push(`**Location:** ${displayPage} (line ${example.line})`);
    markdown.push('');
    markdown.push('**Code:**');
    markdown.push('```' + example.language);
    markdown.push(example.code);
    markdown.push('```');
    markdown.push('');

    // Try to provide context about what the example demonstrates
    const context = getExampleContext(example);
    if (context) {
      markdown.push(`**Context:** ${context}`);
      markdown.push('');
    }

    markdown.push('**Result:** [ ] PASS / [ ] FAIL');
    markdown.push('**Notes:**');
    markdown.push('');
    markdown.push('---');
    markdown.push('');
  }

  // Summary section
  markdown.push('## Summary');
  markdown.push('');
  markdown.push('Total tested: __/20');
  markdown.push('Pass rate: __%');
  markdown.push('');
  markdown.push('### Issues Found');
  markdown.push('');
  markdown.push('[List any failing examples with error details]');
  markdown.push('');
  markdown.push('### Status Assessment');
  markdown.push('');
  markdown.push('- [ ] **PASS** (19-20/20 = 95-100% pass rate) - Production quality');
  markdown.push('- [ ] **MARGINAL** (17-18/20 = 85-94% pass rate) - Needs fixes');
  markdown.push('- [ ] **FAIL** (<17/20 = <85% pass rate) - Systematic quality issues');
  markdown.push('');

  return markdown.join('\n');
}

function getExampleContext(example: SampledExample): string | null {
  const { page, language, code } = example;

  // Infer context based on page and code content
  if (page.includes('installation') || page.includes('quickstart')) {
    if (code.includes('pip install')) return 'Installation command';
    if (code.includes('python -m')) return 'Server startup';
    if (code.includes('curl')) return 'API connectivity test';
  }

  if (page.includes('searching') || page.includes('search')) {
    return 'Dataset search example';
  }

  if (page.includes('preview')) {
    return 'Data preview example';
  }

  if (page.includes('workflow')) {
    return 'Multi-step workflow pattern';
  }

  if (page.includes('testing')) {
    if (code.includes('async def test_')) return 'Pytest async test';
    if (code.includes('mock')) return 'Unit test with mocking';
  }

  if (page.includes('error-handling')) {
    if (code.includes('try:') || code.includes('except')) return 'Error handling pattern';
  }

  // Look at code content for hints
  if (code.includes('search_datasets')) return 'Search tool usage';
  if (code.includes('get_dataset')) return 'Dataset retrieval';
  if (code.includes('preview_data')) return 'Data preview tool';
  if (code.includes('find_related_datasets')) return 'Related datasets tool';

  return null;
}

async function main() {
  const inputPath = join(
    process.cwd(),
    '..',
    '.planning',
    'phases',
    '24-final-polish-a-quality',
    'sampled-examples.json',
  );
  const outputPath = join(
    process.cwd(),
    '..',
    '.planning',
    'phases',
    '24-final-polish-a-quality',
    'example-test-results.md',
  );

  console.log('Reading sampled examples...');
  const data: SamplingOutput = JSON.parse(readFileSync(inputPath, 'utf-8'));

  console.log(`Generating test checklist for ${data.sampledExamples} examples...`);
  const markdown = generateTestChecklist(data);

  writeFileSync(outputPath, markdown);

  console.log(`\nTest checklist written to: ${outputPath}`);
  console.log('\nStrata distribution:');
  for (const [section, count] of Object.entries(data.strata)) {
    console.log(`  ${section}: ${count}`);
  }
}

main().catch(console.error);
