// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
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
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "(docs)/first-query.mdx": () => import("../content/docs/(docs)/first-query.mdx?collection=docs"), "(docs)/index.mdx": () => import("../content/docs/(docs)/index.mdx?collection=docs"), "(docs)/installation.mdx": () => import("../content/docs/(docs)/installation.mdx?collection=docs"), "(docs)/quick-reference.mdx": () => import("../content/docs/(docs)/quick-reference.mdx?collection=docs"), "(docs)/troubleshooting.mdx": () => import("../content/docs/(docs)/troubleshooting.mdx?collection=docs"), "api/index.mdx": () => import("../content/docs/api/index.mdx?collection=docs"), "(docs)/examples/component-showcase.mdx": () => import("../content/docs/(docs)/examples/component-showcase.mdx?collection=docs"), "(docs)/examples/index.mdx": () => import("../content/docs/(docs)/examples/index.mdx?collection=docs"), "(docs)/examples/preview.mdx": () => import("../content/docs/(docs)/examples/preview.mdx?collection=docs"), "(docs)/examples/search.mdx": () => import("../content/docs/(docs)/examples/search.mdx?collection=docs"), "(docs)/examples/workflows.mdx": () => import("../content/docs/(docs)/examples/workflows.mdx?collection=docs"), "(docs)/guides/configuration.mdx": () => import("../content/docs/(docs)/guides/configuration.mdx?collection=docs"), "(docs)/guides/data-preview.mdx": () => import("../content/docs/(docs)/guides/data-preview.mdx?collection=docs"), "(docs)/guides/index.mdx": () => import("../content/docs/(docs)/guides/index.mdx?collection=docs"), "(docs)/guides/quality-metrics.mdx": () => import("../content/docs/(docs)/guides/quality-metrics.mdx?collection=docs"), "(docs)/guides/searching.mdx": () => import("../content/docs/(docs)/guides/searching.mdx?collection=docs"), "(docs)/integration/claude-desktop.mdx": () => import("../content/docs/(docs)/integration/claude-desktop.mdx?collection=docs"), "(docs)/integration/other-clients.mdx": () => import("../content/docs/(docs)/integration/other-clients.mdx?collection=docs"), }),
};
export default browserCollections;