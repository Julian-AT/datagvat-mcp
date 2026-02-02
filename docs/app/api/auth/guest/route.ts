import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, createGuestSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirectUrl') || '/chat';

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    const authResponse = await createGuestSession();
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    const setCookieHeader = authResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      response.headers.set('set-cookie', setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error('Error creating guest session:', error);
    return NextResponse.json({ error: 'Failed to create guest session' }, { status: 500 });
  }
}
