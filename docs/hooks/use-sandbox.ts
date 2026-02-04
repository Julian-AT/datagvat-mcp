'use client';

import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

export type UISandbox = {
  sandboxId: string;
  title: string;
  code: string;
  outputs: Array<{
    type: 'stdout' | 'stderr' | 'visualization';
    content: string;
    timestamp: string;
  }>;
  e2bSandboxId?: string;
  template?: 'python' | 'react' | 'node';
  isRunning: boolean;
  activeTab: 'code' | 'output' | 'preview';
};

export function useSandboxes() {
  const { data: sandboxes, mutate: setSandboxes } = useSWR<UISandbox[]>(
    'sandboxes',
    null,
    { fallbackData: [] }
  );

  const openSandbox = useCallback(
    (sandbox: UISandbox) => {
      console.log('[useSandboxes] openSandbox called with:', sandbox.sandboxId);
      setSandboxes((current) => [...(current || []), sandbox]);
    },
    [setSandboxes]
  );

  const closeSandbox = useCallback(
    (sandboxId: string) => {
      setSandboxes((current) =>
        (current || []).filter((s) => s.sandboxId !== sandboxId)
      );
    },
    [setSandboxes]
  );

  const updateSandbox = useCallback(
    (sandboxId: string, updates: Partial<UISandbox>) => {
      setSandboxes((current) =>
        (current || []).map((s) =>
          s.sandboxId === sandboxId ? { ...s, ...updates } : s
        )
      );
    },
    [setSandboxes]
  );

  const activeSandbox = useMemo(
    () => sandboxes?.[sandboxes.length - 1],
    [sandboxes]
  );

  return {
    sandboxes: sandboxes || [],
    openSandbox,
    closeSandbox,
    updateSandbox,
    activeSandbox,
  };
}
