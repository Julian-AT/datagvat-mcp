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

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { lang, slug = [] } = await params;
  const page = source.getPage(slug, lang);

  if (!page) notFound();

  const MDX = page.data.body;

  const components = useMDXComponents({
    a: createRelativeLink(source, page),
  });

  return (
    <DocsPage toc={page.data.toc}>
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
