import path from 'node:path';
import { createOpenAPI } from 'fumadocs-openapi/server';

const SCHEMA_PATH = path.resolve('./data.gv.at-openapi.yaml');

// Validate schema file exists before creating instance
// This fails fast with clear error rather than cryptic build errors
if (!(await Bun.file(SCHEMA_PATH).exists())) {
  throw new Error(
    `OpenAPI schema not found: ${SCHEMA_PATH}\n` +
      'Run: bun run scripts/download-openapi.ts',
  );
}

export const openapi = createOpenAPI({
  input: [SCHEMA_PATH],
  proxyUrl: '/api/proxy',
});
