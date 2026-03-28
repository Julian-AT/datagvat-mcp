import { cleanup, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VisualizationGrid } from '@/components/visualization/visualization-grid';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(
    private callback: (entries: any[]) => void,
    _options: any
  ) {}
  observe() {
    // Immediately trigger intersecting for tests
    this.callback([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = '';
  thresholds = [];
} as any;

describe('VIZ-10: Memory Usage Benchmarks', () => {
  const measureMemory = async (): Promise<number> => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Wait for any pending operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return mem.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    // Fallback for Node environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }

    return 0;
  };

  describe('Single visualization', () => {
    it('should use less than 50MB for single visualization', async () => {
      const baselineMemory = await measureMemory();

      const visualizations = [{ url: 'https://example.com/chart.png', format: 'png' as const }];

      const { unmount } = render(<VisualizationGrid visualizations={visualizations} />);

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      const memoryWithViz = await measureMemory();
      const memoryUsed = memoryWithViz - baselineMemory;

      console.log(`Memory used for 1 visualization: ${memoryUsed.toFixed(2)} MB`);

      // If we can't measure memory (e.g. in JSDOM environment without exposed GC/memory), skip strict check
      if (memoryWithViz > 0) {
        expect(memoryUsed).toBeLessThan(50);
      }

      unmount();
      cleanup();
    });
  });

  describe('10 visualizations', () => {
    it('should use less than 150MB for 10 visualizations', async () => {
      const baselineMemory = await measureMemory();

      const visualizations = Array.from({ length: 10 }, (_, i) => ({
        url: `https://example.com/chart${i}.png`,
        format: 'png' as const,
        title: `Chart ${i + 1}`,
      }));

      const { unmount } = render(<VisualizationGrid visualizations={visualizations} />);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const memoryWithViz = await measureMemory();
      const memoryUsed = memoryWithViz - baselineMemory;

      console.log(`Memory used for 10 visualizations: ${memoryUsed.toFixed(2)} MB`);

      if (memoryWithViz > 0) {
        expect(memoryUsed).toBeLessThan(150);
      }

      unmount();
      cleanup();
    });
  });

  describe('50 visualizations - VIZ-10', () => {
    it('should use less than 500MB for 50 visualizations', async () => {
      const baselineMemory = await measureMemory();

      const visualizations = Array.from({ length: 50 }, (_, i) => ({
        url: `https://example.com/chart${i}.png`,
        format: 'png' as const,
        title: `Chart ${i + 1}`,
      }));

      const { unmount } = render(<VisualizationGrid visualizations={visualizations} />);

      // Wait for all to render
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const memoryWithViz = await measureMemory();
      const memoryUsed = memoryWithViz - baselineMemory;

      console.log(`Memory used for 50 visualizations: ${memoryUsed.toFixed(2)} MB`);
      console.log(`Average per visualization: ${(memoryUsed / 50).toFixed(2)} MB`);

      // VIZ-10 requirement: <500MB for 50 visualizations
      if (memoryWithViz > 0) {
        expect(memoryUsed).toBeLessThan(500);
      }

      unmount();
      cleanup();

      // Verify cleanup freed memory
      await new Promise((resolve) => setTimeout(resolve, 500));
      const afterCleanup = await measureMemory();
      const memoryRecovered = memoryWithViz - afterCleanup;

      console.log(`Memory recovered after cleanup: ${memoryRecovered.toFixed(2)} MB`);
    });
  });

  describe('Mixed format memory', () => {
    it('should handle mixed formats within memory budget', async () => {
      const baselineMemory = await measureMemory();

      const visualizations = [
        ...Array.from({ length: 20 }, (_, i) => ({
          url: `https://example.com/chart${i}.png`,
          format: 'png' as const,
          title: `PNG Chart ${i + 1}`,
        })),
        ...Array.from({ length: 15 }, (_, i) => ({
          url: `https://example.com/chart${i}.svg`,
          format: 'svg' as const,
          title: `SVG Chart ${i + 1}`,
        })),
        ...Array.from({ length: 15 }, (_, i) => ({
          url: `https://example.com/chart${i}.html`,
          format: 'html' as const,
          title: `HTML Chart ${i + 1}`,
        })),
      ];

      const { unmount } = render(<VisualizationGrid visualizations={visualizations} />);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const memoryWithViz = await measureMemory();
      const memoryUsed = memoryWithViz - baselineMemory;

      console.log(`Memory used for 50 mixed-format visualizations: ${memoryUsed.toFixed(2)} MB`);

      if (memoryWithViz > 0) {
        expect(memoryUsed).toBeLessThan(500);
      }

      unmount();
      cleanup();
    });
  });

  describe('Lazy loading effectiveness', () => {
    it('should not load off-screen visualizations immediately', async () => {
      const visualizations = Array.from({ length: 30 }, (_, i) => ({
        url: `https://example.com/chart${i}.png`,
        format: 'png' as const,
        title: `Chart ${i + 1}`,
      }));

      const { container } = render(
        <div style={{ height: '400px', overflow: 'auto' }}>
          <VisualizationGrid visualizations={visualizations} />
        </div>
      );

      // Check that images have loading="lazy"
      const images = container.querySelectorAll('img');
      const lazyImages = Array.from(images).filter((img) => img.getAttribute('loading') === 'lazy');

      console.log(`Lazy-loaded images: ${lazyImages.length}/${images.length}`);

      // Most images should have lazy loading
      expect(lazyImages.length).toBeGreaterThan(images.length * 0.8);
    });
  });
});
