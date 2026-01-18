'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { i18n } from '@/lib/i18n';

export function LangHtml({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const lang = pathname?.split('/')[1] || i18n.defaultLanguage;

    const validLang = i18n.languages.includes(lang as (typeof i18n.languages)[number]) ? lang : i18n.defaultLanguage;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = validLang;
    }
  }, [pathname]);

  return <>{children}</>;
}
