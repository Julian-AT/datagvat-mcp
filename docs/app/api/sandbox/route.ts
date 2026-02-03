import { auth } from '@/lib/auth';
import { getSandboxState, saveSandboxState } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sandboxId = searchParams.get('sandboxId');

  if (!sandboxId) {
    return new ChatSDKError('bad_request:api', 'Parameter sandboxId is required').toResponse();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const state = await getSandboxState(sandboxId);

  if (!state) {
    return new Response(null, { status: 404 });
  }

  return Response.json(state, { status: 200 });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const body = await request.json();
  const { sandboxId, messageId, chatId, title, code, outputs, hasApprovedOnce, e2bSandboxId } = body;

  if (!sandboxId) {
    return new ChatSDKError('bad_request:api', 'Field sandboxId is required').toResponse();
  }

  if (!messageId) {
    return new ChatSDKError('bad_request:api', 'Field messageId is required').toResponse();
  }

  if (!chatId) {
    return new ChatSDKError('bad_request:api', 'Field chatId is required').toResponse();
  }

  const result = await saveSandboxState({
    sandboxId,
    messageId,
    chatId,
    title: title || 'Sandbox',
    code: code || '',
    outputs,
    hasApprovedOnce,
    e2bSandboxId,
  });

  return Response.json(result, { status: 200 });
}
