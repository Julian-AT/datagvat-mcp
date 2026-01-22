import * as fs from 'node:fs/promises';
import { detectTools } from '../detect.js';
import { getMcpConfig } from '../templates.js';
import { previewConfigUpdate } from '../diff.js';
import * as ui from '../ui.js';
import type { ToolInfo } from '../types.js';
import { isCI, requireNonInteractive } from '../ci.js';
import { checkbox } from '@inquirer/prompts';

interface UpdateCommandOptions {
  yes?: boolean;
  tool?: string;
}

interface UpdateResult {
  updated: number;
  skipped: number;
  failed: number;
  failedTools: string[];
}

export async function updateCommand(options: UpdateCommandOptions = {}): Promise<void> {
  try {
    // Check CI environment before prompts
    if (!options.yes && isCI()) {
      requireNonInteractive();
    }

    // Display header
    ui.header(
      'Update Configuration',
      'Update data.gv.at MCP Server configuration'
    );

    // Step 1: Detect configured tools
    ui.step(1, 2, 'Detecting configured tools');
    console.log('');
    const detectionSpinner = ui.spinner('  Checking for existing configurations...').start();
    const result = await detectTools();
    detectionSpinner.stop();

    // Filter to tools that are both detected and have config files
    const configuredTools: ToolInfo[] = [];
    for (const tool of result.tools) {
      if (tool.detected) {
        try {
          // Check if config file actually exists
          await fs.access(tool.configPath);
          // Check if config has MCP server entry
          const content = await fs.readFile(tool.configPath, 'utf-8');
          const config = JSON.parse(content);
          if (config.mcpServers && 'datagvat' in config.mcpServers) {
            configuredTools.push(tool);
          }
        } catch {
          // Skip tools without valid config files
        }
      }
    }

    // Handle no configured tools
    if (configuredTools.length === 0) {
      console.log('');
      ui.error('No configured tools found');
      console.log('');
      console.log(ui.dim('Fix: Run the init command first'));
      console.log('  $ datagvat-mcp init');
      console.log('');
      process.exit(1);
    }

    ui.success(`Found ${configuredTools.length} configured tool(s)`);
    console.log('');
    for (const tool of configuredTools) {
      ui.listItem(`${ui.cyan(tool.name)} ${ui.dim('(' + tool.configPath + ')')}`, true);
    }
    console.log('');

    // Step 2: Select tools to update
    let toolsToUpdate: ToolInfo[];

    ui.step(2, 2, 'Select tools to update');
    console.log('');

    // Handle --tool flag
    if (options.tool) {
      const specificTool = configuredTools.find(t => t.name === options.tool);
      if (!specificTool) {
        ui.error(`Tool '${options.tool}' not found in configured tools`);
        ui.info('Configured tools: ' + configuredTools.map(t => t.name).join(', '));
        process.exit(1);
      }
      toolsToUpdate = [specificTool];
      ui.info(`Updating specific tool: ${ui.cyan(options.tool)}`);
    }
    // Handle --yes flag or CI mode
    else if (options.yes || isCI()) {
      toolsToUpdate = configuredTools;
      if (isCI() && !options.yes) {
        ui.info('Running in non-interactive mode (CI detected)');
      } else {
        ui.info('Updating all configured tools (--yes flag)');
      }
    }
    // Interactive checkbox selection
    else {
      const choices = configuredTools.map(tool => ({
        name: `${tool.name}  ${ui.dim(tool.configPath)}`,
        value: tool.name,
        checked: true
      }));

      const selectedToolNames = await checkbox({
        message: 'Which tools would you like to update?',
        choices,
        required: true
      });

      toolsToUpdate = configuredTools.filter(tool =>
        selectedToolNames.includes(tool.name)
      );
    }

    console.log('');

    // Step 3: Update each tool
    const updateResult: UpdateResult = {
      updated: 0,
      skipped: 0,
      failed: 0,
      failedTools: []
    };

    for (const tool of toolsToUpdate) {
      try {
        const wasUpdated = await updateTool(tool, options);
        if (wasUpdated) {
          updateResult.updated++;
        } else {
          updateResult.skipped++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        ui.error(`${tool.name}: Update failed - ${errorMessage}`);
        updateResult.failed++;
        updateResult.failedTools.push(tool.name);
      }
    }

    // Display summary
    console.log('');
    if (updateResult.updated > 0) {
      ui.success(`Updated ${updateResult.updated} tool(s)`);
    }
    if (updateResult.skipped > 0) {
      ui.info(`Skipped ${updateResult.skipped} tool(s) (no changes or cancelled)`);
    }
    if (updateResult.failed > 0) {
      ui.error(`Failed to update ${updateResult.failed} tool(s): ${updateResult.failedTools.join(', ')}`);
      process.exit(1);
    }
    console.log('');

  } catch (err) {
    if (err instanceof Error) {
      // Handle Ctrl+C gracefully
      if (err.name === 'ExitPromptError') {
        console.log('');
        ui.warning('Update cancelled');
        console.log('');
        process.exit(0);
      }

      // Handle all other errors with formatted output
      console.log(ui.formatError(err));
    } else {
      console.log('');
      ui.error('Update failed with unknown error');
      console.log('');
    }
    process.exit(1);
  }
}

/**
 * Update a single tool's configuration
 * Returns true if updated, false if skipped or cancelled
 */
async function updateTool(tool: ToolInfo, options: UpdateCommandOptions): Promise<boolean> {
  const { configPath } = tool;

  // Read current config
  let oldConfig: string;
  let currentConfigObj: any;

  try {
    oldConfig = await fs.readFile(configPath, 'utf-8');
    currentConfigObj = JSON.parse(oldConfig);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      throw new Error(`Config file not found: ${configPath}`);
    } else if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${configPath}. Fix syntax or run: datagvat-mcp init --tool ${tool.name}`);
    } else if (err instanceof Error && 'code' in err && err.code === 'EACCES') {
      throw new Error(`Permission denied reading config: ${configPath}. Check file permissions.`);
    }
    throw err;
  }

  // Generate new config
  const newConfigObj = { ...currentConfigObj };
  if (!newConfigObj.mcpServers) {
    newConfigObj.mcpServers = {};
  }
  newConfigObj.mcpServers.datagvat = getMcpConfig();

  const newConfig = JSON.stringify(newConfigObj, null, 2) + '\n';

  // Preview changes and get user approval
  const approved = await previewConfigUpdate(oldConfig, newConfig, { yes: options.yes });

  if (!approved) {
    return false; // User cancelled or no changes
  }

  // Write new config
  try {
    await fs.writeFile(configPath, newConfig, 'utf-8');
    ui.success(`${tool.name}: Updated configuration at ${configPath}`);
    return true;
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'EACCES') {
      throw new Error(`Permission denied writing config: ${configPath}. Check file permissions or run with administrator/sudo privileges.`);
    }
    throw err;
  }
}
