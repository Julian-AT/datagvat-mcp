'use client';

import Ansi from 'ansi-to-react';
import { Download, Maximize2, Terminal, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const openFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `visualization-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              return (
                <div
                  key={`${output.timestamp}-${idx}`}
                  className="my-4"
                >
                  <div className="group relative inline-block">
                    {/* Thumbnail image */}
                    <img
                      src={output.content}
                      alt="Visualization"
                      className={cn(
                        'max-w-[400px] cursor-pointer rounded-md border',
                        'transition-shadow hover:shadow-lg',
                        'bg-white' // White background for charts
                      )}
                      onClick={() => openFullscreen(output.content)}
                    />
                    {/* Expand overlay */}
                    <div
                      className={cn(
                        'absolute inset-0 flex items-center justify-center',
                        'rounded-md bg-black/50 opacity-0 transition-opacity',
                        'group-hover:opacity-100'
                      )}
                      onClick={() => openFullscreen(output.content)}
                    >
                      <div className="flex items-center gap-2 text-white">
                        <Maximize2 className="size-5" />
                        <span className="text-sm font-medium">Click to expand</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
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

      {/* Fullscreen overlay dialog */}
      <Dialog open={!!fullscreenImage} onOpenChange={(open) => !open && closeFullscreen()}>
        <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-auto" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Visualization</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fullscreenImage && handleDownload(fullscreenImage)}
              >
                <Download className="mr-2 size-4" />
                Download
              </Button>
              <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
                <X className="size-4" />
              </DialogClose>
            </div>
          </DialogHeader>
          {fullscreenImage && (
            <div className="flex justify-center">
              <img
                src={fullscreenImage}
                alt="Visualization (fullscreen)"
                className="max-h-[75vh] rounded-md bg-white"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
