import { createOpenAPI } from 'fumadocs-openapi/server';
import { parse as parseYaml } from 'yaml';
import { filterOpenAPISchema } from './filter-openapi';

const OPENAPI_URL = 'https://qs.data.gv.at/api/hub/repo/openapi.yaml';

export const openapi = createOpenAPI({
  input: async () => {
    const res = await fetch(OPENAPI_URL);
    const text = await res.text();
    const doc = text.trimStart().startsWith('{')
      ? (JSON.parse(text) as Parameters<typeof filterOpenAPISchema>[0])
      : (parseYaml(text) as Parameters<typeof filterOpenAPISchema>[0]);
    const filtered = filterOpenAPISchema(doc, {
      xInternal: true,
      internalTags: ['Internal'],
      // Exclude ops whose description contains "internal use only" (common in this spec)
      excludeDescriptionContaining: 'internal use only',
      // excludePathPrefixes: ['/internal/'],
      // excludeOperationIds: ['someOpId'],
    });
    return { [OPENAPI_URL]: filtered };
  },
  proxyUrl: '/api/proxy',
});
