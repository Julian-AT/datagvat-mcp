'use client';

import { useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { useDataStream } from './data-stream-provider';

export function DataStreamHandler() {
  const { dataStream, setDataStream } = useDataStream();
  const { mutate } = useSWRConfig();

  const { artifact, setArtifact, setMetadata } = useArtifact();

  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }

    const newDeltas = dataStream.slice();
    setDataStream([]);

    for (const delta of newDeltas) {
      // Handle chat title updates
      if (delta.type === 'data-chat-title') {
      }
    }
  }, [dataStream, setDataStream]);

  return null;
}
