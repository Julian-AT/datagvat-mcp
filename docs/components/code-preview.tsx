'use client';

import { python } from '@codemirror/lang-python';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

interface CodePreviewProps {
  code: string;
  language?: 'python'; // Extensible for future languages
  maxHeight?: string;
  className?: string;
}

export function CodePreview({
  code,
  language = 'python',
  maxHeight = '400px',
  className = '',
}: CodePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup, // Includes line numbers, fold gutters
        python(), // Python language support
        oneDark, // Match existing code-editor.tsx theme
        EditorView.editable.of(false), // Read-only mode
        EditorView.lineWrapping, // Wrap long lines
        EditorView.theme({
          '&': {
            maxHeight,
            overflow: 'auto', // Scrollable for APPROVAL-06
          },
          '.cm-content': {
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
          },
        }),
      ],
    });

    editorRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [code, maxHeight]);

  return <div ref={containerRef} className={`rounded-md border ${className}`} />;
}
