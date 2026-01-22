import chalk from 'chalk';
import type { ToolName } from './types.js';

/**
 * Get tool-specific restart instructions
 */
export function getRestartInstructions(tool: ToolName): string {
  switch (tool) {
    case 'claude-desktop':
      return 'Quit and restart Claude Desktop app (Cmd+Q on macOS, Alt+F4 on Windows)';
    case 'continue':
      return "Reload VS Code window (Cmd+Shift+P -> 'Developer: Reload Window')";
    case 'cline':
      return "Reload VS Code window (Cmd+Shift+P -> 'Developer: Reload Window')";
  }
}

/**
 * Get example queries users can try
 */
export function getExampleQueries(): string[] {
  return [
    'Find datasets about Vienna population',
    'Show me datasets with quality score above 80',
    'What health-related datasets are available?',
    'Search for datasets about air quality in Austria'
  ];
}

/**
 * Display post-install guidance with restart instructions and example queries
 */
export function displayPostInstall(tools: ToolName[]): void {
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log('');

  // Show restart instructions for each tool
  console.log(chalk.bold('1. Restart your tools:'));
  for (const tool of tools) {
    const instructions = getRestartInstructions(tool);
    console.log(`   ${chalk.cyan(tool)}: ${instructions}`);
  }

  // Show example queries
  console.log('');
  console.log(chalk.bold('2. Try these queries:'));
  const examples = getExampleQueries();
  for (const example of examples) {
    console.log(chalk.gray(`   - "${example}"`));
  }

  // Show documentation link
  console.log('');
  console.log(chalk.bold('3. Learn more:'));
  console.log(`   Documentation: ${chalk.cyan('https://datagvat-mcp-docs.vercel.app')}`);
  console.log('');
}
