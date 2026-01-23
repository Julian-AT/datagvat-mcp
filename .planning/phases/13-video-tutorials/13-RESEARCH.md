# Phase 13: Video Tutorials - Research

**Researched:** 2026-01-23
**Domain:** Programmatic video generation with Remotion, accessibility, build-time rendering
**Confidence:** MEDIUM

## Summary

Remotion is a React-based framework for creating videos programmatically, enabling code-driven video generation with full control over timing, animations, and composition. The standard approach for documentation tutorial videos involves:

1. **Composition**: Build videos as React components with frame-based animations using `useCurrentFrame()`, `interpolate()`, and `spring()` for natural motion
2. **Build-time rendering**: Render videos during build phase using the CLI (`npx remotion render`) with caching to avoid re-renders
3. **Accessibility**: Generate WebVTT captions (manual or via Whisper AI) and provide them via `<track>` elements
4. **Hosting**: Store rendered videos in Next.js `/public` folder for small files (<100MB total), or use Vercel Blob for larger assets with CDN delivery
5. **Embedding**: Use native HTML5 `<video>` elements with `controls`, captions, and poster images in MDX files

The framework supports both local CLI rendering and AWS Lambda for distributed rendering. For documentation sites with 3-5 videos totaling <5 minutes of content, local build-time rendering with file caching is cost-effective and keeps builds under 5 minutes.

**Primary recommendation:** Use Remotion CLI rendering during build phase with video output caching (check file timestamps), store videos in `/public` folder, generate captions with Whisper AI, and embed with accessible HTML5 video elements.

## Standard Stack

The established libraries/tools for programmatic video generation:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| remotion | 4.0+ | React-based video framework | Industry standard for programmatic video, frame-accurate control, extensive templates |
| @remotion/renderer | 4.0+ | Server-side rendering API | Official rendering engine for CLI and programmatic builds |
| @remotion/cli | 4.0+ | Command-line rendering | Standard tool for build-time video generation |
| @remotion/captions | 4.0.216+ | Caption utilities | Official caption handling, converts various formats to canonical Caption type |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @remotion/lambda | 4.0+ | AWS Lambda distributed rendering | Large-scale rendering (many videos, >80 min each) |
| openai-whisper | Latest | Speech-to-text transcription | Automated caption generation from audio tracks |
| ffmpeg | Latest | Video encoding engine | Required dependency for Remotion rendering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Remotion CLI (local) | Remotion Lambda (AWS) | Lambda: faster parallel rendering but adds AWS costs (~pennies/video), infrastructure complexity; CLI: free, simpler, adequate for <10 videos |
| Remotion | Manual video editing (iMovie, Premiere) | Manual: requires human time for every edit, no programmatic updates; Remotion: initial learning curve but full automation |
| WebVTT captions | Hardcoded subtitles in video | Hardcoded: not accessible to screen readers, can't be disabled; WebVTT: proper accessibility, customizable styling |

**Installation:**
```bash
# For new Remotion project (not needed if adding to existing Next.js)
bun create video

# Add to existing Next.js project
bun add remotion @remotion/cli @remotion/renderer @remotion/captions

# Install ffmpeg (required system dependency)
# macOS: brew install ffmpeg
# Ubuntu: apt-get install ffmpeg
# Windows: download from ffmpeg.org

# Optional: Whisper for caption generation
pip install -U openai-whisper
```

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── remotion/                # Video source files
│   ├── compositions/        # Video composition components
│   │   ├── QuickStart.tsx  # 2-3 min installation video
│   │   ├── Workflow.tsx    # 3-5 min workflow demonstrations
│   │   └── Architecture.tsx # 5-7 min system overview
│   ├── assets/             # Images, logos for videos
│   ├── Root.tsx            # Register all compositions
│   └── remotion.config.ts  # Remotion configuration
├── public/
│   └── videos/             # Rendered output (gitignored or committed based on size)
│       ├── quickstart.mp4
│       ├── quickstart.vtt  # Captions
│       ├── workflow-*.mp4
│       └── architecture.mp4
├── scripts/
│   ├── render-videos.ts    # Build-time rendering script
│   └── generate-captions.ts # Whisper-based caption generation
└── content/docs/
    └── tutorials/
        └── videos.mdx      # MDX with embedded videos
```

### Pattern 1: Composition Component Structure
**What:** Define videos as React components with metadata (fps, dimensions, duration)
**When to use:** Every video composition in Remotion

**Example:**
```typescript
// Source: https://www.remotion.dev/docs/the-fundamentals
import { Composition } from 'remotion';

