export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface MCPToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    source: string;
    executionTime?: number;
  };
}

export interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
  id?: string | number;
}

export interface MCPSuccessResponse<T = unknown> {
  jsonrpc: "2.0";
  result: T;
  id: string | number | null;
}

export interface MCPErrorResponse {
  jsonrpc: "2.0";
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

export type MCPResponse<T = unknown> = MCPSuccessResponse<T> | MCPErrorResponse;

export enum MCPErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  VALIDATION_ERROR = -32001,
  NOT_FOUND = -32002,
  RATE_LIMIT = -32003,
}

