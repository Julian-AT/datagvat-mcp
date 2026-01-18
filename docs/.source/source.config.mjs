var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// content/api/source.config.ts
var source_config_exports = {};
__export(source_config_exports, {
  default: () => source_config_default,
  docs: () => docs
});
import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
var docs, source_config_default;
var init_source_config = __esm({
  "content/api/source.config.ts"() {
    "use strict";
    docs = defineDocs({
      dir: ".",
      // cwd is already docs/content/api/
      docs: {
        schema: frontmatterSchema,
        postprocess: {
          includeProcessedMarkdown: true
        }
      },
      meta: {
        schema: metaSchema
      }
    });
    source_config_default = defineConfig({
      plugins: [lastModified()]
    });
  }
});

// source.config.ts
import {
  defineConfig as defineConfig2,
  defineDocs as defineDocs2,
  frontmatterSchema as frontmatterSchema2,
  metaSchema as metaSchema2
} from "fumadocs-mdx/config";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { remarkFeedbackBlock } from "fumadocs-core/mdx-plugins/remark-feedback-block";
import { transformerNotationDiff, transformerNotationHighlight } from "@shikijs/transformers";
import lastModified2 from "fumadocs-mdx/plugins/last-modified";
var docs2 = defineDocs2({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema2,
    postprocess: {
      includeProcessedMarkdown: true
    }
  },
  meta: {
    schema: metaSchema2
  }
});
var source_config_default2 = defineConfig2({
  plugins: [lastModified2()],
  workspaces: {
    "api": {
      dir: "content/api",
      config: await Promise.resolve().then(() => (init_source_config(), source_config_exports))
    }
  },
  mdxOptions: {
    remarkPlugins: [remarkFeedbackBlock],
    rehypeCodeOptions: {
      inline: "tailing-curly-colon",
      themes: {
        light: "github-light",
        dark: "github-dark"
      },
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        ...rehypeCodeDefaultOptions.transformers ?? []
      ]
    }
  }
});
export {
  source_config_default2 as default,
  docs2 as docs
};
