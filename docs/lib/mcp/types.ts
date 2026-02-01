export interface SandboxExecutionResult {
  text: string;
  error?: string;
  logs?: string[];
}

export interface E2BClientConfig {
  apiKey: string;
  timeoutMs?: number;
}
