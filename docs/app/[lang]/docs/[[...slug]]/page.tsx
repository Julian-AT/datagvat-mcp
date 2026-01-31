import Link from 'fumadocs-core/link';
import { findSiblings } from 'fumadocs-core/page-tree';
import { PathUtils } from 'fumadocs-core/source';
import * as Twoslash from 'fumadocs-twoslash/ui';
import { Banner } from 'fumadocs-ui/components/banner';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { DocsBody, DocsPage, PageLastUpdate } from 'fumadocs-ui/layouts/docs/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ComponentProps, FC, ReactNode } from 'react';
import { LLMCopyButton, ViewOptions } from '@/components/ai/page-actions';
import { Feedback, FeedbackBlock } from '@/components/feedback/client';
import { Mermaid } from '@/components/mdx/mermaid';
import * as Preview from '@/components/preview';
import { Customisation } from '@/components/preview/customisation';
import { Installation } from '@/components/preview/installation';
import { Wrapper } from '@/components/preview/wrapper';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { onBlockFeedbackAction, onPageFeedbackAction, owner, repo } from '@/lib/github';
import { createMetadata, getPageImage } from '@/lib/metadata';
import { source } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

function PreviewRenderer({ preview }: { preview: string }): ReactNode {
  if (preview && preview in Preview) {
    const Comp = Preview[preview as keyof typeof Preview];
    return <Comp />;
  }

  return null;
}

export const revalidate = false;

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[]; lang: string }>;
}) {
  const { slug, lang } = await params;
  const page = source.getPage(slug ?? [], lang);

  if (!page) {
    return notFound();
  }

  if (page.data.type === 'openapi') {
    const { APIPage } = await import('@/components/api-page');
    return (
      <DocsPage>
        <h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>

        <DocsBody>
          <APIPage {...page.data.getAPIPageProps()} />
        </DocsBody>
      </DocsPage>
    );
  }

  const { body: Mdx, toc, lastModified } = await page.data.load();

  return (
    <DocsPage
      toc={toc}
      tableOfContent={{
        style: 'clerk',
      }}
    >
      <h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>
      <p className="text-lg text-fd-muted-foreground mb-2">{page.data.description}</p>
      <div className="flex flex-row flex-wrap gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/${owner}/${repo}/blob/dev/apps/docs/content/docs/${page.path}`}
        />
      </div>
      <div className="prose flex-1 text-fd-foreground/90">
        {page.data.preview && <PreviewRenderer preview={page.data.preview} />}
        <Mdx
          // @ts-expect-error
          components={getMDXComponents({
            ...Twoslash,
            a: ({ href, ...props }: { href?: string; [key: string]: any }) => {
              const found = source.getPageByHref(href ?? '', {
                dir: PathUtils.dirname(page.path),
              });

              if (!found) {
                return <Link href={href} {...props} />;
              }

              return (
                <HoverCard>
                  <HoverCardTrigger
                    href={found.hash ? `${found.page.url}#${found.hash}` : found.page.url}
                    {...props}
                  >
                    {props.children}
                  </HoverCardTrigger>
                  <HoverCardContent className="text-sm">
                    <p className="font-medium">{found.page.data.title}</p>
                    <p className="text-fd-muted-foreground">{found.page.data.description}</p>
                  </HoverCardContent>
                </HoverCard>
              );
            },
            FeedbackBlock: ({
              children,
              ...props
            }: {
              children: React.ReactNode;
              id: string;
              // biome-ignore lint/suspicious/noExplicitAny: MDX component props are dynamic
              [key: string]: any;
            }) => (
              <FeedbackBlock {...props} id={props.id} onSendAction={onBlockFeedbackAction}>
                {children}
              </FeedbackBlock>
            ),
            Banner,
            Mermaid,
            TypeTable,
            Wrapper,
            blockquote: Callout as unknown as FC<ComponentProps<'blockquote'>>,
            DocsCategory: ({ url }: { url?: string }) => {
              return <DocsCategory url={url ?? page.url} lang={lang} />;
            },
            Installation,
            Customisation,
          })}
        />
        {page.data.index ? <DocsCategory url={page.url} lang={lang} /> : null}
      </div>
      <Feedback onSendAction={onPageFeedbackAction} />
      {lastModified && <PageLastUpdate date={lastModified} />}
    </DocsPage>
  );
}

function DocsCategory({ url, lang }: { url: string; lang: string }) {
  return (
    <Cards>
      {findSiblings(source.getPageTree(lang), url).map((item) => {
        if (item.type === 'separator') {
          return null;
        }
        if (item.type === 'folder') {
          if (!item.index) {
            return null;
          }
          item = item.index;
        }

        return (
          <Card key={item.url} title={item.name} href={item.url}>
            {item.description}
          </Card>
        );
      })}
    </Cards>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[]; lang: string }>;
}): Promise<Metadata> {
  const { slug = [], lang } = await params;
  const page = source.getPage(slug, lang);
  if (!page) {
    return createMetadata({
      title: 'Not Found',
    });
  }

  const description = page.data.description ?? 'The library for building documentation sites';

  const image = {
    url: getPageImage(page).url,
    width: 1200,
    height: 630,
  };

  return createMetadata({
    title: page.data.title,
    description,
    openGraph: {
      url: `/docs/${page.slugs.join('/')}`,
      images: [image],
    },
    twitter: {
      images: [image],
    },
  });
}

export function generateStaticParams() {
  return source.generateParams('slug', 'lang');
}
