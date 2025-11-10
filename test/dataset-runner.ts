import * as dotenv from "dotenv";
import { listDatasets, getDataset } from "../src/api/datasets";

dotenv.config();

async function main() {
  console.log("=== Testing Dataset Adapter (Live API) ===\n");

  const testCatalogueId = process.env.TEST_CATALOGUE_ID || "stadt-wien";

  try {
    console.log(`1. Fetching datasets from catalogue: ${testCatalogueId}...`);
    const datasetsIds = await listDatasets(testCatalogueId, {
      valueType: "identifiers",
      limit: 5,
    });
    console.log(`Retrieved ${datasetsIds.length} dataset identifiers:`);
    console.log(JSON.stringify(datasetsIds, null, 2));
    console.log("");

    if (datasetsIds.length > 0) {
      console.log(
        "2. Fetching datasets with metadata from same catalogue..."
      );
      const datasetsMeta = await listDatasets(testCatalogueId, {
        valueType: "metadata",
        limit: 3,
      });
      console.log(`Retrieved ${datasetsMeta.length} datasets with metadata:`);
      console.log(JSON.stringify(datasetsMeta, null, 2));
      console.log("");

      if (datasetsMeta.length > 0 && datasetsMeta[0]?.id) {
        const firstDatasetId = datasetsMeta[0].id.split("/").pop();
        if (firstDatasetId) {
          console.log(`3. Fetching detailed metadata for: ${firstDatasetId}...`);
          const datasetDetail = await getDataset(firstDatasetId);
          console.log("Dataset detail:");
          console.log(JSON.stringify(datasetDetail, null, 2));
          console.log("");
        }
      }
    } else {
      console.log(
        "⚠️  No datasets found in catalogue. This may be expected if the catalogue is empty."
      );
    }

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();

