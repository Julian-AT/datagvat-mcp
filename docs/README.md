# data.gv.at MCP Documentation

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Fumadocs](https://img.shields.io/badge/Fumadocs-latest-blue)](https://fumadocs.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://typescriptlang.org)

Documentation site for the data.gv.at MCP Server.

**Live site:** [datagvat-mcp.vercel.app](https://datagvat-mcp.vercel.app)

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
│   ├── [lang]/        # i18n routes (en, de)
│   └── api/           # API routes (chat, search)
├── components/
│   ├── chat/          # Interactive chat interface
│   ├── ai/            # AI-related components
│   └── ui/            # shadcn UI components
└── lib/               # Utilities and config
```

## Key Features

- **i18n** — English and German translations
- **Interactive Chat** — Try the MCP server at `/try`
- **OpenAPI Docs** — Auto-generated API reference
- **Full-text Search** — Client-side search with Orama
- **MDX Components** — TryExample, Mermaid, code blocks with syntax highlighting

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
{/* Interactive example that links to /try with prefilled query */}
<TryExample query="Find datasets about Vienna" />

{/* Grid of examples */}
<TryExamples>
  <TryExample query="Search Vienna" />
  <TryExample query="Preview CSV" />
</TryExamples>

{/* Mermaid diagrams */}
<Mermaid chart={`graph TD; A-->B;`} />
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org) | Framework |
| [Fumadocs](https://fumadocs.vercel.app) | Documentation framework |
| [Tailwind CSS 4](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) | UI components |
| [Vercel AI SDK](https://sdk.vercel.ai) | Chat interface |
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
