import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOpenAPI } from 'fumadocs-openapi/server';
import YAML from 'yaml';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to schema file (one level up from lib/)
const SCHEMA_PATH = path.join(__dirname, '..', 'data.gv.at-openapi.yaml');

// Read and parse schema
// fumadocs-openapi's input accepts a function returning SchemaMap
// where values can be schema objects (not just file paths)
const schemaContent = readFileSync(SCHEMA_PATH, 'utf-8');
const schemaObject = YAML.parse(schemaContent);

export const openapi = createOpenAPI({
  input: () => ({
    'data.gv.at': schemaObject,
  }),
  proxyUrl: '/api/proxy',
});
