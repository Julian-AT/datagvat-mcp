import {
  MCPRequest,
  MCPResponse,
  MCPSuccessResponse,
  MCPErrorResponse,
  MCPErrorCode,
} from "./types";
import { MCPToolRegistry } from "./registry";
import { randomUUID } from "crypto";

export class MCPServer {
  constructor(private registry: MCPToolRegistry) { }

  async handleRequest(request: MCPRequest, correlationId?: string): Promise<MCPResponse> {
    const requestId = request.id !== undefined ? request.id : null;
    const corrId = correlationId || randomUUID();

    try {
      if (request.jsonrpc !== "2.0") {
        return this.createErrorResponse(
          requestId,
          MCPErrorCode.INVALID_REQUEST,
          "Invalid JSON-RPC version. Must be '2.0'",
          undefined,
          corrId
        );
      }

      if (!request.method || typeof request.method !== "string") {
        return this.createErrorResponse(
          requestId,
          MCPErrorCode.INVALID_REQUEST,
          "Missing or invalid 'method' field",
          undefined,
          corrId
        );
      }

      const method = request.method;
      const params = request.params || {};

      if (method === "tools/list") {
        return this.handleListTools(requestId, corrId);
      }

      if (method === "tools/call") {
        return await this.handleToolCall(requestId, params, corrId);
      }

      if (this.registry.hasTool(method)) {
        return await this.handleDirectToolCall(requestId, method, params, corrId);
      }

      return this.createErrorResponse(
        requestId,
        MCPErrorCode.METHOD_NOT_FOUND,
        `Method '${method}' not found`,
        undefined,
        corrId
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      return this.createErrorResponse(
        requestId,
        MCPErrorCode.INTERNAL_ERROR,
        errorMessage,
        undefined,
        corrId
      );
    }
  }

  async handleBatchRequest(requests: MCPRequest[], correlationId?: string): Promise<MCPResponse[]> {
    const corrId = correlationId || randomUUID();

    const responses = await Promise.all(
      requests.map((req) => this.handleRequest(req, corrId))
    );

    return responses;
  }

  private handleListTools(requestId: string | number | null, correlationId: string): MCPSuccessResponse {
    const tools = this.registry.listTools();
    const toolList = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));

    return this.createSuccessResponse(requestId, {
      tools: toolList,
      count: toolList.length,
    }, correlationId);
  }

  private async handleToolCall(
    requestId: string | number | null,
    params: Record<string, unknown>,
    correlationId: string
  ): Promise<MCPResponse> {
    if (!params.name || typeof params.name !== "string") {
      return this.createErrorResponse(
        requestId,
        MCPErrorCode.INVALID_PARAMS,
        "Missing or invalid 'name' parameter",
        undefined,
        correlationId
      );
    }

    const toolName = params.name;
    const toolParams = (params.arguments as Record<string, unknown>) || {};

    return await this.handleDirectToolCall(requestId, toolName, toolParams, correlationId);
  }

  private async handleDirectToolCall(
    requestId: string | number | null,
    toolName: string,
    params: Record<string, unknown>,
    correlationId: string
  ): Promise<MCPResponse> {
    const startTime = Date.now();

    const result = await this.registry.invoke(toolName, params);

    const executionTime = Date.now() - startTime;

    if (!result.success) {
      const errorCode =
        result.error?.code === "TOOL_NOT_FOUND"
          ? MCPErrorCode.METHOD_NOT_FOUND
          : result.error?.code === "INVALID_PARAMS"
            ? MCPErrorCode.INVALID_PARAMS
            : MCPErrorCode.INTERNAL_ERROR;

      return this.createErrorResponse(
        requestId,
        errorCode,
        result.error?.message || "Tool execution failed",
        result.error?.details,
        correlationId
      );
    }

    const enrichedResult = {
      ...(typeof result.result === 'object' && result.result !== null ? result.result : {}),
      _metadata: {
        timestamp: new Date().toISOString(),
        source: "data.gv.at",
        tool: toolName,
        executionTimeMs: executionTime,
        correlationId,
      },
    };

    return this.createSuccessResponse(requestId, enrichedResult, correlationId);
  }

  private createSuccessResponse<T = unknown>(
    id: string | number | null,
    result: T,
    correlationId?: string
  ): MCPSuccessResponse<T> {
    const response: MCPSuccessResponse<T> = {
      jsonrpc: "2.0",
      result,
      id,
    };
    if (correlationId) {
      (response as MCPSuccessResponse<T> & { correlationId: string }).correlationId = correlationId;
    }
    return response;
  }

  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown,
    correlationId?: string
  ): MCPErrorResponse {
    const errorObj: { code: number; message: string; data?: unknown } = {
      code,
      message,
    };
    if (data) {
      errorObj.data = data;
    }
    const response: MCPErrorResponse = {
      jsonrpc: "2.0",
      error: errorObj,
      id,
    };
    if (correlationId) {
      (response as MCPErrorResponse & { correlationId: string }).correlationId = correlationId;
    }
    return response;
  }

  getRegistry(): MCPToolRegistry {
    return this.registry;
  }
}

export function createMCPServer(registry?: MCPToolRegistry): MCPServer {
  const reg = registry || new MCPToolRegistry();
  return new MCPServer(reg);
}

