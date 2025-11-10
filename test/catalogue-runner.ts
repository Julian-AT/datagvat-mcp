import * as dotenv from "dotenv";
import { listCatalogues } from "../src/api/catalogues";

dotenv.config();

async function main() {
  console.log("=== Testing listCatalogues ===\n");

  try {
    console.log("1. Fetching catalogues with identifiers (default)...");
    const cataloguesIds = await listCatalogues({
      valueType: "identifiers",
      limit: 5,
    });
    console.log(`Retrieved ${cataloguesIds.length} catalogue identifiers:`);
    console.log(JSON.stringify(cataloguesIds, null, 2));
    console.log("");

    console.log("2. Fetching catalogues with metadata...");
    const cataloguesMeta = await listCatalogues({
      valueType: "metadata",
      limit: 3,
    });
    console.log(`Retrieved ${cataloguesMeta.length} catalogues with metadata:`);
    console.log(JSON.stringify(cataloguesMeta, null, 2));
    console.log("");

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();

