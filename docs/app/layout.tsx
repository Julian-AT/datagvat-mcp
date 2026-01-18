import type { Metadata } from 'next';
import './globals.css';
import { LangHtml } from '@/components/lang-html';
import { i18n } from '@/lib/i18n';

export const metadata: Metadata = {
  title: {
    default: 'Austria MCP Documentation',
    template: '%s | Austria MCP',
  },
  description: 'Comprehensive guide to the Austria MCP server for data.gv.at',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={i18n.defaultLanguage} suppressHydrationWarning>
      <body>
        <LangHtml>{children}</LangHtml>
      </body>
    </html>
  );
}
