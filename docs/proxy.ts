import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server';
import { i18n } from '@/lib/i18n';

const { rewrite: rewriteLLM } = rewritePath('/docs{/*path}', '/llms.mdx/docs{/*path}');

const i18nMiddleware = createI18nMiddleware(i18n);

export default function proxy(request: NextRequest, event?: unknown) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const isChatRoute = pathname.includes('/chat');
  const isLoginRegister = pathname.includes('/login') || pathname.includes('/register');

  if (isChatRoute && !isLoginRegister) {
    const sessionCookie = request.cookies.get('better-auth.session_token');

    if (!sessionCookie) {
      const guestUrl = new URL('/api/auth/guest', request.url);
      guestUrl.searchParams.set('redirectUrl', pathname);
      return NextResponse.redirect(guestUrl);
    }
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteLLM(request.nextUrl.pathname);
    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }

  return i18nMiddleware(request, event as NextFetchEvent);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
