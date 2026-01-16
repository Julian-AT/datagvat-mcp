# External Integrations

**Analysis Date:** 2026-01-16

## APIs & External Services

**Piveau Hub API (data.gv.at):**
- Purpose: Austrian Open Government Data portal API
- Base URL: `https://qs.data.gv.at/api/hub/repo` (configurable)
- SDK/Client: Custom `PiveauClient` in `app/client.py`
- Auth: API key via `X-API-Key` header (env: `AUSTRIA_MCP_PIVEAU_API_KEY`)
- Content Negotiation: `application/ld+json`, `application/json`, `text/turtle`

**API Endpoints Used:**

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/catalogues` | GET | No | List data catalogues |
| `/catalogues/{id}` | GET | No | Get catalogue details |
| `/catalogues/{id}/datasets` | GET | No | List datasets in catalogue |
| `/datasets` | GET | No | List all datasets |
| `/datasets/{id}` | GET | No | Get dataset metadata |
| `/datasets/{id}/distributions` | GET | No | Get downloadable files |
| `/datasets/{id}/metrics` | GET | No | Get quality metrics (DQV) |
| `/datasets/{id}/record` | GET | No | Get catalogue record |
| `/drafts/datasets` | GET/POST | Yes | List/create drafts |
| `/drafts/datasets/{id}` | GET/PUT/DELETE | Yes | Manage draft |
| `/drafts/datasets/publish/{id}` | PUT | Yes | Publish draft |
| `/drafts/datasets/hide/{id}` | PUT | Yes | Unpublish dataset |
| `/identifiers/datasets/{id}/eligibility` | GET | No | Check DOI eligibility |
| `/vocabularies` | GET | No | List vocabularies |
| `/vocabularies/{id}` | GET | No | Get vocabulary terms |
| `/resources` | GET | No | List resource types |

## Data Storage

**Databases:**
- None - This is an API client, no local data persistence

**File Storage:**
- None - No local file storage

**Caching:**
- None - No caching layer implemented

## Authentication & Identity

**Auth Provider:**
- Custom API key authentication

**Implementation:**
- API key stored as `SecretStr` in `app/config.py` line 18
- Key passed via `X-API-Key` HTTP header in `app/client.py` lines 74-76
- Write operations enforced by `AuthMiddleware` in `app/middleware.py` lines 53-96

**Protected Operations:**
```python
# From app/middleware.py lines 56-62
WRITE_TOOLS = frozenset({
    "create_dataset_draft",
    "update_dataset_draft",
    "delete_dataset_draft",
    "publish_dataset",
    "hide_dataset",
})
```

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service

**Logs:**
- Standard Python `logging` module
- Log level configurable via `AUSTRIA_MCP_LOG_LEVEL`
- Format: `%(asctime)s [%(levelname)s] %(name)s: %(message)s`
- AuditMiddleware logs tool executions with timing (`app/middleware.py` lines 12-50)

**Audit Trail:**
- Request ID tracking (from FastMCP context or generated)
- Tool execution timing logged in milliseconds
- Success/failure status logged

## CI/CD & Deployment

**Hosting:**
- Not specified - designed for local or container deployment
- Claude Desktop integration documented in `README.md`

**CI Pipeline:**
- None detected in repository

**Container:**
- `Dockerfile` for containerized deployment
- Base: `python:3.11-slim`
- Entry: `python -m app.server`

## Environment Configuration

**Required Environment Variables:**
- None strictly required for read operations

**Optional Environment Variables:**
- `AUSTRIA_MCP_PIVEAU_API_KEY` - Required for write operations
- `AUSTRIA_MCP_PIVEAU_API_BASE` - Override default API endpoint
- `AUSTRIA_MCP_REQUEST_TIMEOUT` - Adjust timeout (default 30s)
- `AUSTRIA_MCP_USER_AGENT` - Custom user agent
- `AUSTRIA_MCP_LOG_LEVEL` - Logging verbosity

**Secrets Location:**
- Environment variables (loaded via pydantic-settings)
- `.env` file (gitignored, loaded automatically)

## Webhooks & Callbacks

**Incoming:**
- None - MCP server receives requests via MCP protocol, not HTTP webhooks

**Outgoing:**
- None - No webhook notifications sent

## Data Formats

**Input/Output:**
- JSON-LD (preferred)
- JSON
- Turtle (RDF)
- N-Triples (RDF)
- RDF/XML

**Content Type Handling:**
```python
# From app/client.py lines 33-34
ACCEPT_HEADER = "application/ld+json, application/json;q=0.9, text/turtle;q=0.8"
RDF_CONTENT_TYPES = frozenset(["text/turtle", "application/rdf+xml", "application/n-triples", "text/n3"])
```

**RDF Parsing:**
- rdflib library converts RDF formats to JSON-LD for consistent output
- Parser in `app/client.py` lines 127-142

## MCP Protocol

**Server Name:** `austria-data`

**MCP Resources:**
| URI Pattern | Purpose |
|-------------|---------|
| `piveau://catalogues` | All catalogues |
| `piveau://catalogues/{id}` | Single catalogue |
| `piveau://catalogues/{id}/datasets` | Datasets in catalogue |
| `piveau://datasets/{id}` | Dataset metadata |
| `piveau://datasets/{id}/distributions` | Dataset files |
| `piveau://datasets/{id}/metrics` | Quality metrics |
| `piveau://vocabularies` | All vocabularies |
| `piveau://vocabularies/{id}` | Single vocabulary |

**MCP Prompts:**
- `dataset_search` - Find datasets by topic
- `quality_audit` - Audit dataset quality
- `publication_checklist` - Pre-publish review
- `compare_datasets` - Compare multiple datasets
- `catalogue_overview` - Catalogue summary

## Error Handling

**Custom Exceptions in `app/client.py`:**
- `PiveauApiError` - Base API error (lines 15-19)
- `PiveauNotFoundError` - 404 responses (lines 22-23)
- `PiveauAuthError` - 401/403 responses (lines 26-27)

**HTTP Error Mapping:**
- 404 -> `PiveauNotFoundError`
- 401, 403 -> `PiveauAuthError`
- Other errors -> `PiveauApiError` with status code

---

*Integration audit: 2026-01-16*
