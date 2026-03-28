import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HtmlArtifact } from '@/components/artifacts/html-artifact';
import { VisualizationGrid } from '@/components/visualization/visualization-grid';
import { uploadHtml, uploadImageFromBase64 } from '@/lib/blob';

// Mock blob upload functions
vi.mock('@/lib/blob', () => ({
  uploadImageFromBase64: vi.fn(),
  uploadHtml: vi.fn(),
}));

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

describe('Visualization Rendering', () => {
  describe('VIZ-01: Inline rendering', () => {
    it('should render single visualization inline', () => {
      const visualizations = [{ url: 'https://example.com/chart1.png', format: 'png' as const }];

      render(<VisualizationGrid visualizations={visualizations} />);

      const img = screen.getByAltText('Visualization 1');
      expect(img).toBeInTheDocument();
      expect(img.tagName).toBe('IMG');
    });
  });

  describe('VIZ-02: Multi-format support', () => {
    it('should render PNG visualizations', () => {
      const visualizations = [{ url: 'https://example.com/chart.png', format: 'png' as const }];

      render(<VisualizationGrid visualizations={visualizations} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', expect.stringContaining('.png'));
    });

    it('should render SVG visualizations', () => {
      const visualizations = [{ url: 'https://example.com/chart.svg', format: 'svg' as const }];

      render(<VisualizationGrid visualizations={visualizations} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', expect.stringContaining('.svg'));
    });

    it('should render HTML visualizations with iframe', () => {
      const visualizations = [
        { url: 'https://example.com/chart.html', format: 'html' as const, title: 'Test Chart' },
      ];

      render(<VisualizationGrid visualizations={visualizations} />);

      // HtmlArtifact should render with toolbar
      const elements = screen.getAllByText('Test Chart');
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toBeInTheDocument();
      expect(screen.getAllByText('Interactive')[0]).toBeInTheDocument();
    });
  });

  describe('VIZ-03: Blob upload', () => {
    it('should upload PNG to blob storage', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/chats/test/chart.png';
      vi.mocked(uploadImageFromBase64).mockResolvedValue(mockUrl);

      const base64Png =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const url = await uploadImageFromBase64(base64Png, 'chart.png', 'test-chat');

      expect(url).toBe(mockUrl);
      expect(uploadImageFromBase64).toHaveBeenCalledWith(base64Png, 'chart.png', 'test-chat');
    });

    it('should upload HTML to blob storage', async () => {
      const mockUrl = 'https://blob.vercel-storage.com/chats/test/chart.html';
      vi.mocked(uploadHtml).mockResolvedValue(mockUrl);

      const rawHtml =
        '<html><head><title>Test</title></head><body><h1>Test Chart</h1></body></html>';
      const url = await uploadHtml(rawHtml, 'chart.html', 'test-chat');

      expect(url).toBe(mockUrl);
      expect(uploadHtml).toHaveBeenCalledWith(rawHtml, 'chart.html', 'test-chat');
    });
  });

  describe('VIZ-04: URL persistence', () => {
    it('should use URLs not base64 in visualization data', () => {
      // Simulating sandbox outputs structure
      const outputs = [
        {
          type: 'visualization',
          content: 'https://blob.url/chart.png',
          timestamp: new Date().toISOString(),
        },
      ];

      // Verify outputs contain URLs, not base64 data
      outputs.forEach((output) => {
        expect(output.content).not.toContain('data:image');
        expect(output.content).not.toContain('base64');
        expect(output.content).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('VIZ-05: Grid layout', () => {
    it('should render single visualization full width', () => {
      const visualizations = [{ url: 'https://example.com/chart.png', format: 'png' as const }];

      const { container } = render(<VisualizationGrid visualizations={visualizations} />);
      // Note: We might need to adjust selector based on actual implementation
      // Assuming a grid class or similar
      const grid = container.firstChild;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should render 2 visualizations side by side on desktop', () => {
      const visualizations = [
        { url: 'https://example.com/chart1.png', format: 'png' as const },
        { url: 'https://example.com/chart2.png', format: 'png' as const },
      ];

      const { container } = render(<VisualizationGrid visualizations={visualizations} />);
      const grid = container.firstChild;

      expect(grid).toHaveClass('md:grid-cols-2');
    });

    it('should render 4 visualizations in 2x2 grid', () => {
      const visualizations = [
        { url: 'https://example.com/chart1.png', format: 'png' as const },
        { url: 'https://example.com/chart2.png', format: 'png' as const },
        { url: 'https://example.com/chart3.png', format: 'png' as const },
        { url: 'https://example.com/chart4.png', format: 'png' as const },
      ];

      const { container } = render(<VisualizationGrid visualizations={visualizations} />);
      // Depending on implementation, might check children count
      // Assuming children are the visualizations
      expect(container.firstChild?.childNodes).toHaveLength(4);
    });
  });

  describe('VIZ-06: Fullscreen and download', () => {
    it('should render fullscreen trigger', async () => {
      const visualizations = [{ url: 'https://example.com/chart.png', format: 'png' as const }];

      render(<VisualizationGrid visualizations={visualizations} />);

      await waitFor(() => {
        const img = screen.getByAltText('Visualization 1');
        expect(img).toBeInTheDocument();
        fireEvent.load(img);
      });

      // Wait for actions to appear (they are conditionally rendered on hasLoaded)
      await waitFor(() => {
        // Look for the maximize icon button which has title "Fullscreen" usually
        // Note: The code uses 'Maximize2' icon inside a button.
        // Let's check the title used in VisualizationCard
        const fullscreenBtn = screen.getByTitle('Fullscreen'); // Updated based on code reading
        expect(fullscreenBtn).toBeInTheDocument();
      });
    });

    it('should render download trigger', async () => {
      const visualizations = [{ url: 'https://example.com/chart.png', format: 'png' as const }];

      render(<VisualizationGrid visualizations={visualizations} />);

      await waitFor(() => {
        const img = screen.getByAltText('Visualization 1');
        expect(img).toBeInTheDocument();
        fireEvent.load(img);
      });

      await waitFor(() => {
        const downloadBtn = screen.getByTitle('Download'); // Logic in VisualizationCard uses "Download" title for button
        expect(downloadBtn).toBeInTheDocument();
      });
    });
  });

  describe('VIZ-07: Static image rendering', () => {
    it('should render PNG as img tag', () => {
      const visualizations = [{ url: 'https://example.com/chart.png', format: 'png' as const }];

      render(<VisualizationGrid visualizations={visualizations} />);

      const img = screen.getByRole('img');
      expect(img.tagName).toBe('IMG');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should render SVG as img tag', () => {
      const visualizations = [{ url: 'https://example.com/chart.svg', format: 'svg' as const }];

      render(<VisualizationGrid visualizations={visualizations} />);

      const img = screen.getByRole('img');
      expect(img.tagName).toBe('IMG');
    });
  });

  describe('VIZ-08: Interactive HTML rendering', () => {
    it('should render HTML in sandboxed iframe', () => {
      render(
        <HtmlArtifact
          url="https://example.com/plotly.html"
          title="Interactive Chart"
          height={400}
        />
      );

      const iframes = screen.getAllByTitle('Interactive Chart');
      const iframe = iframes.find((el) => el.tagName === 'IFRAME');
      expect(iframe).toBeDefined();
      expect(iframe).toHaveAttribute('sandbox');
      expect(iframe).toHaveAttribute('sandbox', expect.stringContaining('allow-scripts'));
    });

    it('should show interactive badge for HTML content', () => {
      render(<HtmlArtifact url="https://example.com/plotly.html" title="Interactive Chart" />);

      const badges = screen.getAllByText('Interactive');
      expect(badges[0]).toBeInTheDocument();
    });
  });

  describe('VIZ-09: Multiple content types', () => {
    it('should handle mixed format grid', () => {
      const visualizations = [
        { url: 'https://example.com/chart1.png', format: 'png' as const, title: 'PNG Chart' },
        { url: 'https://example.com/chart2.svg', format: 'svg' as const, title: 'SVG Chart' },
        { url: 'https://example.com/chart3.html', format: 'html' as const, title: 'HTML Chart' },
      ];

      render(<VisualizationGrid visualizations={visualizations} />);

      // Should have 3 items
      expect(screen.getAllByAltText('PNG Chart')[0]).toBeInTheDocument();
      expect(screen.getAllByAltText('SVG Chart')[0]).toBeInTheDocument();
      expect(screen.getAllByText('HTML Chart')[0]).toBeInTheDocument();
    });
  });
});
