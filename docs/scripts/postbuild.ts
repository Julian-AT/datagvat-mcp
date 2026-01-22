import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

function getDirectorySize(dirPath: string): number {
  let size = 0;
  try {
    const items = readdirSync(dirPath);
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      if (stat.isDirectory()) {
        size += getDirectorySize(itemPath);
      } else {
        size += stat.size;
      }
    }
  } catch {
    // Ignore errors for inaccessible directories
  }
  return size;
}

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
    const size = getDirectorySize('.next');
    console.log(formatBytes(size));

    console.log('\n=== Post-build verification complete ===\n');
  } catch (err: unknown) {
    console.error('\n✗ Post-build verification failed:', err);
    process.exit(1);
  }
}

postbuild();
