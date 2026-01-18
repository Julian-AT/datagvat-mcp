import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { remarkFeedbackBlock } from 'fumadocs-core/mdx-plugins/remark-feedback-block';
import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';
import lastModified from 'fumadocs-mdx/plugins/last-modified';

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  plugins: [lastModified()],
  workspaces: {
    'api': {
      dir: 'content/api',
      config: await import('./content/api/source.config.ts'),
    },
  },
  mdxOptions: {
    remarkPlugins: [remarkFeedbackBlock],
    rehypeCodeOptions: {
      inline: 'tailing-curly-colon',
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        ...(rehypeCodeDefaultOptions.transformers ?? []),
      ],
    },
  },
});
