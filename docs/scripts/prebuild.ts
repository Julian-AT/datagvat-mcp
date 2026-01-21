import { $ } from 'bun';

async function prebuild() {
  console.log('=== Pre-build Validation ===\n');

  try {
    console.log('1. Running Biome checks...');
    await $`biome check .`;
    console.log('✓ Biome passed\n');

    console.log('2. Validating links...');
    await $`bun run scripts/validate-links.ts`;
    console.log('✓ Links validated\n');

    console.log('3. Type checking...');
    await $`tsc --noEmit`;
    console.log('✓ Types validated\n');

    console.log('=== Pre-build validation complete ===\n');
  } catch (err: any) {
    console.error('\n✗ Pre-build validation failed');
    console.error(`Exit code: ${err.exitCode}`);
    process.exit(1);
  }
}

prebuild();
