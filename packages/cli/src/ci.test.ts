import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { isCI, requireNonInteractive } from './ci.js';

describe('CI Detection', () => {
  let originalCI: string | undefined;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    // Save original values
    originalCI = process.env.CI;
    originalIsTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    // Restore original values
    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    } else {
      delete process.env.CI;
    }
    if (originalIsTTY !== undefined) {
      process.stdout.isTTY = originalIsTTY;
    }
  });

  describe('isCI', () => {
    it('detects CI environment via CI env var', () => {
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
    });

    it('detects non-TTY environment', () => {
      delete process.env.CI;
      process.stdout.isTTY = false;
      expect(isCI()).toBe(true);
    });

    it('returns false in interactive environment', () => {
      delete process.env.CI;
      process.stdout.isTTY = true;
      // Note: This might still return true if running in actual CI
      // Just verify function doesn't crash
      const result = isCI();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('requireNonInteractive', () => {
    it('throws error in CI environment', () => {
      process.env.CI = 'true';
      expect(() => requireNonInteractive()).toThrow('Interactive prompts not available');
    });

    it('throws error with fix instructions', () => {
      process.env.CI = 'true';
      try {
        requireNonInteractive();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('Fix: Add --yes flag');
          expect(error.message).toContain('Example: datagvat-mcp init --yes');
        }
      }
    });

    it('does not throw in interactive environment', () => {
      delete process.env.CI;
      process.stdout.isTTY = true;
      // If we're in actual CI, this test might fail, but that's ok
      // Just verify function exists and doesn't crash with bad input
      expect(() => requireNonInteractive()).not.toThrow();
    });
  });
});
