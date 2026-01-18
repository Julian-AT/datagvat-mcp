import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { i18n } from '@/lib/i18n';
import { NextRequest, NextResponse } from 'next/server';


const { rewrite: rewriteLLM } = rewritePath('/{/*path}', '/llms.mdx{/*path}');

export default function proxy(request: NextRequest) {

  if (isMarkdownPreferred(request)) {
    const result = rewriteLLM(request.nextUrl.pathname);
    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }
  createI18nMiddleware(i18n)
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
