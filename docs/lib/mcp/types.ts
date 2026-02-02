export interface ExecutionError {
  name: string;
  message: string;
  traceback: string;
  isTimeout: boolean;
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ExecutionOptions {
  timeoutMs?: number;
  workingDirectory?: string;
  files?: ProjectFile[];
}

export interface SandboxExecutionResult {
  success: boolean;
  text: string;
  error?: ExecutionError;
  logs: {
    stdout: string[];
    stderr: string[];
  };
  visualizations?: Array<{
    formats: string[];
    png?: string;
    svg?: string;
    html?: string;
  }>;
}

export interface E2BClientConfig {
  apiKey: string;
  timeoutMs?: number;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'retrying';

export interface ReconnectionConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface ResilientClientOptions {
  createClient: () => Promise<any>;
  reconnectionConfig?: Partial<ReconnectionConfig>;
  onStateChange?: (state: ConnectionState) => void;
}
