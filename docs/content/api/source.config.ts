import { defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: ".",  // cwd is already docs/content/api/
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
