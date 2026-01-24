import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { type NextRequest, NextResponse } from 'next/server';
import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { i18n } from '@/lib/i18n';


// const { rewrite: rewriteLLM } = rewritePath('/docs{/*path}', '/llms.mdx/docs{/*path}');

// export default function proxy(request: NextRequest, event?: unknown) {
//   if (isMarkdownPreferred(request)) {
//     const result = rewriteLLM(request.nextUrl.pathname);
//     if (result) {
//       return NextResponse.rewrite(new URL(result, request.nextUrl));
//     }
//   }

//   createI18nMiddleware(i18n);

//   return NextResponse.next();
// }

export default createI18nMiddleware(i18n);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
