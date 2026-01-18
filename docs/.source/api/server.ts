// @ts-nocheck
import * as __fd_glob_6 from "../../content/api/api/tools.mdx?collection=docs&workspace=api"
import * as __fd_glob_5 from "../../content/api/api/tools.de.mdx?collection=docs&workspace=api"
import * as __fd_glob_4 from "../../content/api/api/resources.mdx?collection=docs&workspace=api"
import * as __fd_glob_3 from "../../content/api/api/resources.de.mdx?collection=docs&workspace=api"
import * as __fd_glob_2 from "../../content/api/api/prompts.mdx?collection=docs&workspace=api"
import * as __fd_glob_1 from "../../content/api/api/prompts.de.mdx?collection=docs&workspace=api"
import { default as __fd_glob_0 } from "../../content/api/api/meta.json?collection=docs&workspace=api"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../../source.config';

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

export const docs = await create.docs("docs", "content/api", {"api/meta.json": __fd_glob_0, }, {"api/prompts.de.mdx": __fd_glob_1, "api/prompts.mdx": __fd_glob_2, "api/resources.de.mdx": __fd_glob_3, "api/resources.mdx": __fd_glob_4, "api/tools.de.mdx": __fd_glob_5, "api/tools.mdx": __fd_glob_6, });