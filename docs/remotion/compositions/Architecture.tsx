import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import type React from 'react';

/**
 * Architecture Video - System Design Overview (6 minutes)
 *
 * Explains:
 * 1. MCP Protocol Layer
 * 2. FastMCP Framework
 * 3. Enterprise Middleware (retry, rate limiting, logging)
 * 4. Piveau Hub API Integration
 * 5. Data Flow: User Query → MCP Tools → API → Response
 */

const ArchIntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, from: 0.8, to: 1, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0f172a',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `scale(${scale})`,
    }}>
      <h1 style={{ fontSize: 72, color: 'white', margin: 0 }}>Architecture Overview</h1>
      <p style={{ fontSize: 36, color: '#94a3b8', marginTop: 20 }}>How DataGvat MCP Works</p>
    </AbsoluteFill>
  );
};

const LayeredArchScene: React.FC = () => {
  const frame = useCurrentFrame();

  const layer1 = interpolate(frame, [0, 30], [-200, 0], { extrapolateRight: 'clamp' });
  const layer2 = interpolate(frame, [30, 60], [-200, 0], { extrapolateRight: 'clamp' });
  const layer3 = interpolate(frame, [60, 90], [-200, 0], { extrapolateRight: 'clamp' });
  const layer4 = interpolate(frame, [90, 120], [-200, 0], { extrapolateRight: 'clamp' });

  const layerStyle = (y: number) => ({
    position: 'absolute' as const,
    left: 100,
    right: 100,
    height: 120,
    backgroundColor: '#1e293b',
    border: '2px solid #3b82f6',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    transform: `translateX(${y}px)`,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', padding: 80 }}>
      <h2 style={{ fontSize: 48, color: 'white', marginBottom: 60 }}>Layered Architecture</h2>

      <div style={{ position: 'relative', height: 600 }}>
        <div style={{ ...layerStyle(layer1), top: 0 }}>MCP Protocol Layer</div>
        <div style={{ ...layerStyle(layer2), top: 150 }}>FastMCP Framework</div>
        <div style={{ ...layerStyle(layer3), top: 300 }}>Enterprise Middleware</div>
        <div style={{ ...layerStyle(layer4), top: 450 }}>Piveau Hub API Client</div>
      </div>
    </AbsoluteFill>
  );
};

const DataFlowScene: React.FC = () => {
  const frame = useCurrentFrame();

  const flowProgress = interpolate(frame, [0, 120], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e293b', padding: 60, color: 'white' }}>
      <h2 style={{ fontSize: 48, marginBottom: 40 }}>Data Flow</h2>

      <div style={{ fontSize: 24 }}>
        <div style={{ opacity: flowProgress > 0 ? 1 : 0, marginBottom: 30 }}>
          <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>1. User Query</span>
          <div style={{ marginLeft: 40, marginTop: 10, color: '#94a3b8' }}>
            "Find Vienna transport datasets"
          </div>
        </div>

        <div style={{ opacity: flowProgress > 25 ? 1 : 0, marginBottom: 30 }}>
          <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>2. MCP Tool Invocation</span>
          <div style={{ marginLeft: 40, marginTop: 10, fontFamily: 'monospace', fontSize: 20 }}>
            search_datasets(query="Vienna transport")
          </div>
        </div>

        <div style={{ opacity: flowProgress > 50 ? 1 : 0, marginBottom: 30 }}>
          <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>3. API Request</span>
          <div style={{ marginLeft: 40, marginTop: 10, fontFamily: 'monospace', fontSize: 20 }}>
            GET /api/hub/search?q=Vienna+transport
          </div>
        </div>

        <div style={{ opacity: flowProgress > 75 ? 1 : 0 }}>
          <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>4. Structured Response</span>
          <div style={{ marginLeft: 40, marginTop: 10, color: '#94a3b8' }}>
            12 datasets with metadata, quality scores, download links
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ArchitectureVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={90}><ArchIntroScene /></Sequence>
      <Sequence from={90} durationInFrames={3600}><LayeredArchScene /></Sequence>
      <Sequence from={3690} durationInFrames={7110}><DataFlowScene /></Sequence>
    </AbsoluteFill>
  );
};
