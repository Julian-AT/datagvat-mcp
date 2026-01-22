import chalk from 'chalk';
import ora, { type Ora } from 'ora';

/**
 * Create a spinner with the given text
 */
export function spinner(text: string): Ora {
  return ora(text);
}

/**
 * Display a success message with ✓ prefix
 */
export function success(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Display an error message with ✗ prefix
 */
export function error(message: string): void {
  console.log(chalk.red(`✗ ${message}`));
}

/**
 * Display a warning message with ⚠ prefix
 */
export function warning(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

/**
 * Display an info message with ℹ prefix
 */
export function info(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`));
}

/**
 * Display a bold cyan header
 */
export function header(text: string): void {
  console.log(chalk.bold.cyan(text));
}
