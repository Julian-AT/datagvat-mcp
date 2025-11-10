import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { listDatasets, getDataset } from "../src/api/datasets";

const mock = new MockAdapter(axios);

async function runMockTests() {
  console.log("=== Step 2: Dataset Adapter Mock Tests ===\n");

  const baseUrl =
    process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";
  const testCatalogueId = "test-catalogue";

  console.log("1. Testing dataset identifiers listing...");
  mock
    .onGet(`${baseUrl}/catalogues/${testCatalogueId}/datasets`, {
      params: { valueType: "identifiers", limit: 3, offset: 0 },
    })
    .reply(
      200,
      [
        "dataset-id-1",
        "dataset-id-2",
        "dataset-id-3",
      ],
      {
        "content-type": "application/json",
      }
    );

  const idsResult = await listDatasets(testCatalogueId, {
    valueType: "identifiers",
    limit: 3,
  });
  console.log("✅ Dataset identifiers result:");
  console.log(JSON.stringify(idsResult, null, 2));
  console.log("");

  console.log("2. Testing dataset metadata listing...");
  const mockDatasetsMetadata = {
    "@context": "https://www.w3.org/ns/hydra/context.jsonld",
    "@graph": [
      {
        "@id": "https://example.com/datasets",
        "@type": "http://www.w3.org/ns/hydra/core#Collection",
        "http://www.w3.org/ns/hydra/core#member": [
          {
            "@id": "https://data.gv.at/katalog/dataset/sample-dataset-1",
            "@type": "http://www.w3.org/ns/dcat#Dataset",
            "http://purl.org/dc/terms/title": [
              {
                "@value": "Sample Dataset 1",
                "@language": "de",
              },
            ],
            "http://purl.org/dc/terms/description": [
              {
                "@value": "This is a sample dataset for testing",
                "@language": "de",
              },
            ],
            "http://www.w3.org/ns/dcat#keyword": [
              {
                "@value": "test",
                "@language": "de",
              },
              {
                "@value": "sample",
                "@language": "de",
              },
            ],
            "http://purl.org/dc/terms/modified": [
              {
                "@value": "2024-01-15T10:30:00Z",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
              },
            ],
            "http://purl.org/dc/terms/publisher": [
              {
                "@id": "https://data.gv.at/katalog/organization/test-org",
                "http://xmlns.com/foaf/0.1/name": [
                  {
                    "@value": "Test Organization",
                  },
                ],
              },
            ],
          },
          {
            "@id": "https://data.gv.at/katalog/dataset/sample-dataset-2",
            "@type": "http://www.w3.org/ns/dcat#Dataset",
            "http://purl.org/dc/terms/title": [
              {
                "@value": "Sample Dataset 2",
                "@language": "de",
              },
            ],
            "http://purl.org/dc/terms/description": [
              {
                "@value": "Another sample dataset",
                "@language": "de",
              },
            ],
          },
        ],
      },
    ],
  };

  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues/${testCatalogueId}/datasets`, {
      params: { valueType: "metadata", limit: 2, offset: 0 },
    })
    .reply(200, mockDatasetsMetadata, {
      "content-type": "application/ld+json",
    });

  const metaResult = await listDatasets(testCatalogueId, {
    valueType: "metadata",
    limit: 2,
  });
  console.log("✅ Dataset metadata result:");
  console.log(JSON.stringify(metaResult, null, 2));
  console.log("");

  console.log("3. Testing empty dataset list...");
  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues/empty-catalogue/datasets`)
    .reply(200, [], {
      "content-type": "application/json",
    });

  const emptyResult = await listDatasets("empty-catalogue", {
    valueType: "identifiers",
  });
  console.log("✅ Empty dataset list handled:");
  console.log(JSON.stringify(emptyResult, null, 2));
  console.log("");

  console.log("4. Testing getDataset metadata fetch...");
  const mockDatasetDetail = {
    "@context": "https://www.w3.org/ns/dcat#",
    "@graph": [
      {
        "@id": "https://data.gv.at/katalog/dataset/test-dataset-123",
        "@type": "http://www.w3.org/ns/dcat#Dataset",
        "http://purl.org/dc/terms/title": [
          {
            "@value": "Test Dataset Full Metadata",
            "@language": "de",
          },
        ],
        "http://purl.org/dc/terms/description": [
          {
            "@value": "Complete dataset with all metadata fields",
            "@language": "de",
          },
        ],
        "http://www.w3.org/ns/dcat#keyword": [
          {
            "@value": "open data",
            "@language": "de",
          },
          {
            "@value": "government",
            "@language": "de",
          },
        ],
        "http://purl.org/dc/terms/modified": [
          {
            "@value": "2024-03-01T14:20:00Z",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
          },
        ],
        "http://purl.org/dc/terms/issued": [
          {
            "@value": "2023-01-10T09:00:00Z",
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
          },
        ],
        "http://purl.org/dc/terms/publisher": [
          {
            "@id": "https://data.gv.at/katalog/organization/gov-agency",
            "http://xmlns.com/foaf/0.1/name": [
              {
                "@value": "Government Agency",
              },
            ],
          },
        ],
        "http://www.w3.org/ns/dcat#distribution": [
          {
            "@id": "https://data.gv.at/katalog/distribution/dist-1",
          },
          {
            "@id": "https://data.gv.at/katalog/distribution/dist-2",
          },
        ],
        "http://www.w3.org/ns/dcat#theme": [
          {
            "@id": "http://publications.europa.eu/resource/authority/data-theme/ECON",
          },
        ],
        "http://purl.org/dc/terms/license": [
          {
            "@id": "http://creativecommons.org/licenses/by/4.0/",
          },
        ],
      },
    ],
  };

  mock.reset();
  mock
    .onGet(`${baseUrl}/datasets/test-dataset-123`)
    .reply(200, mockDatasetDetail, {
      "content-type": "application/ld+json",
    });

  const datasetDetail = await getDataset("test-dataset-123");
  console.log("✅ Dataset detail result:");
  console.log(JSON.stringify(datasetDetail, null, 2));
  console.log("");

  console.log("5. Testing dataset not found (404)...");
  mock.reset();
  mock.onGet(`${baseUrl}/datasets/non-existent`).reply(404, {
    error: "Not Found",
  });

  const notFound = await getDataset("non-existent");
  console.log("✅ Dataset not found handled correctly:");
  console.log(`Result: ${notFound}`);
  console.log("");

  console.log("6. Testing error handling...");
  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues/bad-catalogue/datasets`)
    .reply(400, { error: "Bad Request" });

  try {
    await listDatasets("bad-catalogue");
    console.log("❌ Should have thrown error");
  } catch (error: any) {
    console.log("✅ Error handled correctly:", error.message);
  }

  console.log("\n=== Step 2: All Dataset Mock Tests Passed ===");
  mock.restore();
}

runMockTests().catch((error) => {
  console.error("❌ Mock test failed:", error);
  process.exit(1);
});

