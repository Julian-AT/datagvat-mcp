'use client';

import { useCallback, useState } from 'react';

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T;
  defaultProp: T;
  onChange?: (value: T) => void;
}): [T, (value: T) => void] {
  const [state, setState] = useState(defaultProp);
  const value = prop !== undefined ? prop : state;
  const setValue = useCallback(
    (v: T) => {
      if (prop === undefined) {
        setState(v);
      }
      onChange?.(v);
    },
    [prop, onChange]
  );
  return [value, setValue];
}
