# Codebase Structure

**Analysis Date:** 2025-01-16

## Directory Layout

```
datagvat-mcp/
├── app/                    # Main application package
│   ├── tools/              # MCP tool implementations (grouped by domain)
│   │   ├── __init__.py     # Empty package marker
│   │   ├── analysis.py     # Quality metrics and eligibility tools
│   │   ├── discovery.py    # Catalogue and dataset browsing tools
│   │   ├── management.py   # Draft CRUD and publishing tools
│   │   └── vocabularies.py # Controlled vocabulary tools
│   ├── __init__.py         # Package init with version
│   ├── client.py           # PiveauClient HTTP client
│   ├── config.py           # Settings via pydantic-settings
│   ├── dependencies.py     # DI helpers for Context extraction
│   ├── middleware.py       # Audit and Auth middleware
│   ├── models.py           # Pydantic models and enums
│   ├── prompts.py          # MCP prompt templates
│   ├── resources.py        # MCP resource endpoints
│   └── server.py           # FastMCP server setup and entry point
├── tests/                  # Test suite
│   ├── __init__.py         # Test package marker
│   ├── conftest.py         # Shared fixtures
│   ├── test_client.py      # PiveauClient tests
│   ├── test_config.py      # Settings tests
│   ├── test_dependencies.py# DI helper tests
│   ├── test_middleware.py  # Middleware tests
│   ├── test_models.py      # Model validation tests
│   ├── test_prompts.py     # Prompt generation tests
│   ├── test_resources.py   # Resource endpoint tests
│   └── test_tools.py       # Tool function tests
├── .planning/              # Planning and documentation
│   └── codebase/           # Codebase analysis documents
├── Dockerfile              # Container build
├── environment.yaml        # Conda environment
├── pyproject.toml          # Python project config (hatch build)
├── README.md               # Project documentation
└── llms.txt                # LLM context file
```

## Directory Purposes

**`app/`:**
- Purpose: Main application package containing all source code
- Contains: Server, client, models, tools, resources, prompts, middleware, config
- Key files: `server.py` (entry point), `client.py` (HTTP client)

**`app/tools/`:**
- Purpose: MCP tool implementations grouped by domain
- Contains: Python modules with register_*_tools functions
- Key files: `discovery.py` (read tools), `management.py` (write tools)

**`tests/`:**
- Purpose: Pytest test suite with unit tests
- Contains: Test modules mirroring app structure, shared fixtures
- Key files: `conftest.py` (fixtures), `test_tools.py` (tool tests)

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents for GSD workflow
- Contains: ARCHITECTURE.md, STRUCTURE.md, etc.
- Generated: Yes (by GSD map-codebase)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `app/server.py`: Main server entry, run with `python -m app.server`

**Configuration:**
- `app/config.py`: Settings class with env var loading
- `pyproject.toml`: Project metadata, dependencies, tool configs

**Core Logic:**
- `app/client.py`: PiveauClient - all HTTP/API operations
- `app/middleware.py`: AuditMiddleware, AuthMiddleware

**MCP Components:**
- `app/tools/discovery.py`: Read-only dataset/catalogue tools
- `app/tools/management.py`: Draft management tools (requires auth)
- `app/tools/analysis.py`: Quality metrics and eligibility tools
- `app/tools/vocabularies.py`: Vocabulary browsing tools
- `app/resources.py`: MCP resource endpoints (piveau:// URIs)
- `app/prompts.py`: MCP prompt templates for workflows

**Testing:**
- `tests/conftest.py`: Shared pytest fixtures
- `tests/test_*.py`: Unit tests for each module

## Naming Conventions

**Files:**
- `snake_case.py` for all Python modules
- Test files prefixed with `test_` matching source module name
- Tools grouped by domain: `discovery.py`, `management.py`, `analysis.py`, `vocabularies.py`

**Directories:**
- `snake_case` for all directories
- `app/tools/` for tool modules (subdirectory pattern)
- `tests/` at project root

**Functions:**
- `snake_case` for all functions
- Tool registration: `register_*_tools(mcp: FastMCP)`
- DI helpers: `get_*` prefix (e.g., `get_piveau_client`)
- MCP tool names: `verb_noun` pattern (e.g., `list_catalogues`, `get_dataset`)

**Classes:**
- `PascalCase` for all classes
- Exception suffix: `*Error` (e.g., `PiveauApiError`)
- Middleware suffix: `*Middleware` (e.g., `AuditMiddleware`)

**Constants:**
- `UPPER_SNAKE_CASE` for class-level constants
- e.g., `ACCEPT_HEADER`, `RDF_CONTENT_TYPES`, `WRITE_TOOLS`

## Import Organization

**Order:**
1. Standard library imports
2. Third-party imports (fastmcp, pydantic, httpx, rdflib)
3. Local imports (app.*)

**Path Aliases:**
- None used - all imports are relative to package root
- Pattern: `from app.module import Class`

## Where to Add New Code

**New MCP Tool:**
- Primary code: `app/tools/{domain}.py` (add to existing or create new)
- If new domain: Create `app/tools/newdomain.py`, import register function in `app/server.py`
- Tests: `tests/test_tools.py` (add test cases)

**New MCP Resource:**
- Implementation: `app/resources.py` (add @mcp.resource decorator)
- Tests: `tests/test_resources.py`

**New MCP Prompt:**
- Implementation: `app/prompts.py` (add @mcp.prompt decorator)
- Tests: `tests/test_prompts.py`

**New API Operation:**
- Implementation: `app/client.py` (add method to PiveauClient)
- Tests: `tests/test_client.py`

**New Pydantic Model:**
- Implementation: `app/models.py`
- Tests: `tests/test_models.py`

**New Middleware:**
- Implementation: `app/middleware.py` (subclass Middleware)
- Registration: `app/server.py` (add to middleware list)
- Tests: `tests/test_middleware.py`

**Utilities/Helpers:**
- Shared helpers: `app/dependencies.py`
- Tests: `tests/test_dependencies.py`

## Special Directories

**`.pytest_cache/`:**
- Purpose: Pytest cache for test optimization
- Generated: Yes
- Committed: No (in .gitignore)

**`.planning/`:**
- Purpose: GSD workflow planning documents
- Generated: Partially (codebase docs are generated)
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code configuration and commands
- Contains: GSD workflow definitions, agent configs
- Committed: Likely (project-specific tooling)

---

*Structure analysis: 2025-01-16*
