import { $ } from 'bun';

const SCHEMA_URL = 'https://qs.data.gv.at/api/hub/repo/openapi.yaml';
const OUTPUT_PATH = './data.gv.at-openapi.yaml';

async function main() {
  console.log('Downloading OpenAPI schema...');
  console.log(`  Source: ${SCHEMA_URL}`);
  console.log(`  Target: ${OUTPUT_PATH}`);
  console.log('');

  try {
    // Fetch schema from data.gv.at
    const response = await fetch(SCHEMA_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to download schema: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const yaml = await response.text();

    // Validate it's an OpenAPI schema
    if (!yaml.includes('openapi:')) {
      throw new Error(
        'Invalid schema: missing "openapi:" field. Schema may be corrupted.',
      );
    }

    // Check version (fumadocs-openapi requires 3.0 or 3.1)
    const versionMatch = yaml.match(/openapi:\s*['"]?(\d+\.\d+)/);
    if (!versionMatch) {
      throw new Error(
        'Cannot determine OpenAPI version. Schema format is invalid.',
      );
    }

    const version = versionMatch[1];
    if (!['3.0', '3.1'].includes(version)) {
      throw new Error(
        `Unsupported OpenAPI version: ${version}. fumadocs-openapi requires 3.0 or 3.1`,
      );
    }

    // Write to disk
    await Bun.write(OUTPUT_PATH, yaml);

    // Success output
    console.log('✓ Schema downloaded successfully');
    console.log(`  Version: OpenAPI ${version}`);
    console.log(`  Size: ${(yaml.length / 1024).toFixed(2)} KB`);
    console.log('');
  } catch (error: unknown) {
    console.error('✗ Failed to download schema');
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
    } else {
      console.error(`  Error: ${String(error)}`);
    }
    console.error('');
    process.exit(1);
  }
}

main();
