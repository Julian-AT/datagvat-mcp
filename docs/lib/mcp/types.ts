export interface SandboxExecutionResult {
  text: string;
  error?: string;
  logs?: string[];
}

export interface E2BClientConfig {
  apiKey: string;
  timeoutMs?: number;
}

export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'retrying';

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
