'use client';

import dynamic from 'next/dynamic';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';

const CustomSearchDialog = dynamic(() => import('./search'), {
  ssr: false,
});

export default function SearchDialogWrapper(props: SharedProps) {
  return <CustomSearchDialog {...props} />;
}
