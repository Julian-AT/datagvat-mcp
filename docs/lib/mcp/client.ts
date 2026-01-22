/**
 * MCP Client Singleton
 *
 * Manages a persistent connection to the Python FastMCP server via stdio transport.
 * Uses singleton pattern to avoid reconnecting on every API request.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
	CallToolResult,
	ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Connection configuration for the Python MCP server
 */
const MCP_CONFIG = {
	command: 'python',
	args: ['-m', 'mcp.app.server'],
	name: 'datagvat-docs-test-client',
	version: '1.0.0',
} as const;

/**
 * Retry configuration for connection attempts
 */
const RETRY_CONFIG = {
	attempts: 3,
	delays: [1000, 2000, 4000], // Exponential backoff: 1s, 2s, 4s
} as const;

/**
 * MCP Client Manager
 *
 * Implements singleton pattern with connection caching and promise deduplication.
 * Handles connection lifecycle, retries, and error messaging.
 */
class MCPClientManager {
	private client: Client | null = null;
	private connecting: Promise<Client> | null = null;
	private connectionAttempts = 0;

	/**
	 * Get or create the MCP client instance
	 *
	 * Uses promise deduplication to prevent multiple simultaneous connection attempts.
	 *
	 * @returns Connected MCP client
	 * @throws {Error} If connection fails after all retry attempts
	 */
	async getClient(): Promise<Client> {
		if (this.client) return this.client;
		if (this.connecting) return this.connecting;

		this.connecting = this.connect();
		try {
			this.client = await this.connecting;
			this.connectionAttempts = 0; // Reset on success
			return this.client;
		} finally {
			this.connecting = null;
		}
	}

	/**
	 * Establish connection to MCP server with retry logic
	 *
	 * @returns Connected client instance
	 * @throws {Error} If all retry attempts fail
	 */
	private async connect(): Promise<Client> {
		let lastError: Error | null = null;

		for (let i = 0; i < RETRY_CONFIG.attempts; i++) {
			try {
				const transport = new StdioClientTransport({
					command: MCP_CONFIG.command,
					args: MCP_CONFIG.args,
				});

				const client = new Client(
					{
						name: MCP_CONFIG.name,
						version: MCP_CONFIG.version,
					},
					{
						capabilities: {},
					},
				);

				await client.connect(transport);

				console.log(
					`[MCP] Connected to Python server (attempt ${i + 1}/${RETRY_CONFIG.attempts})`,
				);
				return client;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				this.connectionAttempts++;

				// Don't delay after last attempt
				if (i < RETRY_CONFIG.attempts - 1) {
					const delay = RETRY_CONFIG.delays[i];
					console.warn(
						`[MCP] Connection attempt ${i + 1} failed, retrying in ${delay}ms...`,
					);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		// All attempts failed
		throw this.createConnectionError(lastError);
	}

	/**
	 * Create actionable error message based on failure type
	 */
	private createConnectionError(error: Error | null): Error {
		const message = error?.message ?? 'Unknown error';

		if (message.includes('ENOENT') || message.includes('not found')) {
			return new Error(
				'Python not found. Please ensure Python 3.11+ is installed and available in PATH.',
			);
		}

		if (message.includes('No module named')) {
			return new Error(
				'MCP server module not found. Please verify the project structure and run from the correct directory.',
			);
		}

		if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
			return new Error(
				'Connection timeout. Check that the Python MCP server starts correctly. Run `python -m mcp.app.server` manually to debug.',
			);
		}

		return new Error(
			`Failed to connect to MCP server after ${RETRY_CONFIG.attempts} attempts: ${message}`,
		);
	}

	/**
	 * List all available tools from the MCP server
	 *
	 * @returns List of tool definitions
	 * @throws {Error} If client connection fails or tool listing fails
	 */
	async listTools(): Promise<ListToolsResult['tools']> {
		try {
			const client = await this.getClient();
			const result = await client.listTools();
			return result.tools;
		} catch (error) {
			throw new Error(
				`Failed to list MCP tools: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Call a tool on the MCP server
	 *
	 * @param name - Tool name to invoke
	 * @param args - Tool arguments as key-value object
	 * @returns Tool execution result
	 * @throws {Error} If client connection fails or tool execution fails
	 */
	async callTool(
		name: string,
		args: Record<string, unknown>,
	): Promise<CallToolResult> {
		try {
			const client = await this.getClient();
			const result = await client.callTool({
				name,
				arguments: args,
			});
			return result;
		} catch (error) {
			throw new Error(
				`Failed to call tool '${name}': ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Close the connection to the MCP server
	 *
	 * Useful for cleanup in tests or graceful shutdown.
	 */
	async close(): Promise<void> {
		if (this.client) {
			try {
				await this.client.close();
				this.client = null;
				console.log('[MCP] Connection closed');
			} catch (error) {
				console.error('[MCP] Error closing connection:', error);
			}
		}
	}
}

/**
 * Singleton instance of the MCP client manager
 *
 * Import and use this throughout the application:
 * ```typescript
 * import { mcpClient } from '@/lib/mcp/client';
 *
 * const tools = await mcpClient.listTools();
 * const result = await mcpClient.callTool('search_datasets', { query: 'health' });
 * ```
 */
export const mcpClient = new MCPClientManager();
