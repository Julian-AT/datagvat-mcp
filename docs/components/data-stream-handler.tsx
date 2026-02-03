'use client';

import { useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { useSandboxes, type UISandbox } from '@/hooks/use-sandbox';
import { artifactDefinitions } from './artifact';
import { useDataStream } from './data-stream-provider';
import { getChatHistoryPaginationKey } from './sidebar-history';

export function DataStreamHandler() {
  const { dataStream, setDataStream } = useDataStream();
  const { mutate } = useSWRConfig();

  const { artifact, setArtifact, setMetadata } = useArtifact();
  const { openSandbox } = useSandboxes();

  // Track sandbox being built from stream events
  const pendingSandboxRef = useRef<{
    sandboxId: string | null;
    title: string | null;
    code: string | null;
  }>({ sandboxId: null, title: null, code: null });

  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }

    const newDeltas = dataStream.slice();
    setDataStream([]);

    for (const delta of newDeltas) {
      // Handle chat title updates
      if (delta.type === 'data-chat-title') {
        mutate(unstable_serialize(getChatHistoryPaginationKey));
        continue;
      }

      // Handle sandbox events specially - sandbox uses useSandboxes, not useArtifact
      // Sandbox streams: data-kind='sandbox', data-id, data-title, data-code (optional), data-finish
      if (delta.type === 'data-kind' && delta.data === 'sandbox') {
        // Start collecting sandbox data
        pendingSandboxRef.current = { sandboxId: null, title: null, code: null };
        // Also set artifact kind so artifact.tsx knows to render sandbox
        setArtifact((draftArtifact) => ({
          ...(draftArtifact || initialArtifactData),
          kind: 'sandbox',
          status: 'streaming',
          isVisible: true,
        }));
        continue;
      }

      // Collect sandbox data from subsequent events
      if (artifact.kind === 'sandbox' || pendingSandboxRef.current.sandboxId !== null || delta.type === 'data-id') {
        // Check if we're building a sandbox (kind was set to sandbox)
        const isBuildingSandbox = artifact.kind === 'sandbox' ||
          (pendingSandboxRef.current.sandboxId !== null);

        if (delta.type === 'data-id' && (isBuildingSandbox || artifact.kind === 'sandbox')) {
          pendingSandboxRef.current.sandboxId = delta.data;
          setArtifact((draftArtifact) => ({
            ...(draftArtifact || initialArtifactData),
            documentId: delta.data,
            status: 'streaming',
          }));
          continue;
        }

        if (delta.type === 'data-title' && isBuildingSandbox) {
          pendingSandboxRef.current.title = delta.data;
          setArtifact((draftArtifact) => ({
            ...(draftArtifact || initialArtifactData),
            title: delta.data,
            status: 'streaming',
          }));
          continue;
        }

        if (delta.type === 'data-code' && isBuildingSandbox) {
          pendingSandboxRef.current.code = delta.data;
          continue;
        }

        if (delta.type === 'data-clear' && isBuildingSandbox) {
          // For sandbox, data-clear means reset code
          pendingSandboxRef.current.code = '';
          continue;
        }

        if (delta.type === 'data-finish' && isBuildingSandbox && pendingSandboxRef.current.sandboxId) {
          // Finalize sandbox - open it via useSandboxes
          const newSandbox: UISandbox = {
            sandboxId: pendingSandboxRef.current.sandboxId,
            title: pendingSandboxRef.current.title || 'Python Sandbox',
            code: pendingSandboxRef.current.code || '',
            outputs: [],
            hasApprovedOnce: false,
            isRunning: false,
            activeTab: 'code',
            showApproval: false,
          };
          openSandbox(newSandbox);

          // Reset pending sandbox
          pendingSandboxRef.current = { sandboxId: null, title: null, code: null };

          // Set artifact status to idle
          setArtifact((draftArtifact) => ({
            ...(draftArtifact || initialArtifactData),
            status: 'idle',
          }));
          continue;
        }
      }

      // Handle non-sandbox artifact events
      const artifactDefinition = artifactDefinitions.find(
        (currentArtifactDefinition) => currentArtifactDefinition.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'data-id':
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: 'streaming',
            };

          case 'data-title':
            return {
              ...draftArtifact,
              title: delta.data,
              status: 'streaming',
            };

          case 'data-kind':
            return {
              ...draftArtifact,
              kind: delta.data,
              status: 'streaming',
            };

          case 'data-clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          case 'data-finish':
            return {
              ...draftArtifact,
              status: 'idle',
            };

          default:
            return draftArtifact;
        }
      });
    }
  }, [dataStream, setArtifact, setMetadata, artifact, setDataStream, mutate, openSandbox]);

  return null;
}
