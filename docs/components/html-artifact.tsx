'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface HtmlArtifactProps {
  url?: string;
  content?: string;
  title?: string;
  height?: number | string;
  className?: string;
  allowFullscreen?: boolean;
  allowDownload?: boolean;
  // Props from ArtifactContent that we might receive but don't strictly need
  status?: 'streaming' | 'idle';
  isInline?: boolean;
}

export function HtmlArtifact({
  url,
  content,
  title = 'Interactive Visualization',
  height = 400,
  className,
  allowFullscreen = true,
  allowDownload = true,
}: HtmlArtifactProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Determine what to render
  const hasContent = !!(url || content);

  useEffect(() => {
    // Reset state when source changes
    if (url || content) {
      setIsLoading(true);
      setError(null);
    }
  }, [url, content]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load interactive visualization');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
    setError(null);
  };

  const handleDownload = async () => {
    try {
      if (url) {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        triggerDownload(downloadUrl);
        window.URL.revokeObjectURL(downloadUrl);
      } else if (content) {
        const blob = new Blob([content], { type: 'text/html' });
        const downloadUrl = window.URL.createObjectURL(blob);
        triggerDownload(downloadUrl);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (err) {
      console.error('Failed to download:', err);
      setError('Download failed');
    }
  };

  const triggerDownload = (downloadUrl: string) => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${(title || 'visualization').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (content) {
      const blob = new Blob([content], { type: 'text/html' });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      // Note: We can't revoke this URL immediately if we want it to work, 
      // but browsers handle blob URL cleanup on page unload usually.
    }
  };

  const renderIframe = (fullscreen = false) => {
    const styleHeight = fullscreen ? '80vh' : (typeof height === 'number' ? `${height}px` : height);
    
    // Props for iframe
    const iframeProps = {
      ref: iframeRef,
      className: cn(
        'w-full bg-white border-0',
        fullscreen ? 'h-[80vh]' : ''
      ),
      style: { height: styleHeight },
      onLoad: handleLoad,
      onError: handleError,
      title: title,
      sandbox: "allow-scripts allow-same-origin allow-popups allow-forms",
      loading: "lazy" as const,
    };

    if (url) {
      return <iframe key={refreshKey} {...iframeProps} src={url} />;
    }
    
    if (content) {
      return <iframe key={refreshKey} {...iframeProps} srcDoc={content} />;
    }

    return (
      <div className="flex items-center justify-center h-full bg-muted text-muted-foreground p-4">
        No content to display
      </div>
    );
  };

  return (
    <>
      <div className={cn('relative rounded-lg border border-border overflow-hidden bg-background', className)}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-sm font-medium text-foreground truncate max-w-[200px]" title={title}>{title}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full shrink-0">
              Interactive
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleRefresh}
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {allowDownload && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={handleDownload}
                title="Download HTML"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleOpenInNewTab}
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            {allowFullscreen && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setIsFullscreen(true)}
                title="Fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="relative min-h-[100px]">
          {isLoading && hasContent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-3" />
              <p className="text-sm text-muted-foreground">Loading interactive content...</p>
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center p-8 bg-destructive/5 h-[300px]">
              <p className="text-destructive text-sm mb-3">{error}</p>
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            renderIframe(false)
          )}
        </div>
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 block overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b bg-background">
            <div className="flex items-center justify-between">
              <DialogTitle>{title}</DialogTitle>
              <div className="flex items-center gap-2 mr-8">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 p-0 overflow-hidden h-[calc(95vh-60px)] relative">
            {renderIframe(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
