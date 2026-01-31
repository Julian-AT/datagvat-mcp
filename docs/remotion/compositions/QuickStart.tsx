import type React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * QuickStart Video - Installation to First Query (2.5 minutes)
 *
 * Scenes:
 * 1. Title/Intro (0-90 frames / 0-3s)
 * 2. Installation Steps (90-1800 frames / 3s-60s)
 * 3. Configuration (1800-2700 frames / 60s-90s)
 * 4. First Query Demo (2700-4200 frames / 90s-140s)
 * 5. Outro (4200-4500 frames / 140s-150s)
 */

const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 30], [50, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{ backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <h1 style={{ fontSize: 72, fontWeight: 'bold', margin: 0 }}>DataGvat MCP</h1>
        <p style={{ fontSize: 36, marginTop: 20, color: '#94a3b8' }}>Quick Start Guide</p>
      </div>
    </AbsoluteFill>
  );
};

const InstallationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stagger appearance of installation steps
  const step1Opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const step2Opacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });
  const step3Opacity = interpolate(frame, [120, 140], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e293b', padding: 60, color: 'white' }}>
      <h2 style={{ fontSize: 48, marginBottom: 40 }}>Installation</h2>

      <div style={{ fontSize: 28, fontFamily: 'monospace', lineHeight: 1.8 }}>
        <div style={{ opacity: step1Opacity, marginBottom: 20 }}>
          <div style={{ color: '#94a3b8', marginBottom: 8 }}>Step 1: Install globally</div>
          <div style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 8 }}>
            $ npm install -g @datagvat/mcp-server
          </div>
        </div>

        <div style={{ opacity: step2Opacity, marginBottom: 20 }}>
          <div style={{ color: '#94a3b8', marginBottom: 8 }}>Step 2: Verify installation</div>
          <div style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 8 }}>
            $ datagvat --version
          </div>
        </div>

        <div style={{ opacity: step3Opacity }}>
          <div style={{ color: '#94a3b8', marginBottom: 8 }}>Step 3: Configure Claude Desktop</div>
          <div style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 8 }}>
            Edit claude_desktop_config.json
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ConfigScene: React.FC = () => {
  const frame = useCurrentFrame();

  const codeOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e293b', padding: 60, color: 'white' }}>
      <h2 style={{ fontSize: 48, marginBottom: 40 }}>Configuration</h2>

      <div style={{ opacity: codeOpacity, fontSize: 24, fontFamily: 'monospace' }}>
        <pre
          style={{
            backgroundColor: '#0f172a',
            padding: 24,
            borderRadius: 8,
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {`{
  "mcpServers": {
    "datagvat": {
      "command": "datagvat",
      "args": ["server"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
        </pre>
      </div>
    </AbsoluteFill>
  );
};

const FirstQueryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const queryOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const resultOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e293b', padding: 60, color: 'white' }}>
      <h2 style={{ fontSize: 48, marginBottom: 40 }}>Your First Query</h2>

      <div style={{ fontSize: 28 }}>
        <div style={{ opacity: queryOpacity, marginBottom: 40 }}>
          <div style={{ color: '#94a3b8', marginBottom: 12 }}>Ask Claude:</div>
          <div
            style={{
              backgroundColor: '#3b82f6',
              padding: 20,
              borderRadius: 8,
              fontStyle: 'italic',
            }}
          >
            "Find Vienna datasets about public transport"
          </div>
        </div>

        <div style={{ opacity: resultOpacity }}>
          <div style={{ color: '#94a3b8', marginBottom: 12 }}>Claude uses MCP tools:</div>
          <div
            style={{
              backgroundColor: '#0f172a',
              padding: 20,
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 20,
            }}
          >
            ✓ search_datasets(query="Vienna public transport")
            <br />✓ get_dataset(id="vienna-transport-2024")
            <br />✓ Found 12 relevant datasets
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontSize: 56, margin: 0 }}>You're Ready!</h2>
        <p style={{ fontSize: 32, marginTop: 20, color: '#94a3b8' }}>
          Explore the full documentation at datagvat.dev
        </p>
      </div>
    </AbsoluteFill>
  );
};

export const QuickStartVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={90}>
        <TitleScene />
      </Sequence>
      <Sequence from={90} durationInFrames={1710}>
        <InstallationScene />
      </Sequence>
      <Sequence from={1800} durationInFrames={900}>
        <ConfigScene />
      </Sequence>
      <Sequence from={2700} durationInFrames={1500}>
        <FirstQueryScene />
      </Sequence>
      <Sequence from={4200} durationInFrames={300}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
