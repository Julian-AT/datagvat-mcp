import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOpenAPI } from 'fumadocs-openapi/server';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_PATH = path.join(__dirname, '..', 'data.gv.at-openapi.yaml');

const schemaContent = readFileSync(SCHEMA_PATH, 'utf-8');
const schemaObject = YAML.parse(schemaContent);

export const openapi = createOpenAPI({
  input: () => ({
    'data.gv.at': schemaObject,
  }),
  proxyUrl: '/api/proxy',
});
