import axios, { AxiosError } from "axios";
import { z } from "zod";
import { DatasetRecord, DatasetMetadata } from "../models/dataset";

const HydraMemberSchema = z.object({
  "@id": z.string(),
  "@type": z.union([z.string(), z.array(z.string())]).optional(),
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
  "http://www.w3.org/ns/dcat#keyword": z
    .array(
      z.object({
        "@value": z.string(),
        "@language": z.string().optional(),
      })
    )
    .optional(),
  "http://purl.org/dc/terms/modified": z
    .array(
      z.object({
        "@value": z.string(),
        "@type": z.string().optional(),
      })
    )
    .optional(),
  "http://purl.org/dc/terms/issued": z
    .array(
      z.object({
        "@value": z.string(),
        "@type": z.string().optional(),
      })
    )
    .optional(),
  "http://purl.org/dc/terms/publisher": z
    .array(
      z.object({
        "@id": z.string().optional(),
        "http://xmlns.com/foaf/0.1/name": z
          .array(
            z.object({
              "@value": z.string(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

const DatasetResponseSchema = z.object({
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

const DatasetDetailSchema = z.object({
  "@context": z.any().optional(),
  "@graph": z.array(z.any()).optional(),
  "@id": z.string().optional(),
  "@type": z.union([z.string(), z.array(z.string())]).optional(),
});

export interface ListDatasetsParams {
  valueType?: "uriRefs" | "identifiers" | "originalIds" | "metadata";
  limit?: number;
  offset?: number;
}

export async function listDatasets(
  catalogueId: string,
  params: ListDatasetsParams = {}
): Promise<DatasetRecord[]> {
  const { valueType = "identifiers", limit = 10, offset = 0 } = params;

  const baseUrl =
    process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
  const url = `${baseUrl}/catalogues/${catalogueId}/datasets`;

  try {
    const response = await axios.get(url, {
      params: { valueType, limit, offset },
      headers: {
        Accept: "application/ld+json",
      },
    });

    if (valueType === "identifiers" || valueType === "uriRefs" || valueType === "originalIds") {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    }

    if (typeof response.data === 'string') {
      return [];
    }

    if (valueType === "metadata") {
      const validatedData = DatasetResponseSchema.parse(response.data);

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

      return members.map((dataset) => ({
        id: dataset["@id"],
        title: dataset["http://purl.org/dc/terms/title"]?.[0]?.["@value"],
        description:
          dataset["http://purl.org/dc/terms/description"]?.[0]?.["@value"],
        keywords: dataset["http://www.w3.org/ns/dcat#keyword"]?.map(
          (k) => k["@value"]
        ),
        modified:
          dataset["http://purl.org/dc/terms/modified"]?.[0]?.["@value"],
        issued: dataset["http://purl.org/dc/terms/issued"]?.[0]?.["@value"],
        publisher: {
          id: dataset["http://purl.org/dc/terms/publisher"]?.[0]?.["@id"],
          name: dataset["http://purl.org/dc/terms/publisher"]?.[0]?.[
            "http://xmlns.com/foaf/0.1/name"
          ]?.[0]?.["@value"],
        },
      }));
    }

    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Dataset response validation failed: ${error.message}`);
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Dataset fetching failed: ${axiosError.message} (status: ${axiosError.response?.status})`
      );
    }
    throw new Error(`Dataset fetching failed: ${error}`);
  }
}

export async function getDataset(
  datasetId: string
): Promise<DatasetMetadata | null> {
  const baseUrl =
    process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
  const url = `${baseUrl}/datasets/${datasetId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/ld+json",
      },
    });

    const validatedData = DatasetDetailSchema.parse(response.data);

    let datasetNode: any = null;

    if (validatedData["@graph"] && Array.isArray(validatedData["@graph"])) {
      datasetNode = validatedData["@graph"].find(
        (node: any) =>
          node["@type"] &&
          (node["@type"] === "http://www.w3.org/ns/dcat#Dataset" ||
            (Array.isArray(node["@type"]) &&
              node["@type"].includes("http://www.w3.org/ns/dcat#Dataset")))
      );
    } else {
      datasetNode = response.data;
    }

    if (!datasetNode) {
      return null;
    }

    const metadata: DatasetMetadata = {
      id: datasetNode["@id"] || datasetId,
      title:
        datasetNode["http://purl.org/dc/terms/title"]?.[0]?.["@value"] ||
        datasetNode["title"],
      description:
        datasetNode["http://purl.org/dc/terms/description"]?.[0]?.["@value"] ||
        datasetNode["description"],
      keywords:
        datasetNode["http://www.w3.org/ns/dcat#keyword"]?.map(
          (k: any) => k["@value"] || k
        ) || [],
      modified:
        datasetNode["http://purl.org/dc/terms/modified"]?.[0]?.["@value"],
      issued: datasetNode["http://purl.org/dc/terms/issued"]?.[0]?.["@value"],
      publisher: {
        id: datasetNode["http://purl.org/dc/terms/publisher"]?.[0]?.["@id"],
        name: datasetNode["http://purl.org/dc/terms/publisher"]?.[0]?.[
          "http://xmlns.com/foaf/0.1/name"
        ]?.[0]?.["@value"],
      },
      distributions: datasetNode["http://www.w3.org/ns/dcat#distribution"]?.map(
        (d: any) => d["@id"] || d
      ),
      themes: datasetNode["http://www.w3.org/ns/dcat#theme"]?.map(
        (t: any) => t["@id"] || t
      ),
      spatial: datasetNode["http://purl.org/dc/terms/spatial"]?.map(
        (s: any) => s["@id"] || s
      ),
      license: datasetNode["http://purl.org/dc/terms/license"]?.[0]?.["@id"],
      accessRights:
        datasetNode["http://purl.org/dc/terms/accessRights"]?.[0]?.["@id"],
    };
    return metadata;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Dataset metadata validation failed: ${error.message}`
      );
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw new Error(
        `Dataset metadata fetch failed: ${axiosError.message} (status: ${axiosError.response?.status})`
      );
    }
    throw new Error(`Dataset metadata fetch failed: ${error}`);
  }
}

