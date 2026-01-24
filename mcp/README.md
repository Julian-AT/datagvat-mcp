# DataGVAT MCP Server

MCP server for Austrian Open Government Data via [data.gv.at](https://data.gv.at).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

```bash
# Install to Claude Desktop (or Continue, Cline)
uvx datagvat-mcp init

# Check installation
uvx datagvat-mcp doctor
```

That's it! Restart your AI tool and start querying Austrian open data.

## Commands

```bash
uvx datagvat-mcp              # Run MCP server (used by AI tools)
uvx datagvat-mcp init         # Install to AI tools
uvx datagvat-mcp init -y      # Install without prompts
uvx datagvat-mcp doctor       # Check installation health
uvx datagvat-mcp update       # Update configuration
uvx datagvat-mcp --version    # Show version
```

## Configuration

Environment variables (prefix: `AUSTRIA_MCP_`):

| Variable          | Default                                   | Description             |
| ----------------- | ----------------------------------------- | ----------------------- |
| `PIVEAU_API_BASE` | `https://data.gv.at/katalog/api/hub/repo` | API base URL            |
| `REQUEST_TIMEOUT` | `30`                                      | HTTP timeout in seconds |
| `LOG_LEVEL`       | `INFO`                                    | Logging level           |

## Tools (18 Read-Only)

**Discovery:** `list_catalogues`, `get_catalogue`, `search_datasets`, `get_dataset`, `get_dataset_distributions`

**Analysis:** `get_dataset_metrics`, `check_doi_eligibility`, `analyze_dataset_quality`

**Vocabularies:** `list_vocabularies`, `get_vocabulary`, `search_vocabulary_terms`, `get_resource_types`

**Preview:** `preview_distribution`, `analyze_distribution_schema`, `get_distribution_stats`, `find_related_datasets`, `compare_datasets`, `get_dataset_lineage`

## Example Queries

After installation, try these in Claude Desktop:

- "Find datasets about Vienna population"
- "Show me health-related open data"
- "What datasets have quality score above 80?"
- "Preview the first 10 rows of this CSV"

## Development

```bash
cd mcp
pip install -e ".[dev]"
pytest
```

## Links

- **Documentation:** https://datagvat-mcp-docs.vercel.app
- **Repository:** https://github.com/julian-at/datagvat-mcp

## License

MIT
