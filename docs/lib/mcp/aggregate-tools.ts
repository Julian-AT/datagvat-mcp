import { tool } from 'ai';
import { z } from 'zod/v4';
import { uploadImageFromBase64, uploadVisualization } from '@/lib/blob';
import { createDataGvatClient } from './datagvat-client';
import { createE2BClient } from './e2b-client';
import type { ProjectFile } from './types';

export async function getAvailableTools(chatId?: string) {
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
      needsApproval: true,
      inputSchema: z.object({
        code: z.string().describe('Python code to execute'),
        files: z
          .array(
            z.object({
              path: z
                .string()
                .describe(
                  'File path relative to /home/user (e.g., utils.py or mypackage/helpers.py)'
                ),
              content: z.string().describe('File content'),
            })
          )
          .optional()
          .describe(
            'Additional files for multi-file projects. Files are written before code execution.'
          ),
        workingDirectory: z
          .string()
          .optional()
          .describe('Working directory for imports (default: /home/user)'),
      }),
      execute: async ({ code, files, workingDirectory }) => {
        console.log('[DEBUG] execute-python execute() called - THIS SHOULD ONLY HAPPEN AFTER APPROVAL');
        console.log('[DEBUG] Code length:', code?.length || 0);
        console.log('[DEBUG] Files count:', files?.length || 0);

        if (!chatId) {
          return {
            success: false,
            error: {
              name: 'ConfigurationError',
              message: 'Chat ID required for visualization upload',
            },
          };
        }

        const sandbox = await e2bClient.createSandbox();
        try {
          const result = await sandbox.runCode(code, {
            timeoutMs: 30 * 1000,
            files: files?.map((f) => ({ path: f.path, content: f.content })),
            workingDirectory,
          });

          if (result.error?.isTimeout) {
            result.error.message +=
              '\n\nCode execution exceeded 30-second limit. Consider:\n- Breaking into smaller chunks\n- Reducing dataset size\n- Optimizing loops or vectorizing operations';
          }

          // If visualizations exist, upload immediately
          if (result.visualizations && result.visualizations.length > 0) {
            const uploadedViz = await Promise.all(
              result.visualizations.map(async (viz, index) => {
                const urls: { format: string; url: string }[] = [];

                // Upload PNG if present
                if (viz.png) {
                  const url = await uploadImageFromBase64(
                    viz.png,
                    `viz-${Date.now()}-${index}.png`,
                    chatId
                  );
                  urls.push({ format: 'png', url });
                }

                // Upload SVG if present
                if (viz.svg) {
                  const url = await uploadImageFromBase64(
                    viz.svg,
                    `viz-${Date.now()}-${index}.svg`,
                    chatId
                  );
                  urls.push({ format: 'svg', url });
                }

                // Upload HTML if present
                if (viz.html) {
                  const url = await uploadVisualization(
                    viz.html,
                    `viz-${Date.now()}-${index}.html`,
                    chatId,
                    'text/html'
                  );
                  urls.push({ format: 'html', url });
                }

                return urls;
              })
            );

            // Flatten array of arrays
            const allUrls = uploadedViz.flat();

            return {
              success: true,
              text: result.text,
              logs: result.logs,
              visualizations: allUrls, // URLs only, no base64
            };
          }

          return {
            success: result.success,
            text: result.text,
            error: result.error,
            logs: result.logs,
          };
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
        error:
          'Code execution sandbox is temporarily unavailable. Only dataset search is available.',
      }),
    });
  }

  return tools;
}
