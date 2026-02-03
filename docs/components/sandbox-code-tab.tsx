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
  showApproval: boolean;
  onApprove: () => void;
  onDeny: () => void;
  hasApprovedOnce: boolean;
  isRunning: boolean;
}

export function SandboxCodeTab({
  code,
  onCodeChange,
  onRun,
  showApproval,
  onApprove,
  onDeny,
  hasApprovedOnce,
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
    // Only run on mount/unmount - code updates handled separately
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
      {/* Inline Approval UI - shows when showApproval=true */}
      {showApproval && (
        <div className="border-b border-amber-500/30 bg-amber-50/50 p-4 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">
                  Review code before running
                </h4>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  This is the first execution. Please review the code below and approve or deny
                  execution.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={onApprove}
                  className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                >
                  Approve
                </Button>
                <Button onClick={onDeny} variant="destructive">
                  Deny
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="min-h-0 flex-1">
        <div
          ref={containerRef}
          className={cn(
            'h-full w-full',
            showApproval && 'pointer-events-none opacity-75' // Dim editor during approval
          )}
        />
      </div>

      {/* Run Button Bar */}
      <div className="border-t bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {hasApprovedOnce ? (
              <span>Auto-execute enabled (previously approved)</span>
            ) : (
              <span>First run requires approval</span>
            )}
          </div>
          <Button
            onClick={onRun}
            disabled={isRunning || showApproval}
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
