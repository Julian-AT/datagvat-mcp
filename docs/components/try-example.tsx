'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';

interface TryExampleProps {
  /** The query to prefill in the chat */
  query: string;
  /** Optional label (defaults to the query text) */
  label?: string;
  /** Optional description shown below the label */
  description?: string;
}

/**
 * Interactive button that links to the Try page with a prefilled query.
 *
 * Usage in MDX:
 * ```mdx
 * <TryExample query="Find datasets about Vienna population" />
 * ```
 *
 * With custom label:
 * ```mdx
 * <TryExample
 *   query="Find datasets about Vienna population"
 *   label="Search for population data"
 *   description="Explore demographic datasets from Vienna"
 * />
 * ```
 */
export function TryExample({ query, label, description }: TryExampleProps) {
  const encodedQuery = encodeURIComponent(query);

  return (
    <Link
      href={`/try?q=${encodedQuery}`}
      className="group flex items-start gap-3 p-4 my-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-accent transition-colors no-underline"
    >
      <div className="flex-shrink-0 p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Play className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground group-hover:text-foreground">
          {label || query}
        </div>
        {description && (
          <div className="text-sm text-muted-foreground mt-0.5">
            {description}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span>Try this query</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Grid of example queries for showcasing multiple options.
 *
 * Usage in MDX:
 * ```mdx
 * <TryExamples>
 *   <TryExample query="Find datasets about Vienna" />
 *   <TryExample query="Show energy statistics" />
 * </TryExamples>
 * ```
 */
export function TryExamples({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 my-4">
      {children}
    </div>
  );
}
