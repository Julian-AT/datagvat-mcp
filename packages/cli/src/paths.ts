import * as os from "node:os";
import * as path from "node:path";
import type { Platform, ToolName } from "./types.js";

export function getToolPaths(platform: Platform): Record<ToolName, string> {
	const homeDir = os.homedir();

	if (platform === "darwin") {
		return {
			"claude-desktop": path.join(
				homeDir,
				"Library/Application Support/Claude/claude_desktop_config.json",
			),
			continue: path.join(homeDir, ".continue/config.json"),
			cline: path.join(
				homeDir,
				"Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
			),
		};
	}

	if (platform === "win32") {
		const appData =
			process.env.APPDATA || path.join(homeDir, "AppData/Roaming");
		const userProfile = process.env.USERPROFILE || homeDir;

		return {
			"claude-desktop": path.join(appData, "Claude/claude_desktop_config.json"),
			continue: path.join(userProfile, ".continue/config.json"),
			cline: path.join(
				appData,
				"Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
			),
		};
	}

	// Linux
	return {
		"claude-desktop": path.join(
			homeDir,
			".config/Claude/claude_desktop_config.json",
		),
		continue: path.join(homeDir, ".config/continue/config.json"),
		cline: path.join(
			homeDir,
			".config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
		),
	};
}
