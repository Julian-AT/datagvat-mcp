# data.gv.at MCP Server

![Version](https://img.shields.io/github/package-json/v/datagvat/datagvat-mcp?filename=docs%2Fpackage.json)
![Build Status](https://img.shields.io/github/actions/workflow/status/datagvat/datagvat-mcp/build.yml)
![License](https://img.shields.io/github/license/datagvat/datagvat-mcp)
![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)
![Python](https://img.shields.io/badge/Python-3.11%2B-blue)

Access Austrian Open Government Data through Claude and other MCP clients with semantic search, quality scoring, and data preview capabilities.

> **10,000+ datasets** from data.gv.at available through natural language queries

![Quick Start Example](docs/public/images/screenshot-quick-start.png)
*Screenshot coming soon - see [Quick Start Guide](https://datagvat-mcp.vercel.app/docs/docs/getting-started/quickstart) for visual walkthrough*

## Quick Start

Get your first dataset in under 5 minutes:

### 1. Install the MCP Server

```bash
# Clone repository
git clone https://github.com/datagvat/datagvat-mcp.git
cd datagvat-mcp/mcp

# Set up Python environment
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -e .
```

### 2. Configure Claude Desktop

**macOS:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

Add configuration:
```json
{
  "mcpServers": {
    "datagvat": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/datagvat-mcp/mcp",
        "run",
        "app/server.py"
      ]
    }
  }
}
```

### 3. Try Your First Query

Restart Claude Desktop and ask:

> "Find datasets about Vienna population"

## Features

- **🔍 Semantic Search** - Natural language queries with automatic German/English term expansion
- **⚡ Quality Scoring** - Automatic dataset quality assessment (0-100 scale) with detailed metrics
- **👁️ Data Preview** - Inspect CSV/JSON contents and schema before download
- **📊 Smart Ranking** - Results ranked by relevance, quality, and freshness
- **🌐 Comprehensive Coverage** - Access to 10,000+ datasets from Austria's open data portal
- **🇦🇹 🇬🇧 Bilingual** - Full German and English documentation
- **🔄 Enterprise Grade** - Retry logic, rate limiting, structured logging, graceful degradation
- **📖 25 MCP Tools** - Complete toolkit for discovery, analysis, and management

## Documentation

Full documentation at **[datagvat-mcp.vercel.app](https://datagvat-mcp.vercel.app)**

### Key Resources

- [Installation Guide](https://datagvat-mcp.vercel.app/docs/docs/getting-started/installation) - Complete setup instructions
- [Quick Start Guide](https://datagvat-mcp.vercel.app/docs/docs/getting-started/quickstart) - Get started in 5 minutes
- [Workflow Examples](https://datagvat-mcp.vercel.app/docs/docs/workflows) - Real-world use cases
- [API Reference](https://datagvat-mcp.vercel.app/docs/api) - Complete tool documentation
- [Try Online](https://datagvat-mcp.vercel.app/try) - Test the server without installation

## Use Cases

**Data Analysts:**
- Discover relevant datasets through natural language search
- Assess data quality before investing time in analysis
- Preview schema and sample data to verify suitability

**App Developers:**
- Find Austrian open data for applications
- Validate data structure and availability
- Access download URLs and metadata programmatically

**Researchers:**
- Explore publication-ready datasets (DOI eligibility check)
- Find related datasets via content similarity
- Track dataset updates and freshness

## Architecture

Built on modern, production-ready technologies:

- **FastMCP** - MCP protocol server framework
- **Python 3.11+** - Async/await patterns throughout
- **Piveau Hub API** - Austrian open data catalog backend
- **Fumadocs** - Documentation framework with i18n support
- **Next.js 16** - Documentation site and testing interface
- **Bun** - Fast build tooling

## Requirements

- Python 3.11 or higher
- Claude Desktop, Cline, or any MCP-compatible client
- uv (Python package manager) - [Install uv](https://docs.astral.sh/uv/getting-started/installation/)

## Installation

See [Installation Guide](https://datagvat-mcp.vercel.app/docs/docs/getting-started/installation) for:
- Claude Desktop integration (macOS, Windows, Linux)
- Cline/Windsurf setup
- Self-hosted deployment
- API configuration

## Contributing

Contributions welcome! See [Contributing Guidelines](CONTRIBUTING.md) for:
- Development setup
- Code style and testing
- Pull request process

## License

[MIT License](LICENSE) - Free to use, modify, and distribute.

## Links

- [Documentation](https://datagvat-mcp.vercel.app)
- [GitHub Repository](https://github.com/datagvat/datagvat-mcp)
- [data.gv.at Portal](https://www.data.gv.at)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Issue Tracker](https://github.com/datagvat/datagvat-mcp/issues)

---

**Built with ❤️ for Austrian Open Data** | Powered by [Model Context Protocol](https://modelcontextprotocol.io)
