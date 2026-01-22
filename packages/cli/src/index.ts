#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('datagvat-mcp')
  .description('CLI installer for data.gv.at MCP Server')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize data.gv.at MCP Server in AI tools')
  .action(() => {
    console.log('Init command');
  });

program.parse(process.argv);

// Export types for use in other modules
export interface DetectionResult {
  tools: ToolInfo[];
  platform: Platform;
}

export interface ToolInfo {
  name: ToolName;
  configPath: string;
  detected: boolean;
}

export type ToolName = 'claude-desktop' | 'continue' | 'cline';
export type Platform = 'darwin' | 'win32' | 'linux';
