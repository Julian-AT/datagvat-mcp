import ciInfo from 'ci-info';

/**
 * Detect if running in a CI environment
 * Checks both CI environment variables and TTY availability
 */
export function isCI(): boolean {
  return ciInfo.isCI || !process.stdout.isTTY;
}

/**
 * Require non-interactive mode or throw helpful error
 * Call this before prompting user for input
 *
 * @throws {Error} If in CI environment without non-interactive flag
 */
export function requireNonInteractive(): void {
  if (isCI()) {
    const ciName = ciInfo.name || 'non-TTY';
    const error = new Error(
      `Interactive prompts not available in CI environment\n` +
      `  Detected: ${ciName}\n` +
      `  Fix: Add --yes flag to use defaults\n` +
      `  Example: datagvat-mcp init --yes`
    );
    error.name = 'CIEnvironmentError';
    throw error;
  }
}
