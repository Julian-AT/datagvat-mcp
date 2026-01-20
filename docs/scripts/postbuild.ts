import { $ } from 'bun';
import { existsSync } from 'fs';

async function postbuild() {
  console.log('=== Post-build Verification ===\n');

  try {
    // Verify .next directory structure
    const requiredDirs = ['.next/server', '.next/static'];

    for (const dir of requiredDirs) {
      if (!existsSync(dir)) {
        throw new Error(`Missing expected build output: ${dir}`);
      }
    }
    console.log('✓ Build output structure verified\n');

    // Report build size
    console.log('Build size:');
    const result = await $`du -sh .next`.text();
    console.log(result);

    console.log('\n=== Post-build verification complete ===\n');
  } catch (err: any) {
    console.error('\n✗ Post-build verification failed:', err);
    process.exit(1);
  }
}

postbuild();
