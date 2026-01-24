import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import * as FilesComponents from 'fumadocs-ui/components/files';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as icons from 'lucide-react';
import type { MDXComponents } from 'mdx/types';
import { Mermaid } from '@/components/mdx/mermaid';
import { APIPage } from '@/components/api-page';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...(icons as unknown as MDXComponents),
    ...defaultMdxComponents,
    ...TabsComponents,
    ...FilesComponents,
    Accordion,
    Accordions,
    Step,
    Steps,
    Mermaid,
    APIPage,
    ...components,
  } satisfies MDXComponents;
}

declare module 'mdx/types.js' {
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementClass = React.JSX.ElementClass;
    type ElementType = React.JSX.ElementType;
    type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
