'use client';

import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import dynamic from 'next/dynamic';

const CustomSearchDialog = dynamic(() => import('./search'), {
  ssr: false,
});

export default function SearchDialogWrapper(props: SharedProps) {
  return <CustomSearchDialog {...props} />;
}
