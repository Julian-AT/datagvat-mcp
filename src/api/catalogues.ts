import axios, { AxiosError } from "axios";
import { z } from "zod";
import { CatalogueRecord } from "../models/catalogue";

const HydraMemberSchema = z.object({
  "@id": z.string(),
  "@type": z.string().optional(),
  "http://purl.org/dc/terms/title": z
    .array(
      z.object({
        "@value": z.string(),
        "@language": z.string().optional(),
      })
    )
    .optional(),
  "http://purl.org/dc/terms/description": z
    .array(
      z.object({
        "@value": z.string(),
        "@language": z.string().optional(),
      })
    )
    .optional(),
});

const CatalogueResponseSchema = z.object({
  "@context": z.any().optional(),
  "@graph": z
    .array(
      z.object({
        "@id": z.string().optional(),
        "@type": z.union([z.string(), z.array(z.string())]).optional(),
        "http://www.w3.org/ns/hydra/core#member": z
          .array(HydraMemberSchema)
          .optional(),
      })
    )
    .optional(),
  "http://www.w3.org/ns/hydra/core#member": z
    .array(HydraMemberSchema)
    .optional(),
});

export interface ListCataloguesParams {
  valueType?: "uriRefs" | "identifiers" | "originalIds" | "metadata";
  limit?: number;
  offset?: number;
}

export async function listCatalogues(
  params: ListCataloguesParams = {}
): Promise<CatalogueRecord[]> {
  const { valueType = "identifiers", limit = 10, offset = 0 } = params;

  const baseUrl =
    process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
  const url = `${baseUrl}/catalogues`;

  try {
    const response = await axios.get(url, {
      params: { valueType, limit, offset },
      headers: {
        Accept: "application/ld+json",
      },
    });

    if (valueType === "identifiers" || valueType === "uriRefs" || valueType === "originalIds") {
      if (Array.isArray(response.data)) {
        return response.data
      }
      return [];
    }

    if (typeof response.data === 'string') {
      return [];
    }

    if (valueType === "metadata") {
      const validatedData = CatalogueResponseSchema.parse(response.data);

      let members: z.infer<typeof HydraMemberSchema>[] = [];

      if (validatedData["http://www.w3.org/ns/hydra/core#member"]) {
        members = validatedData["http://www.w3.org/ns/hydra/core#member"];
      } else if (validatedData["@graph"]) {
        for (const item of validatedData["@graph"]) {
          if (item["http://www.w3.org/ns/hydra/core#member"]) {
            members = item["http://www.w3.org/ns/hydra/core#member"];
            break;
          }
        }
      }

      return members.map((cat) => ({
        id: cat["@id"],
        title: cat["http://purl.org/dc/terms/title"]?.[0]?.["@value"],
        description:
          cat["http://purl.org/dc/terms/description"]?.[0]?.["@value"],
      }));
    }

    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Catalogue response validation failed: ${error.message}`);
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Catalogue fetching failed: ${axiosError.message} (status: ${axiosError.response?.status})`
      );
    }
    throw new Error(`Catalogue fetching failed: ${error}`);
  }
}

