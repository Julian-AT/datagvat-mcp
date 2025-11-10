import { MCPToolDefinition } from "../types";
import { listVocabularies, getVocabulary } from "../../api/vocabularies";

interface ListVocabulariesParams {
  valueType?: "uriRefs" | "identifiers" | "originalIds" | "metadata";
  limit?: number;
  offset?: number;
}

const listVocabulariesInputSchema = {
  type: "object",
  properties: {
    valueType: {
      type: "string",
      enum: ["uriRefs", "identifiers", "originalIds", "metadata"],
    },
    limit: { type: "number", minimum: 1, maximum: 1000 },
    offset: { type: "number", minimum: 0 },
  },
  additionalProperties: false,
};

export const listVocabulariesTool: MCPToolDefinition = {
  name: "listVocabularies",
  description:
    "List available controlled vocabularies used by data.gv.at. Vocabularies provide standardized terms for themes, licenses, formats, and other metadata fields.",
  inputSchema: listVocabulariesInputSchema,
  handler: async (params: Record<string, unknown>) => {
    const typedParams = params as unknown as ListVocabulariesParams;
    const {
      valueType = "metadata",
      limit = 100,
      offset = 0,
    } = typedParams;

    const vocabularies = await listVocabularies({ valueType, limit, offset });

    return {
      vocabularies,
      count: vocabularies.length,
      pagination: {
        limit,
        offset,
        hasMore: vocabularies.length === limit,
      },
    };
  },
};

interface GetVocabularyParams {
  vocabularyId: string;
}

const getVocabularyInputSchema = {
  type: "object",
  properties: {
    vocabularyId: { type: "string", minLength: 1 },
  },
  required: ["vocabularyId"],
  additionalProperties: false,
};

export const getVocabularyTool: MCPToolDefinition = {
  name: "getVocabulary",
  description:
    "Retrieve detailed information about a specific vocabulary by ID. Vocabularies contain controlled terms used for categorizing and standardizing metadata.",
  inputSchema: getVocabularyInputSchema,
  handler: async (params: Record<string, unknown>) => {
    const { vocabularyId } = params as unknown as GetVocabularyParams;
    const vocabulary = await getVocabulary(vocabularyId);

    if (!vocabulary) {
      throw new Error(`Vocabulary '${vocabularyId}' not found`);
    }

    return { vocabulary };
  },
};

