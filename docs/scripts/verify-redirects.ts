import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Parse redirects from next.config.mjs
const configPath = join(process.cwd(), 'next.config.mjs');
const configContent = readFileSync(configPath, 'utf-8');

// Extract redirect source patterns
const redirectMatches = configContent.matchAll(/source:\s*['"]([^'"]+)['"]/g);
const redirectSources = Array.from(redirectMatches).map((m) => m[1]);

console.log(`Found ${redirectSources.length} redirect rules in next.config.mjs\n`);

// Define all old URL patterns that should redirect
const expectedOldUrls = [
  '/docs/getting-started/:path*',
  '/docs/guides/:path*',
  '/docs/workflows/:path*',
  '/docs/examples/:path*',
  '/docs/integration/:path*',
  '/docs/best-practices/:path*',
  '/docs/advanced/:path*',
  '/docs/reference/:path*',
  '/docs/tools/:path*',
  '/docs/api-reference/:path*',
  '/docs/tutorials/:path*',
];

// Check coverage
const missing: string[] = [];
const covered: string[] = [];

for (const expectedUrl of expectedOldUrls) {
  if (redirectSources.includes(expectedUrl)) {
    covered.push(expectedUrl);
  } else {
    missing.push(expectedUrl);
  }
}

// Report results
console.log('=== REDIRECT COVERAGE REPORT ===\n');

console.log(`✓ Covered (${covered.length}/${expectedOldUrls.length}):`);
covered.forEach((url) => console.log(`  ${url}`));

if (missing.length > 0) {
  console.log(`\n✗ Missing coverage (${missing.length}):`);
  missing.forEach((url) => console.log(`  ${url}`));
  console.log('\n❌ FAIL: Not all old URLs have redirects');
  process.exit(1);
} else {
  console.log('\n✅ PASS: All expected old URLs have redirect coverage');
  process.exit(0);
}
