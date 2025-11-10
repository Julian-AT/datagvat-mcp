import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listCatalogues } from "./api/catalogues";
import { listAllCatalogues } from "./api/catalogues-paginated";
import { listDatasets, getDataset } from "./api/datasets";
import { listAllDatasets } from "./api/datasets-paginated";
import { listDistributions, getDistribution, getEnrichedDataset } from "./api/distributions";
import { listVocabularies, getVocabulary } from "./api/vocabularies";

export class DataGvatMCP extends McpAgent {
	server = new McpServer({
		name: "data.gv.at MCP Server",
		version: "1.1.0",
	});

	async init() {
		this.server.tool(
			"listCatalogues",
			{
				valueType: z.enum(["uriRefs", "identifiers", "originalIds", "metadata"]).optional().default("metadata"),
				limit: z.number().min(1).max(1000).optional().default(10),
				offset: z.number().min(0).optional().default(0),
				fetchAll: z.boolean().optional().default(false),
			},
			async ({ valueType, limit, offset, fetchAll }) => {
				try {
					if (fetchAll) {
						const catalogues = await listAllCatalogues(
							{ valueType },
							{ maxItems: 5000, batchSize: 100 }
						);

						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										catalogues,
										total: catalogues.length,
										fetched: "all",
										_metadata: {
											timestamp: new Date().toISOString(),
											source: "data.gv.at",
											tool: "listCatalogues",
										},
									}, null, 2),
								},
							],
						};
					}

					const catalogues = await listCatalogues({ valueType, limit, offset });

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									catalogues,
									count: catalogues.length,
									pagination: {
										limit,
										offset,
										hasMore: catalogues.length === limit,
									},
									_metadata: {
										timestamp: new Date().toISOString(),
										source: "data.gv.at",
										tool: "listCatalogues",
									},
								}, null, 2),
							},
						],
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error listing catalogues: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			}
		);

		this.server.tool(
			"listDatasets",
			{
				catalogueId: z.string().min(1),
				valueType: z.enum(["uriRefs", "identifiers", "originalIds", "metadata"]).optional().default("metadata"),
				limit: z.number().min(1).max(1000).optional().default(10),
				offset: z.number().min(0).optional().default(0),
				fetchAll: z.boolean().optional().default(false),
				keywords: z.array(z.string()).optional(),
				publisher: z.string().optional(),
				modifiedSince: z.string().optional(),
			},
			async ({ catalogueId, valueType, limit, offset, fetchAll, keywords, publisher, modifiedSince }) => {
				try {
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

					// Apply filters
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

					const result = fetchAll
						? {
							catalogueId,
							datasets: filteredDatasets,
							total: filteredDatasets.length,
							fetched: "all",
							...(keywords && { filteredByKeywords: keywords }),
							...(publisher && { filteredByPublisher: publisher }),
							...(modifiedSince && { filteredByModifiedSince: modifiedSince }),
							_metadata: {
								timestamp: new Date().toISOString(),
								source: "data.gv.at",
								tool: "listDatasets",
							},
						}
						: {
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
							_metadata: {
								timestamp: new Date().toISOString(),
								source: "data.gv.at",
								tool: "listDatasets",
							},
						};

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2),
							},
						],
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error listing datasets: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			}
		);

		this.server.tool(
			"getDataset",
			{
				datasetId: z.string().min(1),
			},
			async ({ datasetId }) => {
				try {
					const dataset = await getDataset(datasetId);

					if (!dataset) {
						return {
							content: [
								{
									type: "text",
									text: `Dataset '${datasetId}' not found`,
								},
							],
							isError: true,
						};
					}

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									dataset,
									_metadata: {
										timestamp: new Date().toISOString(),
										source: "data.gv.at",
										tool: "getDataset",
									},
								}, null, 2),
							},
						],
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error getting dataset: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			}
		);

		this.server.tool(
			"getEnrichedDataset",
			{
				datasetId: z.string().min(1),
			},
			async ({ datasetId }) => {
				try {
					const enrichedDataset = await getEnrichedDataset(datasetId);

					if (!enrichedDataset) {
						return {
							content: [
								{
									type: "text",
									text: `Dataset '${datasetId}' not found`,
								},
							],
							isError: true,
						};
					}

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									dataset: enrichedDataset,
									distributionCount: enrichedDataset.distributions.length,
									_metadata: {
										timestamp: new Date().toISOString(),
										source: "data.gv.at",
										tool: "getEnrichedDataset",
									},
								}, null, 2),
							},
						],
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error getting enriched dataset: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			}
		);

		this.server.tool(
			"listDistributions",
			{
				datasetId: z.string().min(1),
				valueType: z.enum(["uriRefs", "identifiers", "originalIds", "metadata"]).optional().default("metadata"),
				limit: z.number().min(1).max(1000).optional().default(100),
				offset: z.number().min(0).optional().default(0),
			},
			async ({ datasetId, valueType, limit, offset }) => {
				try {
					const distributions = await listDistributions(datasetId, {
						valueType,
						limit,
						offset,
					});

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									datasetId,
									distributions,
									count: distributions.length,
									pagination: {
										limit,
										offset,
										hasMore: distributions.length === limit,
									},
									_metadata: {
										timestamp: new Date().toISOString(),
										source: "data.gv.at",
										tool: "listDistributions",
									},
								}, null, 2),
							},
						],
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error listing distributions: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			}
		);

		this.server.tool(
			"getDistribution",
			{
				distributionId: z.string().min(1),
			},
			async ({ distributionId }) => {
				try {
					const distribution = await getDistribution(distributionId);

					if (!distribution) {
						return {
							content: [
								{
									type: "text",
									text: `Distribution '${distributionId}' not found`,
								},
							],
							isError: true,
						};
					}

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									distribution,
									_metadata: {
										timestamp: new Date().toISOString(),
										source: "data.gv.at",
										tool: "getDistribution",
									},
								}, null, 2),
							},
						],
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error getting distribution: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			}
		);

		this.server.tool(
			"listVocabularies",
			{
				valueType: z.enum(["uriRefs", "identifiers", "originalIds", "metadata"]).optional().default("metadata"),
				limit: z.number().min(1).max(1000).optional().default(100),
				offset: z.number().min(0).optional().default(0),
			},
			async ({ valueType, limit, offset }) => {
				try {
					const vocabularies = await listVocabularies({ valueType, limit, offset });

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									vocabularies,
									count: vocabularies.length,
									pagination: {
										limit,
										offset,
										hasMore: vocabularies.length === limit,
									},
									_metadata: {
										timestamp: new Date().toISOString(),
										source: "data.gv.at",
										tool: "listVocabularies",
									},
								}, null, 2),
							},
						],
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error listing vocabularies: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			}
		);

		this.server.tool(
			"getVocabulary",
			{
				vocabularyId: z.string().min(1),
			},
			async ({ vocabularyId }) => {
				try {
					const vocabulary = await getVocabulary(vocabularyId);

					if (!vocabulary) {
						return {
							content: [
								{
									type: "text",
									text: `Vocabulary '${vocabularyId}' not found`,
								},
							],
							isError: true,
						};
					}

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									vocabulary,
									_metadata: {
										timestamp: new Date().toISOString(),
										source: "data.gv.at",
										tool: "getVocabulary",
									},
								}, null, 2),
							},
						],
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error getting vocabulary: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			}
		);
	}
}

