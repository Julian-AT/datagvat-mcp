import { MCPToolDefinition } from "../types";
import { listDatasets, getDataset } from "../../api/datasets";
import { listAllDatasets } from "../../api/datasets-paginated";
import { getEnrichedDataset } from "../../api/distributions";

interface ListDatasetsParams {
  catalogueId: string;
  valueType?: "uriRefs" | "identifiers" | "originalIds" | "metadata";
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  keywords?: string[];
  publisher?: string;
  modifiedSince?: string;
}

const listDatasetsInputSchema = {
  type: "object",
  properties: {
    catalogueId: { type: "string", minLength: 1 },
    valueType: {
      type: "string",
      enum: ["uriRefs", "identifiers", "originalIds", "metadata"],
    },
    limit: { type: "number", minimum: 1, maximum: 1000 },
    offset: { type: "number", minimum: 0 },
    fetchAll: { type: "boolean" },
    keywords: { type: "array", items: { type: "string" } },
    publisher: { type: "string" },
    modifiedSince: { type: "string", format: "date-time" },
  },
  required: ["catalogueId"],
  additionalProperties: false,
};

export const listDatasetsTool: MCPToolDefinition = {
  name: "listDatasets",
  description:
    "List datasets within a specific catalogue. Supports filtering by keywords, publisher, and modification date. Returns dataset IDs, titles, descriptions, keywords, and publisher information. Use fetchAll=true for automatic pagination through all datasets.",
  inputSchema: listDatasetsInputSchema,
  handler: async (params: Record<string, unknown>) => {
    const typedParams = params as unknown as ListDatasetsParams;
    const {
      catalogueId,
      valueType = "metadata",
      limit = 10,
      offset = 0,
      fetchAll = false,
      keywords,
      publisher,
      modifiedSince,
    } = typedParams;

    type DatasetRecord = {
      id?: string;
      keywords?: string[];
      publisher?: { name?: string };
      modified?: string;
    };

    let datasets: DatasetRecord[];

    if (fetchAll) {
      datasets = await listAllDatasets(
        catalogueId,
        { valueType },
        { maxItems: 5000, batchSize: 100 }
      );
    } else {
      datasets = await listDatasets(catalogueId, {
        valueType,
        limit,
        offset,
      });
    }

    let filteredDatasets = datasets;

    if (keywords && keywords.length > 0) {
      filteredDatasets = filteredDatasets.filter((ds) => {
        const dsKeywords = ds.keywords || [];
        return keywords.some((kw) =>
          dsKeywords.some((dskw) =>
            dskw.toLowerCase().includes(kw.toLowerCase())
          )
        );
      });
    }

    if (publisher) {
      filteredDatasets = filteredDatasets.filter((ds) => {
        const pubName = ds.publisher?.name || "";
        return pubName.toLowerCase().includes(publisher.toLowerCase());
      });
    }

    if (modifiedSince) {
      const sinceDate = new Date(modifiedSince);
      filteredDatasets = filteredDatasets.filter((ds) => {
        if (!ds.modified) return false;
        const modDate = new Date(ds.modified);
        return modDate >= sinceDate;
      });
    }

    if (fetchAll) {
      return {
        catalogueId,
        datasets: filteredDatasets,
        total: filteredDatasets.length,
        fetched: "all",
        ...(keywords && { filteredByKeywords: keywords }),
        ...(publisher && { filteredByPublisher: publisher }),
        ...(modifiedSince && { filteredByModifiedSince: modifiedSince }),
      };
    }

    return {
      catalogueId,
      datasets: filteredDatasets,
      count: filteredDatasets.length,
      pagination: {
        limit,
        offset,
        hasMore: datasets.length === limit,
      },
      ...(keywords && { filteredByKeywords: keywords }),
      ...(publisher && { filteredByPublisher: publisher }),
      ...(modifiedSince && { filteredByModifiedSince: modifiedSince }),
    };
  },
};

interface GetDatasetParams {
  datasetId: string;
}

const getDatasetInputSchema = {
  type: "object",
  properties: {
    datasetId: { type: "string", minLength: 1 },
  },
  required: ["datasetId"],
  additionalProperties: false,
};

export const getDatasetTool: MCPToolDefinition = {
  name: "getDataset",
  description:
    "Retrieve detailed metadata for a specific dataset by ID. Returns complete information including title, description, keywords, publisher, themes, temporal/spatial coverage, license, and distribution references.",
  inputSchema: getDatasetInputSchema,
  handler: async (params: Record<string, unknown>) => {
    const { datasetId } = params as unknown as GetDatasetParams;
    const dataset = await getDataset(datasetId);

    if (!dataset) {
      throw new Error(`Dataset '${datasetId}' not found`);
    }

    return { dataset };
  },
};

interface GetEnrichedDatasetParams {
  datasetId: string;
}

const getEnrichedDatasetInputSchema = {
  type: "object",
  properties: {
    datasetId: { type: "string", minLength: 1 },
  },
  required: ["datasetId"],
  additionalProperties: false,
};

export const getEnrichedDatasetTool: MCPToolDefinition = {
  name: "getEnrichedDataset",
  description:
    "Retrieve a dataset with all its distributions embedded. This combines dataset metadata with complete distribution information (download URLs, formats, file sizes, licenses) in a single call, optimized for LLM consumption.",
  inputSchema: getEnrichedDatasetInputSchema,
  handler: async (params: Record<string, unknown>) => {
    const { datasetId } = params as unknown as GetEnrichedDatasetParams;
    const enrichedDataset = await getEnrichedDataset(datasetId);

    if (!enrichedDataset) {
      throw new Error(`Dataset '${datasetId}' not found`);
    }

    return {
      dataset: enrichedDataset,
      distributionCount: enrichedDataset.distributions.length,
    };
  },
};

