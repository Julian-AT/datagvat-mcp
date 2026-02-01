'use client';

import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { useDataStream } from './data-stream-provider';

// Store visualizations that arrive via stream before message is saved
const pendingVisualizations = new Map<string, { format: string; data: string; index: number }>();

export { pendingVisualizations };

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
        // Existing title handling
      }

      // Handle visualization data from execute-python tool
      if (delta.type === 'visualization') {
        console.log('[DataStreamHandler] Received visualization:', {
          id: delta.id,
          format: delta.format,
          index: delta.index,
          dataLength: delta.data?.length
        });

        // Store visualization data temporarily
        pendingVisualizations.set(delta.id, {
          format: delta.format,
          data: delta.data,
          index: delta.index
        });
      }
    }
  }, [dataStream, setDataStream]);

  return null;
}
