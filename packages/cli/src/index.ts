#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { updateCommand } from './commands/update.js';
import { doctorCommand } from './commands/doctor.js';

const program = new Command();

program
  .name('datagvat-mcp')
  .description('shadcn-like installer for data.gv.at MCP Server')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize data.gv.at MCP Server in AI tools')
  .option('--yes', 'skip prompts and configure all detected tools')
  .option('--tool <name>', 'configure specific tool only')
  .action(initCommand);

program
  .command('add <tool>')
  .description('Add data.gv.at MCP Server to specific tool')
  .action((tool: string) => initCommand({ tool }));

program
  .command('update')
  .description('Update data.gv.at MCP Server configuration')
  .option('--yes', 'skip diff preview and apply all updates')
  .option('--tool <name>', 'update specific tool only')
  .action(updateCommand);

program
  .command('doctor')
  .description('Check configuration health and diagnose issues')
  .option('--fix', 'attempt automatic fixes (show instructions)')
  .action(doctorCommand);

// Handle uncaught errors with professional error messages
process.on('unhandledRejection', (error: Error) => {
  console.error('\nUnexpected error:', error.message);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('\nUnexpected error:', error.message);
  process.exit(1);
});

program.parse(process.argv);

// Re-export types for use in other modules
export type { DetectionResult, ToolInfo, ToolName, Platform } from './types.js';
