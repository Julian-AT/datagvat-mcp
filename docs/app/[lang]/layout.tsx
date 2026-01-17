import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';
import { defineI18nUI } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';

const { provider: I18nProvider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
    },
    de: {
      displayName: 'Deutsch',
      toc: 'Inhaltsverzeichnis',
      search: 'Dokumentation durchsuchen',
      lastUpdate: 'Zuletzt aktualisiert am',
      searchNoResult: 'Keine Ergebnisse',
      previousPage: 'Vorherige Seite',
      nextPage: 'Nächste Seite',
      chooseLanguage: 'Sprache wählen',
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
  const { lang } = await params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <I18nProvider locale={lang}>
          <RootProvider>{children}</RootProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
