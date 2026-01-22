import { generateDiff, displayDiff } from './diff.js';
import { describe, it, expect } from 'bun:test';

describe('generateDiff', () => {
  it('detects additions', () => {
    const diff = generateDiff('line1', 'line1\nline2');
    expect(diff.some(d => d.added)).toBe(true);
  });

  it('detects removals', () => {
    const diff = generateDiff('line1\nline2', 'line1');
    expect(diff.some(d => d.removed)).toBe(true);
  });

  it('handles no changes', () => {
    const diff = generateDiff('same', 'same');
    expect(diff.every(d => !d.added && !d.removed)).toBe(true);
  });

  it('handles empty strings', () => {
    const diff = generateDiff('', '');
    expect(diff.length).toBeGreaterThan(0);
  });

  it('detects multiple changes', () => {
    const oldContent = 'line1\nline2\nline3';
    const newContent = 'line1\nmodified\nline3\nline4';
    const diff = generateDiff(oldContent, newContent);

    expect(diff.some(d => d.added)).toBe(true);
    expect(diff.some(d => d.removed)).toBe(true);
  });
});

describe('displayDiff', () => {
  it('displays without errors', () => {
    const diff = generateDiff('old', 'new');
    // Should not throw
    displayDiff(diff);
  });
});
