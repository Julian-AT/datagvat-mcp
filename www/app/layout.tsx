import '@/app/globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextProvider } from 'fumadocs-core/framework/next';
import type { Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { Body } from '@/app/layout.client';
import { Provider } from '@/app/provider';
import { baseUrl, createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: {
    template: '%s | data.gv.at MCP Server',
    default: 'data.gv.at MCP Server Documentation',
  },
  description:
    'MCP server for accessing Austrian Open Government Data from data.gv.at through Claude and other MCP clients.',
  metadataBase: baseUrl,
});

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const mono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
    { media: '(prefers-color-scheme: light)', color: '#fff' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable}`} suppressHydrationWarning>
      <Body>
        <NextProvider>
          <Provider>{children}</Provider>
        </NextProvider>
      </Body>
      <SpeedInsights />
      <Analytics />
    </html>
  );
}
