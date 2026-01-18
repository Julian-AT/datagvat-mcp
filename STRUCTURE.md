# Repository Structure

This document describes the reorganized structure of the DataGVAT MCP repository.

## Overview

The repository has been reorganized to cleanly separate the Python MCP server from the React.js documentation website.

## Directory Structure

```
datagvat-mcp/
├── mcp/                 # Python MCP Server
│   ├── app/            # Server application code
│   │   ├── tools/      # MCP tool implementations
│   │   ├── server.py   # Main server entry point
│   │   ├── client.py   # Piveau API client
│   │   ├── config.py   # Configuration management
│   │   ├── models.py   # Data models
│   │   └── ...         # Other server modules
│   ├── tests/          # Test suite
│   ├── pyproject.toml  # Python dependencies
│   ├── environment.yaml # Conda environment
│   ├── uv.lock         # UV lock file
│   ├── Dockerfile      # Container image
│   ├── test_api.py     # API integration tests
│   └── README.md       # Server documentation
│
├── docs/               # Documentation Website (Next.js)
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   ├── content/       # MDX documentation content
│   │   └── docs/      # Documentation pages
│   │       ├── api/           # API reference
│   │       ├── guides/        # How-to guides
│   │       ├── tutorials/     # Tutorials
│   │       ├── examples/      # Code examples
│   │       └── best-practices/ # Best practices
│   ├── lib/           # Utility functions
│   ├── package.json   # Node.js dependencies
│   ├── pnpm-lock.yaml # pnpm lock file
│   ├── tsconfig.json  # TypeScript config
│   └── README.md      # Documentation guide
│
├── .gitignore         # Git ignore rules (shared)
└── README.md          # Main repository README
```

## Key Changes

### Before
```
datagvat-mcp/
├── app/              # Python server (mixed with docs)
├── tests/            # Python tests (mixed with docs)
├── docs/             # React docs
├── pyproject.toml    # Python config (root level)
├── environment.yaml  # Conda config (root level)
├── Dockerfile        # Docker config (root level)
└── ...
```

### After
```
datagvat-mcp/
├── mcp/           # All Python files isolated
│   ├── app/
│   ├── tests/
│   ├── pyproject.toml
│   ├── environment.yaml
│   ├── Dockerfile
│   └── ...
├── docs/             # All React/docs files isolated
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── ...
└── README.md         # Unified entry point
```

## Benefits

1. **Clear Separation**: Python and JavaScript/TypeScript code are completely separated
2. **Independent Development**: Each component can be developed, tested, and deployed independently
3. **Easier Navigation**: Developers can focus on one component without confusion
4. **Better Tooling**: Each directory has its own configuration and dependencies
5. **Cleaner Git History**: Changes to server vs docs are clearly separated

## Working with the New Structure

### Server Development

```bash
cd server
pip install -e .
pytest
python -m app.server
```

### Documentation Development

```bash
cd docs
pnpm install
pnpm dev
```

### Claude Desktop Configuration

Update your `claude_desktop_config.json` to point to the `mcp/` directory:

```json
{
  "mcpServers": {
    "datagvat": {
      "command": "python",
      "args": ["-m", "app.server"],
      "cwd": "/path/to/datagvat-mcp/server"
    }
  }
}
```

## Migration Notes

- All Python files moved from root to `mcp/`
- All documentation files remain in `docs/`
- Documentation updated to reflect new paths
- No changes to import statements (Python module structure unchanged)
- Docker configuration moved to `mcp/Dockerfile`
- Both English and German documentation updated

## Questions?

See the main [README.md](README.md) for more information or refer to:
- [Server Documentation](mcp/README.md)
- [Documentation Guide](docs/README.md)
