# Piveau Hub-Repo MCP Server

A Model Context Protocol (MCP) server for the piveau hub-repo service API. This server provides tools to interact with DCAT-AP compliant dataset management systems used in European data portals.

## Features

- Manage catalogues, datasets, and distributions
- DCAT-AP standard compliance
- RDF data format support
- Authentication support (API Key and Bearer token)
- Vocabulary management
- Draft dataset handling
- Persistent identifier creation
- Quality metrics tracking

## Installation

```bash
pip install piveau-hub-mcp
```

## Configuration

Set the piveau API base URL using environment variables:

```bash
export PIVEAU_API_BASE_URL="https://your-piveau-instance.com/api"
```

Default URL: `https://hub.example.com/api`

## Usage

Start the MCP server:

```bash
piveau-hub-mcp
```

The server listens for MCP requests via stdio and can be used with any MCP-compatible AI assistant.

## Available Tools

**Note**: This client only implements publicly available endpoints. Many administrative and internal-use-only endpoints have been excluded.

### Catalogue Management (4 tools)
- `list_catalogues` - List all catalogues
- `get_catalogue` - Get catalogue details  
- `list_catalogue_datasets` - List datasets in a catalogue
- `get_catalogue_dataset_by_origin` - Get dataset by original ID

### Dataset Management (6 tools + 4 deprecated)
**Public Tools:**
- `list_datasets` - List all datasets
- `get_dataset` - Get dataset details
- `update_dataset` - Update a dataset (auth required)
- `list_dataset_distributions` - List dataset distributions
- `get_dataset_metrics` - Get dataset quality metrics
- `get_dataset_catalogue_record` - Get catalogue record

**Deprecated Legacy Tools:**
- `add_dataset_legacy` - [DEPRECATED] Add dataset (legacy endpoint)
- `create_or_update_dataset_legacy` - [DEPRECATED] Create/update dataset (legacy endpoint)
- `delete_dataset_legacy` - [DEPRECATED] Delete dataset (legacy endpoint)
- `get_catalogue_record_legacy` - [DEPRECATED] Get catalogue record (legacy endpoint)

### Distribution Management (1 tool)
- `get_distribution` - Get distribution details

### Vocabulary Management (2 tools + 1 deprecated)
**Public Tools:**
- `list_vocabularies` - List controlled vocabularies
- `get_vocabulary` - Get vocabulary details

**Deprecated Legacy Tools:**
- `create_or_update_vocabulary_legacy` - [DEPRECATED] Create/update vocabulary (legacy, internal-only)

### Resource Management (3 tools)
- `list_resource_types` - List resource types
- `list_resources` - List resources of specific type
- `get_resource` - Get resource details

### Excluded Internal-Only Endpoints

The following endpoint categories are reserved for internal use only and are **not** available in this public API client:

**Catalogue Management (excluded):**
- Create/update/delete catalogues
- Add/update/delete datasets in catalogues

**Dataset Management (excluded):** 
- Delete datasets
- Add distributions to datasets
- Create/update/delete metrics
- Index/reindex datasets

**Distribution Management (excluded):**
- Update/delete distributions

**Vocabulary Management (excluded):**
- Create/update/delete vocabularies

**Draft Management (excluded):**
- All draft operations (list, create, update, delete, publish, hide)

**Identifier Management (excluded):**
- Create identifiers
- Check identifier eligibility

**Resource Management (excluded):**
- Create/update/delete resources

**Actions and Translation (excluded):**
- JSON-RPC actions
- Translation management

## Authentication

Many endpoints require authentication. You can provide credentials in two ways:

### API Key Authentication
```json
{
  "tool": "create_or_update_catalogue",
  "arguments": {
    "catalogue_id": "my-catalogue",
    "catalogue_data": {...},
    "api_key": "your-api-key"
  }
}
```

### Bearer Token Authentication
```json
{
  "tool": "create_or_update_catalogue",
  "arguments": {
    "catalogue_id": "my-catalogue", 
    "catalogue_data": {...},
    "bearer_token": "your-jwt-token"
  }
}
```

## Integration

### Claude Desktop

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "piveau-hub": {
      "command": "piveau-hub-mcp",
      "env": {
        "PIVEAU_API_BASE_URL": "https://your-piveau-instance.com/api"
      }
    }
  }
}
```

## Examples

### List Catalogues
```json
{
  "tool": "list_catalogues",
  "arguments": {
    "value_type": "metadata",
    "limit": 10
  }
}
```

### Get Dataset Details
```json
{
  "tool": "get_dataset",
  "arguments": {
    "dataset_id": "my-dataset-id"
  }
}
```

### Create a Dataset Draft
```json
{
  "tool": "create_dataset_draft",
  "arguments": {
    "catalogue": "my-catalogue-id",
    "api_key": "your-api-key"
  }
}
```

### Search Vocabularies
```json
{
  "tool": "list_vocabularies",
  "arguments": {
    "value_type": "metadata",
    "offset": 0,
    "limit": 50
  }
}
```

## Development

### Setup
```bash
git clone <repository-url>
cd piveau-hub-mcp
pip install -e .
```

### Project Structure
```
src/
├── main.py                 # Main entry point
├── common.py              # Shared components and utilities  
├── server.py              # Legacy server (unused)
└── endpoints/             # API endpoint implementations
    ├── __init__.py        # Package init
    ├── catalogues.py      # Catalogue endpoints
    ├── datasets.py        # Dataset endpoints
    ├── distributions.py   # Distribution endpoints
    ├── vocabularies.py    # Vocabulary endpoints
    └── other.py          # Other endpoints (drafts, identifiers, etc.)
```

## API Documentation

This server implements the piveau hub-repo OpenAPI specification. The API supports various RDF formats:

- `application/rdf+xml`
- `application/ld+json` 
- `text/turtle`
- `text/n3`
- `application/trig`
- `application/n-triples`

## License

MIT License - see LICENSE file for details.

## Note

This implementation is based on the piveau hub-repo OpenAPI specification and supports DCAT-AP compliant data portals.