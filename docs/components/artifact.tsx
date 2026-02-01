"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "lucide-react";

interface ArtifactProps {
  kind: "code" | "text";
  title?: string;
  language?: string;
  content: string;
}

export function Artifact({ kind, title, language, content }: ArtifactProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-sm font-medium">
            {title || (kind === "code" ? "Code" : "Document")}
          </span>
          {language && (
            <span className="text-xs text-muted-foreground uppercase">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="p-4">
        {kind === "code" ? (
          <pre className="text-sm overflow-x-auto">
            <code className={language ? `language-${language}` : ""}>
              {content}
            </code>
          </pre>
        ) : (
          <div className="prose dark:prose-invert max-w-none text-sm">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
