import type { ConnectionState, ReconnectionConfig, ResilientClientOptions } from './types';

const DEFAULT_CONFIG: ReconnectionConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export function createResilientMCPClient(options: ResilientClientOptions): {
  getClient: () => Promise<any>;
  getState: () => ConnectionState;
  reconnect: () => Promise<void>;
} {
  const config: ReconnectionConfig = {
    ...DEFAULT_CONFIG,
    ...options.reconnectionConfig,
  };

  let state: ConnectionState = 'connecting';
  let client: any = null;
  let reconnectionPromise: Promise<void> | null = null;

  const setState = (newState: ConnectionState) => {
    state = newState;
    options.onStateChange?.(newState);
  };

  const calculateBackoff = (attemptNumber: number): number => {
    const delay = config.initialDelayMs * config.backoffMultiplier ** attemptNumber;
    return Math.min(delay, config.maxDelayMs);
  };

  const reconnect = async (): Promise<void> => {
    // If already reconnecting, wait for current attempt
    if (reconnectionPromise) {
      return reconnectionPromise;
    }

    reconnectionPromise = (async () => {
      for (let attempt = 0; attempt < config.maxRetries; attempt++) {
        setState('retrying');
        console.log(
          `[MCP Reconnection] Attempting connection... (attempt ${attempt + 1}/${config.maxRetries})`
        );

        try {
          client = await options.createClient();
          setState('connected');
          console.log('[MCP Reconnection] Connected successfully');
          reconnectionPromise = null;
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';

          if (attempt < config.maxRetries - 1) {
            const backoffMs = calculateBackoff(attempt);
            console.warn(
              `[MCP Reconnection] Connection failed (${message}), retrying in ${backoffMs / 1000}s...`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          } else {
            console.error(
              `[MCP Reconnection] Max retries (${config.maxRetries}) exceeded, giving up`
            );
          }
        }
      }

      setState('disconnected');
      reconnectionPromise = null;
      throw new Error(`Failed to connect after ${config.maxRetries} attempts`);
    })();

    return reconnectionPromise;
  };

  const getClient = async (): Promise<any> => {
    // If already connected, return cached client
    if (client && state === 'connected') {
      return client;
    }

    // If disconnected or never connected, trigger reconnection
    if (state === 'disconnected' || state === 'connecting') {
      await reconnect();
      return client;
    }

    // If currently retrying, wait for reconnection to complete
    if (state === 'retrying' && reconnectionPromise) {
      await reconnectionPromise;
      return client;
    }

    throw new Error(`Unexpected connection state: ${state}`);
  };

  const getState = (): ConnectionState => {
    return state;
  };

  return {
    getClient,
    getState,
    reconnect,
  };
}
