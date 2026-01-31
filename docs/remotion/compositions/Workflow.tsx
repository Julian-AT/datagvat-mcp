import type React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';

/**
 * Workflow Video - Key MCP Tool Demonstrations (4 minutes)
 *
 * Demonstrates:
 * 1. Dataset Discovery Workflow (search + filter + analyze)
 * 2. Quality Assessment Workflow (quality metrics + comparison)
 * 3. Data Preview Workflow (schema introspection + sample data)
 */

const WorkflowIntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <h1 style={{ fontSize: 72, color: 'white', margin: 0 }}>MCP Workflows</h1>
      <p style={{ fontSize: 36, color: '#94a3b8', marginTop: 20 }}>Real-World Examples</p>
    </AbsoluteFill>
  );
};

const DiscoveryWorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();

  const step1 = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const step2 = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });
  const step3 = interpolate(frame, [120, 140], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e293b', padding: 60, color: 'white' }}>
      <h2 style={{ fontSize: 48, marginBottom: 40 }}>Workflow 1: Dataset Discovery</h2>

      <div style={{ fontSize: 24, fontFamily: 'monospace' }}>
        <div style={{ opacity: step1, marginBottom: 30 }}>
          <div style={{ color: '#94a3b8', marginBottom: 8 }}>1. Search with filters</div>
          <div style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 8 }}>
            search_datasets(query="climate", theme="Environment", format="CSV")
          </div>
        </div>

        <div style={{ opacity: step2, marginBottom: 30 }}>
          <div style={{ color: '#94a3b8', marginBottom: 8 }}>2. Get detailed metadata</div>
          <div style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 8 }}>
            get_dataset(id="climate-data-austria-2024")
          </div>
        </div>

        <div style={{ opacity: step3 }}>
          <div style={{ color: '#94a3b8', marginBottom: 8 }}>3. Analyze quality</div>
          <div style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 8 }}>
            analyze_quality(id="climate-data-austria-2024")
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const QualityWorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e293b', padding: 60, color: 'white', opacity }}>
      <h2 style={{ fontSize: 48, marginBottom: 40 }}>Workflow 2: Quality Assessment</h2>

      <div style={{ fontSize: 28 }}>
        <div style={{ color: '#10b981', marginBottom: 20 }}>✓ Metadata completeness: 95%</div>
        <div style={{ color: '#10b981', marginBottom: 20 }}>✓ Update frequency: Monthly</div>
        <div style={{ color: '#f59e0b', marginBottom: 20 }}>⚠ Documentation: Partial</div>
        <div style={{ color: '#10b981' }}>✓ Format: Machine-readable CSV</div>
      </div>
    </AbsoluteFill>
  );
};

const PreviewWorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e293b', padding: 60, color: 'white', opacity }}>
      <h2 style={{ fontSize: 48, marginBottom: 40 }}>Workflow 3: Data Preview</h2>

      <div style={{ fontSize: 22, fontFamily: 'monospace' }}>
        <div style={{ backgroundColor: '#0f172a', padding: 20, borderRadius: 8 }}>
          <div style={{ color: '#94a3b8', marginBottom: 16 }}>Schema:</div>
          <div>date: string | temperature: float | location: string</div>
          <div style={{ color: '#94a3b8', marginTop: 20, marginBottom: 16 }}>Sample Data:</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #475569' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Temp</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 8 }}>2024-01-15</td>
                <td style={{ padding: 8 }}>-2.4°C</td>
                <td style={{ padding: 8 }}>Vienna</td>
              </tr>
              <tr>
                <td style={{ padding: 8 }}>2024-01-16</td>
                <td style={{ padding: 8 }}>1.2°C</td>
                <td style={{ padding: 8 }}>Vienna</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WorkflowVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={90}>
        <WorkflowIntroScene />
      </Sequence>
      <Sequence from={90} durationInFrames={2100}>
        <DiscoveryWorkflowScene />
      </Sequence>
      <Sequence from={2190} durationInFrames={2400}>
        <QualityWorkflowScene />
      </Sequence>
      <Sequence from={4590} durationInFrames={2610}>
        <PreviewWorkflowScene />
      </Sequence>
    </AbsoluteFill>
  );
};
