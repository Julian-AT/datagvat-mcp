# data.gv.at MCP Server - Cleanup Summary

## Final Usage

```bash
# Install to Claude Desktop, Continue, or Cline
uvx datagvat-mcp init

# Check installation health
uvx datagvat-mcp doctor

# Update configuration
uvx datagvat-mcp update

# Run MCP server directly (used by AI tools)
uvx datagvat-mcp
```

---

## What Changed

### MCP Server
| Before | After |
|--------|-------|
| 25 tools | 18 tools (read-only) |
| 7 write operations | 0 write operations |
| Auth required for writes | No auth needed |

**Removed tools:** `list_dataset_drafts`, `get_dataset_draft`, `create_dataset_draft`, `update_dataset_draft`, `delete_dataset_draft`, `publish_dataset`, `hide_dataset`

### CLI
| Before | After |
|--------|-------|
| Node.js (TypeScript) | Python (Rich + Typer) |
| `npx @datagvat/mcp-installer init` | `uvx datagvat-mcp init` |
| Separate package | Single package |

### Documentation
| Before | After |
|--------|-------|
| ~111 pages | ~19 pages |
| OpenAPI REST docs | MCP-focused only |
| Multiple workflow sections | Consolidated |
| German translations | English only |

---

## Files Changed

### Deleted
- `mcp/app/tools/management.py` - Management tools
- `packages/cli/` - Entire Node.js CLI

### Added
- `mcp/app/cli/__init__.py` - CLI module
- `mcp/app/cli/main.py` - Rich CLI implementation

### Modified
- `mcp/app/server.py` - Removed management imports
- `mcp/app/middleware.py` - Removed AuthMiddleware
- `mcp/app/client.py` - Removed draft methods
- `mcp/pyproject.toml` - Added typer, rich; unified entry point
- `mcp/README.md` - Updated documentation

### Docs Deleted
- `docs/content/docs/api/openapi/` (64+ files)
- `docs/content/docs/(docs)/getting-started/`
- `docs/content/docs/(docs)/workflows/`
- `docs/content/docs/(docs)/advanced/`
- `docs/content/docs/(docs)/best-practices/`
- All `*.de.mdx` files

---

## Publishing

```bash
cd mcp
uv build
uv publish
```

After publishing, users install with:
```bash
uvx datagvat-mcp init
```

---

## Claude Desktop Config

After running `uvx datagvat-mcp init`, your config contains:

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

---

## Links

- **Docs:** https://datagvat-mcp-docs.vercel.app
- **Repo:** https://github.com/julian-at/datagvat-mcp
