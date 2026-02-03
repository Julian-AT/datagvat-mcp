import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import type { ChatMessage } from '@/lib/types';
import { generateUUID } from '@/lib/utils';

type Session = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

type OpenSandboxProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const openSandbox = ({ session, dataStream }: OpenSandboxProps) =>
  tool({
    description:
      'Open an interactive Python sandbox for code execution, data analysis, charts, or any Python programming task. Use this whenever the user asks to run code, create visualizations, or work with data programmatically.',
    needsApproval: false, // Approval happens at execution time, not sandbox creation
    inputSchema: z.object({
      title: z.string().describe('Short descriptive title for the sandbox'),
      initialCode: z
        .string()
        .optional()
        .describe('Initial Python code to populate the editor'),
    }),
    execute: async ({ title, initialCode }) => {
      if (!session.user?.id) {
        return {
          error: 'Unauthorized: You must be logged in to open sandboxes',
        };
      }

      const sandboxId = generateUUID();

      // Stream artifact metadata to client
      dataStream.write({ type: 'data-kind', data: 'sandbox', transient: true });
      dataStream.write({ type: 'data-id', data: sandboxId, transient: true });
      dataStream.write({ type: 'data-title', data: title, transient: true });
      dataStream.write({ type: 'data-clear', data: null, transient: true });

      // Initialize sandbox with code if provided
      if (initialCode) {
        dataStream.write({
          type: 'data-code',
          data: initialCode,
          transient: true,
        });
      }

      dataStream.write({ type: 'data-finish', data: null, transient: true });

      return {
        sandboxId,
        title,
        message: 'Sandbox opened - user can edit code and run when ready',
      };
    },
  });
