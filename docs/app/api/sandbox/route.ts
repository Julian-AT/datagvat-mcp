import { auth } from '@/lib/auth';
import { getSandboxState, saveSandboxState } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  console.log('[API /sandbox GET] Request received');
  const { searchParams } = new URL(request.url);
  const sandboxId = searchParams.get('sandboxId');
  console.log('[API /sandbox GET] sandboxId param:', sandboxId);

  if (!sandboxId) {
    console.log('[API /sandbox GET] Missing sandboxId param, returning 400');
    return new ChatSDKError('bad_request:api', 'Parameter sandboxId is required').toResponse();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  console.log('[API /sandbox GET] Session:', session ? 'valid' : 'invalid');

  if (!session?.user) {
    console.log('[API /sandbox GET] No session, returning 401');
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  console.log('[API /sandbox GET] Calling getSandboxState for:', sandboxId);
  const state = await getSandboxState(sandboxId);
  console.log('[API /sandbox GET] getSandboxState result:', state ? 'found' : 'null');

  if (!state) {
    console.log('[API /sandbox GET] State not found, returning 404');
    return new Response(null, { status: 404 });
  }

  console.log('[API /sandbox GET] Returning 200 with state');
  return Response.json(state, { status: 200 });
}

export async function POST(request: Request) {
  console.log('[API /sandbox POST] Request received');
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  console.log('[API /sandbox POST] Session:', session ? 'valid' : 'invalid');

  if (!session?.user) {
    console.log('[API /sandbox POST] No session, returning 401');
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const body = await request.json();
  console.log('[API /sandbox POST] Body:', JSON.stringify(body, null, 2));
  const { sandboxId, messageId, chatId, title, code, outputs, hasApprovedOnce, e2bSandboxId } = body;

  if (!sandboxId) {
    console.log('[API /sandbox POST] Missing sandboxId, returning 400');
    return new ChatSDKError('bad_request:api', 'Field sandboxId is required').toResponse();
  }

  if (!messageId) {
    console.log('[API /sandbox POST] Missing messageId, returning 400');
    return new ChatSDKError('bad_request:api', 'Field messageId is required').toResponse();
  }

  if (!chatId) {
    console.log('[API /sandbox POST] Missing chatId, returning 400');
    return new ChatSDKError('bad_request:api', 'Field chatId is required').toResponse();
  }

  console.log('[API /sandbox POST] Calling saveSandboxState');
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
  console.log('[API /sandbox POST] saveSandboxState result:', result ? 'success' : 'failed');

  return Response.json(result, { status: 200 });
}
