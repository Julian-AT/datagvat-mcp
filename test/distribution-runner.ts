import * as dotenv from "dotenv";
import {
  listDistributions,
  getDistribution,
  getEnrichedDataset,
} from "../src/api/distributions";

dotenv.config();

async function main() {
  console.log("=== Testing Distribution Adapter (Live API) ===\n");

  const testDatasetId = process.env.TEST_DATASET_ID || "sample-dataset-id";

  try {
    console.log(`1. Fetching distributions for dataset: ${testDatasetId}...`);
    const distIds = await listDistributions(testDatasetId, {
      valueType: "identifiers",
    });
    console.log(`Retrieved ${distIds.length} distribution identifiers:`);
    console.log(JSON.stringify(distIds, null, 2));
    console.log("");

    if (distIds.length > 0) {
      console.log("2. Fetching distributions with metadata...");
      const distMeta = await listDistributions(testDatasetId, {
        valueType: "metadata",
        limit: 5,
      });
      console.log(`Retrieved ${distMeta.length} distributions with metadata:`);
      console.log(JSON.stringify(distMeta, null, 2));
      console.log("");

      if (distMeta.length > 0 && distMeta[0]?.id) {
        const firstDistId = distMeta[0].id.split("/").pop();
        if (firstDistId) {
          console.log(`3. Fetching detailed metadata for: ${firstDistId}...`);
          const distDetail = await getDistribution(firstDistId);
          console.log("Distribution detail:");
          console.log(JSON.stringify(distDetail, null, 2));
          console.log("");
        }
      }
    }

    console.log(`4. Fetching enriched dataset (with distributions)...`);
    const enriched = await getEnrichedDataset(testDatasetId);
    if (enriched) {
      console.log("Enriched dataset:");
      console.log(JSON.stringify(enriched, null, 2));
    } else {
      console.log("Dataset not found");
    }

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();

