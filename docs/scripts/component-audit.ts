#!/usr/bin/env tsx
/**
 * Component Consistency Audit Script
 *
 * Audits Fumadocs component usage for consistency across documentation.
 * Checks for proper usage of Tabs, Steps, TypeTable, and other components.
 * Verifies QUAL-03 (type information) and QUAL-04 (error handling).
 *
 * Usage: npx tsx ./scripts/component-audit.ts
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface ComponentUsage {
  total: number;
  withPersist?: number;
  withGroupId?: number;
  inApiDocs?: number;
  inWorkflows?: number;
  issues: Array<{ file: string; line: number; issue: string }>;
}

interface AuditResult {
  tabs: ComponentUsage;
  typeTable: ComponentUsage;
  steps: ComponentUsage;
  typeInfo: {
    apiDocsWithTypes: number;
    examplesWithTypes: number;
  };
  errorHandling: {
    guidesWithExamples: number;
    patterns: string[];
  };
}

function countPattern(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function findPatternLines(content: string, pattern: RegExp): number[] {
  const lines: number[] = [];
  const contentLines = content.split('\n');

  contentLines.forEach((line, index) => {
    if (pattern.test(line)) {
      lines.push(index + 1);
    }
  });

  return lines;
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
  console.log('Component Consistency Audit');
  console.log('============================\n');

  const contentDir = join(process.cwd(), 'content', 'docs');
  const mdxFiles = await getAllMdxFiles(contentDir);

  const result: AuditResult = {
    tabs: { total: 0, withPersist: 0, withGroupId: 0, issues: [] },
    typeTable: { total: 0, inApiDocs: 0, issues: [] },
    steps: { total: 0, inWorkflows: 0, issues: [] },
    typeInfo: { apiDocsWithTypes: 0, examplesWithTypes: 0 },
    errorHandling: { guidesWithExamples: 0, patterns: [] },
  };

  console.log(`Scanning ${mdxFiles.length} MDX files...\n`);

  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, 'utf-8');

    // Tabs component analysis
    const tabsMatches = countPattern(content, /<Tabs[^>]*>/gi);
    result.tabs.total += tabsMatches;

    const tabsWithPersist = countPattern(content, /<Tabs[^>]*persist[^>]*>/gi);
    result.tabs.withPersist! += tabsWithPersist;

    const tabsWithGroupId = countPattern(content, /<Tabs[^>]*groupId[^>]*>/gi);
    result.tabs.withGroupId! += tabsWithGroupId;

    // Check for tabs without persist (potential issue)
    if (tabsMatches > 0 && tabsWithPersist < tabsMatches) {
      const lines = findPatternLines(content, /<Tabs(?![^>]*persist)[^>]*>/i);
      for (const line of lines) {
        result.tabs.issues.push({
          file: filePath,
          line,
          issue: 'Missing persist prop',
        });
      }
    }

    // TypeTable component analysis
    const typeTableMatches = countPattern(content, /<TypeTable[^>]*>|<auto-type-table[^>]*>/gi);
    result.typeTable.total += typeTableMatches;

    if (filePath.includes('/tools/') || filePath.includes('/api/')) {
      if (typeTableMatches > 0) {
        result.typeTable.inApiDocs!++;
      }
    }

    // Steps component analysis
    const stepsMatches = countPattern(content, /<Steps>/gi);
    result.steps.total += stepsMatches;

    if (filePath.includes('/workflows/')) {
      if (stepsMatches > 0) {
        result.steps.inWorkflows!++;
      }
    }

    // Type information (QUAL-03) - check for TypeTable usage and inline types
    if (
      filePath.includes('/tools/') ||
      filePath.includes('/api/') ||
      filePath.includes('/guides/')
    ) {
      const hasTypeTable = typeTableMatches > 0;
      const hasInlineTypes =
        content.includes(': string') ||
        content.includes(': number') ||
        content.includes(': boolean');

      if (hasTypeTable || hasInlineTypes) {
        result.typeInfo.apiDocsWithTypes++;
      }
    }

    // Count code examples with type annotations
    if (content.match(/```(typescript|python|ts|tsx)/gi)) {
      const hasTypeAnnotations =
        content.includes(': str') ||
        content.includes(': int') ||
        content.includes(': string') ||
        content.includes(': number');
      if (hasTypeAnnotations) {
        result.typeInfo.examplesWithTypes++;
      }
    }

    // Error handling (QUAL-04) - check for try/catch, error responses
    if (filePath.includes('/guides/') || filePath.includes('/advanced/')) {
      const hasTryCatch =
        content.includes('try:') || content.includes('try {') || content.includes('except');
      const hasErrorResponse =
        content.includes('ToolError') || content.includes('error') || content.includes('Error');
      const hasTroubleshooting =
        content.includes('## Troubleshooting') || content.includes('## Common Issues');

      if (hasTryCatch || hasErrorResponse || hasTroubleshooting) {
        result.errorHandling.guidesWithExamples++;

        if (hasTryCatch && !result.errorHandling.patterns.includes('try/catch')) {
          result.errorHandling.patterns.push('try/catch');
        }
        if (hasErrorResponse && !result.errorHandling.patterns.includes('error responses')) {
          result.errorHandling.patterns.push('error responses');
        }
        if (hasTroubleshooting && !result.errorHandling.patterns.includes('troubleshooting')) {
          result.errorHandling.patterns.push('troubleshooting');
        }
      }
    }
  }

  // Save JSON results
  const outputDir = join(process.cwd(), '.planning', 'phases', '24-final-polish-a-quality');
  const outputPath = join(outputDir, 'component-audit-results.json');

  // Ensure directory exists
  mkdirSync(outputDir, { recursive: true });

  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`JSON results saved to: ${outputPath}\n`);

  // Print human-readable output
  console.log(`Tabs: ${result.tabs.total} usages`);
  console.log(`  ✓ ${result.tabs.withPersist} with persist`);
  console.log(`  ✓ ${result.tabs.withGroupId} with groupId`);
  if (result.tabs.issues.length > 0) {
    console.log(`  ✗ ${result.tabs.issues.length} missing persist:`);
    result.tabs.issues.forEach((issue) => {
      console.log(`    ${issue.file}:${issue.line} - ${issue.issue}`);
    });
  }

  console.log(`\nTypeTable: ${result.typeTable.total} usages`);
  console.log(`  ✓ ${result.typeTable.inApiDocs} in API docs`);

  console.log(`\nSteps: ${result.steps.total} usages`);
  console.log(`  ✓ ${result.steps.inWorkflows} in workflow guides`);

  console.log('\nQUAL-03 (Type Information):');
  console.log(`  ✓ ${result.typeInfo.apiDocsWithTypes} API/guide docs with type information`);
  console.log(`  ✓ ${result.typeInfo.examplesWithTypes} code examples with type annotations`);

  console.log('\nQUAL-04 (Error Handling):');
  console.log(
    `  ✓ ${result.errorHandling.guidesWithExamples} guides include error handling examples`,
  );
  console.log(`  ✓ Patterns: ${result.errorHandling.patterns.join(', ')}`);

  if (result.tabs.issues.length > 0) {
    console.log('\nRecommendations:');
    console.log(
      `- Add persist prop to Tabs in ${result.tabs.issues.length} files for cross-page state`,
    );
  }

  console.log('\n✓ Component audit complete');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error running component audit:', error);
  process.exit(1);
});
