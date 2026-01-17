import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';
import type { Metadata } from 'next';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;

  return (
    <DocsLayout
      tree={source.pageTree[lang]}
      nav={{
        title: 'Austria MCP',
      }}
    >
      {children}
    </DocsLayout>
  );
}

export async function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Metadata {
  return {
    title: 'Austria MCP Documentation',
    description: 'Comprehensive guide to using the Austria MCP server',
  };
}
