import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { FeedbackBlock } from '@/components/feedback/client';
import { onBlockFeedbackAction } from '@/lib/github';
import { ImageProps } from 'next/image';

export function useMDXComponents(components: any): any {
  return {
    ...defaultMdxComponents,
    ...components,
    img: (props: ImageProps) => <ImageZoom {...props} />,
    Accordion,
    Accordions,
    Tab,
    Tabs,
    Step,
    Steps,
    TypeTable,
    Callout,
    Card,
    Cards,
    File,
    Files,
    Folder,
    FeedbackBlock: (props: any) => (
      <FeedbackBlock {...props} onSendAction={onBlockFeedbackAction} />
    ),
  };
}
