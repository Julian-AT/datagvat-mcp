import {
  type InferMetaType,
  type InferPageType,
  type LoaderPlugin,
  loader,
  multiple,
} from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { openapiPlugin, openapiSource } from 'fumadocs-openapi/server';
import { i18n } from '@/lib/i18n';
import { openapi } from '@/lib/openapi';
import { docs } from '../.source/server';

export const source = loader(
  multiple({
    docs: docs.toFumadocsSource(),
    openapi: await openapiSource(openapi, {
      baseDir: 'api-reference',
    }),
  }),
  {
    baseUrl: '/docs',
    i18n,
    plugins: [pageTreeCodeTitles(), lucideIconsPlugin(), openapiPlugin()],
  }
);

function pageTreeCodeTitles(): LoaderPlugin {
  return {
    transformPageTree: {
      file(node) {
        if (
          typeof node.name === 'string' &&
          (node.name.endsWith('()') || node.name.match(/^<\w+ \/>$/))
        ) {
          return {
            ...node,
            name: (
              <code key="0" className="text-[0.8125rem]">
                {node.name}
              </code>
            ),
          };
        }
        return node;
      },
    },
  };
}

export type Page = InferPageType<typeof source>;
export type Meta = InferMetaType<typeof source>;