export default {
	fetch(request: Request, env: any, ctx: any) {
		const url = new URL(request.url);

		if (url.pathname === "/" && request.method === "GET") {
			const html = `<!DOCTYPE html>
<html>
<head>
  <title>MCP Server - data.gv.at</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #2c3e50; }
    h2 { color: #34495e; margin-top: 30px; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: "Monaco", "Courier New", monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    .endpoint {
      background: #e8f4f8;
      padding: 10px;
      border-left: 4px solid #3498db;
      margin: 10px 0;
    }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <h1>🚀 MCP Server - data.gv.at</h1>
  <p>Model Context Protocol server for Austria's Open Government Data portal.</p>
  
  <h2>Endpoints</h2>
  
  <div class="endpoint">
    <strong>POST /mcp</strong> - JSON-RPC over HTTP
  </div>
  
  <div class="endpoint">
    <strong>POST /sse</strong> - Server-Sent Events transport
  </div>
  
  <h2>Available Tools</h2>
  <ul>
    <li><code>listCatalogues</code> - Browse data catalogues</li>
    <li><code>listDatasets</code> - List datasets in a catalogue</li>
    <li><code>getDataset</code> - Get dataset details</li>
    <li><code>getEnrichedDataset</code> - Get dataset with distributions</li>
    <li><code>listDistributions</code> - List distributions for a dataset</li>
    <li><code>getDistribution</code> - Get distribution details</li>
    <li><code>listVocabularies</code> - List controlled vocabularies</li>
    <li><code>getVocabulary</code> - Get vocabulary details</li>
  </ul>
  
  <h2>Documentation</h2>
  <p>Data source: <a href="https://www.data.gv.at">data.gv.at</a></p>
</body>
</html>`;

			return new Response(html, {
				headers: {
					"Content-Type": "text/html; charset=utf-8",
				},
			});
		}

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return DataGvatMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return DataGvatMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};

