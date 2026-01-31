# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

**Primary:**
- TypeScript - Documentation site (`docs/`)
- Python 3.11+ - MCP server (`mcp/`)

**Secondary:**
- JavaScript (ESM) - Configuration files

## Runtime

**Environment:**
- Node.js >=18.0.0 (documentation site)
- Python 3.11+ (MCP server)
- Bun (package manager and lockfile for docs)

**Package Manager:**
- Bun (docs)
- uv (Python, MCP server)
- Lockfile: `docs/bun.lock`, `mcp/uv.lock`

## Frameworks

**Core:**
- Next.js 16.1.3 - React framework for documentation site
- FastMCP 2.14.0+ - Model Context Protocol server framework
- React 19.2.4 - UI framework

**Testing:**
- pytest >=8.0.0 - Python testing framework
- pytest-asyncio >=0.23.0 - Async test support
- pytest-cov >=4.1.0 - Coverage reporting
- pytest-mock >=3.12.0 - Mocking utilities

**Build/Dev:**
- TypeScript 5.9.3 - Type checking
- Biome 2.3.11 - Linting and formatting for TypeScript
- Ruff >=0.4.0 - Python linting and formatting
- Tailwind CSS 4.1.18 - Styling framework
- PostCSS 8.5.6 - CSS processing
- Remotion 4.0.244 - Video generation framework

## Key Dependencies

**Critical:**
- ai 6.0.64 - Vercel AI SDK for streaming and chat
- @ai-sdk/mcp 1.0.16 - MCP client integration for AI SDK
- @ai-sdk/google 3.0.18 - Google AI provider
- @ai-sdk/openai-compatible 2.0.24 - OpenAI-compatible provider
- @ai-sdk/react 3.0.66 - React hooks for AI SDK
- @modelcontextprotocol/sdk 1.25.3 - MCP SDK
- fumadocs-ui 16.4.11 - Documentation UI components
- fumadocs-mdx 14.2.6 - MDX processing for docs
- fumadocs-openapi 10.2.7 - OpenAPI documentation
- httpx >=0.27.0 - HTTP client for Python
- rdflib >=7.0.0 - RDF parsing for data.gv.at
- pydantic >=2.0.0 - Data validation for Python
- typer >=0.12.0 - CLI framework for Python

**Infrastructure:**
- redis 5.10.0 - Caching and stream storage
- resumable-stream 2.2.10 - Stream resumption support
- @vercel/functions 3.4.0 - Vercel serverless functions
- @vercel/analytics 1.6.1 - Analytics tracking
- @vercel/speed-insights 1.3.1 - Performance monitoring

## Configuration

**Environment:**
- Configured via `.env.local` and `.env.example` in `docs/`
- Required variables: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` (optional for docs)
- Optional: `REDIS_URL` (for stream resumption)
- Python env vars: `AUSTRIA_MCP_LOG_LEVEL`, `PIVEAU_API_BASE`, etc.

**Build:**
- `docs/next.config.mjs` - Next.js configuration with MDX support
- `docs/tsconfig.json` - TypeScript compiler options (ES2022 target, bundler resolution)
- `mcp/pyproject.toml` - Python project configuration (hatchling build)
- `docs/postcss.config.mjs` - PostCSS with Tailwind
- `docs/source.config.ts` - Fumadocs content configuration
- `docs/remotion/remotion.config.ts` - Remotion video configuration
- Git hooks configured via `simple-git-hooks` (pre-commit: Biome check)

## Platform Requirements

**Development:**
- Node.js >=18.0.0
- Python >=3.11
- Bun (recommended for docs)
- uv (recommended for Python)

**Production:**
- Vercel (documentation site deployment)
- Docker support available (Python 3.11-slim base image in `mcp/Dockerfile`)
- FastMCP server can run as HTTP endpoint or stdio MCP transport

---

*Stack analysis: 2026-01-31*
