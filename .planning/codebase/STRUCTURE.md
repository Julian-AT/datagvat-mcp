# Codebase Structure

**Analysis Date:** 2026-01-31

## Directory Layout

```
datagvat-mcp/
├── mcp/                    # Python MCP server
│   ├── app/                # Server application code
│   │   ├── cli/            # CLI installer commands
│   │   └── tools/          # MCP tool implementations
│   ├── scripts/            # Code generation scripts
│   ├── tests/              # Python test suite
│   ├── pyproject.toml      # Python package config
│   └── uv.lock             # UV lockfile
├── docs/                   # Next.js documentation site
│   ├── app/                # Next.js App Router
│   │   ├── [lang]/         # Internationalized routes
│   │   └── api/            # API routes (chat, search)
│   ├── components/         # React components
│   │   ├── ai-elements/    # AI-specific components
│   │   └── ui/             # shadcn/ui components
│   ├── content/            # MDX documentation content
│   │   └── docs/           # Docs pages
│   ├── lib/                # Utility libraries
│   │   ├── ai/             # AI SDK utilities
│   │   └── source/         # Fumadocs source config
│   ├── public/             # Static assets
│   ├── remotion/           # Video tutorial compositions
│   ├── package.json        # Node dependencies
│   └── next.config.mjs     # Next.js configuration
├── .planning/              # GSD planning artifacts
│   ├── codebase/           # Codebase analysis docs
│   ├── phases/             # Implementation phases
│   └── milestones/         # Project milestones
├── assets/                 # Repository assets (banner, etc.)
├── my-app/                 # Example Next.js app (scaffolded)
├── next-app/               # Example Next.js app (scaffolded)
├── openapi.yaml            # OpenAPI spec for MCP server
└── README.md               # Project documentation
```

## Directory Purposes

**`mcp/`:**
- Purpose: Python MCP server package
- Contains: FastMCP server, tools, CLI, tests
- Key files: `app/server.py` (entry point), `pyproject.toml` (package config)

**`mcp/app/`:**
- Purpose: Core MCP server application code
- Contains: Server initialization, API client, models, business logic, tools
- Key files: `server.py`, `client.py`, `models.py`, `config.py`, `semantic.py`, `similarity.py`, `preview.py`, `prompts.py`, `resources.py`, `middleware.py`, `dependencies.py`

**`mcp/app/cli/`:**
- Purpose: Command-line interface for MCP server installation
- Contains: Typer-based CLI with init/doctor/update/uninstall commands
- Key files: `main.py`

**`mcp/app/tools/`:**
- Purpose: MCP tool implementations grouped by category
- Contains: Discovery tools, analysis tools, preview tools, vocabulary tools
- Key files: `discovery.py` (search, list, get), `analysis.py` (quality scoring), `preview.py` (data inspection), `vocabularies.py` (SKOS concepts)

**`mcp/tests/`:**
- Purpose: Pytest test suite for MCP server
- Contains: Unit tests, integration tests, fixtures
- Key files: `conftest.py` (shared fixtures), `test_*.py` (test modules)

**`mcp/scripts/`:**
- Purpose: Code generation and maintenance scripts
- Contains: JSON schema extractors, template generators
- Key files: `extractors/`, `templates/`

**`docs/`:**
- Purpose: Next.js documentation site with AI chat
- Contains: App Router pages, components, MDX content, API routes
- Key files: `package.json`, `next.config.mjs`, `tsconfig.json`

**`docs/app/`:**
- Purpose: Next.js App Router entry point
- Contains: Route handlers, layouts, pages
- Key files: `layout.tsx`, `page.tsx`, `[lang]/docs/[[...slug]]/page.tsx`, `api/chat/route.ts`

**`docs/app/[lang]/`:**
- Purpose: Internationalized route group
- Contains: Locale-specific pages (home, docs, chat)
- Key files: `layout.tsx`, `(home)/page.tsx`, `docs/[[...slug]]/page.tsx`, `chat/page.tsx`

**`docs/app/api/`:**
- Purpose: API route handlers
- Contains: Chat endpoint, search endpoint
- Key files: `chat/route.ts` (AI streaming), `search/route.ts` (content search)

**`docs/components/`:**
- Purpose: Reusable React components
- Contains: AI elements, UI primitives, MDX components
- Key files: `chat.tsx`, `messages.tsx`, `multimodal-input.tsx`

