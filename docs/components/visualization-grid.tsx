'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { HtmlArtifact } from './html-artifact';

export interface VisualizationItem {
  url: string;
  format: 'png' | 'svg' | 'html';
  title?: string;
}

interface VisualizationGridProps {
  visualizations: VisualizationItem[];
  className?: string;
}

// Hook for intersection observer-based lazy loading
function useLazyLoad(index: number) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Start loading 100px before visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const markLoaded = () => setHasLoaded(true);

  return { ref, isVisible, hasLoaded, markLoaded };
}

function VisualizationCard({
  viz,
  index,
  onFullscreen,
  onDownload,
}: {
  viz: VisualizationItem;
  index: number;
  onFullscreen: (viz: VisualizationItem) => void;
  onDownload: (viz: VisualizationItem) => void;
}) {
  const { ref, isVisible, hasLoaded, markLoaded } = useLazyLoad(index);
  const [error, setError] = useState<string | null>(null);

  const handleError = () => {
    setError('Failed to load visualization');
    markLoaded();
  };

  const renderVisualization = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-[300px] bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      );
    }

    if (viz.format === 'html') {
      return (
        <HtmlArtifact
          url={viz.url}
          title={viz.title || `Visualization ${index + 1}`}
          height={300}
        />
      );
    }

    return (
      <img
        src={viz.url}
        alt={viz.title || `Visualization ${index + 1}`}
        className={cn(
          'w-full h-[300px] object-contain rounded-lg bg-white',
          !hasLoaded && 'hidden'
        )}
        onLoad={markLoaded}
        onError={handleError}
        loading="lazy"
      />
    );
  };

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-lg border border-border bg-white"
    >
      {/* Placeholder when not visible yet */}
      {!isVisible && (
        <div className="flex items-center justify-center h-[300px] bg-muted">
          <div className="text-muted-foreground text-sm">Scroll to load...</div>
        </div>
      )}

      {/* Loading placeholder when visible but not loaded (skip for HTML as it handles its own loading) */}
      {isVisible && !hasLoaded && !error && viz.format !== 'html' && (
        <div className="flex items-center justify-center h-[300px] bg-muted">
          <div className="animate-pulse text-muted-foreground">
            Loading visualization...
          </div>
        </div>
      )}

      {/* Visualization content - only render when visible */}
      {isVisible && renderVisualization()}

      {/* Actions overlay - show when loaded */}
      {hasLoaded && !error && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-white/90"
            onClick={() => onFullscreen(viz)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-white/90"
            onClick={() => onDownload(viz)}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Title if provided */}
      {viz.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <span className="text-xs text-white font-medium">{viz.title}</span>
        </div>
      )}
    </div>
  );
}

export function VisualizationGrid({ visualizations, className }: VisualizationGridProps) {
  const [fullscreenViz, setFullscreenViz] = useState<VisualizationItem | null>(null);

  const count = visualizations.length;

  // Determine grid layout based on count
  const getGridClasses = () => {
    switch (count) {
      case 1:
        return 'grid-cols-1 max-w-2xl mx-auto';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const handleDownload = async (viz: VisualizationItem) => {
    try {
      const response = await fetch(viz.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visualization-${Date.now()}.${viz.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download:', err);
    }
  };

  const renderFullscreen = () => {
    if (!fullscreenViz) return null;

    const isHtml = fullscreenViz.format === 'html';
    const isSvg = fullscreenViz.format === 'svg';

    if (isHtml) {
      return (
        <iframe
          src={fullscreenViz.url}
          className="w-full h-[80vh] bg-white"
          title={fullscreenViz.title || 'Visualization (fullscreen)'}
          sandbox="allow-scripts allow-same-origin"
        />
      );
    }

    if (isSvg) {
      return (
        <object
          data={fullscreenViz.url}
          type="image/svg+xml"
          className="w-full h-[80vh] object-contain bg-white"
          aria-label={fullscreenViz.title || 'Visualization (fullscreen)'}
        >
          <img
            src={fullscreenViz.url}
            alt={fullscreenViz.title || 'Visualization (fullscreen)'}
            className="w-full h-[80vh] object-contain bg-white"
          />
        </object>
      );
    }

    // PNG
    return (
      <img
        src={fullscreenViz.url}
        alt={fullscreenViz.title || 'Visualization (fullscreen)'}
        className="w-full h-[80vh] object-contain bg-white"
      />
    );
  };

  if (count === 0) return null;

  return (
    <>
      <div className={cn('grid gap-4', getGridClasses(), className)}>
        {visualizations.map((viz, index) => (
          <VisualizationCard
            key={`${viz.url}-${index}`}
            viz={viz}
            index={index}
            onFullscreen={setFullscreenViz}
            onDownload={handleDownload}
          />
        ))}
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={!!fullscreenViz} onOpenChange={() => setFullscreenViz(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-4">
          <DialogHeader>
            <DialogTitle>Visualization</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full">
            {renderFullscreen()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
