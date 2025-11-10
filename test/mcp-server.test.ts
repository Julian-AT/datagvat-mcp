import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { MCPServer, createMCPServer } from "../src/mcp/server";
import { MCPToolRegistry } from "../src/mcp/registry";
import { registerAllTools } from "../src/mcp/tools";
import { MCPRequest } from "../src/mcp/types";

const mock = new MockAdapter(axios);

async function runMCPTests() {
  console.log("=== Step 5: MCP Server Tests ===\n");

  const baseUrl = process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
  const registry = new MCPToolRegistry();
  registerAllTools(registry);
  const server = new MCPServer(registry);

  console.log("1. Testing tool discovery (tools/list)...");
  const listRequest: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/list",
    id: 1,
  };

  const listResponse = await server.handleRequest(listRequest);
  console.log("✅ Tool list response:");
  console.log(JSON.stringify(listResponse, null, 2).substring(0, 500) + "...");
  console.log(`Total tools: ${(listResponse as any).result?.count}`);
  console.log("");

  console.log("2. Testing listCatalogues tool call...");
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "metadata", limit: 3, offset: 0 },
    })
    .reply(200, {
      "@graph": [
        {
          "@id": "https://example.com/catalogues",
          "@type": "http://www.w3.org/ns/hydra/core#Collection",
          "http://www.w3.org/ns/hydra/core#member": [
            {
              "@id": "https://data.gv.at/katalog/catalogue/cat-1",
              "@type": "http://www.w3.org/ns/dcat#Catalog",
              "http://purl.org/dc/terms/title": [{ "@value": "Test Catalogue 1" }],
              "http://purl.org/dc/terms/description": [{ "@value": "Description 1" }],
            },
          ],
        },
      ],
    });

  const cataloguesRequest: MCPRequest = {
    jsonrpc: "2.0",
    method: "listCatalogues",
    params: { limit: 3 },
    id: 2,
  };

  const cataloguesResponse = await server.handleRequest(cataloguesRequest);
  console.log("✅ listCatalogues response:");
  console.log(JSON.stringify(cataloguesResponse, null, 2));
  console.log("");

  console.log("3. Testing tools/call method...");
  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues/test-cat/datasets`, {
      params: { valueType: "metadata", limit: 2, offset: 0 },
    })
    .reply(200, {
      "@graph": [
        {
          "http://www.w3.org/ns/hydra/core#member": [
            {
              "@id": "https://data.gv.at/katalog/dataset/ds-1",
              "@type": "http://www.w3.org/ns/dcat#Dataset",
              "http://purl.org/dc/terms/title": [{ "@value": "Dataset 1" }],
            },
          ],
        },
      ],
    });

  const toolCallRequest: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "listDatasets",
      arguments: {
        catalogueId: "test-cat",
        limit: 2,
      },
    },
    id: 3,
  };

  const toolCallResponse = await server.handleRequest(toolCallRequest);
  console.log("✅ tools/call response:");
  console.log(JSON.stringify(toolCallResponse, null, 2));
  console.log("");

  console.log("4. Testing getDataset tool...");
  mock.reset();
  mock.onGet(`${baseUrl}/datasets/test-ds-123`).reply(200, {
    "@graph": [
      {
        "@id": "https://data.gv.at/katalog/dataset/test-ds-123",
        "@type": "http://www.w3.org/ns/dcat#Dataset",
        "http://purl.org/dc/terms/title": [{ "@value": "Test Dataset" }],
        "http://purl.org/dc/terms/description": [{ "@value": "A test dataset" }],
        "http://www.w3.org/ns/dcat#keyword": [
          { "@value": "test" },
          { "@value": "sample" },
        ],
      },
    ],
  });

  const getDatasetRequest: MCPRequest = {
    jsonrpc: "2.0",
    method: "getDataset",
    params: { datasetId: "test-ds-123" },
    id: 4,
  };

  const getDatasetResponse = await server.handleRequest(getDatasetRequest);
  console.log("✅ getDataset response:");
  console.log(JSON.stringify(getDatasetResponse, null, 2));
  console.log("");

  console.log("5. Testing getEnrichedDataset tool...");
  mock.reset();
  mock.onGet(`${baseUrl}/datasets/enriched-ds`).reply(200, {
    "@graph": [
      {
        "@id": "https://data.gv.at/katalog/dataset/enriched-ds",
        "@type": "http://www.w3.org/ns/dcat#Dataset",
        "http://purl.org/dc/terms/title": [{ "@value": "Enriched Dataset" }],
      },
    ],
  });
  mock
    .onGet(`${baseUrl}/datasets/enriched-ds/distributions`, {
      params: { valueType: "metadata", limit: 100, offset: 0 },
    })
    .reply(200, {
      "@graph": [
        {
          "http://www.w3.org/ns/hydra/core#member": [
            {
              "@id": "https://data.gv.at/katalog/distribution/dist-1",
              "@type": "http://www.w3.org/ns/dcat#Distribution",
              "http://purl.org/dc/terms/title": [{ "@value": "CSV File" }],
              "http://www.w3.org/ns/dcat#downloadURL": [
                { "@id": "https://example.com/data.csv" },
              ],
              "http://purl.org/dc/terms/format": [{ "@value": "CSV" }],
            },
          ],
        },
      ],
    });

  const enrichedRequest: MCPRequest = {
    jsonrpc: "2.0",
    method: "getEnrichedDataset",
    params: { datasetId: "enriched-ds" },
    id: 5,
  };

  const enrichedResponse = await server.handleRequest(enrichedRequest);
  console.log("✅ getEnrichedDataset response (with distributions):");
  console.log(JSON.stringify(enrichedResponse, null, 2));
  console.log("");

  console.log("6. Testing input validation errors...");
  const invalidRequest: MCPRequest = {
    jsonrpc: "2.0",
    method: "getDataset",
    params: {},
    id: 6,
  };

  const errorResponse = await server.handleRequest(invalidRequest);
  console.log("✅ Validation error response:");
  console.log(JSON.stringify(errorResponse, null, 2));
  console.log("");

  console.log("7. Testing method not found...");
  const notFoundRequest: MCPRequest = {
    jsonrpc: "2.0",
    method: "nonExistentTool",
    params: {},
    id: 7,
  };

  const notFoundResponse = await server.handleRequest(notFoundRequest);
  console.log("✅ Method not found response:");
  console.log(JSON.stringify(notFoundResponse, null, 2));
  console.log("");

  console.log("8. Testing batch request...");
  const batchRequests: MCPRequest[] = [
    {
      jsonrpc: "2.0",
      method: "tools/list",
      id: 8,
    },
    {
      jsonrpc: "2.0",
      method: "listCatalogues",
      params: { limit: 1 },
      id: 9,
    },
  ];

  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "metadata", limit: 1, offset: 0 },
    })
    .reply(200, {
      "@graph": [
        {
          "http://www.w3.org/ns/hydra/core#member": [
            {
              "@id": "https://data.gv.at/katalog/catalogue/cat-1",
              "http://purl.org/dc/terms/title": [{ "@value": "Catalogue 1" }],
            },
          ],
        },
      ],
    });

  const batchResponse = await server.handleBatchRequest(batchRequests);
  console.log("✅ Batch response:");
  console.log(`Batch size: ${batchResponse.length}`);
  console.log(JSON.stringify(batchResponse[0], null, 2).substring(0, 300) + "...");
  console.log("");

  console.log("9. Testing metadata enrichment...");
  const metadataRequest: MCPRequest = {
    jsonrpc: "2.0",
    method: "listCatalogues",
    params: { limit: 1 },
    id: 10,
  };

  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "metadata", limit: 1, offset: 0 },
    })
    .reply(200, {
      "@graph": [
        {
          "http://www.w3.org/ns/hydra/core#member": [
            {
              "@id": "https://data.gv.at/katalog/catalogue/meta-test",
              "http://purl.org/dc/terms/title": [{ "@value": "Meta Test" }],
            },
          ],
        },
      ],
    });

  const metadataResponse = await server.handleRequest(metadataRequest);
  const metadata = (metadataResponse as any).result?._metadata;
  console.log("✅ Response includes metadata:");
  console.log(JSON.stringify(metadata, null, 2));
  console.log("");

  console.log("\n=== Step 5: All MCP Server Tests Passed ===");
  mock.restore();
}

runMCPTests().catch((error) => {
  console.error("❌ MCP test failed:", error);
  process.exit(1);
});

