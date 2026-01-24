import { generateFiles } from 'fumadocs-openapi';
import { openapi } from '@/lib/openapi';

void generateFiles({
    input: openapi,
    output: 'docs/content/docs/api/openapi',
    includeDescription: true,
});