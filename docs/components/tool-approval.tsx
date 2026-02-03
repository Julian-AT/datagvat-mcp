'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { CodePreview } from '@/components/code-preview';
import { Tool, ToolContent, ToolHeader, ToolApprovalContent } from '@/components/elements/tool';
import { Button } from '@/components/ui/button';

interface ToolApprovalProps {
  toolCallId: string;
  toolName: string;
  code: string;
  files?: Array<{ path: string; content: string }>;
  onApprove: (toolCallId: string, approved: boolean, reason?: string) => void;
}

export function ToolApproval({
  toolCallId,
  toolName,
  code,
  files,
  onApprove,
}: ToolApprovalProps) {
  const [isOpen, setIsOpen] = useState(true); // Auto-expand for visibility

  return (
    <Tool defaultOpen={isOpen} onOpenChange={setIsOpen} className="w-full">
      <ToolHeader state="approval-requested" type={toolName} />
      <ToolContent>
        <ToolApprovalContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium text-sm">Code to Execute:</h4>
              <CodePreview code={code} maxHeight="400px" />
              {files && files.length > 0 && (
                <p className="mt-2 text-muted-foreground text-xs">
                  + {files.length} additional file{files.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => onApprove(toolCallId, true)}
                className="flex-1"
                variant="default"
              >
                <CheckIcon className="mr-2 size-4" />
                Approve & Execute
              </Button>
              <Button
                onClick={() => onApprove(toolCallId, false, 'User denied execution')}
                className="flex-1"
                variant="outline"
              >
                <XIcon className="mr-2 size-4" />
                Deny
              </Button>
            </div>

            <p className="text-muted-foreground text-xs">
              Review the code above before approving. Execution will run in an isolated
              sandbox with a 30-second timeout.
            </p>
          </div>
        </ToolApprovalContent>
      </ToolContent>
    </Tool>
  );
}
