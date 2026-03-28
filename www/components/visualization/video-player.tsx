interface VideoPlayerProps {
  /**
   * Path to video file (relative to /public)
   */
  src: string;
  /**
   * Path to WebVTT caption file (relative to /public)
   */
  captions: string;
  /**
   * Optional poster image (shown before play)
   */
  poster?: string;
  /**
   * Video title for accessibility
   */
  title: string;
}

/**
 * Accessible video player component with responsive sizing and captions
 *
 * Features:
 * - Responsive scaling (100% width, maintains aspect ratio)
 * - WebVTT captions with default enabled
 * - Native browser controls
 * - Fallback download link for unsupported browsers
 */
export function VideoPlayer({ src, captions, poster, title }: VideoPlayerProps) {
  return (
    <figure style={{ margin: '2rem 0' }}>
      <video
        controls
        width={1920}
        height={1080}
        poster={poster}
        preload="metadata"
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: '1920px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
        <track kind="captions" src={captions} srcLang="en" label="English" default />
        Your browser doesn't support HTML5 video.{' '}
        <a href={src} download style={{ color: '#3b82f6', textDecoration: 'underline' }}>
          Download the video
        </a>
      </video>
      <figcaption
        style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: '#64748b',
          textAlign: 'center',
        }}
      >
        {title}
      </figcaption>
    </figure>
  );
}
