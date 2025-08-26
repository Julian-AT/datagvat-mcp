# data.gv.at MCP Server

A simple Model Context Protocol (MCP) server for integrating with data.gv.at, Austria's official open data platform. This server enables AI assistants to search, retrieve, and explore Austrian government datasets.

## Features

- Search and explore Austrian government datasets
- Get detailed dataset information
- Browse organizations and resources
- Tag-based discovery
- Simple, direct API integration

## Installation

```bash
pip install datagvat-mcp
```

## Usage

Start the MCP server:

```bash
datagvat-mcp
```

The server listens for MCP requests via stdio and can be used with any MCP-compatible AI assistant.

## Available Tools

### Dataset Tools
- `package_list` - List all datasets
- `package_search` - Search datasets with queries and filters
- `package_show` - Get detailed dataset information
- `package_autocomplete` - Get dataset name suggestions
- `current_package_list_with_resources` - Get recent datasets with resources

### Organization Tools
- `organization_list` - List organizations/publishers

### Resource Tools
- `resource_show` - Get resource metadata
- `resource_search` - Search for resources
- `resource_view_show` - Get resource view details
- `resource_view_list` - List resource views

### Tag Tools
- `tag_list` - List available tags
- `tag_show` - Get tag details
- `tag_search` - Search tags

### Activity Tools
- `package_activity_list` - Get dataset activity stream
- `organization_activity_list` - Get organization activity
- `recently_changed_packages_activity_list` - Get recent activity
- `activity_show` - Get activity details

### Utility Tools
- `help_show` - Get API help for actions

## Integration

### Claude Desktop

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "datagvat": {
      "command": "datagvat-mcp"
    }
  }
}
```

## Examples

Search for environmental datasets:
```json
{
  "tool": "package_search",
  "arguments": {
    "q": "umwelt OR environment",
    "rows": 5
  }
}
```

Get dataset details:
```json
{
  "tool": "package_show", 
  "arguments": {
    "id": "statistik-austria-bevoelkerung"
  }
}
```

## Development

### Setup
```bash
git clone <repository-url>
cd datagvat-mcp
pip install -e .
```

### Project Structure
```
src/datagvat_mcp/
├── simple_server.py   # Main MCP server implementation
├── server.py          # Entry point
└── __init__.py        # Package exports
```

## License

MIT License - see LICENSE file for details.

## Note

This is an unofficial implementation and is not affiliated with the Austrian government or data.gv.at.