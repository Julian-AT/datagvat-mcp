'use client';

import { useState, type ReactNode } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, ExternalLink } from 'lucide-react';
import type { PageFeedback, BlockFeedback, ActionResponse } from './schema';

interface FeedbackProps {
  onSendAction: (feedback: PageFeedback) => Promise<ActionResponse>;
}

export function Feedback({ onSendAction }: FeedbackProps) {
  const [opinion, setOpinion] = useState<'positive' | 'negative' | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opinion) return;

    setIsSubmitting(true);
    try {
      const feedback: PageFeedback = {
        url: window.location.pathname,
        opinion,
        message: message || undefined,
      };

      const response = await onSendAction(feedback);
      setSubmitted(true);
      if (response.githubUrl) {
        setGithubUrl(response.githubUrl);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-6 my-8">
        <h3 className="text-lg font-semibold mb-2">Thank you for your feedback!</h3>
        <p className="text-sm text-muted-foreground">
          Your feedback helps us improve the documentation.
        </p>
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
          >
            View on GitHub <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 my-8">
      <h3 className="text-lg font-semibold mb-4">Was this page helpful?</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setOpinion('positive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
              opinion === 'positive'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => setOpinion('negative')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
              opinion === 'negative'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            No
          </button>
        </div>

        {opinion && (
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Tell us more (optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background"
              placeholder="What can we improve?"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

interface FeedbackBlockProps {
  id: string;
  body: string;
  children: ReactNode;
  onSendAction: (feedback: BlockFeedback) => Promise<ActionResponse>;
}

export function FeedbackBlock({
  id,
  body,
  children,
  onSendAction,
}: FeedbackBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const feedback: BlockFeedback = {
        url: window.location.pathname,
        blockId: id,
        blockBody: body,
        message,
      };

      const response = await onSendAction(feedback);
      setSubmitted(true);
      if (response.githubUrl) {
        setGithubUrl(response.githubUrl);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="rounded-lg border bg-card/50 p-4 pr-12">
        {children}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-accent transition-colors"
          title="Send feedback about this section"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      {isOpen && !submitted && (
        <form onSubmit={handleSubmit} className="mt-2 rounded-lg border bg-card p-4 space-y-3">
          <label htmlFor={`feedback-${id}`} className="text-sm font-medium">
            Feedback for this section
          </label>
          <textarea
            id={`feedback-${id}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm"
            placeholder="What would you like to share about this section?"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {submitted && (
        <div className="mt-2 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-sm text-primary hover:underline"
            >
              View on GitHub <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
