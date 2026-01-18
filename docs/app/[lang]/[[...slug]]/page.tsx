import { source } from "@/lib/source";
import { notFound } from "next/navigation";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { useMDXComponents } from "@/mdx-components";
import { Feedback } from '@/components/feedback/client';
import { onPageFeedbackAction } from '@/lib/github';
import { Breadcrumb } from '@/components/breadcrumb';
import { LLMCopyButton, ViewOptions } from "@/components/page-actions";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { lang, slug } = await params;
  const page = source.getPage(slug || [], lang);

  if (!page) notFound();

  const MDX = page.data.body;

  const components = useMDXComponents({
    a: createRelativeLink(source, page),
  });

  return (
    <DocsPage toc={page.data.toc} tableOfContent={{
      style: "clerk",
    }} breadcrumb={<Breadcrumb tree={source.pageTree[lang]} />}>
      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/${owner}/${repo}/blob/dev/apps/docs/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
      <Feedback onSendAction={onPageFeedbackAction} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { lang, slug = [] } = await params;
  const page = source.getPage(slug, lang);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
