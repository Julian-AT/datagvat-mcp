import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getMcpConfig } from "./templates.js";
import type { ToolInfo } from "./types.js";
import * as ui from "./ui.js";

interface ConfigResult {
	configured: number;
	skipped: number;
	failed: number;
}

interface ToolConfig {
	mcpServers?: Record<string, unknown>;
	[key: string]: unknown;
}

/**
 * Configure selected tools by updating their config files
 */
export async function configureTools(tools: ToolInfo[]): Promise<ConfigResult> {
	const result: ConfigResult = {
		configured: 0,
		skipped: 0,
		failed: 0,
	};

	for (const tool of tools) {
		try {
			await configureTool(tool);
			result.configured++;
		} catch (err) {
			if (err instanceof SkipToolError) {
				ui.warning(`${tool.name}: ${err.message}`);
				result.skipped++;
			} else {
				const errorMessage =
					err instanceof Error ? err.message : "Unknown error";
				ui.error(`${tool.name}: Configuration failed - ${errorMessage}`);
				result.failed++;
			}
		}
	}

	return result;
}

/**
 * Error thrown when a tool should be skipped (already configured)
 */
class SkipToolError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SkipToolError";
	}
}

/**
 * Configure a single tool
 */
async function configureTool(tool: ToolInfo): Promise<void> {
	const { configPath } = tool;
	const mcpConfig = getMcpConfig();

	// Read or create config
	let config: ToolConfig;
	try {
		const fileContent = await fs.readFile(configPath, "utf-8");
		config = JSON.parse(fileContent) as ToolConfig;
	} catch (err) {
		if (err instanceof Error && "code" in err && err.code === "ENOENT") {
			// File doesn't exist - create parent directory and use empty config
			const parentDir = path.dirname(configPath);
			try {
				await fs.mkdir(parentDir, { recursive: true });
			} catch (mkdirErr) {
				if (
					mkdirErr instanceof Error &&
					"code" in mkdirErr &&
					mkdirErr.code === "EACCES"
				) {
					throw new Error(
						"Permission denied. Try running with administrator/sudo privileges.",
					);
				}
				throw mkdirErr;
			}
			config = {};
		} else if (err instanceof SyntaxError) {
			// Invalid JSON - warn and create new config
			ui.warning(
				`${tool.name}: Invalid JSON in config file, creating new configuration`,
			);
			config = {};
		} else if (err instanceof Error && "code" in err && err.code === "EACCES") {
			throw new Error(
				"Permission denied reading config file. Check file permissions or run with administrator/sudo privileges.",
			);
		} else {
			throw err;
		}
	}

	// Initialize mcpServers if it doesn't exist
	if (!config.mcpServers) {
		config.mcpServers = {};
	}

	// Check if already configured
	if ("datagvat" in config.mcpServers) {
		throw new SkipToolError("Already configured (datagvat entry exists)");
	}

	// Add our MCP server
	config.mcpServers.datagvat = mcpConfig;

	// Write back to file
	try {
		await fs.writeFile(
			configPath,
			`${JSON.stringify(config, null, 2)}\n`,
			"utf-8",
		);
	} catch (err) {
		if (err instanceof Error && "code" in err && err.code === "EACCES") {
			throw new Error(
				"Permission denied writing config file. Check file permissions or run with administrator/sudo privileges.",
			);
		}
		throw err;
	}

	ui.success(`${tool.name}: Configured at ${configPath}`);
}
