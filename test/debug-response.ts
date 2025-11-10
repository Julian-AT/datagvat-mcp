import axios from "axios";

async function debugResponse() {
  const baseUrl = "https://qs.data.gv.at/api/hub/repo";

  console.log("Testing identifiers response...");
  const idResponse = await axios.get(`${baseUrl}/catalogues`, {
    params: { valueType: "identifiers", limit: 3 },
    headers: { Accept: "application/ld+json" },
  });
  console.log("Type:", typeof idResponse.data);
  console.log("IsArray:", Array.isArray(idResponse.data));
  console.log("Content-Type:", idResponse.headers["content-type"]);
  console.log("Data:", JSON.stringify(idResponse.data, null, 2));
  console.log("\n---\n");

  console.log("Testing metadata response...");
  const metaResponse = await axios.get(`${baseUrl}/catalogues`, {
    params: { valueType: "metadata", limit: 2 },
    headers: { Accept: "application/ld+json" },
  });
  console.log("Type:", typeof metaResponse.data);
  console.log("IsArray:", Array.isArray(metaResponse.data));
  console.log("Content-Type:", metaResponse.headers["content-type"]);
  if (typeof metaResponse.data === "string") {
    console.log("Data (first 1000 chars):", metaResponse.data.substring(0, 1000));
  } else {
    console.log("Data:", JSON.stringify(metaResponse.data, null, 2));
  }
}

debugResponse().catch(console.error);

