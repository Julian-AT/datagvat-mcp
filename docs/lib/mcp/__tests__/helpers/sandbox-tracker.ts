/**
 * SandboxTracker - Helper for tracking E2B sandboxes to detect orphans
 *
 * Tracks created sandbox IDs and verifies all are properly cleaned up.
 * Used in tests to ensure no resource leaks (E2B-07 requirement).
 */
export class SandboxTracker {
  private activeSandboxes: Set<string>;

  constructor() {
    this.activeSandboxes = new Set<string>();
  }

  /**
   * Track a sandbox that was created
   * @param sandboxId - E2B sandbox ID to track
   */
  track(sandboxId: string): void {
    this.activeSandboxes.add(sandboxId);
  }

  /**
   * Untrack a sandbox that was properly cleaned up
   * @param sandboxId - E2B sandbox ID to untrack
   */
  untrack(sandboxId: string): void {
    this.activeSandboxes.delete(sandboxId);
  }

  /**
   * Get list of sandboxes that were created but not cleaned up
   * @returns Array of orphaned sandbox IDs
   */
  getOrphaned(): string[] {
    return Array.from(this.activeSandboxes);
  }

  /**
   * Clear all tracked sandboxes (use for test isolation)
   */
  clear(): void {
    this.activeSandboxes.clear();
  }

  /**
   * Get count of currently tracked sandboxes
   */
  getCount(): number {
    return this.activeSandboxes.size;
  }
}
