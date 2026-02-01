"use client";

import { type UIMessage } from "ai";
import { Artifact } from "./artifact";
import { Canvas } from "./canvas";
import { Response } from "@/components/ai-elements/response";

interface MessageProps {
  message: UIMessage;
}

export function Message({ message }: MessageProps) {
  return (
    <div
      className="flex flex-col gap-4"
      data-role={message.role}
    >
      {message.parts.map((part: any, index: number) => {
        const key = `${message.id}-part-${index}`;

        // Text parts - render as markdown
        if (part.type === "text") {
          return (
            <div key={key} className="prose dark:prose-invert max-w-none">
              <Response>{part.text}</Response>
            </div>
          );
        }

        // Tool call parts - show tool invocation
        if (part.type === "tool-call") {
          return (
            <div key={key} className="border rounded-lg p-3 bg-muted/50">
              <div className="font-mono text-sm">
                <span className="text-muted-foreground">Calling:</span>{" "}
                <span className="font-semibold">{part.toolName}</span>
              </div>
              <pre className="mt-2 text-xs overflow-x-auto">
                {JSON.stringify(part.args, null, 2)}
              </pre>
            </div>
          );
        }

        // Tool result parts - show result
        if (part.type === "tool-result") {
          return (
            <div key={key} className="border rounded-lg p-3 bg-muted/30">
              <div className="font-mono text-sm text-muted-foreground mb-2">
                Result from {part.toolName}
              </div>
              <div className="text-sm">
                {typeof part.result === "string"
                  ? part.result
                  : <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(part.result, null, 2)}
                    </pre>
                }
              </div>
            </div>
          );
        }

        // Visualization parts - render in Canvas
        if (part.type === "visualization") {
          const vizPart = part as any;
          return (
            <Canvas
              key={key}
              url={vizPart.url}
              format={vizPart.format}
              metadata={vizPart.metadata}
            />
          );
        }

        // File parts - render based on MIME type
        if (part.type === "file") {
          if (part.data?.startsWith("image/") || part.mimeType?.startsWith("image/")) {
            return (
              <img
                key={key}
                src={part.data || ""}
                alt={part.name || "Uploaded file"}
                className="max-w-md rounded-lg"
              />
            );
          }
          return (
            <a
              key={key}
              href={part.data || ""}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {part.name || "Download file"}
            </a>
          );
        }

        return null;
      })}
    </div>
  );
}
