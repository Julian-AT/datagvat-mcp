import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

export const { GET } = createFromSource(source, {
  localeMap: {
    de: { language: 'german' },
    en: { language: 'english' },
  },
});