// In Root.tsx - register compositions
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="QuickStart"
        component={QuickStartVideo}
        durationInFrames={4500}  // 2.5 min at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

// In compositions/QuickStart.tsx
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

export const QuickStartVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      <h1>Installation Guide</h1>
      <p>Frame: {frame}</p>
    </AbsoluteFill>
  );
};
```

### Pattern 2: Frame-Based Animation with interpolate()
**What:** Map frame ranges to property values for smooth animations
**When to use:** Any property animation (opacity, position, scale, rotation)

**Example:**
```typescript
// Source: https://www.remotion.dev/docs/animating-properties
import { useCurrentFrame, interpolate } from 'remotion';

export const AnimatedTitle = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();

  // Fade in over first 30 frames (1 second at 30fps)
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp'  // Stay at 1 after frame 30
  });

  // Slide in from left
  const translateX = interpolate(frame, [0, 30], [-100, 0], {
    extrapolateRight: 'clamp'
  });

  return (
    <h1 style={{
      opacity,
      transform: `translateX(${translateX}px)`,
      fontSize: 100
    }}>
      {text}
    </h1>
  );
};
```

### Pattern 3: Scene Sequencing with <Sequence>
**What:** Time and offset multiple scenes within a composition
**When to use:** Multi-scene videos (intro → demo → outro)

**Example:**
```typescript
// Source: https://www.remotion.dev/docs/sequence
import { Sequence, AbsoluteFill } from 'remotion';

