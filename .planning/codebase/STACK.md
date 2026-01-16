# Technology Stack

**Analysis Date:** 2026-01-16

## Languages

**Primary:**
- Python 3.11+ - All application and test code

**Secondary:**
- None

## Runtime

**Environment:**
- Python 3.11+ (specified in `pyproject.toml` and `Dockerfile`)
- Async/await pattern throughout

**Package Manager:**
- pip (via pyproject.toml)
- Optional: conda (via `environment.yaml`)
- Lockfile: Not present (relies on version constraints in pyproject.toml)

**Build System:**
- Hatchling (`pyproject.toml` build-backend)

## Frameworks

**Core:**
- FastMCP 2.3.0+ - MCP (Model Context Protocol) server framework
- Pydantic 2.0.0+ - Data validation and settings management
- Pydantic-Settings 2.0.0+ - Environment-based configuration

**HTTP:**
- httpx 0.27.0+ - Async HTTP client for API calls

**Data Processing:**
- rdflib 7.0.0+ - RDF/Linked Data parsing (Turtle, JSON-LD, N-Triples)

**Testing:**
- pytest 8.0.0+ - Test framework
- pytest-asyncio 0.23.0+ - Async test support
- pytest-cov 4.1.0+ - Coverage reporting
- pytest-mock 3.12.0+ - Mocking utilities

**Linting/Formatting:**
- ruff 0.4.0+ - Linting and formatting

## Key Dependencies

**Critical:**
- `fastmcp` - Core framework; provides `FastMCP`, `Context`, `Middleware`, `Prompt`, `Message` classes
- `httpx` - All HTTP communication with Piveau API
- `rdflib` - Parses RDF responses from data.gv.at API
- `pydantic` - All models in `app/models.py`
- `pydantic-settings` - Configuration in `app/config.py`

**Infrastructure:**
- Standard library `logging` - Application logging
- Standard library `dataclasses` - `AppState` in `app/server.py`
- Standard library `contextlib` - Lifespan management

## Configuration

**Environment Variables:**
All prefixed with `AUSTRIA_MCP_`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `AUSTRIA_MCP_PIVEAU_API_BASE` | `https://qs.data.gv.at/api/hub/repo` | Piveau Hub API endpoint |
| `AUSTRIA_MCP_PIVEAU_API_KEY` | None | API key for write operations |
| `AUSTRIA_MCP_REQUEST_TIMEOUT` | 30 | HTTP timeout (5-300 seconds) |
| `AUSTRIA_MCP_USER_AGENT` | `Austria-MCP-Agent/1.0` | HTTP User-Agent header |
| `AUSTRIA_MCP_LOG_LEVEL` | `INFO` | Logging level |

**Configuration Files:**
- `pyproject.toml` - Project metadata, dependencies, tool configs
- `environment.yaml` - Conda environment definition
- `.env` (gitignored) - Local environment overrides

**Build Configuration:**
- `pyproject.toml` lines 25-30: Hatchling build config
- `pyproject.toml` lines 32-38: Ruff linter config (line-length=120, Python 3.11 target)
- `pyproject.toml` lines 40-52: Pytest config (asyncio_mode=auto)
- `pyproject.toml` lines 54-67: Coverage config (80% minimum)

## Platform Requirements

**Development:**
- Python 3.11+
- pip or conda for dependency installation
- No OS-specific requirements

**Production:**
- Docker support via `Dockerfile`
- Base image: `python:3.11-slim`
- Entry point: `python -m app.server`

**Container Commands:**
```bash
docker build -t austria-mcp .
docker run -e AUSTRIA_MCP_PIVEAU_API_KEY=your-key austria-mcp
```

**Local Run Commands:**
```bash
# Direct execution
python -m app.server

# Via FastMCP CLI
fastmcp run app.server:mcp
```

## Version Constraints

All version constraints use minimum versions (`>=`):
- Core dependencies require modern versions (2024+)
- No upper bounds specified
- Test dependencies similarly modern

---

*Stack analysis: 2026-01-16*
