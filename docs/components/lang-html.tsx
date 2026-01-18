'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { i18n } from '@/lib/i18n';

export function LangHtml({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Extract language from pathname (e.g., /en/... or /de/...)
    const lang = pathname?.split('/')[1] || i18n.defaultLanguage;
    
    // Validate language
    const validLang = i18n.languages.includes(lang) ? lang : i18n.defaultLanguage;
    
    // Update html lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = validLang;
    }
  }, [pathname]);

  return <>{children}</>;
}
