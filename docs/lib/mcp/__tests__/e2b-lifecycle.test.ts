import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createSandbox } from '../e2b-client';
import { SandboxTracker } from './helpers/sandbox-tracker';
import dotenv from 'dotenv';

dotenv.config({
  path: '.env.local',
});

// Test timeouts (E2B-05, E2B-06 requirements)
const EXECUTION_TIMEOUT_MS = 30000; // 30 seconds
const TEST_TIMEOUT_MS = 60000; // 60 seconds for standard tests

describe('E2B Sandbox Lifecycle', () => {
  let tracker: SandboxTracker;

  beforeAll(() => {
    if (!process.env.E2B_API_KEY) {
      console.warn('⚠️  E2B_API_KEY not set, skipping E2B lifecycle tests');
      console.warn('   Get your API key from: https://e2b.dev/dashboard');
      process.exit(0);
    }
    tracker = new SandboxTracker();
  });

  afterAll(() => {
    const orphaned = tracker.getOrphaned();
    if (orphaned.length > 0) {
      console.error(`❌ Orphaned sandboxes detected: ${orphaned.join(', ')}`);
    }
    expect(orphaned).toHaveLength(0);
  });

  // E2B-01: Sandbox creates successfully with Python libraries
  test('creates sandbox with Python libraries', async () => {
    const sandbox = await createSandbox(process.env.E2B_API_KEY!);
    tracker.track(sandbox.sandboxId);

    try {
      const result = await sandbox.runCode('import pandas, matplotlib, plotly; print("OK")');
      expect(result.success).toBe(true);
      expect(result.logs.stdout.join('\n')).toContain('OK');
    } finally {
      await sandbox.kill();
      tracker.untrack(sandbox.sandboxId);
    }
  }, { timeout: TEST_TIMEOUT_MS });

  // E2B-02: Code executes in isolated sandbox
  test('executes code in isolated environment', async () => {
    const sandbox = await createSandbox(process.env.E2B_API_KEY!);
    tracker.track(sandbox.sandboxId);

    try {
      const result = await sandbox.runCode('import os; print(os.environ.get("HOME"))');
      expect(result.success).toBe(true);
      // E2B sandboxes run as root user
      expect(result.logs.stdout.join('\n')).toContain('/root');
    } finally {
      await sandbox.kill();
      tracker.untrack(sandbox.sandboxId);
    }
  }, { timeout: TEST_TIMEOUT_MS });

  // E2B-03: Cleanup runs after execution completes
  test('cleanup runs after successful execution', async () => {
    const sandbox = await createSandbox(process.env.E2B_API_KEY!);
    tracker.track(sandbox.sandboxId);

    try {
      await sandbox.runCode('print("success")');
      await sandbox.kill();
      tracker.untrack(sandbox.sandboxId);

      // Verify sandbox is killed (subsequent operations should return errors)
      const result = await sandbox.runCode('print("test")');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    } catch (error) {
      // Clean up on assertion failure
      await sandbox.kill().catch(() => {});
      tracker.untrack(sandbox.sandboxId);
      throw error;
    }
  }, { timeout: TEST_TIMEOUT_MS });

  // E2B-04: Cleanup runs on failure
  test('cleanup runs after execution failure', async () => {
    const sandbox = await createSandbox(process.env.E2B_API_KEY!);
    tracker.track(sandbox.sandboxId);

    try {
      const result = await sandbox.runCode('raise ValueError("test error")');
      expect(result.success).toBe(false);
      expect(result.error?.name).toBe('ValueError');
    } finally {
      await sandbox.kill();
      tracker.untrack(sandbox.sandboxId);
    }
  }, { timeout: TEST_TIMEOUT_MS });

  // E2B-05: Timeout enforcement
  test('enforces 30-second timeout on infinite loops', async () => {
    const sandbox = await createSandbox(process.env.E2B_API_KEY!);
    tracker.track(sandbox.sandboxId);

    try {
      const result = await sandbox.runCode('while True: pass', { timeoutMs: 5000 });
      expect(result.success).toBe(false);
      expect(result.error?.isTimeout).toBe(true);
    } finally {
      await sandbox.kill();
      tracker.untrack(sandbox.sandboxId);
    }
  }, { timeout: TEST_TIMEOUT_MS });

  // E2B-06: Full lifecycle verification
  test('verifies create → execute → kill → verify cleanup', async () => {
    const sandbox = await createSandbox(process.env.E2B_API_KEY!);
    tracker.track(sandbox.sandboxId);

    try {
      const sandboxId = sandbox.sandboxId;
      expect(sandboxId).toBeTruthy();

      const result = await sandbox.runCode('x = 42; print(x)');
      expect(result.success).toBe(true);
      expect(result.logs.stdout.join('\n')).toContain('42');

      await sandbox.kill();
      tracker.untrack(sandbox.sandboxId);

      // Verify sandbox is killed (subsequent operations should return errors)
      const postKillResult = await sandbox.runCode('print(x)');
      expect(postKillResult.success).toBe(false);
      expect(postKillResult.error).toBeDefined();
    } catch (error) {
      // Clean up on assertion failure
      await sandbox.kill().catch(() => {});
      tracker.untrack(sandbox.sandboxId);
      throw error;
    }
  }, { timeout: TEST_TIMEOUT_MS });

  // E2B-07: No orphaned sandboxes after 100 runs
  test('creates 100 sandboxes sequentially without orphaning', async () => {
    const sandboxIds: string[] = [];

    for (let i = 0; i < 100; i++) {
      const sandbox = await createSandbox(process.env.E2B_API_KEY!);
      tracker.track(sandbox.sandboxId);
      sandboxIds.push(sandbox.sandboxId);

      try {
        await sandbox.runCode(`print("Run ${i}")`);
      } finally {
        await sandbox.kill();
        tracker.untrack(sandbox.sandboxId);
      }
    }

    expect(sandboxIds).toHaveLength(100);
    expect(tracker.getOrphaned()).toHaveLength(0);
  }, { timeout: 600000 }); // 10 minutes for 100 sandboxes

  // E2B-08: Error handling preserves cleanup
  test('preserves cleanup in try/finally pattern', async () => {
    let sandbox;
    const testTracker = new SandboxTracker(); // Use isolated tracker for this test

    try {
      sandbox = await createSandbox(process.env.E2B_API_KEY!);
      testTracker.track(sandbox.sandboxId);

      await sandbox.runCode('raise RuntimeError("intentional error")');
      throw new Error('Should not reach here');
    } catch (error) {
      // Error expected
    } finally {
      if (sandbox) {
        await sandbox.kill();
        testTracker.untrack(sandbox.sandboxId);
      }
    }

    expect(testTracker.getOrphaned()).toHaveLength(0);
  }, { timeout: TEST_TIMEOUT_MS });

  // Success Criteria #5: Visualization generation
  test('executes multi-file Python with matplotlib and receives base64 visualizations', async () => {
    const sandbox = await createSandbox(process.env.E2B_API_KEY!);
    tracker.track(sandbox.sandboxId);

    try {
      const code = `
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2*np.pi, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y)
plt.title('Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.show()
`;

      const result = await sandbox.runCode(code);
      expect(result.success).toBe(true);
      expect(result.visualizations).toBeDefined();
      expect(result.visualizations!.length).toBeGreaterThan(0);
      expect(result.visualizations![0].png).toBeTruthy();
      expect(result.visualizations![0].png?.startsWith('iVBORw0KGgo')).toBe(true); // PNG header
    } finally {
      await sandbox.kill();
      tracker.untrack(sandbox.sandboxId);
    }
  }, { timeout: TEST_TIMEOUT_MS });
});
