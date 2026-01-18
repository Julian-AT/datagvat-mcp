// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
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
  docs: create.doc("docs", {"index.de.mdx": () => import("../content/docs/index.de.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "best-practices/optimization.de.mdx": () => import("../content/docs/best-practices/optimization.de.mdx?collection=docs"), "best-practices/optimization.mdx": () => import("../content/docs/best-practices/optimization.mdx?collection=docs"), "examples/preview.de.mdx": () => import("../content/docs/examples/preview.de.mdx?collection=docs"), "examples/preview.mdx": () => import("../content/docs/examples/preview.mdx?collection=docs"), "examples/search.de.mdx": () => import("../content/docs/examples/search.de.mdx?collection=docs"), "examples/search.mdx": () => import("../content/docs/examples/search.mdx?collection=docs"), "examples/workflows.de.mdx": () => import("../content/docs/examples/workflows.de.mdx?collection=docs"), "examples/workflows.mdx": () => import("../content/docs/examples/workflows.mdx?collection=docs"), "guides/configuration.de.mdx": () => import("../content/docs/guides/configuration.de.mdx?collection=docs"), "guides/configuration.mdx": () => import("../content/docs/guides/configuration.mdx?collection=docs"), "guides/setup.de.mdx": () => import("../content/docs/guides/setup.de.mdx?collection=docs"), "guides/setup.mdx": () => import("../content/docs/guides/setup.mdx?collection=docs"), "tutorials/getting-started.de.mdx": () => import("../content/docs/tutorials/getting-started.de.mdx?collection=docs"), "tutorials/getting-started.mdx": () => import("../content/docs/tutorials/getting-started.mdx?collection=docs"), }),
};
export default browserCollections;