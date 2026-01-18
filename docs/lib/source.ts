import { docs } from "../.source/server";
import { docs as apiDocs } from "../.source/api/server";
import { type InferPageType, loader, multiple } from "fumadocs-core/source";
import { i18n } from "./i18n";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

export const source = loader(
  multiple({
    root: docs.toFumadocsSource(),
    api: apiDocs.toFumadocsSource(),
  }),
  {
    baseUrl: "/",
    i18n,
    plugins: [lucideIconsPlugin()],
  }
);

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");

  return `${processed}`;
}

export type Page = InferPageType<typeof source>;
