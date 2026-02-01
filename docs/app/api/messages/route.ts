import { NextRequest, NextResponse } from 'next/server';
import { createMessage } from '@/app/actions/messages';
import { z } from 'zod';

const createMessageSchema = z.object({
  conversationId: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(z.unknown()),
  executionStatus: z.string().optional(),
  sandboxId: z.string().optional(),
  mcpSource: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createMessageSchema.parse(body);

    const message = await createMessage(
      validated.conversationId,
      validated.role,
      validated.parts as any,
      {
        executionStatus: validated.executionStatus,
        sandboxId: validated.sandboxId,
        mcpSource: validated.mcpSource,
        metadata: validated.metadata,
      }
    );

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
