/**
 * Get the MCP server configuration template for data.gv.at
 */
export function getMcpConfig(): { command: string; args: string[] } {
	return {
		command: "uvx",
		args: ["datagvat-mcp"],
	};
}