export const WorkflowVideo = () => {
  return (
    <AbsoluteFill>
      {/* Intro scene: frames 0-90 (3 seconds) */}
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>

      {/* Demo scene: frames 90-270 (6 seconds) */}
      <Sequence from={90} durationInFrames={180}>
        <DemoScene />
      </Sequence>

      {/* Outro: frames 270-330 (2 seconds) */}
      <Sequence from={270} durationInFrames={60}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### Pattern 4: Build-Time Rendering with Caching
**What:** Render videos during build only if source files changed
**When to use:** CI/CD pipelines with build time constraints

**Example:**
```typescript
// scripts/render-videos.ts
import { renderMedia } from '@remotion/renderer';
import { existsSync, statSync } from 'fs';
import path from 'path';

async function renderIfNeeded(compositionId: string, outputPath: string) {
  const sourceDir = path.join(process.cwd(), 'remotion');
  const outputExists = existsSync(outputPath);

  if (outputExists) {
    // Check if source files are newer than output
    const outputTime = statSync(outputPath).mtime.getTime();
    const sourceTime = getNewestFileTime(sourceDir);

    if (sourceTime < outputTime) {
      console.log(`✓ ${compositionId} is up to date`);
      return;
    }
  }

  console.log(`Rendering ${compositionId}...`);
  await renderMedia({
    composition: {
      id: compositionId,
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 4500
    },
    serveUrl: 'http://localhost:3000',
    codec: 'h264',
    outputLocation: outputPath,
    concurrency: '50%',  // Use half CPU cores
    crf: 21  // Good quality/size balance
  });
}

// In package.json scripts:
// "prebuild": "bun run scripts/render-videos.ts && next build"
```

### Pattern 5: Accessible Video Embedding in MDX
**What:** Embed videos with captions, controls, and fallback content
**When to use:** All video embeds in documentation

**Example:**
```tsx
// In content/docs/tutorials/videos.mdx or as React component
export function TutorialVideo({
  src,
  captions,
  poster
}: {
  src: string;
  captions: string;
  poster?: string;
}) {
  return (
    <video
      controls
      width={1920}
      height={1080}
      poster={poster}
      preload="metadata"
      style={{ width: '100%', height: 'auto' }}
    >
      <source src={src} type="video/mp4" />
      <track
        kind="captions"
        src={captions}
        srcLang="en"
        label="English"
        default
      />
      Your browser doesn't support HTML5 video.
      <a href={src} download>Download the video</a>
    </video>
  );
}

// Usage in MDX:
<TutorialVideo
  src="/videos/quickstart.mp4"
  captions="/videos/quickstart.vtt"
  poster="/videos/quickstart-poster.jpg"
/>
```

### Anti-Patterns to Avoid

- **CSS Transitions/Animations:** Don't use CSS `transition` or `@keyframes` — these cause flicker during frame-by-frame rendering. Always drive animations with `useCurrentFrame()` and `interpolate()`.

- **Runtime Rendering in Production:** Don't render videos on-demand in production API routes. Pre-render during build or use Remotion Lambda for serverless rendering.

- **Ignoring Accessibility:** Don't skip captions or transcripts. WCAG 2.1 Level A requires captions for all prerecorded video with audio.

- **Hardcoded Frame Numbers:** Don't hardcode frame numbers like `frame === 120`. Use `interpolate()` ranges and `fps` from `useVideoConfig()` to make compositions duration-agnostic.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Caption file parsing | Custom SRT/WebVTT parser | `@remotion/captions` | Handles multiple formats (SRT, WebVTT, Whisper JSON), canonical Caption type, edge cases |
| Speech-to-text | Custom audio transcription | OpenAI Whisper | State-of-the-art accuracy, 99+ language support, proven on billions of audio hours |
| Video encoding | Direct ffmpeg commands | `@remotion/renderer` renderMedia() | Handles frame rendering, parallel encoding, codec selection, progress tracking, error recovery |
| Animation easing | Manual easing functions | Remotion `spring()` and `interpolate()` | Physics-based natural motion, tested easing curves, extrapolation control |
| Scene timing | Manual frame math | `<Sequence>` component | Declarative timing, nested sequences, automatic frame offset calculation |

**Key insight:** Video generation has complex edge cases (codec compatibility, frame-perfect timing, parallel encoding). Use Remotion's high-level APIs instead of low-level ffmpeg commands.

## Common Pitfalls

### Pitfall 1: Build Time Explosion Without Caching
**What goes wrong:** Every build re-renders all videos, blowing past 5-minute budget (rendering 10 minutes of 1080p video takes ~10-15 minutes)

**Why it happens:** Default setup has no caching — `npx remotion render` always re-renders

**How to avoid:**
1. Check output file timestamps before rendering
2. Hash source file contents and store in metadata
3. Only render if source changed or output missing
4. Use GitHub Actions cache for rendered videos

**Warning signs:**
- Build time increases linearly with video count
- CI/CD minutes consumed rapidly
- No "video already rendered" logs

### Pitfall 2: Missing WCAG Accessibility Requirements
**What goes wrong:** Videos deployed without captions fail WCAG 2.1 Level A compliance

**Why it happens:** Captions feel optional, Whisper step requires extra setup

**How to avoid:**
1. Generate captions with Whisper during build: `whisper video.mp4 --model turbo --output_format vtt`
2. Review and correct auto-generated captions (names, technical terms)
3. Add `<track>` element to every video embed with `default` attribute
4. Provide transcript link below video

**Warning signs:**
- `<video>` elements without `<track>` children
- Missing `.vtt` files in `/public/videos/`
- No transcript or caption download option

### Pitfall 3: Incorrect Codec/Format for Web
**What goes wrong:** Videos don't play in browsers (Safari, Firefox) or file sizes are huge

**Why it happens:** Default codec settings may not include web-optimized flags

**How to avoid:**
1. Always use `codec: 'h264'` (not h265, vp9 unless testing)
2. Set `crf: 21-23` for quality/size balance (lower = bigger/better, 18 = visually lossless, 28 = small/lower quality)
3. Add `-movflags +faststart` via ffmpeg override for progressive download
4. Use `pixelFormat: 'yuv420p'` for broad player compatibility
5. Test in Safari, Firefox, Chrome before deploying

**Warning signs:**
- "Video format not supported" errors
- 2-minute video exceeds 50MB (should be ~20-30MB at 1080p with CRF 21)
- Video requires full download before playing (no progressive playback)

### Pitfall 4: Lambda Costs for Small Projects
**What goes wrong:** Using Remotion Lambda for 3-5 tutorial videos incurs unnecessary AWS costs and complexity

**Why it happens:** Lambda docs are prominent, looks "professional"

**How to avoid:**
1. Use local CLI rendering for <10 videos
2. Only use Lambda if:
   - Rendering >50 videos regularly
   - Individual videos >30 minutes
   - Need sub-5-minute rendering of long content
3. Estimate costs: 5 videos × 3 min each × $0.02/video = ~$0.10 but adds S3, function setup

**Warning signs:**
- AWS credentials required for docs build
- S3 buckets created for tutorial videos
- Lambda functions with <10 invocations/month

### Pitfall 5: No Source Control for Rendered Videos
**What goes wrong:** Rendered videos committed to git, bloating repository size

**Why it happens:** Videos in `/public` are easy to commit

**How to avoid:**
1. Add `/public/videos/*.mp4` to `.gitignore`
2. Keep `.vtt` caption files in git (small, text)
3. Render videos in CI/CD and deploy artifacts
4. Alternative: Commit videos if <10MB total and rarely change (docs convenience vs repo size)

**Warning signs:**
- Git repository >100MB
- Slow clones
- "Large files detected" warnings

### Pitfall 6: Hardcoded Dimensions Breaking Mobile
**What goes wrong:** 1920×1080 videos overflow mobile screens, require horizontal scrolling

**Why it happens:** Forgetting responsive CSS for video elements

**How to avoid:**
```tsx
<video
  controls
  width={1920}  // Intrinsic size for poster
  height={1080}
  style={{
    width: '100%',      // Responsive width
    height: 'auto',     // Maintain aspect ratio
    maxWidth: '1920px'  // Don't upscale beyond source
  }}
>
```

**Warning signs:**
- Videos wider than viewport on mobile
- Horizontal scroll bars on video pages
- Poor mobile UX reports

## Code Examples

Verified patterns from official sources:

### Caption Generation with Whisper
```bash
# Install Whisper
pip install -U openai-whisper

# Generate VTT captions from video audio
whisper public/videos/quickstart.mp4 \
  --model turbo \
  --output_format vtt \
  --output_dir public/videos \
  --language en

# Result: public/videos/quickstart.vtt
```

### CLI Rendering Command
```bash
# Source: https://www.remotion.dev/docs/cli/render
npx remotion render \
  src/index.ts \
  QuickStart \
  public/videos/quickstart.mp4 \
  --codec h264 \
  --crf 21 \
  --concurrency 50% \
  --overwrite
```

### Build Script with Caching
```typescript
// scripts/render-videos.ts
import { renderMedia } from '@remotion/renderer';
import { existsSync } from 'fs';

const videos = [
  { id: 'QuickStart', output: 'public/videos/quickstart.mp4', duration: 4500 },
  { id: 'Workflow', output: 'public/videos/workflow.mp4', duration: 5400 },
];

for (const video of videos) {
  if (existsSync(video.output)) {
    console.log(`✓ ${video.id} cached`);
    continue;
  }

  console.log(`Rendering ${video.id}...`);
  await renderMedia({
    composition: {
      id: video.id,
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: video.duration,
    },
    serveUrl: 'http://localhost:3000',
    codec: 'h264',
    outputLocation: video.output,
    crf: 21,
    concurrency: '50%',
  });
}
```

### WebVTT Caption File Format
```
WEBVTT

00:00.000 --> 00:03.000
Welcome to the DataGvat MCP quick start guide.

00:03.500 --> 00:07.000
First, install the MCP server with: npm install -g datagvat-mcp

00:07.500 --> 00:11.000
Next, configure your Claude Desktop settings.

00:11.500 --> 00:15.000
Add the server configuration to claude_desktop_config.json
```

### Responsive Video Component
```tsx
// components/VideoPlayer.tsx
interface VideoPlayerProps {
  src: string;
  captions: string;
  poster?: string;
  title: string;
}

export function VideoPlayer({ src, captions, poster, title }: VideoPlayerProps) {
  return (
    <figure>
      <video
        controls
        width={1920}
        height={1080}
        poster={poster}
        preload="metadata"
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px'
        }}
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
        <track
          kind="captions"
          src={captions}
          srcLang="en"
          label="English"
          default
        />
        Your browser doesn't support HTML5 video.{' '}
        <a href={src} download>Download the video</a>
      </video>
      <figcaption>{title}</figcaption>
    </figure>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual screen recording | Programmatic composition (Remotion) | 2021+ | Reproducible, updatable videos; can regenerate with code/data changes |
| Hardcoded subtitles in video | WebVTT/SRT external captions | WCAG 2.1 (2018) | Accessibility compliance, user-controllable captions, SEO benefits |
| 2-pass encoding for web | CRF single-pass with faststart | ffmpeg modern defaults | Simpler workflow, similar quality, faster encoding |
| After Effects/Premiere rendering | Code-based video frameworks | 2020+ | Non-designers can create videos, version control, automation |

**Deprecated/outdated:**
- **Remotion Lambda v2**: Use v4+ with improved error handling and cost optimization
- **Manual ffmpeg commands**: Use `@remotion/renderer` renderMedia() API for better defaults
- **SRT captions only**: WebVTT is now standard for web (HTML5 `<track>` element)

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal CRF value for documentation videos**
   - What we know: CRF 18 = visually lossless (~50MB for 2-min 1080p), CRF 23 = default (~20MB), CRF 28 = noticeable compression (~10MB)
   - What's unclear: Best balance for code demonstrations (high detail) vs talking head segments
   - Recommendation: Start with CRF 21, test with actual content, adjust per video if needed

2. **Vercel Blob vs public folder threshold**
   - What we know: Vercel Blob costs $0.023/GB storage + $0.050/GB transfer (iad1), free tier 5GB storage + 100GB transfer
   - What's unclear: Exact total video size after rendering 3-5 videos at 2-7 minutes each
   - Recommendation: Render to `/public` first, measure total size; if >50MB total, consider Blob; if >100MB, use Blob to avoid git bloat

3. **GitHub Actions rendering time vs free tier limits**
   - What we know: Free tier = 2,000 minutes/month, 1080p rendering ~2-3× realtime (10 min video = 20-30 min render)
   - What's unclear: With caching, how often will videos need re-rendering in CI?
   - Recommendation: Implement file-based caching first, monitor Actions minutes usage for first month, switch to Lambda if exceeding budget

4. **Whisper model selection (tiny vs turbo vs base)**
   - What we know: Whisper "turbo" is fastest, "base" more accurate, "tiny" smallest but less accurate
   - What's unclear: Accuracy difference for English-only technical documentation narration
   - Recommendation: Use "turbo" initially, manually review/correct captions, switch to "base" if accuracy issues

## Sources

### Primary (HIGH confidence)
- [Remotion Documentation](https://www.remotion.dev/docs) - Installation, composition patterns, rendering API (accessed 2026-01-23)
- [Remotion Renderer API](https://www.remotion.dev/docs/renderer) - renderMedia() function, caching options
- [Remotion CLI render command](https://www.remotion.dev/docs/cli/render) - CLI flags, output paths, caching
- [Remotion The Fundamentals](https://www.remotion.dev/docs/the-fundamentals) - Composition structure, useCurrentFrame, animations
- [Remotion Animating Properties](https://www.remotion.dev/docs/animating-properties) - interpolate(), spring() patterns
- [Remotion Sequence](https://www.remotion.dev/docs/sequence) - Scene timing, layout patterns
- [Remotion Captions Package](https://www.remotion.dev/docs/captions/api) - Caption utilities, formats
- [Remotion Lambda](https://www.remotion.dev/docs/lambda) - AWS Lambda rendering service, pricing
- [Remotion Templates](https://www.remotion.dev/templates) - Available starter templates
- [MDN WebVTT API](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API) - WebVTT format, browser support
- [MDN HTML Video Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) - Video embedding, accessibility
- [W3C WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1) - Accessibility requirements for video
- [OpenAI Whisper GitHub](https://github.com/openai/whisper) - Speech recognition model, usage
- [FFmpeg H.264 Encoding Guide](https://trac.ffmpeg.org/wiki/Encode/H.264) - CRF values, presets, web optimization
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob) - Features, use cases, caching
- [Vercel Blob Pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing) - Costs, limits, operation rates

### Secondary (MEDIUM confidence)
- [Remotion Player docs](https://www.remotion.dev/docs/player) - Runtime customization patterns (limited performance tips found)

### Tertiary (LOW confidence)
- YouTube recommended encoding settings - Could not fetch complete bitrate table; using ffmpeg wiki values instead
- Remotion best practices page (404) - Relied on fundamentals docs and renderer docs for best practices
- GitHub Actions caching for Remotion - No official guide found; standard Actions cache patterns apply

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Remotion documentation comprehensive, active v4.0+ releases
- Architecture: HIGH - Official composition patterns, API examples well-documented
- Pitfalls: MEDIUM - Inferred from common web video issues + Remotion limitations (no dedicated troubleshooting doc found)
- Accessibility: HIGH - WCAG 2.1 specification is authoritative, WebVTT is W3C standard
- Video encoding: HIGH - FFmpeg wiki is community-maintained expert resource
- Hosting costs: MEDIUM - Vercel Blob pricing documented but file size estimates are ballpark
- Build caching: MEDIUM - Standard practice but no Remotion-specific caching guide found

**Research date:** 2026-01-23
**Valid until:** ~2026-03-23 (60 days - Remotion under active development, may have updates)
