// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../../source.config';

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
  docs: create.doc("docs", {"api/prompts.de.mdx": () => import("../../content/api/api/prompts.de.mdx?collection=docs&workspace=api"), "api/prompts.mdx": () => import("../../content/api/api/prompts.mdx?collection=docs&workspace=api"), "api/resources.de.mdx": () => import("../../content/api/api/resources.de.mdx?collection=docs&workspace=api"), "api/resources.mdx": () => import("../../content/api/api/resources.mdx?collection=docs&workspace=api"), "api/tools.de.mdx": () => import("../../content/api/api/tools.de.mdx?collection=docs&workspace=api"), "api/tools.mdx": () => import("../../content/api/api/tools.mdx?collection=docs&workspace=api"), }),
};
export default browserCollections;