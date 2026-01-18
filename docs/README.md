# DataGVAT MCP Documentation

This directory contains the documentation site for the DataGVAT MCP Server, built with [Next.js](https://nextjs.org/) and [Fumadocs](https://fumadocs.vercel.app/).

## Features

- 📚 Multi-language support (English & German)
- 🎨 Modern, responsive design with dark mode
- 🔍 Full-text search
- 📖 Auto-generated API documentation
- ⚡ Built with Next.js 16 (Turbopack)
- 💬 User feedback system with GitHub Discussions integration

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended package manager)

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev

# The site will be available at http://localhost:3000
```

### Building for Production

```bash
# Build the site
pnpm build

# Start the production server
pnpm start
```

## Project Structure

```
docs/
├── app/                  # Next.js app router pages
│   ├── [lang]/          # Localized routes
│   └── layout.tsx       # Root layout
├── components/          # React components
├── content/            # MDX documentation content
│   └── docs/           # Documentation pages
│       ├── api/        # API reference
│       ├── guides/     # How-to guides
│       ├── tutorials/  # Step-by-step tutorials
│       ├── examples/   # Code examples
│       └── best-practices/
├── lib/                # Utility functions
└── public/             # Static assets
```

## Writing Documentation

Documentation is written in MDX format. Each page should have both English (`.mdx`) and German (`.de.mdx`) versions.

### Example

```mdx
---
title: My Page
description: A brief description
---

# My Page

Content goes here...
```

### Using Feedback Blocks

You can add feedback blocks to allow users to provide targeted feedback on specific sections:

```mdx
<FeedbackBlock id="unique-id" body="Brief description">
  Your content here. Users can click the message icon to provide feedback.
</FeedbackBlock>
```

## Technologies

- **Next.js 16** - React framework
- **Fumadocs** - Documentation framework
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety
- **Shiki** - Syntax highlighting

## License

MIT
