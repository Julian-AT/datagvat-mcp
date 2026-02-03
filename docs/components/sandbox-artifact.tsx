'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSandboxes, type UISandbox } from '@/hooks/use-sandbox';
import { cn } from '@/lib/utils';

import { SandboxCodeTab } from './sandbox-code-tab';
import { SandboxOutputTab, type SandboxOutput } from './sandbox-output-tab';

type SandboxArtifactProps = {
  sandboxId: string;
  chatId: string;
  messageId: string;
};

export function SandboxArtifact({
  sandboxId,
  chatId,
  messageId,
}: SandboxArtifactProps) {
  const { sandboxes, updateSandbox, closeSandbox, openSandbox } = useSandboxes();
  const sandbox = sandboxes.find((s) => s.sandboxId === sandboxId);
  console.log('[SandboxArtifact] Render - sandboxId:', sandboxId, 'found sandbox:', !!sandbox, 'total sandboxes:', sandboxes.length);

  const [activeTab, setActiveTab] = useState<'code' | 'output'>('code');
  const [isLoading, setIsLoading] = useState(!sandbox);
  const initialSaveDone = useRef(false);

  // Initial save to database when sandbox is first created locally
  useEffect(() => {
    console.log('[SandboxArtifact] initialSave effect - sandbox exists:', !!sandbox, 'initialSaveDone:', initialSaveDone.current);
    if (sandbox && !initialSaveDone.current) {
      initialSaveDone.current = true;
      console.log('[SandboxArtifact] Saving initial sandbox state to DB:', sandboxId);
      // Save initial sandbox state to database
      fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          messageId,
          chatId,
          title: sandbox.title || 'Sandbox',
          code: sandbox.code || '',
          outputs: sandbox.outputs,
          hasApprovedOnce: sandbox.hasApprovedOnce,
          e2bSandboxId: sandbox.e2bSandboxId,
        }),
      }).then(res => {
        console.log('[SandboxArtifact] POST /api/sandbox response:', res.status);
        if (!res.ok) {
          console.error('[SandboxArtifact] POST failed, will retry on code change');
          initialSaveDone.current = false; // Reset to retry later
        }
      }).catch(err => {
        console.error('[SandboxArtifact] POST error:', err);
        initialSaveDone.current = false; // Reset to retry later
      });
    }
  }, [sandbox, sandboxId, chatId, messageId]);

  // Load sandbox state on mount (page refresh restoration)
  useEffect(() => {
    if (sandbox) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    // Fetch sandbox state from API for page refresh restoration
    fetch(`/api/sandbox?sandboxId=${sandboxId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((state) => {
        if (state) {
          // Restore sandbox from persisted state
          const restoredSandbox: UISandbox = {
            sandboxId,
            title: state.title || 'Sandbox',
            code: state.code || '',
            outputs: (state.outputs as SandboxOutput[]) || [],
            hasApprovedOnce: state.hasApprovedOnce || false,
            e2bSandboxId: state.e2bSandboxId || undefined,
            isRunning: false,
            activeTab: 'code',
            showApproval: false,
          };
          openSandbox(restoredSandbox);
        }
      })
      .catch(() => {
        // Silently fail - sandbox will show loading state
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sandboxId, sandbox, openSandbox]);

  const handleCodeChange = useCallback(
    (code: string) => {
      updateSandbox(sandboxId, { code });
      // Auto-save to DB via API
      fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          messageId,
          chatId,
          title: sandbox?.title || 'Sandbox',
          code,
          outputs: sandbox?.outputs,
          hasApprovedOnce: sandbox?.hasApprovedOnce,
          e2bSandboxId: sandbox?.e2bSandboxId,
        }),
      }).catch(() => {
        // Silently fail auto-save - user can retry
      });
    },
    [sandboxId, chatId, messageId, sandbox, updateSandbox]
  );

  const handleRun = useCallback(async () => {
    if (!sandbox) return;

    // Show approval UI on first run
    if (!sandbox.hasApprovedOnce) {
      updateSandbox(sandboxId, { showApproval: true });
      return;
    }

    // Set running state and clear previous outputs (CONTEXT.md: clear on run)
    updateSandbox(sandboxId, {
      isRunning: true,
      outputs: [],
    });
    setActiveTab('output'); // Auto-switch to output tab

    try {
      const response = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          messageId,
          chatId,
          title: sandbox.title,
          code: sandbox.code,
          e2bSandboxId: sandbox.e2bSandboxId,
        }),
      });

      const result = await response.json();

      // Update sandbox with final state
      updateSandbox(sandboxId, {
        isRunning: false,
        outputs: result.outputs || [],
        e2bSandboxId: result.e2bSandboxId,
      });
    } catch (error) {
      console.error('Execution error:', error);
      updateSandbox(sandboxId, {
        isRunning: false,
        outputs: [
          {
            type: 'stderr',
            content: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }
  }, [sandbox, sandboxId, chatId, messageId, updateSandbox]);

  const handleApprove = useCallback(() => {
    updateSandbox(sandboxId, {
      hasApprovedOnce: true,
      showApproval: false,
    });
    // Then execute
    handleRun();
  }, [sandboxId, updateSandbox, handleRun]);

  const handleDeny = useCallback(() => {
    // CONTEXT.md decision line 46: denial closes sandbox completely
    closeSandbox(sandboxId);

    // AI will naturally respond to denial - no manual message append needed per AI SDK pattern.
    // When sandbox closes without tool execution, the AI SDK sees no tool-result and
    // generates a natural language response like "I understand you don't want to execute this code".
    // This is the standard AI SDK pattern - the "Execution denied" message comes from AI naturally,
    // not from manual message appending.
  }, [sandboxId, closeSandbox]);

  if (isLoading || !sandbox) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <div className="text-muted-foreground">Loading sandbox...</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted px-4 py-2">
        <h3 className="font-medium">{sandbox.title}</h3>
      </div>

      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'code' | 'output')}
      >
        <Tabs.List className="flex border-b">
          <Tabs.Trigger
            value="code"
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              'hover:text-foreground',
              'data-[state=active]:border-b-2 data-[state=active]:border-primary',
              'data-[state=inactive]:text-muted-foreground'
            )}
          >
            Code
          </Tabs.Trigger>
          <Tabs.Trigger
            value="output"
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              'hover:text-foreground',
              'data-[state=active]:border-b-2 data-[state=active]:border-primary',
              'data-[state=inactive]:text-muted-foreground'
            )}
          >
            Output
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="code" className="min-h-[300px]">
          <SandboxCodeTab
            code={sandbox.code}
            onCodeChange={handleCodeChange}
            onRun={handleRun}
            showApproval={sandbox.showApproval}
            onApprove={handleApprove}
            onDeny={handleDeny}
            hasApprovedOnce={sandbox.hasApprovedOnce}
            isRunning={sandbox.isRunning}
          />
        </Tabs.Content>

        <Tabs.Content value="output" className="min-h-[300px]">
          <SandboxOutputTab outputs={sandbox.outputs} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
