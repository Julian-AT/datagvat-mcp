# Austria MCP

MCP server for Austrian Open Government Data via the [data.gv.at](https://data.gv.at) platform.

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
    "austria-data": {
      "command": "python",
      "args": ["-m", "app.server"],
      "cwd": "/path/to/austria-mcp"
    }
  }
}
```

## License

MIT
