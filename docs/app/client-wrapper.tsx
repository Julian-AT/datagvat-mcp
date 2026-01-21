'use client';

import { type ReactNode, useEffect } from 'react';

export function ClientWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const uwuParam = urlParams.get('uwu');

    if (typeof uwuParam === 'string') {
      localStorage.setItem('uwu', uwuParam);
    }

    const item = localStorage.getItem('uwu');

    if (item === 'true') {
      document.documentElement.classList.add('uwu');
    }
  }, []);

  return <>{children}</>;
}
