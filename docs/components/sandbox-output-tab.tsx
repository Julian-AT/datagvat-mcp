'use client';

import Ansi from 'ansi-to-react';
import { Terminal } from 'lucide-react';

import { VisualizationGrid, type VisualizationItem } from '@/components/visualization-grid';
import { cn } from '@/lib/utils';

export interface SandboxOutput {
  type: 'stdout' | 'stderr' | 'visualization';
  content: string;
  timestamp: string;
}

export interface SandboxOutputTabProps {
  outputs: SandboxOutput[];
}

export function SandboxOutputTab({ outputs }: SandboxOutputTabProps) {
  // Empty state
  if (outputs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-muted p-4">
          <Terminal className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-medium">No output yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Click Run to execute code and see output here
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Output list */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {outputs.map((output, idx) => {
            if (output.type === 'stdout') {
              return (
                <div
                  key={`${output.timestamp}-${idx}`}
                  className="rounded-md bg-muted/50 p-3"
                >
                  <pre className="overflow-x-auto font-mono text-sm">
                    <Ansi>{output.content}</Ansi>
                  </pre>
                </div>
              );
            }

            if (output.type === 'stderr') {
              return (
                <div
                  key={`${output.timestamp}-${idx}`}
                  className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30"
                >
                  <pre className="overflow-x-auto font-mono text-sm text-red-700 dark:text-red-400">
                    <Ansi>{output.content}</Ansi>
                  </pre>
                </div>
              );
            }

            if (output.type === 'visualization') {
              // Collect all visualizations for batch rendering below
              return null;
            }

            // Unknown type - render as raw content
            return (
              <div
                key={`${output.timestamp}-${idx}`}
                className="rounded-md bg-muted/50 p-3"
              >
                <pre className="overflow-x-auto font-mono text-sm">{output.content}</pre>
              </div>
            );
          })}
        </div>
      </div>

      {/* Render visualizations in grid */}
      {(() => {
        const visualizations: VisualizationItem[] = outputs
          .filter(o => o.type === 'visualization')
          .map(o => {
            // Detect format from URL extension
            const url = o.content;
            let format: 'png' | 'svg' | 'html' = 'png';
            if (url.endsWith('.svg')) format = 'svg';
            else if (url.endsWith('.html')) format = 'html';

            return { url, format };
          });

        if (visualizations.length === 0) return null;

        return (
          <div className="p-4 pt-0">
            <VisualizationGrid visualizations={visualizations} />
          </div>
        );
      })()}
    </div>
  );
}
