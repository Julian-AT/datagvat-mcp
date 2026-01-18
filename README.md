# DataGVAT MCP Server

MCP server for Austrian Open Government Data via the [data.gv.at](https://data.gv.at) platform.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
pip install -e .
```

## Quick Start

```bash
# Run the server
python -m app.server

# Or with FastMCP CLI
fastmcp run app.server:mcp
```

## Configuration

Environment variables (prefix: `AUSTRIA_MCP_`):

| Variable          | Default                                   | Description                  |
| ----------------- | ----------------------------------------- | ---------------------------- |
| `PIVEAU_API_BASE` | `https://data.gv.at/katalog/api/hub/repo` | API base URL                 |
| `PIVEAU_API_KEY`  | -                                         | API key for write operations |
| `REQUEST_TIMEOUT` | `30`                                      | HTTP timeout in seconds      |
| `LOG_LEVEL`       | `INFO`                                    | Logging level                |

## Tools

### Discovery

- `list_catalogues` - List available catalogues
- `get_catalogue` - Get catalogue details
- `search_datasets` - Search datasets
- `get_dataset` - Get dataset metadata
- `get_dataset_distributions` - Get downloadable files

### Analysis

- `get_dataset_metrics` - Quality metrics (DQV)
- `check_doi_eligibility` - DOI readiness check
- `analyze_dataset_quality` - Comprehensive analysis

### Management

- `create_dataset_draft` - Create new draft
- `update_dataset_draft` - Update draft
- `delete_dataset_draft` - Delete draft
- `publish_dataset` - Publish to portal
- `hide_dataset` - Unpublish dataset

### Vocabularies

- `list_vocabularies` - List controlled vocabularies
- `get_vocabulary` - Get vocabulary terms
- `search_vocabulary_terms` - Search within vocabulary

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

## Testing

Run the test suite with pytest:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=term-missing

# Run specific test module
pytest tests/test_client.py

# Run with verbose output
pytest -v
```

### Test Structure

| Module              | Description                           |
| ------------------- | ------------------------------------- |
| `test_client.py`    | HTTP client and API operations        |
| `test_config.py`    | Settings and environment variables    |
| `test_dependencies.py` | Dependency injection helpers       |
| `test_middleware.py` | Audit and auth middleware            |
| `test_models.py`    | Pydantic models and validation        |
| `test_prompts.py`   | MCP prompt templates                  |
| `test_resources.py` | MCP resource endpoints                |
| `test_tools.py`     | MCP tool implementations              |

## Docker

```bash
docker build -t austria-mcp .
docker run -e AUSTRIA_MCP_PIVEAU_API_KEY=your-key austria-mcp
```

## Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "datagvat": {
      "command": "python",
      "args": ["-m", "app.server"],
      "cwd": "/path/to/datagvat-mcp"
    }
  }
}
```

## Documentation

Full documentation is available at `/docs`. To run the documentation site locally:

```bash
cd docs
pnpm install
pnpm dev
```

Visit http://localhost:3000 to view the documentation.

## License

MIT
