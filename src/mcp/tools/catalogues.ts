import { MCPToolDefinition } from "../types";
import { listCatalogues } from "../../api/catalogues";
import { listAllCatalogues } from "../../api/catalogues-paginated";

interface ListCataloguesParams {
  valueType?: "uriRefs" | "identifiers" | "originalIds" | "metadata";
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
}

const listCataloguesInputSchema = {
  type: "object",
  properties: {
    valueType: {
      type: "string",
      enum: ["uriRefs", "identifiers", "originalIds", "metadata"],
    },
    limit: { type: "number", minimum: 1, maximum: 1000 },
    offset: { type: "number", minimum: 0 },
    fetchAll: { type: "boolean" },
  },
  additionalProperties: false,
};

export const listCataloguesTool: MCPToolDefinition = {
  name: "listCatalogues",
  description:
    "List available data catalogues from data.gv.at. Returns catalogue IDs, titles, and descriptions. Use fetchAll=true to retrieve all catalogues with automatic pagination.",
  inputSchema: listCataloguesInputSchema,
  handler: async (params: Record<string, unknown>) => {
    const typedParams = params as unknown as ListCataloguesParams;
    const {
      valueType = "metadata",
      limit = 10,
      offset = 0,
      fetchAll = false,
    } = typedParams;

    if (fetchAll) {
      const catalogues = await listAllCatalogues(
        { valueType },
        { maxItems: 5000, batchSize: 100 }
      );

      return {
        catalogues,
        total: catalogues.length,
        fetched: "all",
      };
    }

    const catalogues = await listCatalogues({ valueType, limit, offset });

    return {
      catalogues,
      count: catalogues.length,
      pagination: {
        limit,
        offset,
        hasMore: catalogues.length === limit,
      },
    };
  },
};

