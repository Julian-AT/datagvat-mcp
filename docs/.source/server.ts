// @ts-nocheck
import * as __fd_glob_20 from "../content/docs/tutorials/getting-started.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/tutorials/getting-started.de.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/guides/setup.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/guides/setup.de.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/guides/configuration.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/guides/configuration.de.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/examples/workflows.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/examples/workflows.de.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/examples/search.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/examples/search.de.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/examples/preview.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/examples/preview.de.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/best-practices/optimization.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/best-practices/optimization.de.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/index.de.mdx?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/tutorials/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/guides/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/examples/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/best-practices/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
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
}>({"doc":{"passthroughs":["extractedReferences","lastModified"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "best-practices/meta.json": __fd_glob_1, "examples/meta.json": __fd_glob_2, "guides/meta.json": __fd_glob_3, "tutorials/meta.json": __fd_glob_4, }, {"index.de.mdx": __fd_glob_5, "index.mdx": __fd_glob_6, "best-practices/optimization.de.mdx": __fd_glob_7, "best-practices/optimization.mdx": __fd_glob_8, "examples/preview.de.mdx": __fd_glob_9, "examples/preview.mdx": __fd_glob_10, "examples/search.de.mdx": __fd_glob_11, "examples/search.mdx": __fd_glob_12, "examples/workflows.de.mdx": __fd_glob_13, "examples/workflows.mdx": __fd_glob_14, "guides/configuration.de.mdx": __fd_glob_15, "guides/configuration.mdx": __fd_glob_16, "guides/setup.de.mdx": __fd_glob_17, "guides/setup.mdx": __fd_glob_18, "tutorials/getting-started.de.mdx": __fd_glob_19, "tutorials/getting-started.mdx": __fd_glob_20, });