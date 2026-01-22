import { checkbox } from '@inquirer/prompts';
import { detectTools } from '../detect.js';
import { configureTools } from '../configure.js';
import { displayPostInstall } from '../messages.js';
import * as ui from '../ui.js';
import type { ToolInfo, ToolName } from '../types.js';

interface InitCommandOptions {
  yes?: boolean;
  tool?: string;
}

export async function initCommand(options: InitCommandOptions = {}): Promise<void> {
  try {
    // Display header
    ui.header(
      'data.gv.at MCP Installer',
      'One-command setup for Austrian Open Data MCP Server'
    );

    // Step 1: Tool detection
    ui.step(1, 3, 'Scanning for AI tools');
    console.log('');
    const detectionSpinner = ui.spinner('  Checking for Claude Desktop, Continue, and Cline...').start();
    const result = await detectTools();
    detectionSpinner.stop();

    // Filter to only detected tools
    const detectedTools = result.tools.filter(tool => tool.detected);

    // Handle no tools detected
    if (detectedTools.length === 0) {
      console.log('');
      ui.warning('No AI tools detected on this system');
      console.log('');
      console.log(ui.dim('Supported tools:'));
      ui.listItem('Claude Desktop: https://claude.ai/download');
      ui.listItem('Continue: https://continue.dev');
      ui.listItem('Cline: https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev');
      console.log('');
      console.log(ui.dim('Install one of these tools and run the installer again.'));
      console.log('');
      return;
    }

    ui.success(`Found ${detectedTools.length} tool(s)`);
    console.log('');
    for (const tool of detectedTools) {
      ui.listItem(`${ui.cyan(tool.name)} ${ui.dim('(' + tool.configPath + ')')}`, true);
    }
    console.log('');

    let toolsToConfigureList: ToolInfo[];

    // Step 2: Tool selection
    ui.step(2, 3, 'Select tools to configure');
    console.log('');

    // Handle --tool flag
    if (options.tool) {
      const specificTool = detectedTools.find(t => t.name === options.tool);
      if (!specificTool) {
        ui.error(`Tool '${options.tool}' not detected on this system`);
        ui.info('Detected tools: ' + detectedTools.map(t => t.name).join(', '));
        process.exit(1);
      }
      toolsToConfigureList = [specificTool];
      ui.info(`Configuring specific tool: ${ui.cyan(options.tool)}`);
    }
    // Handle --yes flag
    else if (options.yes) {
      toolsToConfigureList = detectedTools;
      ui.info('Configuring all detected tools (--yes flag)');
    }
    // Interactive checkbox selection
    else {
      const choices = detectedTools.map(tool => ({
        name: `${tool.name}  ${ui.dim(tool.configPath)}`,
        value: tool.name,
        checked: true // All checked by default
      }));

      const selectedToolNames = await checkbox({
        message: 'Which tools would you like to configure?',
        choices,
        required: true
      });

      toolsToConfigureList = detectedTools.filter(tool =>
        selectedToolNames.includes(tool.name)
      );
    }

    console.log('');

    // Step 3: Configuration
    ui.step(3, 3, 'Writing configuration');
    console.log('');
    const configSpinner = ui.spinner('  Updating configuration files...').start();
    const configResult = await configureTools(toolsToConfigureList);
    configSpinner.stop();

    // Display summary
    console.log('');
    if (configResult.configured > 0) {
      ui.success(`Configured ${configResult.configured} tool(s) successfully`);
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
        console.log('');
        ui.warning('Installation cancelled');
        console.log('');
        process.exit(0);
      }
      console.log('');
      ui.error(`Installation failed: ${err.message}`);
      console.log('');
    } else {
      console.log('');
      ui.error('Installation failed with unknown error');
      console.log('');
    }
    process.exit(1);
  }
}
