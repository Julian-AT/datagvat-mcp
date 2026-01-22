import * as fs from 'node:fs/promises';
import { detectTools } from '../detect.js';
import * as ui from '../ui.js';
import { execa } from 'execa';

interface DoctorCommandOptions {
  fix?: boolean;
}

interface HealthCheck {
  name: string;
  severity: 'error' | 'warning' | 'info';
  check: () => Promise<{
    ok: boolean;
    message: string;
    fix?: string;
  }>;
}

export async function doctorCommand(options: DoctorCommandOptions = {}): Promise<void> {
  try {
    // Display header
    ui.header(
      'Health Check',
      'Diagnose data.gv.at MCP Server configuration'
    );

    // Define health checks
    const checks: HealthCheck[] = [
      {
        name: 'Config files exist',
        severity: 'error',
        check: async () => {
          const result = await detectTools();
          const configuredTools = [];
          const missingTools = [];

          for (const tool of result.tools) {
            if (tool.detected) {
              try {
                await fs.access(tool.configPath);
                configuredTools.push(tool.name);
              } catch {
                missingTools.push(tool.name);
              }
            }
          }

          if (missingTools.length > 0) {
            return {
              ok: false,
              message: `Config files missing for: ${missingTools.join(', ')}`,
              fix: 'Run: datagvat-mcp init'
            };
          }

          if (configuredTools.length === 0) {
            return {
              ok: false,
              message: 'No config files found',
              fix: 'Run: datagvat-mcp init'
            };
          }

          return {
            ok: true,
            message: `Config files exist for ${configuredTools.length} tool(s)`
          };
        }
      },

      {
        name: 'Config files are valid JSON',
        severity: 'error',
        check: async () => {
          const result = await detectTools();
          const invalidTools = [];

          for (const tool of result.tools) {
            if (tool.detected) {
              try {
                const content = await fs.readFile(tool.configPath, 'utf-8');
                JSON.parse(content);
              } catch (err) {
                if (err instanceof SyntaxError) {
                  invalidTools.push(tool.name);
                }
                // Ignore missing files (handled by previous check)
              }
            }
          }

          if (invalidTools.length > 0) {
            const toolName = invalidTools[0];
            return {
              ok: false,
              message: `Invalid JSON in config for: ${invalidTools.join(', ')}`,
              fix: `Manually fix JSON syntax or run: datagvat-mcp init --tool ${toolName}`
            };
          }

          return {
            ok: true,
            message: 'All config files are valid JSON'
          };
        }
      },

      {
        name: 'MCP server entry exists',
        severity: 'error',
        check: async () => {
          const result = await detectTools();
          const missingEntry = [];

          for (const tool of result.tools) {
            if (tool.detected) {
              try {
                const content = await fs.readFile(tool.configPath, 'utf-8');
                const config = JSON.parse(content);

                if (!config.mcpServers || !('datagvat' in config.mcpServers)) {
                  missingEntry.push(tool.name);
                }
              } catch {
                // Ignore errors (handled by previous checks)
              }
            }
          }

          if (missingEntry.length > 0) {
            const toolName = missingEntry[0];
            return {
              ok: false,
              message: `MCP server entry missing for: ${missingEntry.join(', ')}`,
              fix: `Run: datagvat-mcp init --tool ${toolName}`
            };
          }

          return {
            ok: true,
            message: 'MCP server entry exists in all configs'
          };
        }
      },

      {
        name: 'MCP server path is valid',
        severity: 'warning',
        check: async () => {
          const result = await detectTools();
          const invalidPaths = [];

          for (const tool of result.tools) {
            if (tool.detected) {
              try {
                const content = await fs.readFile(tool.configPath, 'utf-8');
                const config = JSON.parse(content);

                if (config.mcpServers && 'datagvat' in config.mcpServers) {
                  const mcpConfig = config.mcpServers.datagvat;
                  const command = mcpConfig.command;

                  // For npx, we don't check the path (it's a package manager command)
                  if (command === 'npx' || command === 'npm' || command === 'bunx') {
                    continue;
                  }

                  // For absolute paths, check if file exists
                  try {
                    await fs.access(command);
                  } catch {
                    invalidPaths.push(`${tool.name}: ${command}`);
                  }
                }
              } catch {
                // Ignore errors (handled by previous checks)
              }
            }
          }

          if (invalidPaths.length > 0) {
            return {
              ok: false,
              message: `Invalid MCP server paths: ${invalidPaths.join(', ')}`,
              fix: 'Update path in config or reinstall MCP server'
            };
          }

          return {
            ok: true,
            message: 'MCP server paths are valid'
          };
        }
      },

      {
        name: 'Node.js is available',
        severity: 'error',
        check: async () => {
          try {
            const { stdout } = await execa('node', ['--version']);
            return {
              ok: true,
              message: `Node.js ${stdout.trim()} is installed`
            };
          } catch {
            return {
              ok: false,
              message: 'Node.js not found',
              fix: 'Install Node.js 18+ from https://nodejs.org'
            };
          }
        }
      },

      {
        name: 'Python is available',
        severity: 'warning',
        check: async () => {
          // Try python3 first, then python
          try {
            const { stdout } = await execa('python3', ['--version']);
            return {
              ok: true,
              message: `Python ${stdout.trim().replace('Python ', '')} is installed`
            };
          } catch {
            try {
              const { stdout } = await execa('python', ['--version']);
              return {
                ok: true,
                message: `Python ${stdout.trim().replace('Python ', '')} is installed`
              };
            } catch {
              return {
                ok: false,
                message: 'Python not found',
                fix: 'Install Python 3.11+ for MCP server'
              };
            }
          }
        }
      },

      {
        name: 'uv is available',
        severity: 'info',
        check: async () => {
          try {
            const { stdout } = await execa('uv', ['--version']);
            return {
              ok: true,
              message: `uv ${stdout.trim().replace('uv ', '')} is installed`
            };
          } catch {
            return {
              ok: false,
              message: 'uv not found (optional)',
              fix: 'Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh'
            };
          }
        }
      }
    ];

    console.log(ui.dim(`Running ${checks.length} health checks...`));
    console.log('');

    // Run checks
    let errorCount = 0;
    let warningCount = 0;

    for (const healthCheck of checks) {
      const spinner = ui.spinner(`  ${healthCheck.name}`).start();

      try {
        const result = await healthCheck.check();

        if (result.ok) {
          spinner.succeed(result.message);
        } else {
          if (healthCheck.severity === 'error') {
            spinner.fail(result.message);
            errorCount++;
          } else if (healthCheck.severity === 'warning') {
            spinner.warn(result.message);
            warningCount++;
          } else {
            spinner.info(result.message);
          }

          if (result.fix) {
            console.log(ui.dim('  → Fix: ') + result.fix);
          }
        }
      } catch (err) {
        spinner.fail('Check failed with error');
        if (err instanceof Error) {
          console.log(ui.dim('  → Error: ') + err.message);
        }
        errorCount++;
      }
    }

    // Display summary
    console.log('');
    if (errorCount === 0 && warningCount === 0) {
      ui.success('All checks passed');
      console.log('');
      process.exit(0);
    } else if (errorCount > 0) {
      ui.error(`${errorCount} critical issue(s) found`);
      if (warningCount > 0) {
        ui.warning(`${warningCount} warning(s) found`);
      }
      console.log('');
      process.exit(1);
    } else {
      ui.warning(`${warningCount} warning(s) found`);
      console.log('');
      process.exit(0);
    }

  } catch (err) {
    if (err instanceof Error) {
      console.log(ui.formatError(err));
    } else {
      console.log('');
      ui.error('Health check failed with unknown error');
      console.log('');
    }
    process.exit(1);
  }
}