**`docs/components/ai-elements/`:**
- Purpose: AI-specific UI components
- Contains: Message display, reasoning, model selector, prompt input
- Key files: `message.tsx`, `reasoning.tsx`, `model-selector.tsx`, `prompt-input.tsx`, `actions.tsx`, `response.tsx`

**`docs/components/ui/`:**
- Purpose: shadcn/ui component library
- Contains: Radix UI wrapper components
- Key files: `button.tsx`, `input.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `alert.tsx`, `scroll-area.tsx`, `sidebar.tsx`, `skeleton.tsx`

**`docs/content/docs/`:**
- Purpose: MDX documentation content
- Contains: Guides, API reference, tutorials organized by folders
- Key files: `(docs)/` subdirectory with meta.json navigation

**`docs/lib/`:**
- Purpose: Shared utilities and configuration
- Contains: AI SDK setup, Fumadocs source loader, type definitions
- Key files: `source.tsx`, `ai/providers.ts`, `ai/prompts.ts`, `utils.ts`, `types.ts`, `errors.ts`

**`docs/lib/ai/`:**
- Purpose: AI SDK integration utilities
- Contains: Provider setup, prompt engineering, entitlements
- Key files: `providers.ts`, `prompts.ts`, `entitlements.ts`

**`docs/lib/source/`:**
- Purpose: Fumadocs source configuration
- Contains: Navigation tree, page source loaders
- Key files: `navigation.ts`

**`docs/public/`:**
- Purpose: Static assets served at root
- Contains: Images, videos, screenshots, optimized assets
- Key files: `favicon.ico`, `screenshots/`, `videos/`, `optimized/`

**`docs/remotion/`:**
- Purpose: Video tutorial generation with Remotion
- Contains: Video compositions for documentation
- Key files: `Root.tsx`, `compositions/Architecture.tsx`, `compositions/QuickStart.tsx`, `compositions/Workflow.tsx`

**`.planning/`:**
- Purpose: GSD (Get Stuff Done) planning artifacts
- Contains: Phase plans, milestone tracking, codebase analysis
- Key files: `phases/*/PLAN.md`, `milestones/*.md`, `codebase/*.md`

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents for GSD
- Contains: Architecture, conventions, testing patterns, tech stack
- Key files: `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `STACK.md`, `INTEGRATIONS.md`, `CONCERNS.md`

**`.planning/phases/`:**
- Purpose: Individual phase implementation plans
- Contains: Subdirectories per phase with PLAN.md
- Key files: `*/PLAN.md`, `*/STATUS.md`

**`my-app/` and `next-app/`:**
- Purpose: Example Next.js applications (scaffolded but unused)
- Contains: Boilerplate Next.js App Router structure
- Key files: Not actively used in production

## Key File Locations

**Entry Points:**
- `mcp/app/server.py`: MCP server main entry point
- `mcp/app/cli/main.py`: CLI entry point (`datagvat-mcp` command)
- `docs/app/page.tsx`: Documentation site home page
- `docs/app/[lang]/docs/[[...slug]]/page.tsx`: Dynamic docs page renderer
- `docs/app/api/chat/route.ts`: AI chat API endpoint

**Configuration:**
- `mcp/pyproject.toml`: Python package metadata, dependencies, build config
- `docs/package.json`: Node dependencies, scripts
- `docs/next.config.mjs`: Next.js configuration
- `docs/tsconfig.json`: TypeScript compiler options
- `docs/source.config.ts`: Fumadocs source configuration
- `mcp/app/config.py`: MCP server settings (Pydantic Settings)
- `openapi.yaml`: OpenAPI specification for MCP API

**Core Logic:**
- `mcp/app/client.py`: Piveau Hub API client (HTTP, RDF parsing)
- `mcp/app/tools/discovery.py`: Dataset search and discovery tools
- `mcp/app/semantic.py`: Natural language query expansion
- `mcp/app/similarity.py`: Related dataset finder
- `docs/app/api/chat/route.ts`: AI streaming with MCP tools
- `docs/lib/ai/providers.ts`: AI Gateway model configuration

**Testing:**
- `mcp/tests/conftest.py`: Pytest fixtures and configuration
- `mcp/tests/test_*.py`: Unit and integration tests
- `mcp/pytest.ini`: Pytest configuration in pyproject.toml

## Naming Conventions

**Files (Python):**
- `snake_case.py`: Module files
- `test_*.py`: Test files (pytest discovery pattern)
- Pattern: Descriptive names like `semantic.py`, `similarity.py`, `preview.py`

**Files (TypeScript/TSX):**
- `kebab-case.tsx`: Component files (e.g., `model-selector.tsx`, `prompt-input.tsx`)
- `kebab-case.ts`: Utility files (e.g., `page-actions.ts`)
- `PascalCase.tsx`: Component files with JSX (alternative pattern, e.g., `Root.tsx`)
- Pattern: shadcn/ui uses kebab-case, Remotion uses PascalCase

**Directories:**
- `lowercase`: Python packages (e.g., `app`, `tools`, `cli`, `tests`)
- `kebab-case`: Next.js route groups (e.g., `ai-elements`, `api-page`)
- `[bracket]`: Next.js dynamic routes (e.g., `[lang]`, `[[...slug]]`)
- `(group)`: Next.js route groups without URL segment (e.g., `(home)`, `(docs)`)

**Functions:**
- `snake_case`: Python functions (e.g., `search_datasets`, `get_catalogue`)
- `camelCase`: TypeScript functions (e.g., `getLanguageModel`, `generateUUID`)
- Pattern: Follow language idioms (PEP 8 for Python, JavaScript conventions for TS)

**Variables:**
- `snake_case`: Python variables (e.g., `piveau_client`, `dataset_id`)
- `camelCase`: TypeScript variables (e.g., `selectedChatModel`, `requestHints`)

**Types/Classes:**
- `PascalCase`: Python classes (e.g., `PiveauClient`, `Dataset`, `Distribution`)
- `PascalCase`: TypeScript types/interfaces (e.g., `ChatMessage`, `RequestHints`)

## Where to Add New Code

**New MCP Tool:**
- Primary code: `mcp/app/tools/` - add to existing category file or create new category
- Registration: `mcp/app/server.py` - call `register_*_tools(mcp)`
- Tests: `mcp/tests/test_tools_*.py` - add test module
- Models: `mcp/app/models.py` - add Pydantic models if needed

**New API Endpoint:**
- Implementation: `docs/app/api/[name]/route.ts` - create route handler
- Schema: `docs/app/api/[name]/schema.ts` - define Zod schema
- Usage: Component imports from `@/app/api/[name]`

**New UI Component:**
- AI-specific: `docs/components/ai-elements/[name].tsx`
- Generic UI: `docs/components/ui/[name].tsx` (follow shadcn/ui pattern)
- Shared logic: `docs/components/[name].tsx`
- Usage: Import from `@/components/[name]`

**New Documentation Page:**
- MDX file: `docs/content/docs/(docs)/[category]/[page].mdx`
- Navigation: Update `docs/content/docs/(docs)/[category]/meta.json`
- Assets: `docs/public/` for images/videos

**New Feature (Multi-Module):**
- Backend: Add tool to `mcp/app/tools/[category].py`
- Frontend: Add component to `docs/components/`
- API: Add route to `docs/app/api/`
- Docs: Add guide to `docs/content/docs/(docs)/guides/`

**Utilities:**
- Shared helpers (Python): `mcp/app/` at root level (e.g., `semantic.py`, `similarity.py`)
- Shared helpers (TypeScript): `docs/lib/[name].ts` or `docs/lib/[category]/[name].ts`

**Business Logic:**
- Algorithm implementations: `mcp/app/[name].py` (e.g., semantic search, similarity)
- Type definitions: `mcp/app/models.py` (Pydantic) or `docs/lib/types.ts` (TypeScript)

## Special Directories

**`node_modules/`:**
- Purpose: NPM dependencies (docs site)
- Generated: Yes (via `bun install` or `npm install`)
- Committed: No (gitignored)

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (via `next build` or `next dev`)
- Committed: No (gitignored)

**`__pycache__/`:**
- Purpose: Python bytecode cache
- Generated: Yes (via Python interpreter)
- Committed: No (gitignored)

**`.planning/`:**
- Purpose: GSD planning artifacts
- Generated: Manually by GSD commands and human planning
- Committed: Yes (tracked for project management)

**`.source/`:**
- Purpose: Generated Fumadocs source files
- Generated: Yes (via Fumadocs CLI)
- Committed: Yes (tracked for build reproducibility)

**`api/`:**
- Purpose: Auto-generated TypeDoc API documentation
- Generated: Yes (via `fumadocs-docgen` from OpenAPI spec)
- Committed: Yes (tracked for docs deployment)

**`docs/public/optimized/`:**
- Purpose: Optimized images
- Generated: Yes (via image optimization pipeline)
- Committed: Yes (for deployment performance)

---

*Structure analysis: 2026-01-31*
