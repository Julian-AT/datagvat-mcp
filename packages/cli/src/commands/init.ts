import { checkbox } from '@inquirer/prompts';
import { detectTools } from '../detect';
import { configureTools } from '../configure';
import { displayPostInstall } from '../messages';
import * as ui from '../ui';
import type { ToolInfo, ToolName } from '../types';

interface InitCommandOptions {
  yes?: boolean;
  tool?: string;
}

export async function initCommand(options: InitCommandOptions = {}): Promise<void> {
  try {
    // Display header
    ui.header('\ndata.gv.at MCP Installer\n');

    // Start detection spinner
    const detectionSpinner = ui.spinner('Detecting AI tools...').start();
    const result = await detectTools();
    detectionSpinner.stop();

    // Filter to only detected tools
    const detectedTools = result.tools.filter(tool => tool.detected);

    // Handle no tools detected
    if (detectedTools.length === 0) {
      ui.warning('No AI tools detected on this system.');
      console.log('\nSupported tools:');
      console.log('  - Claude Desktop: https://claude.ai/download');
      console.log('  - Continue: https://continue.dev');
      console.log('  - Cline: https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev');
      console.log('\nInstall one of these tools and run the installer again.');
      return;
    }

    ui.success(`Found ${detectedTools.length} tool(s): ${detectedTools.map(t => t.name).join(', ')}`);

    let toolsToConfigureList: ToolInfo[];

    // Handle --tool flag
    if (options.tool) {
      const specificTool = detectedTools.find(t => t.name === options.tool);
      if (!specificTool) {
        ui.error(`Tool '${options.tool}' not detected on this system.`);
        ui.info('Detected tools: ' + detectedTools.map(t => t.name).join(', '));
        process.exit(1);
      }
      toolsToConfigureList = [specificTool];
      ui.info(`Configuring specific tool: ${options.tool}`);
    }
    // Handle --yes flag
    else if (options.yes) {
      toolsToConfigureList = detectedTools;
      ui.info('Configuring all detected tools (--yes flag)');
    }
    // Interactive checkbox selection
    else {
      const choices = detectedTools.map(tool => ({
        name: `${tool.name} (${tool.configPath})`,
        value: tool.name,
        checked: true // All checked by default
      }));

      const selectedToolNames = await checkbox({
        message: 'Select tools to configure:',
        choices,
        required: true
      });

      toolsToConfigureList = detectedTools.filter(tool =>
        selectedToolNames.includes(tool.name)
      );
    }

    // Configure selected tools
    console.log('\nConfiguring tools...');
    const configResult = await configureTools(toolsToConfigureList);

    // Display summary
    console.log('');
    if (configResult.configured > 0) {
      ui.success(`Configured ${configResult.configured} tool(s)`);
    }
    if (configResult.skipped > 0) {
      ui.info(`Skipped ${configResult.skipped} tool(s) (already configured)`);
    }
    if (configResult.failed > 0) {
      ui.error(`Failed to configure ${configResult.failed} tool(s)`);
    }

    // Display post-install guidance if at least one tool was configured
    if (configResult.configured > 0) {
      const configuredToolNames = toolsToConfigureList.map(tool => tool.name);
      displayPostInstall(configuredToolNames);
    }

  } catch (err) {
    if (err instanceof Error) {
      // Handle Ctrl+C gracefully
      if (err.name === 'ExitPromptError') {
        console.log('\n');
        ui.warning('Installation cancelled.');
        process.exit(0);
      }
      ui.error(`Installation failed: ${err.message}`);
    } else {
      ui.error('Installation failed with unknown error');
    }
    process.exit(1);
  }
}
