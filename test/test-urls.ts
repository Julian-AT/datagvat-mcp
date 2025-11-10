import axios from "axios";

async function testUrls() {
  const urls = [
    "https://qs.data.gv.at/api/hub/repo/catalogues",
    "https://www.data.gv.at/api/3/catalogues",
    "https://data.gv.at/katalog/api/3/catalogues",
    "https://data.gv.at/api/3/catalogues",
  ];

  for (const url of urls) {
    try {
      console.log(`\nTesting: ${url}`);
      const response = await axios.get(url, {
        params: { valueType: "identifiers", limit: 2 },
        headers: { Accept: "application/json" },
        validateStatus: () => true,
      });
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers["content-type"]}`);
      console.log(
        `Response type: ${typeof response.data}, IsArray: ${Array.isArray(
          response.data
        )}`
      );
      if (Array.isArray(response.data)) {
        console.log(`Data: ${JSON.stringify(response.data.slice(0, 2), null, 2)}`);
      } else if (typeof response.data === "string") {
        console.log(`Data preview: ${response.data.substring(0, 200)}`);
      } else {
        console.log(`Data: ${JSON.stringify(response.data, null, 2).substring(0, 500)}`);
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }
}

testUrls();

