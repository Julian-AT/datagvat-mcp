# data.gv.at MCP Documentation

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Fumadocs](https://img.shields.io/badge/Fumadocs-latest-blue)](https://fumadocs.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://typescriptlang.org)

Documentation site for the data.gv.at MCP Server.

**Live site:** [mcp.julianschmidt.cv](https://mcp.julianschmidt.cv)

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build for production
bun run build
```

Open [localhost:3000](http://localhost:3000) to view the docs.

## Structure

```
docs/
├── content/docs/      # MDX documentation content
│   ├── (docs)/        # Main docs (installation, guides, etc.)
│   ├── api/           # API reference
│   └── examples/      # Code examples
├── app/               # Next.js app router
│   └── [lang]/        # i18n routes (en, de)
├── components/
│   ├── ai/            # AI-related components
│   └── ui/            # shadcn UI components
└── lib/               # Utilities and config
```

## Key Features

- **i18n** — English and German translations
- **OpenAPI Docs** — Auto-generated API reference
- **Full-text Search** — Client-side search with Orama
- **MDX Components** — Mermaid diagrams, code blocks with syntax highlighting

## Writing Content

Content is written in MDX format in `content/docs/`.

```mdx
---
title: Page Title
description: Brief description
icon: IconName
---

Content with **markdown** and <Components />.
```

### Custom Components

```mdx
{/* Mermaid diagrams */}
<Mermaid chart={`graph TD; A-->B;`} />

{/* Callouts */}
<Callout type="info" title="Screenshot placeholder">
Description of what the screenshot will show.
</Callout>

{/* Tabs */}
<Tabs items={['macOS', 'Windows']}>
  <Tab value="macOS">macOS content</Tab>
  <Tab value="Windows">Windows content</Tab>
</Tabs>
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org) | Framework |
| [Fumadocs](https://fumadocs.vercel.app) | Documentation framework |
| [Tailwind CSS 4](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) | UI components |
| [Shiki](https://shiki.style) | Syntax highlighting |

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server |
| `bun run build` | Production build |
| `bun run validate` | Run all validation checks |
| `bun run lint:fix` | Fix linting issues |

## License

MIT
