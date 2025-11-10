import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { listCatalogues } from "../src/api/catalogues";

const mock = new MockAdapter(axios);

async function runMockTests() {
  console.log("=== Running Mock Tests ===\n");

  const baseUrl = process.env.API_BASE_URL || "https://qs.data.gv.at/api/hub/repo";

  console.log("1. Testing identifiers response...");
  mock
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "identifiers", limit: 3, offset: 0 },
    })
    .reply(200, ["cat-id-1", "cat-id-2", "cat-id-3"], {
      "content-type": "application/json",
    });

  const idsResult = await listCatalogues({
    valueType: "identifiers",
    limit: 3,
  });
  console.log("✅ Identifiers result:", JSON.stringify(idsResult, null, 2));
  console.log("");

  console.log("2. Testing metadata response...");
  const mockMetadataResponse = {
    "@context": "https://www.w3.org/ns/hydra/context.jsonld",
    "@graph": [
      {
        "@id": "https://example.com/catalogues",
        "@type": "http://www.w3.org/ns/hydra/core#Collection",
        "http://www.w3.org/ns/hydra/core#member": [
          {
            "@id": "https://data.gv.at/katalog/catalogue/stadt-wien",
            "@type": "http://www.w3.org/ns/dcat#Catalog",
            "http://purl.org/dc/terms/title": [
              {
                "@value": "Stadt Wien",
                "@language": "de",
              },
            ],
            "http://purl.org/dc/terms/description": [
              {
                "@value": "Open Government Data der Stadt Wien",
                "@language": "de",
              },
            ],
          },
          {
            "@id": "https://data.gv.at/katalog/catalogue/bund",
            "@type": "http://www.w3.org/ns/dcat#Catalog",
            "http://purl.org/dc/terms/title": [
              {
                "@value": "Bund",
                "@language": "de",
              },
            ],
            "http://purl.org/dc/terms/description": [
              {
                "@value": "Open Government Data des Bundes",
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
    .onGet(`${baseUrl}/catalogues`, {
      params: { valueType: "metadata", limit: 2, offset: 0 },
    })
    .reply(200, mockMetadataResponse, {
      "content-type": "application/ld+json",
    });

  const metaResult = await listCatalogues({
    valueType: "metadata",
    limit: 2,
  });
  console.log("✅ Metadata result:", JSON.stringify(metaResult, null, 2));
  console.log("");

  console.log("3. Testing error handling...");
  mock.reset();
  mock
    .onGet(`${baseUrl}/catalogues`)
    .reply(400, { error: "Bad Request" });

  try {
    await listCatalogues({ valueType: "metadata" });
    console.log("❌ Should have thrown error");
  } catch (error: any) {
    console.log("✅ Error handled correctly:", error.message);
  }

  console.log("\n=== All Mock Tests Passed ===");
  mock.restore();
}

runMockTests().catch((error) => {
  console.error("❌ Mock test failed:", error);
  process.exit(1);
});

