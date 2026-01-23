import { expect, test } from "bun:test";
import { detectTools } from "./detect.js";

test("detectTools returns array of tool detection results", async () => {
	const result = await detectTools();

	expect(result).toBeDefined();
	expect(result.platform).toBeDefined();
	expect(Array.isArray(result.tools)).toBe(true);
	expect(result.tools.length).toBe(3); // claude-desktop, continue, cline

	for (const tool of result.tools) {
		expect(tool).toHaveProperty("name");
		expect(tool).toHaveProperty("configPath");
		expect(tool).toHaveProperty("detected");
		expect(typeof tool.detected).toBe("boolean");
	}
});
