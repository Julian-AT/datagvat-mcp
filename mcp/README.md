# DataGVAT MCP Server

MCP server for Austrian Open Government Data via the [data.gv.at](https://data.gv.at) platform.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

### Option 1: Using uvx (Recommended)

```bash
# Run MCP server directly
uvx datagvat-mcp
```

### Option 2: Using the CLI Installer

```bash
# Install to Claude Desktop, Continue, or Cline
uvx --from datagvat-mcp datagvat-mcp-cli init

# Check installation health
uvx --from datagvat-mcp datagvat-mcp-cli doctor
```

### Option 3: From Source

```bash
cd mcp
pip install -e .
python -m app.server
```

## Configuration

Environment variables (prefix: `AUSTRIA_MCP_`):

| Variable          | Default                                   | Description             |
| ----------------- | ----------------------------------------- | ----------------------- |
| `PIVEAU_API_BASE` | `https://data.gv.at/katalog/api/hub/repo` | API base URL            |
| `REQUEST_TIMEOUT` | `30`                                      | HTTP timeout in seconds |
| `LOG_LEVEL`       | `INFO`                                    | Logging level           |

## Tools (18 Read-Only)

### Discovery

- `list_catalogues` - List available catalogues
- `get_catalogue` - Get catalogue details
- `search_datasets` - Search datasets with filters
- `get_dataset` - Get dataset metadata
- `get_dataset_distributions` - Get downloadable files

### Analysis

- `get_dataset_metrics` - Quality metrics (DQV)
- `check_doi_eligibility` - DOI readiness check
- `analyze_dataset_quality` - Comprehensive analysis

### Vocabularies

- `list_vocabularies` - List controlled vocabularies
- `get_vocabulary` - Get vocabulary terms
- `search_vocabulary_terms` - Search within vocabulary
- `get_resource_types` - List resource types

### Preview

- `preview_distribution` - Preview CSV/JSON data
- `analyze_distribution_schema` - Analyze data structure
- `get_distribution_stats` - Statistical summary
- `find_related_datasets` - Find similar datasets
- `compare_datasets` - Compare multiple datasets
- `get_dataset_lineage` - Dataset provenance

## Resources

Access data via MCP resources:

```
piveau://catalogues
piveau://catalogues/{id}
piveau://catalogues/{id}/datasets
piveau://datasets/{id}
piveau://datasets/{id}/distributions
piveau://datasets/{id}/metrics
piveau://vocabularies
piveau://vocabularies/{id}
```

## CLI Commands

```bash
# Initialize MCP server in AI tools
datagvat-mcp-cli init [--yes] [--tool <name>]

# Add to specific tool
datagvat-mcp-cli add <tool-name>

# Update configuration
datagvat-mcp-cli update [--yes] [--tool <name>]

# Health check
datagvat-mcp-cli doctor [--fix]
```

Supported tools: `claude-desktop`, `continue`, `cline`

## Testing

```bash
cd mcp
pytest                                    # Run all tests
pytest --cov=app --cov-report=term-missing  # With coverage
pytest -v                                 # Verbose output
```

## Claude Desktop Configuration

After running `datagvat-mcp-cli init`, your config will contain:

```json
{
  "mcpServers": {
    "datagvat": {
      "command": "uvx",
      "args": ["datagvat-mcp"]
    }
  }
}
```

## Documentation

Full documentation: https://datagvat-mcp-docs.vercel.app

## License

MIT
