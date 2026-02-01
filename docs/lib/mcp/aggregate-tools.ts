import { tool } from 'ai';
import { z } from 'zod/v4';
import { createDataGvatClient } from './datagvat-client';
import { createE2BClient } from './e2b-client';
import type { ProjectFile } from './types';

export async function getAvailableTools() {
  const tools: Record<string, any> = {};

  try {
    const dataGvatClient = await createDataGvatClient(
      process.env.DATAGVAT_MCP_URL || '',
      process.env.DATAGVAT_MCP_BEARER_TOKEN
    );
    const dataGvatTools = await dataGvatClient.tools();
    Object.assign(tools, dataGvatTools);
  } catch (error) {
    console.warn('Data.gv.at MCP unavailable - dataset search disabled', error);
  }

  try {
    const e2bClient = createE2BClient({
      apiKey: process.env.E2B_API_KEY || '',
    });

    tools['execute-python'] = tool({
      description: `Execute Python code in isolated E2B sandbox with 30-second timeout.
Supports multi-file projects with imports. Pre-installed packages: pandas, matplotlib, seaborn, plotly, numpy.
Use 'files' parameter for multi-file projects with proper directory structure.`,
      inputSchema: z.object({
        code: z.string().describe('Python code to execute'),
        files: z.array(z.object({
          path: z.string().describe('File path relative to /home/user (e.g., utils.py or mypackage/helpers.py)'),
          content: z.string().describe('File content'),
        })).optional().describe('Additional files for multi-file projects. Files are written before code execution.'),
        workingDirectory: z.string().optional().describe('Working directory for imports (default: /home/user)'),
      }),
      execute: async ({ code, files, workingDirectory }) => {
        const sandbox = await e2bClient.createSandbox();
        try {
          const result = await sandbox.runCode(code, {
            timeoutMs: 30 * 1000,
            files: files?.map(f => ({ path: f.path, content: f.content })),
            workingDirectory,
          });

          if (result.error?.isTimeout) {
            result.error.message += '\n\nCode execution exceeded 30-second limit. Consider:\n- Breaking into smaller chunks\n- Reducing dataset size\n- Optimizing loops or vectorizing operations';
          }

          return result;
        } finally {
          await sandbox.kill();
        }
      },
    });
  } catch (error) {
    console.warn('E2B unavailable - code execution disabled', error);

    tools['execute-python-unavailable'] = tool({
      description: 'Code execution unavailable',
      inputSchema: z.object({}),
      execute: async () => ({
        error: 'Code execution sandbox is temporarily unavailable. Only dataset search is available.',
      }),
    });
  }

  return tools;
}
