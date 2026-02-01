'use client';

import { useEffect, useState } from 'react';

interface HealthResponse {
  timestamp: string;
  servers: Array<{
    server: string;
    status: 'healthy' | 'unhealthy';
    latencyMs?: number;
    toolCount?: number;
    error?: string;
  }>;
  allHealthy: boolean;
}

export function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/mcp/health');
        if (response.ok) {
          const data = await response.json();
          setHealth(data);
        }
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchHealth();

    // Poll every 30 seconds
    const interval = setInterval(fetchHealth, 30000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <span>Checking connection status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  return (
    <div className={`border-b px-4 py-2 ${health.allHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {health.servers.map((server) => (
          <div key={server.server} className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                server.status === 'healthy'
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
            />
            <span className={server.status === 'healthy' ? 'text-green-700' : 'text-red-700'}>
              <strong>{server.server}:</strong>{' '}
              {server.status === 'healthy' ? 'Connected' : 'Disconnected'}
            </span>
            {server.status === 'healthy' && server.latencyMs !== undefined && (
              <span className="text-gray-600">({server.latencyMs}ms)</span>
            )}
            {server.status === 'healthy' && server.toolCount !== undefined && (
              <span className="text-gray-600">· {server.toolCount} tools</span>
            )}
            {server.status === 'unhealthy' && server.error && (
              <span className="text-red-600 text-xs">· {server.error}</span>
            )}
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          Updated: {new Date(health.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
