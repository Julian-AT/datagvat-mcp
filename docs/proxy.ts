import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { i18n } from '@/lib/i18n';
import { type NextRequest, NextResponse } from 'next/server';

const { rewrite: rewriteLLM } = rewritePath('/docs{/*path}', '/llms.mdx/docs{/*path}');
const i18nMiddleware = createI18nMiddleware(i18n);

export default function proxy(request: NextRequest, event?: any) {
  if (isMarkdownPreferred(request)) {
    const result = rewriteLLM(request.nextUrl.pathname);
    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }
  
  const pathname = request.nextUrl.pathname;
  const hasLocalePrefix = i18n.languages.some(lang => 
    pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)
  );
  
  if (!hasLocalePrefix && pathname !== '/') {
    const locale = i18n.defaultLanguage;
    const redirectUrl = new URL(
      `/${locale}${pathname}${request.nextUrl.search}`,
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }
  
  return i18nMiddleware(request, event);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
