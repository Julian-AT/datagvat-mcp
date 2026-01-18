'use client';

import { Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { i18n } from '@/lib/i18n';
import { useState } from 'react';

const languageNames: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
};

const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function LanguageToggle({ lang }: { lang: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const getNewPath = (newLang: string) => {
    const segments = pathname.split('/');
    segments[1] = newLang;
    return segments.join('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
          "hover:bg-fd-accent transition-colors",
          "border border-transparent hover:border-fd-border"
        )}
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline-block">
          {languageFlags[lang]} {languageNames[lang]}
        </span>
        <span className="sm:hidden">{languageFlags[lang]}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 min-w-[150px] rounded-md border border-fd-border bg-fd-popover p-1 shadow-lg">
            {i18n.languages.map((language: string) => (
              <Link
                key={language}
                href={getNewPath(language)}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-sm text-sm",
                  "hover:bg-fd-accent transition-colors cursor-pointer",
                  language === lang && "bg-fd-accent"
                )}
              >
                <span className="text-lg">{languageFlags[language]}</span>
                <span>{languageNames[language]}</span>
                {language === lang && (
                  <span className="ml-auto text-fd-primary">✓</span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
