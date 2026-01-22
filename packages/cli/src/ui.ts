import chalk from 'chalk';
import ora, { type Ora } from 'ora';

/**
 * Create a spinner with the given text
 */
export function spinner(text: string): Ora {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots'
  });
}

/**
 * Display a success message with ✓ prefix
 */
export function success(message: string): void {
  console.log(chalk.green('✓') + ' ' + message);
}

/**
 * Display an error message with ✗ prefix
 */
export function error(message: string): void {
  console.log(chalk.red('✗') + ' ' + message);
}

/**
 * Display a warning message with ⚠ prefix
 */
export function warning(message: string): void {
  console.log(chalk.yellow('⚠') + ' ' + message);
}

/**
 * Display an info message with ℹ prefix
 */
export function info(message: string): void {
  console.log(chalk.cyan('ℹ') + ' ' + chalk.dim(message));
}

/**
 * Display dimmed (secondary) text
 */
export function dim(text: string): string {
  return chalk.dim(text);
}

/**
 * Display a bold text
 */
export function bold(text: string): string {
  return chalk.bold(text);
}

/**
 * Display text in cyan
 */
export function cyan(text: string): string {
  return chalk.cyan(text);
}

/**
 * Display a step indicator (e.g., "1/3")
 */
export function step(current: number, total: number, message: string): void {
  const indicator = chalk.cyan(`[${current}/${total}]`);
  console.log(`${indicator} ${message}`);
}

/**
 * Draw a beautiful box around content using box-drawing characters
 */
export function box(content: string, title?: string): void {
  const lines = content.split('\n');
  const maxLength = Math.max(
    ...lines.map(line => line.replace(/\u001b\[[0-9;]*m/g, '').length),
    title ? title.length + 2 : 0
  );

  const width = maxLength + 4; // padding
  const horizontal = '─'.repeat(width - 2);

  // Top border with optional title
  if (title) {
    const titleText = ` ${title} `;
    const titleLength = titleText.length;
    const leftPad = Math.floor((width - 2 - titleLength) / 2);
    const rightPad = width - 2 - titleLength - leftPad;
    console.log(chalk.dim('┌') + chalk.dim('─'.repeat(leftPad)) + chalk.cyan.bold(titleText) + chalk.dim('─'.repeat(rightPad)) + chalk.dim('┐'));
  } else {
    console.log(chalk.dim('┌' + horizontal + '┐'));
  }

  // Content lines
  for (const line of lines) {
    const plainLine = line.replace(/\u001b\[[0-9;]*m/g, '');
    const padding = ' '.repeat(maxLength - plainLine.length + 2);
    console.log(chalk.dim('│') + '  ' + line + padding + chalk.dim('│'));
  }

  // Bottom border
  console.log(chalk.dim('└' + horizontal + '┘'));
}

/**
 * Display a beautiful header with box drawing
 */
export function header(text: string, subtitle?: string): void {
  console.log('');

  const content = subtitle
    ? `${chalk.bold.cyan(text)}\n${chalk.dim(subtitle)}`
    : chalk.bold.cyan(text);

  box(content);
  console.log('');
}

/**
 * Display a section separator
 */
export function separator(): void {
  console.log(chalk.dim('─'.repeat(50)));
}

/**
 * Display a list item with a bullet
 */
export function listItem(text: string, checked: boolean = false): void {
  const bullet = checked ? chalk.green('●') : chalk.dim('○');
  console.log(`  ${bullet} ${text}`);
}
