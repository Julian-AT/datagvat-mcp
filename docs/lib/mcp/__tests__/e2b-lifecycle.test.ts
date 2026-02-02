import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createSandbox } from '../e2b-client';
import { SandboxTracker } from './helpers/sandbox-tracker';

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

  // Placeholder test to validate structure
  test('test infrastructure loaded', () => {
    expect(tracker).toBeDefined();
    expect(process.env.E2B_API_KEY).toBeTruthy();
  });
});
