import "../globals.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { defineI18nUI } from "fumadocs-ui/i18n";
import { i18n } from "@/lib/i18n";
import { SearchDialog } from "fumadocs-ui/components/dialog/search";
import DefaultSearchDialog from "@/components/search";

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: "English",
    },
    de: {
      displayName: "Deutsch",
      toc: "Inhaltsverzeichnis",
      search: "Dokumentation durchsuchen",
      lastUpdate: "Zuletzt aktualisiert am",
      searchNoResult: "Keine Ergebnisse",
      previousPage: "Vorherige Seite",
      nextPage: "Nächste Seite",
      chooseLanguage: "Sprache wählen",
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
        <RootProvider i18n={provider(lang)} search={{
          enabled: true,
          SearchDialog: DefaultSearchDialog,
        }}>{children}</RootProvider>
      </body>
    </html>
  );
}
