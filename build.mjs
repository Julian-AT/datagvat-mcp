import * as esbuild from "esbuild";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

try {
  await esbuild.build({
    entryPoints: ["src/worker/index.ts"],
    bundle: true,
    outfile: "dist/worker/index.js",
    format: "esm",
    platform: "browser",
    target: "es2020",
    sourcemap: true,
    minify: false,
    external: [],
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.API_BASE_URL": '"https://qs.data.gv.at/api/hub/repo"',
      "global": "globalThis",
    },
    inject: ["./src/worker/polyfills/process-shim.js"],
    alias: {
      "crypto": "./src/worker/polyfills/crypto.ts",
      "pino": "./src/worker/logger.ts",
    },
    logLevel: "info",
  });

  console.log("✅ Worker build completed successfully");
  console.log("📦 Output: dist/worker/index.js");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}

