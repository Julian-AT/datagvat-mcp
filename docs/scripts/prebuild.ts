import { $ } from 'bun';

// TODO: Re-enable type-check after Bun 1.2+ / TypeScript 5.9 compatibility fix
// Known issue: Bun 1.x global types conflict with TypeScript 5.9 (error TS2317)
// Tracking: https://github.com/oven-sh/bun/issues (search "ThisType")
// Workaround: Skip tsc --noEmit until Bun releases fix
const SKIP_TYPE_CHECK = true;

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
    if (SKIP_TYPE_CHECK) {
      console.log('⚠️  Skipped: Bun 1.x / TypeScript 5.9 compatibility issue');
      console.log('   See SKIP_TYPE_CHECK constant for details\n');
    } else {
      await $`tsc --noEmit`;
      console.log('✓ Types validated\n');
    }

    console.log('=== Pre-build validation complete ===\n');
  } catch (err: unknown) {
    console.error('\n✗ Pre-build validation failed');
    if (err && typeof err === 'object' && 'exitCode' in err) {
      console.error(`Exit code: ${err.exitCode}`);
    }
    process.exit(1);
  }
}

prebuild();
