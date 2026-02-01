"use client";

import { Download, Maximize2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VisualizationProps {
  format: "png" | "svg" | "html";
  url: string;
  metadata?: Record<string, unknown>;
}

export function Visualization({ format, url, metadata }: VisualizationProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `visualization.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download visualization:", err);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load visualization");
  };

  const renderVisualization = (fullscreen = false) => {
    const className = fullscreen
      ? "w-full h-full object-contain"
      : "max-w-full h-auto rounded-lg border border-border";

    if (format === "html") {
      return (
        <iframe
          src={url}
          className={`${className} ${isLoading ? "hidden" : ""}`}
          onLoad={handleLoad}
          onError={handleError}
          title="Visualization"
          sandbox="allow-scripts"
          style={{ minHeight: fullscreen ? "100%" : "400px" }}
        />
      );
    }

    if (format === "svg") {
      return (
        <object
          data={url}
          type="image/svg+xml"
          className={`${className} ${isLoading ? "hidden" : ""}`}
          onLoad={handleLoad}
          onError={handleError}
          aria-label="Visualization"
        >
          <img
            src={url}
            alt="Visualization"
            className={className}
            onLoad={handleLoad}
            onError={handleError}
          />
        </object>
      );
    }

    // PNG
    return (
      <img
        src={url}
        alt="Visualization"
        className={`${className} ${isLoading ? "hidden" : ""}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  };

  return (
    <>
      <div className="relative w-full my-4 group">
        {isLoading && (
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
            <div className="animate-pulse text-muted-foreground">
              Loading visualization...
            </div>
          </div>
        )}

        {error ? (
          <div className="flex items-center justify-center p-8 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {renderVisualization()}

            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={() => setIsFullscreen(true)}
                title="View fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-background">
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 z-10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {renderVisualization(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
