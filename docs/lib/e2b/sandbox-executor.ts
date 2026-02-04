import { Sandbox } from '@e2b/code-interpreter';
import { uploadImageFromBase64, uploadHtml } from '@/lib/blob';

const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour sandbox lifetime
const EXECUTION_TIMEOUT_MS = 30 * 1000; // 30 second execution timeout (E2B-05 requirement)

export type ExecutionOutput = {
  type: 'stdout' | 'stderr' | 'visualization';
  content: string;
  timestamp: string;
};

export type ExecutionResult = {
  success: boolean;
  outputs: ExecutionOutput[];
  error?: string;
  e2bSandboxId?: string;
};

/**
 * Execute Python code in E2B sandbox with streaming output and visualization upload.
 *
 * Key features:
 * - Reuses existing sandbox via e2bSandboxId (RESEARCH.md Pitfall 3)
 * - Streams output via onStdout/onStderr callbacks
 * - 30-second execution timeout (E2B-05 requirement)
 * - Uploads visualizations to Vercel Blob (VIZ-03 requirement)
 * - Persistent workspace model (doesn't kill sandbox after execution)
 */
export async function executeSandboxCode({
  code,
  e2bSandboxId,
  chatId,
  onOutput,
  template,
}: {
  code: string;
  e2bSandboxId?: string;
  chatId: string;
  onOutput?: (output: { type: string; content: string }) => void;
  template?: 'python' | 'react' | 'node';
}): Promise<ExecutionResult> {
  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;
  const outputs: ExecutionOutput[] = [];

  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      outputs: [
        {
          type: 'stderr',
          content: 'Error: E2B_API_KEY not configured',
          timestamp: new Date().toISOString(),
        },
      ],
      error: 'E2B_API_KEY not configured',
    };
  }

  try {
    // Reuse existing sandbox or create new one (RESEARCH.md Pitfall 3)
    if (e2bSandboxId) {
      try {
        sandbox = await Sandbox.connect(e2bSandboxId, { apiKey });
      } catch {
        // Sandbox died or expired, create new one with correct template
        const options: any = { apiKey, timeoutMs: DEFAULT_TIMEOUT_MS };
        
        // Use standard 'base' template but we'll bootstrap it for React
        // Ideally we would use a custom template ID here if we built one
        sandbox = await Sandbox.create(options);
        
        // Fix for Kaleido/Plotly version mismatch (Plotly 6.0.1 requires Kaleido 0.2.1)
        if (template === 'python' || !template) {
          try {
            await sandbox.commands.run('pip install kaleido==0.2.1');
          } catch (err) {
            console.warn('Failed to install kaleido fix:', err);
          }
        }
      }
    } else {
      const options: any = { apiKey, timeoutMs: DEFAULT_TIMEOUT_MS };
      sandbox = await Sandbox.create(options);
      
      // Fix for Kaleido/Plotly version mismatch (Plotly 6.0.1 requires Kaleido 0.2.1)
      if (template === 'python' || !template) {
        try {
          await sandbox.commands.run('pip install kaleido==0.2.1');
        } catch (err) {
          console.warn('Failed to install kaleido fix:', err);
        }
      }
    }

    // --- REACT/NODE TEMPLATE BOOTSTRAP LOGIC ---
    if (template === 'react') {
      try {
        // Check if environment is already initialized
        const checkInit = await sandbox.commands.run('test -f package.json && echo "yes" || echo "no"');
        const isInitialized = checkInit.stdout.trim() === 'yes';

        if (!isInitialized) {
          console.log('Bootstrapping React environment...');
          // Bootstrap Vite project (this takes time, so we might want to inform user)
          // Using a faster setup sequence for runtime
          await sandbox.commands.run('npm create vite@latest . -- --template react-ts');
          await sandbox.commands.run('npm install');
          
          // Install Tailwind & dependencies
          await sandbox.commands.run('npm install -D tailwindcss postcss autoprefixer');
          await sandbox.commands.run('npx tailwindcss init -p');
          await sandbox.commands.run('npm install lucide-react class-variance-authority clsx tailwind-merge');

          // Configure Vite for E2B (host: 0.0.0.0 is critical)
          await sandbox.filesystem.write('vite.config.ts', `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      clientPort: 443
    }
  }
})`);
          
          // Setup Tailwind
          await sandbox.filesystem.write('tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`);

          await sandbox.filesystem.write('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;
`);
        }

        // Write the user's code to App.tsx
        if (code) {
          // If code contains multiple files (e.g. via markers), we could parse it here
          // For now, assume it's the main App component
          await sandbox.filesystem.write('src/App.tsx', code);
        }

        // Ensure dev server is running
        // Check if port 3000 is listening
        const checkPort = await sandbox.commands.run('lsof -i :3000 | grep LISTEN || echo "no"');
        if (checkPort.stdout.trim() === 'no') {
          console.log('Starting dev server...');
          // Start in background
          await sandbox.commands.run('npm run dev', { background: true });
          
          // Wait a bit for server to start
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Return the preview URL
        // E2B exposes ports via subdomains: <sandbox-id>-<port>.e2b.dev
        // In local/self-hosted it might vary, but standard is this pattern
        // The frontend constructs the URL, but we can return it explicitly
        const previewUrl = `https://${sandbox.sandboxId}-3000.use.e2b.dev`;
        
        outputs.push({
          type: 'stdout',
          content: `React app running. Preview available.`,
          timestamp: new Date().toISOString(),
        });
        
        // We can also push a special 'preview' output type if we want specific handling
        // but the frontend constructs the URL from sandboxId anyway.

      } catch (err: any) {
        console.error('React bootstrap failed:', err);
        outputs.push({
          type: 'stderr',
          content: `React environment setup failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }
    // --- END REACT LOGIC ---

    const stdoutLines: string[] = [];
    const stderrLines: string[] = [];

    const execution = await sandbox.runCode(code, {
      timeoutMs: EXECUTION_TIMEOUT_MS,
      onStdout: (output) => {
        // Skip spammy npm output if in React mode
        if (template === 'react' && (output.line.includes('npm') || output.line.includes('vite'))) {
          // optional: filter logs
        }
        
        const line = output.line;
        stdoutLines.push(line);
        const outputEntry = {
          type: 'stdout' as const,
          content: line,
          timestamp: new Date().toISOString(),
        };
        outputs.push(outputEntry);
        onOutput?.(outputEntry);
      },
      onStderr: (output) => {
        const line = output.line;
        stderrLines.push(line);
        const outputEntry = {
          type: 'stderr' as const,
          content: line,
          timestamp: new Date().toISOString(),
        };
        outputs.push(outputEntry);
        onOutput?.(outputEntry);
      },
    });

    // Handle execution errors
    if (execution.error) {
      let errorMessage = execution.error.value;
      if (execution.error.name === 'TimeoutError') {
        errorMessage +=
          '\n\nCode execution exceeded 30-second limit. Consider:\n- Breaking into smaller chunks\n- Reducing dataset size\n- Optimizing loops or vectorizing operations';
      }
      outputs.push({
        type: 'stderr',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      });
      onOutput?.({ type: 'stderr', content: `Error: ${errorMessage}` });
    }

    // Handle visualizations (upload to blob storage - VIZ-03 requirement)
    const visualizationResults = execution.results.filter(
      (r) => r.png || r.svg || r.html
    );

    if (visualizationResults.length > 0) {
      for (const viz of visualizationResults) {
        // Upload PNG if present (most common for matplotlib)
        if (viz.png) {
          try {
            const url = await uploadImageFromBase64(
              viz.png,
              `sandbox-viz-${Date.now()}.png`,
              chatId
            );

            const vizOutput = {
              type: 'visualization' as const,
              content: url,
              timestamp: new Date().toISOString(),
            };
            outputs.push(vizOutput);
            onOutput?.({ type: 'visualization', content: url });
          } catch (uploadError) {
            console.error('Failed to upload PNG visualization:', uploadError);
          }
        }

        // Upload SVG if present
        if (viz.svg) {
          try {
            const url = await uploadImageFromBase64(
              viz.svg,
              `sandbox-viz-${Date.now()}.svg`,
              chatId
            );

            const vizOutput = {
              type: 'visualization' as const,
              content: url,
              timestamp: new Date().toISOString(),
            };
            outputs.push(vizOutput);
            onOutput?.({ type: 'visualization', content: url });
          } catch (uploadError) {
            console.error('Failed to upload SVG visualization:', uploadError);
          }
        }

        // Upload HTML if present (interactive visualizations like plotly)
        if (viz.html) {
          try {
            const url = await uploadHtml(
              viz.html,
              `sandbox-viz-${Date.now()}.html`,
              chatId
            );

            const vizOutput = {
              type: 'visualization' as const,
              content: url,
              timestamp: new Date().toISOString(),
            };
            outputs.push(vizOutput);
            onOutput?.({ type: 'visualization', content: url });
          } catch (uploadError) {
            console.error('Failed to upload HTML visualization:', uploadError);
          }
        }
      }
    }

    return {
      success: !execution.error,
      outputs,
      e2bSandboxId: sandbox.sandboxId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown execution error';

    outputs.push({
      type: 'stderr',
      content: `Error: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      outputs,
      error: errorMessage,
      e2bSandboxId: sandbox?.sandboxId,
    };
  }
  // DON'T kill sandbox - reuse it (CONTEXT.md: persistent workspace model)
  // Sandbox cleanup happens when user closes artifact or after timeout (1 hour)
}
