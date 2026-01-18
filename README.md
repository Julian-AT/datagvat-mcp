# DataGVAT MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This repository contains the DataGVAT MCP Server and its documentation.

## Repository Structure

```
datagvat-mcp/
├── mcp/             # Python MCP server for data.gv.at
│   ├── app/         # Server application code
│   ├── tests/       # Test suite
│   └── ...          # Python configs (pyproject.toml, etc.)
├── docs/            # Documentation website (Next.js)
└── README.md        # This file
```

## Components

### 🐍 MCP Server

The MCP (Model Context Protocol) server provides programmatic access to Austrian Open Government Data via the [data.gv.at](https://data.gv.at) platform.

**Quick Start:**

```bash
cd mcp
pip install -e .
python -m app.server
```

👉 **[Full Server Documentation](mcp/README.md)**

**Key Features:**
- Dataset discovery and search
- Quality metrics and analysis
- Dataset management (create, update, publish)
- Controlled vocabularies
- MCP resources for data access

### 📚 Documentation

Modern, multilingual documentation website built with Next.js and Fumadocs.

**Quick Start:**

```bash
cd docs
pnpm install
pnpm dev
```

👉 **[Full Documentation Guide](docs/README.md)**

**Features:**
- English & German support
- Full-text search
- Auto-generated API docs
- Dark mode
- User feedback system

## Getting Started

### For Server Development

1. Navigate to the `mcp/` directory
2. Install dependencies: `pip install -e .`
3. Run tests: `pytest`
4. Start server: `python -m app.server`

See [mcp/README.md](mcp/README.md) for detailed setup and usage.

### For Documentation

1. Navigate to the `docs/` directory
2. Install dependencies: `pnpm install`
3. Start dev server: `pnpm dev`
4. Visit http://localhost:3000

See [docs/README.md](docs/README.md) for content authoring guidelines.

## Integration with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "datagvat": {
      "command": "python",
      "args": ["-m", "app.server"],
      "cwd": "/path/to/datagvat-mcp/mcp"
    }
  }
}
```

## Contributing

Contributions are welcome! Please ensure:

- **Server changes**: Run tests with `pytest` and linting with `ruff`
- **Documentation changes**: Provide both English and German versions

## License

MIT - See LICENSE file for details

## Links

- [data.gv.at Platform](https://data.gv.at)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [FastMCP Framework](https://github.com/jlowin/fastmcp)
