import { MCPToolDefinition } from "../types";
import { listDistributions, getDistribution } from "../../api/distributions";

interface ListDistributionsParams {
  datasetId: string;
  valueType?: "uriRefs" | "identifiers" | "originalIds" | "metadata";
  limit?: number;
  offset?: number;
}

const listDistributionsInputSchema = {
  type: "object",
  properties: {
    datasetId: { type: "string", minLength: 1 },
    valueType: {
      type: "string",
      enum: ["uriRefs", "identifiers", "originalIds", "metadata"],
    },
    limit: { type: "number", minimum: 1, maximum: 1000 },
    offset: { type: "number", minimum: 0 },
  },
  required: ["datasetId"],
  additionalProperties: false,
};

export const listDistributionsTool: MCPToolDefinition = {
  name: "listDistributions",
  description:
    "List all distributions (downloadable files/resources) for a specific dataset. Returns distribution metadata including access URLs, download URLs, file formats, media types, file sizes, and licenses.",
  inputSchema: listDistributionsInputSchema,
  handler: async (params: Record<string, unknown>) => {
    const typedParams = params as unknown as ListDistributionsParams;
    const {
      datasetId,
      valueType = "metadata",
      limit = 100,
      offset = 0,
    } = typedParams;

    const distributions = await listDistributions(datasetId, {
      valueType,
      limit,
      offset,
    });

    return {
      datasetId,
      distributions,
      count: distributions.length,
      pagination: {
        limit,
        offset,
        hasMore: distributions.length === limit,
      },
    };
  },
};

interface GetDistributionParams {
  distributionId: string;
}

const getDistributionInputSchema = {
  type: "object",
  properties: {
    distributionId: { type: "string", minLength: 1 },
  },
  required: ["distributionId"],
  additionalProperties: false,
};

export const getDistributionTool: MCPToolDefinition = {
  name: "getDistribution",
  description:
    "Retrieve detailed metadata for a specific distribution (file/resource) by ID. Returns complete information including title, access URL, download URL, format, media type, file size, license, and modification dates.",
  inputSchema: getDistributionInputSchema,
  handler: async (params: Record<string, unknown>) => {
    const { distributionId } = params as unknown as GetDistributionParams;
    const distribution = await getDistribution(distributionId);

    if (!distribution) {
      throw new Error(`Distribution '${distributionId}' not found`);
    }

    return { distribution };
  },
};

