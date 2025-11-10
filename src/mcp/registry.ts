import { MCPToolDefinition } from "./types";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export class MCPToolRegistry {
  private tools: Map<string, MCPToolDefinition> = new Map();

  register(tool: MCPToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  getTool(name: string): MCPToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): MCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  validateInput(toolName: string, params: unknown): { valid: boolean; errors?: unknown[] } {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        valid: false,
        errors: [{ message: `Tool '${toolName}' not found` }],
      };
    }

    const validate = ajv.compile(tool.inputSchema);
    const valid = validate(params);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors || [],
      };
    }

    return { valid: true };
  }

  async invoke(
    toolName: string,
    params: unknown
  ): Promise<{ success: boolean; result?: unknown; error?: { code: string; message: string; details?: unknown } }> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: {
          code: "TOOL_NOT_FOUND",
          message: `Tool '${toolName}' not found`,
        },
      };
    }

    const validation = this.validateInput(toolName, params);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "INVALID_PARAMS",
          message: "Input validation failed",
          details: validation.errors,
        },
      };
    }

    try {
      const result = await tool.handler(params as Record<string, unknown>);

      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Tool execution failed";
      const errorStack = error instanceof Error ? error.stack : undefined;
      return {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: errorMessage,
          details: errorStack,
        },
      };
    }
  }

  clear(): void {
    this.tools.clear();
  }

  getToolCount(): number {
    return this.tools.size;
  }
}

export const globalRegistry = new MCPToolRegistry();

