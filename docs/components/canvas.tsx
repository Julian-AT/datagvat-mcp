'use client';

import { useState } from 'react';

interface CanvasProps {
  url: string;
  format: 'png' | 'svg' | 'html';
  metadata?: Record<string, unknown>;
}

export function Canvas({ url, format, metadata }: CanvasProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Visualization</span>
          <span className="text-xs text-muted-foreground uppercase">{format}</span>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-xs hover:text-primary transition-colors"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'p-4'}`}>
        {format === 'html' ? (
          <iframe
            src={url}
            className="w-full h-96 border-0"
            sandbox="allow-scripts"
            title="Visualization"
          />
        ) : (
          <img src={url} alt="Visualization" className="max-w-full h-auto mx-auto" />
        )}
      </div>

      {metadata && (
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <details>
            <summary className="cursor-pointer hover:text-foreground">Metadata</summary>
            <pre className="mt-2 overflow-x-auto">{JSON.stringify(metadata, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
