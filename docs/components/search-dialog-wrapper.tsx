'use client';

import dynamic from 'next/dynamic';

export const SearchDialog = dynamic(() => import('@/components/search'), {
  ssr: false,
});
