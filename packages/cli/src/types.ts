export type ToolName = "claude-desktop" | "continue" | "cline";
export type Platform = "darwin" | "win32" | "linux";

export interface ToolInfo {
	name: ToolName;
	configPath: string;
	detected: boolean;
}

export interface DetectionResult {
	tools: ToolInfo[];
	platform: Platform;
}
