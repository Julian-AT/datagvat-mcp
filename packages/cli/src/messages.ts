import chalk from 'chalk';
import type { ToolName } from './types.js';
import * as ui from './ui.js';

/**
 * Get tool-specific restart instructions
 */
export function getRestartInstructions(tool: ToolName): string {
  switch (tool) {
    case 'claude-desktop':
      return 'Quit and restart Claude Desktop app (Cmd+Q on macOS, Alt+F4 on Windows)';
    case 'continue':
      return "Reload VS Code window (Cmd+Shift+P → 'Developer: Reload Window')";
    case 'cline':
      return "Reload VS Code window (Cmd+Shift+P → 'Developer: Reload Window')";
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
  ui.separator();
  console.log('');

  // Success box
  const successContent = `${chalk.green.bold('✓ Installation complete!')}\n\n${ui.dim('The data.gv.at MCP Server has been configured')}`;
  ui.box(successContent);

  console.log('');

  // Next steps section
  console.log(chalk.bold('Next Steps'));
  console.log('');

  // Step 1: Restart tools
  console.log(ui.cyan('1. Restart your tools'));
  console.log('');
  for (const tool of tools) {
    const instructions = getRestartInstructions(tool);
    console.log(`   ${chalk.bold(tool)}`);
    console.log(`   ${ui.dim('→')} ${instructions}`);
    console.log('');
  }

  // Step 2: Try example queries
  console.log(ui.cyan('2. Try these example queries'));
  console.log('');
  const examples = getExampleQueries();
  for (const example of examples) {
    console.log(`   ${ui.dim('○')} ${chalk.italic(example)}`);
  }
  console.log('');

  // Step 3: Learn more
  console.log(ui.cyan('3. Learn more'));
  console.log('');
  console.log(`   ${ui.dim('Documentation:')} ${chalk.cyan.underline('https://datagvat-mcp-docs.vercel.app')}`);
  console.log(`   ${ui.dim('Source code:  ')} ${chalk.cyan.underline('https://github.com/yourusername/datagvat-mcp')}`);
  console.log('');

  ui.separator();
  console.log('');
}
