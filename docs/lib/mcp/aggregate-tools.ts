import { tool } from 'ai';
import { z } from 'zod/v4';
import { createDataGvatClient } from './datagvat-client';
import { createE2BClient } from './e2b-client';

export async function getAvailableTools() {
  const tools: Record<string, any> = {};

  try {
    const dataGvatClient = await createDataGvatClient(
      process.env.DATAGVAT_MCP_URL || ''
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
      description: 'Execute Python code in isolated E2B sandbox',
      inputSchema: z.object({
        code: z.string().describe('Python code to execute'),
      }),
      execute: async ({ code }: { code: string }) => {
        const sandbox = await e2bClient.createSandbox();
        try {
          const result = await sandbox.runCode(code);
          return {
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
        error: 'Code execution sandbox is temporarily unavailable. Only dataset search is available.',
      }),
    });
  }

  return tools;
}
