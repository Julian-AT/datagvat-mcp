#!/usr/bin/env node
import { Command } from 'commander';
import { detectTools } from './detect';

const program = new Command();

program
  .name('datagvat-mcp')
  .description('CLI installer for data.gv.at MCP Server')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize data.gv.at MCP Server in AI tools')
  .action(async () => {
    const result = await detectTools();
    console.log('Platform:', result.platform);
    console.log('Detected tools:');
    for (const tool of result.tools) {
      console.log(`  - ${tool.name}: ${tool.detected ? 'detected' : 'not detected'}`);
      console.log(`    Path: ${tool.configPath}`);
    }
  });

program.parse(process.argv);

// Re-export types for use in other modules
export type { DetectionResult, ToolInfo, ToolName, Platform } from './types';
