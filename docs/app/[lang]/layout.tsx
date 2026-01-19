import { RootProvider } from 'fumadocs-ui/provider/next';
import { defineI18nUI } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';
import { source } from '@/lib/source';
import { TreeContextProvider } from 'fumadocs-ui/contexts/tree';
import type { ReactNode } from 'react';
import { SearchDialog } from '@/components/search-dialog-wrapper';

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
    },
    de: {
      displayName: 'Deutsch',
    },
  },
});

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const lang = (await params).lang;
  const tree = source.getPageTree(lang);

  return (
    <TreeContextProvider tree={tree}>
      <RootProvider
        i18n={provider(lang)}
        search={{
          SearchDialog,
        }}
      >
        {children}
      </RootProvider>
    </TreeContextProvider>
  );
}

export async function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
