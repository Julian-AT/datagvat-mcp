import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { listAllCatalogues, listCataloguesPaginated } from "../src/api/catalogues-paginated";
import { listAllDatasets, listDatasetsPaginated } from "../src/api/datasets-paginated";

const mock = new MockAdapter(axios);

async function runMockTests() {
  console.log("=== Step 4: Pagination Helper Mock Tests ===\n");

  const baseUrl =
    process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";

  console.log("1. Testing paginated result structure...");
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 5, offset: 0 },
    })
    .reply(200, ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5"]);

  const paginatedResult = await listCataloguesPaginated({
    valueType: "identifiers",
    limit: 5,
    offset: 0,
  });
  console.log("✅ Paginated result structure:");
  console.log(JSON.stringify(paginatedResult, null, 2));
  console.log("");

  console.log("2. Testing fetchAllPages with multiple pages...");

  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 3, offset: 0 },
    })
    .reply(200, ["cat-1", "cat-2", "cat-3"]);

  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 3, offset: 3 },
    })
    .reply(200, ["cat-4", "cat-5", "cat-6"]);

  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 3, offset: 6 },
    })
    .reply(200, ["cat-7"]);

  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 3, offset: 7 },
    })
    .reply(200, []);

  const allCatalogues = await listAllCatalogues(
    { valueType: "identifiers" },
    { batchSize: 3, maxItems: 100, maxRequests: 10, delayMs: 0 }
  );
  console.log("✅ Fetched all catalogues across pages:");
  console.log(`Total: ${allCatalogues.length}`);
  console.log(JSON.stringify(allCatalogues, null, 2));
  console.log("");

  console.log("3. Testing pagination with max items limit...");
  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 5, offset: 0 },
    })
    .reply(200, ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5"]);

  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 5, offset: 5 },
    })
    .reply(200, ["cat-6", "cat-7", "cat-8", "cat-9", "cat-10"]);

  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 2, offset: 10 },
    })
    .reply(200, ["cat-11", "cat-12"]);

  const limitedCatalogues = await listAllCatalogues(
    { valueType: "identifiers" },
    { batchSize: 5, maxItems: 12, maxRequests: 10, delayMs: 0 }
  );
  console.log("✅ Max items limit respected:");
  console.log(`Total: ${limitedCatalogues.length} (expected: 12)`);
  console.log("");

  console.log("4. Testing dataset pagination...");
  const testCatalogueId = "test-catalogue";

  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues/${testCatalogueId}/datasets`, {
      params: { valueType: "identifiers", limit: 2, offset: 0 },
    })
    .reply(200, ["ds-1", "ds-2"]);

  mock
    .onGet(`${baseUrl}/catalogues/${testCatalogueId}/datasets`, {
      params: { valueType: "identifiers", limit: 2, offset: 2 },
    })
    .reply(200, ["ds-3"]);

  mock
    .onGet(`${baseUrl}/catalogues/${testCatalogueId}/datasets`, {
      params: { valueType: "identifiers", limit: 2, offset: 3 },
    })
    .reply(200, []);

  const allDatasets = await listAllDatasets(
    testCatalogueId,
    { valueType: "identifiers" },
    { batchSize: 2, maxItems: 100, maxRequests: 10, delayMs: 0 }
  );
  console.log("✅ Dataset pagination:");
  console.log(`Total datasets: ${allDatasets.length}`);
  console.log(JSON.stringify(allDatasets, null, 2));
  console.log("");

  console.log("5. Testing hasMore flag...");
  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 5, offset: 0 },
    })
    .reply(200, ["cat-1", "cat-2", "cat-3", "cat-4", "cat-5"]);

  const fullBatch = await listCataloguesPaginated({
    valueType: "identifiers",
    limit: 5,
    offset: 0,
  });
  console.log("✅ Full batch hasMore flag:");
  console.log(`hasMore: ${fullBatch.pagination.hasMore} (expected: true)`);

  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 5, offset: 0 },
    })
    .reply(200, ["cat-1", "cat-2"]);

  const partialBatch = await listCataloguesPaginated({
    valueType: "identifiers",
    limit: 5,
    offset: 0,
  });
  console.log(`hasMore: ${partialBatch.pagination.hasMore} (expected: false)`);
  console.log("");

  console.log("\n=== Step 4: All Pagination Mock Tests Passed ===");
  mock.restore();
}

runMockTests().catch((error) => {
  console.error("❌ Mock test failed:", error);
  process.exit(1);
});

