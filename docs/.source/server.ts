// @ts-nocheck
import { frontmatter as __fd_glob_24 } from "../content/docs/(docs)/integration/other-clients.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_23 } from "../content/docs/(docs)/integration/claude-desktop.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_22 } from "../content/docs/(docs)/guides/searching.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_21 } from "../content/docs/(docs)/guides/quality-metrics.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_20 } from "../content/docs/(docs)/guides/index.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_19 } from "../content/docs/(docs)/guides/data-preview.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_18 } from "../content/docs/(docs)/guides/configuration.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_17 } from "../content/docs/(docs)/examples/workflows.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_16 } from "../content/docs/(docs)/examples/search.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_15 } from "../content/docs/(docs)/examples/preview.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_14 } from "../content/docs/(docs)/examples/index.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_13 } from "../content/docs/api/index.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_12 } from "../content/docs/(docs)/troubleshooting.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_11 } from "../content/docs/(docs)/quick-reference.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_10 } from "../content/docs/(docs)/installation.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_9 } from "../content/docs/(docs)/index.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_8 } from "../content/docs/(docs)/first-query.mdx?collection=docs&only=frontmatter"
import { frontmatter as __fd_glob_7 } from "../content/docs/index.mdx?collection=docs&only=frontmatter"
import { default as __fd_glob_6 } from "../content/docs/(docs)/guides/meta.json?collection=docs"
import { default as __fd_glob_5 } from "../content/docs/api/tools/meta.json?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/(docs)/integration/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/(docs)/examples/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/api/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/(docs)/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
    docs: {
      /**
       * extracted references (e.g. hrefs, paths), useful for analyzing relationships between pages.
       */
      extractedReferences: import("fumadocs-mdx").ExtractedReference[];
    },
  }
} & {
  DocData: {
    docs: {
      /**
       * Last modified date of document file, obtained from version control.
       *
       */
      lastModified?: Date;
    },
  }
}>({"doc":{"passthroughs":["extractedReferences","lastModified"]}});

export const docs = await create.docsLazy("docs", "content/docs", {"meta.json": __fd_glob_0, "(docs)/meta.json": __fd_glob_1, "api/meta.json": __fd_glob_2, "(docs)/examples/meta.json": __fd_glob_3, "(docs)/integration/meta.json": __fd_glob_4, "api/tools/meta.json": __fd_glob_5, "(docs)/guides/meta.json": __fd_glob_6, }, {"index.mdx": __fd_glob_7, "(docs)/first-query.mdx": __fd_glob_8, "(docs)/index.mdx": __fd_glob_9, "(docs)/installation.mdx": __fd_glob_10, "(docs)/quick-reference.mdx": __fd_glob_11, "(docs)/troubleshooting.mdx": __fd_glob_12, "api/index.mdx": __fd_glob_13, "(docs)/examples/index.mdx": __fd_glob_14, "(docs)/examples/preview.mdx": __fd_glob_15, "(docs)/examples/search.mdx": __fd_glob_16, "(docs)/examples/workflows.mdx": __fd_glob_17, "(docs)/guides/configuration.mdx": __fd_glob_18, "(docs)/guides/data-preview.mdx": __fd_glob_19, "(docs)/guides/index.mdx": __fd_glob_20, "(docs)/guides/quality-metrics.mdx": __fd_glob_21, "(docs)/guides/searching.mdx": __fd_glob_22, "(docs)/integration/claude-desktop.mdx": __fd_glob_23, "(docs)/integration/other-clients.mdx": __fd_glob_24, }, {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "(docs)/first-query.mdx": () => import("../content/docs/(docs)/first-query.mdx?collection=docs"), "(docs)/index.mdx": () => import("../content/docs/(docs)/index.mdx?collection=docs"), "(docs)/installation.mdx": () => import("../content/docs/(docs)/installation.mdx?collection=docs"), "(docs)/quick-reference.mdx": () => import("../content/docs/(docs)/quick-reference.mdx?collection=docs"), "(docs)/troubleshooting.mdx": () => import("../content/docs/(docs)/troubleshooting.mdx?collection=docs"), "api/index.mdx": () => import("../content/docs/api/index.mdx?collection=docs"), "(docs)/examples/index.mdx": () => import("../content/docs/(docs)/examples/index.mdx?collection=docs"), "(docs)/examples/preview.mdx": () => import("../content/docs/(docs)/examples/preview.mdx?collection=docs"), "(docs)/examples/search.mdx": () => import("../content/docs/(docs)/examples/search.mdx?collection=docs"), "(docs)/examples/workflows.mdx": () => import("../content/docs/(docs)/examples/workflows.mdx?collection=docs"), "(docs)/guides/configuration.mdx": () => import("../content/docs/(docs)/guides/configuration.mdx?collection=docs"), "(docs)/guides/data-preview.mdx": () => import("../content/docs/(docs)/guides/data-preview.mdx?collection=docs"), "(docs)/guides/index.mdx": () => import("../content/docs/(docs)/guides/index.mdx?collection=docs"), "(docs)/guides/quality-metrics.mdx": () => import("../content/docs/(docs)/guides/quality-metrics.mdx?collection=docs"), "(docs)/guides/searching.mdx": () => import("../content/docs/(docs)/guides/searching.mdx?collection=docs"), "(docs)/integration/claude-desktop.mdx": () => import("../content/docs/(docs)/integration/claude-desktop.mdx?collection=docs"), "(docs)/integration/other-clients.mdx": () => import("../content/docs/(docs)/integration/other-clients.mdx?collection=docs"), });