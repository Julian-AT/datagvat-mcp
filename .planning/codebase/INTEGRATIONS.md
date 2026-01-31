# External Integrations

**Analysis Date:** 2026-01-31

## APIs & External Services

**MCP Servers:**
- data.gv.at MCP Server - Austrian Open Government Data access
  - SDK/Client: `@ai-sdk/mcp` (v1.0.16), `@modelcontextprotocol/sdk` (v1.25.3)
  - Transport: HTTP transport to `https://data-gv-at.fastmcp.app/mcp`
  - Auth: Bearer token (hardcoded in `docs/app/api/chat/route.ts` line 38)
  - Purpose: Provides tools for Austrian open data discovery, preview, analysis

**AI Gateway:**
- Vercel AI Gateway - Multi-provider AI model routing
  - SDK/Client: `@ai-sdk/gateway` (imported in `docs/lib/ai/providers.ts`)
  - Usage: Routes requests to Google Gemini, Anthropic Claude models
  - Models used:
    - `google/gemini-2.5-flash-lite` (title generation)
    - `anthropic/claude-haiku-4.5` (artifact generation)
    - Dynamic model selection via `getLanguageModel()`

**AI Providers:**
- Google AI - Gemini models
  - SDK/Client: `@ai-sdk/google` (v3.0.18)
  - Model: Used for "Next/font/google" and AI models
- OpenAI-compatible providers
  - SDK/Client: `@ai-sdk/openai-compatible` (v2.0.24)
  - Purpose: Generic OpenAI API-compatible provider support

**Piveau Hub API:**
- data.gv.at API - Austrian government open data portal
  - Client: `app/client.py` (`PiveauClient`)
  - Base URL: Configurable via `PIVEAU_API_BASE` env var
  - Auth: API key via `API_KEY_VALUE` env var
  - User Agent: Configurable via `USER_AGENT` env var
  - Purpose: Search, retrieve, and analyze Austrian open datasets

**GitHub:**
- GitHub Apps API - Code repository integration
  - SDK/Client: `octokit` (v5.0.5)
  - Auth: App ID (`GITHUB_APP_ID`) and private key (`GITHUB_APP_PRIVATE_KEY`)
  - Purpose: Repository access (likely for documentation contributions)

## Data Storage

**Databases:**
- Not detected (no traditional database)

**File Storage:**
- Local filesystem only

**Caching:**
- Redis (optional)
  - Connection: `REDIS_URL` env var (optional)
  - Client: `redis` package (v5.10.0)
  - Usage: Stream resumption storage in `docs/app/api/chat/route.ts` lines 108-123

## Authentication & Identity

**Auth Provider:**
- None (documentation site is public)
  - Implementation: Basic entitlements system (`docs/lib/ai/entitlements.ts`)
  - Rate limiting: Guest users (20 msgs/day), regular users (50 msgs/day)

## Monitoring & Observability

**Error Tracking:**
- None (logs to console)

**Logs:**
- Console logging with structured logging middleware
- Python: `logging` module (configured in `mcp/app/server.py`)
- TypeScript: `console.log`, `console.error`

**Analytics:**
- Vercel Analytics (`@vercel/analytics` v1.6.1)
- Vercel Speed Insights (`@vercel/speed-insights` v1.3.1)

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js documentation site)
  - Platform: Serverless deployment
  - Geolocation API: Used in `docs/app/api/chat/route.ts` (line 1, 64)

**CI Pipeline:**
- Git hooks (pre-commit: Biome check)
- Package: `simple-git-hooks` (v2.13.1)

**Python Package Distribution:**
- PyPI (via `uvx datagvat-mcp` command)
- CLI: `app/cli/main.py` with Typer framework

## Environment Configuration

**Required env vars:**
- Python MCP server:
  - `PIVEAU_API_BASE` - Piveau Hub API endpoint
  - `API_KEY_VALUE` - Piveau API authentication
  - `USER_AGENT` - HTTP client user agent
  - `AUSTRIA_MCP_LOG_LEVEL` - Logging level (default: INFO)
  - `REQUEST_TIMEOUT` - HTTP request timeout

- Documentation site (optional):
  - `GITHUB_APP_ID` - GitHub App identifier
  - `GITHUB_APP_PRIVATE_KEY` - GitHub App authentication
  - `REDIS_URL` - Redis connection string (optional for stream resumption)

**Secrets location:**
- `.env.local` (documentation site, not committed)
- `.env.example` (template in `docs/`)
- Environment variables passed to Vercel deployment
- Docker: Environment variables set in Dockerfile

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Video Generation

**Remotion:**
- Remotion video framework (v4.0.244)
  - Config: `docs/remotion/remotion.config.ts`
  - Compositions: `docs/remotion/compositions/` (Architecture, QuickStart, Workflow)
  - Purpose: Generate showcase videos for documentation

---

*Integration audit: 2026-01-31*
