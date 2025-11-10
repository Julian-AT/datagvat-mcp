import { MCPToolRegistry } from "../registry";
import { listCataloguesTool } from "./catalogues";
import {
  listDatasetsTool,
  getDatasetTool,
  getEnrichedDatasetTool,
} from "./datasets";
import {
  listDistributionsTool,
  getDistributionTool,
} from "./distributions";
import {
  listVocabulariesTool,
  getVocabularyTool,
} from "./vocabularies";

export const allTools = [
  listCataloguesTool,
  listDatasetsTool,
  getDatasetTool,
  getEnrichedDatasetTool,
  listDistributionsTool,
  getDistributionTool,
  listVocabulariesTool,
  getVocabularyTool,
];

export function registerAllTools(registry: MCPToolRegistry): void {
  allTools.forEach((tool) => registry.register(tool));
}

export * from "./catalogues";
export * from "./datasets";
export * from "./distributions";
export * from "./vocabularies";

