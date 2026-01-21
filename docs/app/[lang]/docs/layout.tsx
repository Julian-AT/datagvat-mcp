import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/search';
import { source } from '@/lib/source';
import 'katex/dist/katex.min.css';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { baseOptions } from '@/lib/layout.shared';
import { getSection } from '@/lib/source/navigation';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;
  const base = baseOptions(lang);

  return (
    <DocsLayout
      {...base}
      tree={source.getPageTree(lang)}
      nav={{
        title: <Logo />,
      }}
      sidebar={{
        tabs: {
          transform(option, node) {
            const meta = source.getNodeMeta(node);
            if (!meta || !node.icon) return option;
            const color = `var(--${getSection(meta.path)}-color, var(--color-fd-foreground))`;

            return {
              ...option,
              icon: (
                <div
                  className="[&_svg]:size-full rounded-lg size-full text-(--tab-color) max-md:bg-(--tab-color)/10 max-md:border max-md:p-1.5"
                  style={
                    {
                      '--tab-color': color,
                    } as object
                  }
                >
                  {node.icon}
                </div>
              ),
            };
          },
        },
      }}
      githubUrl="https://github.com/julian-at/datagvat-mcp/"
    >
      {children}
      <AISearch>
        <AISearchPanel />
        <AISearchTrigger />
      </AISearch>
    </DocsLayout>
  );
}
