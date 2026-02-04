'use client';

import { python } from '@codemirror/lang-python';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { AlertTriangle, Loader2, Play } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SandboxCodeTabProps {
  code: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  isRunning: boolean;
}

export function SandboxCodeTab({
  code,
  onCodeChange,
  onRun,
  isRunning,
}: SandboxCodeTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const startState = EditorState.create({
        doc: code,
        extensions: [
          basicSetup,
          python(),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onCodeChange(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              height: '100%',
              maxHeight: '60vh',
              overflow: 'auto',
            },
            '.cm-content': {
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
            },
            '.cm-scroller': {
              overflow: 'auto',
            },
          }),
        ],
      });

      editorRef.current = new EditorView({
        state: startState,
        parent: containerRef.current,
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // Initialize editor only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor content when code prop changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.state.doc.toString();
      if (currentContent !== code) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: code,
          },
        });
      }
    }
  }, [code]);

  return (
    <div className="flex h-full flex-col">
      {/* Code Editor */}
      <div className="min-h-0 flex-1">
        <div
          ref={containerRef}
          className="h-full w-full"
        />
      </div>

      {/* Run Button Bar */}
      <div className="border-t bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {/* Status text or left blank */}
          </div>
          <Button
            onClick={onRun}
            disabled={isRunning}
            className="gap-2"
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="size-4" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
