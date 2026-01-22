#!/usr/bin/env tsx
/**
 * Master Quality Check Script
 *
 * Orchestrates all quality validation checks for data.gv.at MCP Server documentation.
 * Executes both automated validation (MDX syntax, TypeScript types, production build)
 * and custom validation (syntax highlighting, component consistency).
 *
 * Usage: npx tsx ./scripts/quality-check.ts
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message?: string;
  details?: string;
}

const results: CheckResult[] = [];

function printHeader(text: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(text);
  console.log(`${'='.repeat(60)}\n`);
}

function printResult(result: CheckResult) {
  const icon = result.status === 'PASS' ? '✓' : result.status === 'WARN' ? '⚠' : '✗';
  const color =
    result.status === 'PASS' ? '\x1b[32m' : result.status === 'WARN' ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`${color}${icon} ${result.name}: ${result.status}${reset}`);
  if (result.message) {
    console.log(`  ${result.message}`);
  }
  if (result.details) {
    console.log(`  Details: ${result.details}`);
  }
}

function runCommand(command: string, name: string): CheckResult {
  try {
    const output = execSync(command, {
      cwd: join(process.cwd()),
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    return {
      name,
      status: 'PASS',
      message: output.trim().split('\n').slice(-2).join(' '),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      name,
      status: 'FAIL',
      message: 'Command failed',
      details: errorMessage,
    };
  }
}

function checkFileExists(path: string, name: string): CheckResult {
  const fullPath = join(process.cwd(), path);
  if (existsSync(fullPath)) {
    return {
      name,
      status: 'PASS',
      message: `Found: ${path}`,
    };
  } else {
    return {
      name,
      status: 'FAIL',
      message: `Missing: ${path}`,
    };
  }
}

async function main() {
  printHeader('Quality Validation Report - data.gv.at MCP Server Documentation');

  console.log('Starting comprehensive quality checks...\n');

  // Layer 1: Automated Validation
  printHeader('Layer 1: Automated Validation');

  // Check 1: MDX Syntax Validation
  console.log('Running MDX syntax validation...');
  const mdxCheck = runCommand('fumadocs-mdx', 'MDX Syntax');
  results.push(mdxCheck);
  printResult(mdxCheck);

  // Check 2: TypeScript Type Checking
  console.log('\nRunning TypeScript type checking...');
  const typeCheck = runCommand('next typegen && tsc --noEmit', 'Type Checking');
  results.push(typeCheck);
  printResult(typeCheck);

  // Check 3: Production Build
  console.log('\nRunning production build...');
  const buildCheck = runCommand('next build', 'Production Build');
  results.push(buildCheck);
  printResult(buildCheck);

  // Layer 2: Custom Validation
  printHeader('Layer 2: Custom Validation');

  // Check 4: Syntax Highlighting Verification
  console.log('Running syntax highlighting verification...');
  const syntaxCheck = runCommand(
    'npx tsx ./scripts/verify-syntax-highlighting.ts',
    'Syntax Highlighting',
  );
  results.push(syntaxCheck);
  printResult(syntaxCheck);

  // Check 5: Component Consistency Audit
  console.log('\nRunning component consistency audit...');
  const componentCheck = runCommand('npx tsx ./scripts/component-audit.ts', 'Component Audit');
  results.push(componentCheck);
  printResult(componentCheck);

  // Check 6: Type Information Verification (QUAL-03)
  console.log('\nVerifying type information presence...');
  const typeInfoCheck = checkFileExists(
    '.planning/phases/24-final-polish-a-quality/component-audit-results.json',
    'Type Information (QUAL-03)',
  );
  results.push(typeInfoCheck);
  printResult(typeInfoCheck);

  // Check 7: Error Handling Examples (QUAL-04)
  console.log('\nVerifying error handling examples...');
  const errorHandlingCheck = checkFileExists(
    'content/docs/advanced/error-handling.mdx',
    'Error Handling (QUAL-04)',
  );
  results.push(errorHandlingCheck);
  printResult(errorHandlingCheck);

  // Summary
  printHeader('Summary');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warnings = results.filter((r) => r.status === 'WARN').length;

  console.log(`Total checks: ${results.length}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`⚠ Warnings: ${warnings}`);

  if (failed === 0) {
    console.log('\n🎉 Status: READY FOR PRODUCTION\n');
    process.exit(0);
  } else {
    console.log('\n❌ Status: ISSUES FOUND - Review and fix before production\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error running quality checks:', error);
  process.exit(1);
});
