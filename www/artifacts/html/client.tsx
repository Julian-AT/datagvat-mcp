import { toast } from 'sonner';
import { Artifact } from '@/components/artifacts/create-artifact';
import { HtmlArtifact } from '@/components/artifacts/html-artifact';
import { CopyIcon } from '@/components/ui/icons';

export const htmlArtifact = new Artifact({
  kind: 'html',
  description: 'Interactive HTML content',
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + streamPart.data,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: (props) => {
    // During streaming, show code to avoid iframe reloading flicker
    if (props.status === 'streaming') {
      return (
        <div className="p-4 border rounded-md overflow-auto h-full font-mono text-xs bg-muted/50 whitespace-pre-wrap">
          {props.content}
        </div>
      );
    }

    // When idle, show the interactive artifact
    return (
      <HtmlArtifact
        content={props.content}
        title={props.title}
        height="100%"
        className="min-h-[500px] h-full border-none shadow-none"
        allowFullscreen={true}
        allowDownload={true}
      />
    );
  },
  actions: [
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy HTML code',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied HTML to clipboard!');
      },
    },
  ],
  toolbar: [],
});
