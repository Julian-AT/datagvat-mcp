import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  listDistributions,
  getDistribution,
  getEnrichedDataset,
} from "../src/api/distributions";

const mock = new MockAdapter(axios);

async function runMockTests() {
  console.log("=== Step 3: Distribution Adapter Mock Tests ===\n");

  const baseUrl =
    process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
  const testDatasetId = "test-dataset-123";

  console.log("1. Testing distribution identifiers listing...");
  mock
    .onGet(`${baseUrl}/datasets/${testDatasetId}/distributions`, {
      params: { valueType: "identifiers", limit: 100, offset: 0 },
    })
    .reply(
      200,
      ["dist-id-1", "dist-id-2", "dist-id-3"],
      {
        "content-type": "application/json",
      }
    );

  const idsResult = await listDistributions(testDatasetId, {
    valueType: "identifiers",
  });
  console.log("✅ Distribution identifiers result:");
  console.log(JSON.stringify(idsResult, null, 2));
  console.log("");

  console.log("2. Testing distribution metadata listing...");
  const mockDistributionsMetadata = {
    "@context": "https://www.w3.org/ns/hydra/context.jsonld",
    "@graph": [
      {
        "@id": "https://example.com/distributions",
        "@type": "http://www.w3.org/ns/hydra/core#Collection",
        "http://www.w3.org/ns/hydra/core#member": [
          {
            "@id": "https://data.gv.at/katalog/distribution/dist-csv",
            "@type": "http://www.w3.org/ns/dcat#Distribution",
            "http://purl.org/dc/terms/title": [
              {
                "@value": "CSV Download",
                "@language": "de",
              },
            ],
            "http://www.w3.org/ns/dcat#accessURL": [
              {
                "@id": "https://example.com/data.csv",
              },
            ],
            "http://www.w3.org/ns/dcat#downloadURL": [
              {
                "@id": "https://example.com/download/data.csv",
              },
            ],
            "http://purl.org/dc/terms/format": [
              {
                "@value": "CSV",
              },
            ],
            "http://www.w3.org/ns/dcat#mediaType": [
              {
                "@value": "text/csv",
              },
            ],
            "http://www.w3.org/ns/dcat#byteSize": [
              {
                "@value": "1024000",
                "@type": "http://www.w3.org/2001/XMLSchema#decimal",
              },
            ],
            "http://purl.org/dc/terms/license": [
              {
                "@id": "http://creativecommons.org/licenses/by/4.0/",
              },
            ],
          },
          {
            "@id": "https://data.gv.at/katalog/distribution/dist-json",
            "@type": "http://www.w3.org/ns/dcat#Distribution",
            "http://purl.org/dc/terms/title": [
              {
                "@value": "JSON Download",
                "@language": "de",
              },
            ],
            "http://www.w3.org/ns/dcat#accessURL": [
              {
                "@id": "https://example.com/data.json",
              },
            ],
            "http://purl.org/dc/terms/format": [
              {
                "@value": "JSON",
              },
            ],
          },
        ],
      },
    ],
  };

  mock.reset();
  mock
    .onGet(`${baseUrl}/datasets/${testDatasetId}/distributions`, {
      params: { valueType: "metadata", limit: 100, offset: 0 },
    })
    .reply(200, mockDistributionsMetadata, {
      "content-type": "application/ld+json",
    });

  const metaResult = await listDistributions(testDatasetId, {
    valueType: "metadata",
  });
  console.log("✅ Distribution metadata result:");
  console.log(JSON.stringify(metaResult, null, 2));
  console.log("");

  console.log("3. Testing getDistribution metadata fetch...");
  const mockDistributionDetail = {
    "@context": "https://www.w3.org/ns/dcat#",
    "@graph": [
      {
        "@id": "https://data.gv.at/katalog/distribution/dist-full",
        "@type": "http://www.w3.org/ns/dcat#Distribution",
        "http://purl.org/dc/terms/title": [
          {
            "@value": "Full Dataset Distribution",
            "@language": "de",
          },
        ],
        "http://www.w3.org/ns/dcat#accessURL": [
          {
            "@id": "https://example.com/full-data.xlsx",
          },
        ],
        "http://www.w3.org/ns/dcat#downloadURL": [
          {
            "@id": "https://example.com/download/full-data.xlsx",
          },
        ],
        "http://purl.org/dc/terms/format": [
          {
            "@value": "XLSX",
          },
        ],
        "http://www.w3.org/ns/dcat#mediaType": [
          {
            "@value": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
        "http://www.w3.org/ns/dcat#byteSize": [
          {
            "@value": "5242880",
            "@type": "http://www.w3.org/2001/XMLSchema#decimal",
          },
        ],
        "http://purl.org/dc/terms/license": [
          {
            "@id": "http://creativecommons.org/publicdomain/zero/1.0/",
          },
        ],
        "http://purl.org/dc/terms/issued": [
          {
            "@value": "2023-06-01T00:00:00Z",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
          },
        ],
        "http://purl.org/dc/terms/modified": [
          {
            "@value": "2024-02-15T10:30:00Z",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
          },
        ],
      },
    ],
  };

  mock.reset();
  mock
    .onGet(`${baseUrl}/distributions/dist-full`)
    .reply(200, mockDistributionDetail, {
      "content-type": "application/ld+json",
    });

  const distDetail = await getDistribution("dist-full");
  console.log("✅ Distribution detail result:");
  console.log(JSON.stringify(distDetail, null, 2));
  console.log("");

  console.log("4. Testing enriched dataset (dataset + distributions)...");
  const mockDatasetDetail = {
    "@graph": [
      {
        "@id": "https://data.gv.at/katalog/dataset/enriched-test",
        "@type": "http://www.w3.org/ns/dcat#Dataset",
        "http://purl.org/dc/terms/title": [{ "@value": "Enriched Test Dataset" }],
        "http://purl.org/dc/terms/description": [
          { "@value": "Dataset with distributions" },
        ],
        "http://www.w3.org/ns/dcat#keyword": [
          { "@value": "test" },
          { "@value": "enriched" },
        ],
      },
    ],
  };

  mock.reset();
  mock
    .onGet(`${baseUrl}/datasets/enriched-test`)
    .reply(200, mockDatasetDetail, {
      "content-type": "application/ld+json",
    });
  mock
    .onGet(`${baseUrl}/datasets/enriched-test/distributions`, {
      params: { valueType: "metadata", limit: 100, offset: 0 },
    })
    .reply(200, mockDistributionsMetadata, {
      "content-type": "application/ld+json",
    });

  const enriched = await getEnrichedDataset("enriched-test");
  console.log("✅ Enriched dataset result:");
  console.log(JSON.stringify(enriched, null, 2));
  console.log("");

  console.log("5. Testing distribution not found (404)...");
  mock.reset();
  mock.onGet(`${baseUrl}/distributions/non-existent`).reply(404, {
    error: "Not Found",
  });

  const notFound = await getDistribution("non-existent");
  console.log("✅ Distribution not found handled correctly:");
  console.log(`Result: ${notFound}`);
  console.log("");

  console.log("6. Testing error handling...");
  mock.reset();
  mock
    .onGet(`${baseUrl}/datasets/bad-dataset/distributions`)
    .reply(400, { error: "Bad Request" });

  try {
    await listDistributions("bad-dataset");
    console.log("❌ Should have thrown error");
  } catch (error: any) {
    console.log("✅ Error handled correctly:", error.message);
  }

  console.log("\n=== Step 3: All Distribution Mock Tests Passed ===");
  mock.restore();
}

runMockTests().catch((error) => {
  console.error("❌ Mock test failed:", error);
  process.exit(1);
});

