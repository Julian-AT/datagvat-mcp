import type { Metadata } from 'next';

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
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
