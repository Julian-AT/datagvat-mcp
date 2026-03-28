import { auth } from '@/lib/auth';
import { saveSandboxState } from '@/lib/db/queries';
import { executeSandboxCode } from '@/lib/e2b/sandbox-executor';
import { ChatSDKError } from '@/lib/errors';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const body = await request.json();
  const { sandboxId, messageId, chatId, title, code, e2bSandboxId, template } = body;

  if (!code) {
    return new ChatSDKError('bad_request:api', 'Field code is required').toResponse();
  }

  if (!chatId) {
    return new ChatSDKError('bad_request:api', 'Field chatId is required').toResponse();
  }

  try {
    // Execute code in E2B sandbox
    const result = await executeSandboxCode({
      code,
      e2bSandboxId,
      chatId,
      template,
    });

    // Save result to database if sandboxId and messageId are provided
    if (sandboxId && messageId) {
      try {
        await saveSandboxState({
          sandboxId,
          messageId,
          chatId,
          title: title || 'Sandbox',
          code,
          outputs: result.outputs,
          hasApprovedOnce: true, // Must be true if we got here
          e2bSandboxId: result.e2bSandboxId,
        });
      } catch (saveError: any) {
        // Handle race condition where message is not yet persisted
        if (
          saveError instanceof ChatSDKError &&
          saveError.type === 'not_found' &&
          saveError.surface === 'database'
        ) {
          console.warn('[API /sandbox/execute] Message not found yet, retrying save in 1s...');
          // Simple server-side retry once
          await new Promise((resolve) => setTimeout(resolve, 1000));
          try {
            await saveSandboxState({
              sandboxId,
              messageId,
              chatId,
              title: title || 'Sandbox',
              code,
              outputs: result.outputs,
              hasApprovedOnce: true,
              e2bSandboxId: result.e2bSandboxId,
            });
          } catch (retryError) {
            console.error(
              '[API /sandbox/execute] Failed to save execution results after retry:',
              retryError
            );
            // We don't fail the request, just log it. Client has the outputs anyway.
          }
        } else {
          console.error('[API /sandbox/execute] Failed to save execution results:', saveError);
        }
      }
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('Sandbox execution error:', error);
    return Response.json(
      {
        success: false,
        outputs: [
          {
            type: 'stderr',
            content: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          },
        ],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Still 200 - error is part of the response
    );
  }
}
