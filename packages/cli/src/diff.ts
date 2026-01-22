import { diffLines, type Change } from 'diff';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { isCI } from './ci.js';

/**
 * Generate line-level diff between two strings
 */
export function generateDiff(oldContent: string, newContent: string): Change[] {
  return diffLines(oldContent, newContent);
}

/**
 * Display colored diff to console
 * - Added lines: green with "+" prefix
 * - Removed lines: red with "-" prefix
 * - Unchanged lines: dim gray with " " prefix
 */
export function displayDiff(diff: Change[]): void {
  console.log(''); // Empty line before diff

  for (const change of diff) {
    const lines = change.value.split('\n');

    // Remove trailing empty line from split
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    for (const line of lines) {
      if (change.added) {
        console.log(chalk.green('+ ') + chalk.green(line));
      } else if (change.removed) {
        console.log(chalk.red('- ') + chalk.red(line));
      } else {
        console.log(chalk.dim('  ') + chalk.dim(line));
      }
    }
  }

  console.log(''); // Empty line after diff
}

/**
 * Preview configuration update with diff display and user confirmation
 * Returns true if user approves (or in non-interactive mode with --yes)
 */
export async function previewConfigUpdate(
  oldConfig: string,
  newConfig: string,
  options?: { yes?: boolean }
): Promise<boolean> {
  const diff = generateDiff(oldConfig, newConfig);

  // Check for empty diff
  const hasChanges = diff.some(d => d.added || d.removed);
  if (!hasChanges) {
    console.log('');
    console.log(chalk.dim('No changes detected'));
    console.log('');
    return false;
  }

  // Check for very large diffs
  const lineCount = diff.reduce((count, change) => {
    return count + change.value.split('\n').length - 1;
  }, 0);

  if (lineCount > 50) {
    console.log('');
    console.log(chalk.yellow(`⚠ Large diff: ${lineCount} lines`));
  }

  // Display header
  console.log('');
  console.log(chalk.bold('Configuration changes:'));

  // Display diff
  displayDiff(diff);

  // Handle non-interactive mode
  if (isCI() || options?.yes) {
    console.log(chalk.dim('Non-interactive mode: applying changes'));
    console.log('');
    return true;
  }

  // Prompt for confirmation
  try {
    const approved = await confirm({
      message: 'Apply these changes?',
      default: true
    });
    console.log('');
    return approved;
  } catch (err) {
    // Handle Ctrl+C or prompt cancellation
    console.log('');
    return false;
  }
}
