# datagvat-mcp

[![PyPI](https://img.shields.io/pypi/v/datagvat-mcp)](https://pypi.org/project/datagvat-mcp)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)

MCP server for Austrian Open Government Data ([data.gv.at](https://data.gv.at)).

## Quick Start

```bash
uvx datagvat-mcp init
```

The installer auto-detects and configures your AI tools.

## CLI Commands

| Command | Description |
|---------|-------------|
| `uvx datagvat-mcp` | Run the MCP server |
| `uvx datagvat-mcp init` | Install to AI tools |
| `uvx datagvat-mcp init -y` | Install without prompts |
| `uvx datagvat-mcp doctor` | Check installation health |
| `uvx datagvat-mcp update` | Update configuration |
| `uvx datagvat-mcp --version` | Show version |

## Available Tools

**Discovery** — Find and browse datasets

| Tool | Description |
|------|-------------|
| `list_catalogues` | List available data catalogues |
| `get_catalogue` | Get catalogue details |
| `search_datasets` | Search datasets by query |
| `get_dataset` | Get dataset metadata |
| `get_dataset_distributions` | List download formats |

**Analysis** — Assess data quality

| Tool | Description |
|------|-------------|
| `get_dataset_metrics` | Get usage metrics |
| `check_doi_eligibility` | Check DOI registration eligibility |
| `analyze_dataset_quality` | Calculate quality score (0-100) |

**Preview** — Inspect data contents

| Tool | Description |
|------|-------------|
| `preview_distribution` | Preview CSV/JSON data |
| `analyze_distribution_schema` | Infer column types |
| `get_distribution_stats` | Get data statistics |
| `find_related_datasets` | Find similar datasets |
| `compare_datasets` | Compare two datasets |
| `get_dataset_lineage` | Trace data lineage |

**Vocabularies** — EU DCAT-AP controlled vocabularies

| Tool | Description |
|------|-------------|
| `list_vocabularies` | List available vocabularies |
| `get_vocabulary` | Get vocabulary details |
| `search_vocabulary_terms` | Search vocabulary terms |
| `get_resource_types` | List resource types |

## Configuration

Environment variables (prefix `AUSTRIA_MCP_`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PIVEAU_API_BASE` | `https://data.gv.at/katalog/api/hub/repo` | API base URL |
| `REQUEST_TIMEOUT` | `30` | HTTP timeout (seconds) |
| `LOG_LEVEL` | `INFO` | Logging level |

## Development

```bash
# Clone and setup
git clone https://github.com/julian-at/datagvat-mcp.git
cd datagvat-mcp/mcp

# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run server locally
python -m app.server
```

### Project Structure

```
mcp/
├── app/
│   ├── cli/          # CLI commands (Typer)
│   ├── tools/        # MCP tool implementations
│   ├── server.py     # FastMCP server
│   ├── client.py     # Piveau API client
│   ├── config.py     # Settings
│   └── middleware.py # Request middleware
├── tests/
└── pyproject.toml
```

## Links

- **Documentation:** [datagvat-mcp.vercel.app](https://datagvat-mcp.vercel.app)
- **Try Online:** [datagvat-mcp.vercel.app/try](https://datagvat-mcp.vercel.app/try)
- **data.gv.at:** [data.gv.at](https://data.gv.at)

## License

MIT
