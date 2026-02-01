import { NextRequest, NextResponse } from 'next/server';
import { getMessages } from '@/app/actions/messages';
import { z } from 'zod';

const querySchema = z.object({
  cursor: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
});

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ conversationId: string }> }
) {
  try {
    const params = await props.params;
    const conversationId = parseInt(params.conversationId);
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { cursor, limit } = querySchema.parse(searchParams);

    const result = await getMessages(conversationId, cursor, limit);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
