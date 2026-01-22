# data.gv.at MCP Installer

A beautiful, shadcn-like one-command installer for the [data.gv.at MCP Server](https://github.com/yourusername/datagvat-mcp).

Automatically detects your AI tools and configures the Austrian Open Data MCP Server with zero hassle.

## Features

- **Zero-config installation** - Works out of the box with automatic tool detection
- **Beautiful CLI** - shadcn-inspired design with box drawing and clear visual hierarchy
- **Multi-tool support** - Claude Desktop, Continue, and Cline
- **Interactive prompts** - Choose which tools to configure with checkbox selection
- **Smart configuration** - Preserves existing configs, merges safely
- **Cross-platform** - Works on macOS, Windows, and Linux

## Installation

Run the installer with npx (no installation required):

```bash
npx @datagvat/mcp-installer init
```

That's it! The installer will:
1. Detect which AI tools you have installed
2. Let you choose which ones to configure
3. Update configuration files automatically
4. Show you example queries to get started

## Usage

### Interactive Installation

```bash
npx @datagvat/mcp-installer init
```

This will:
- Scan for Claude Desktop, Continue, and Cline
- Show an interactive checkbox to select tools
- Configure selected tools automatically

### Skip Prompts (Configure All)

```bash
npx @datagvat/mcp-installer init --yes
```

Automatically configures all detected tools without prompting.

### Configure Specific Tool

```bash
npx @datagvat/mcp-installer init --tool claude-desktop
npx @datagvat/mcp-installer init --tool continue
npx @datagvat/mcp-installer init --tool cline
```

### Alias Command

```bash
npx @datagvat/mcp-installer add continue
```

Shorthand for `init --tool continue`.

## Supported Tools

### Claude Desktop

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**Restart:** Quit and restart the Claude Desktop app (Cmd+Q on macOS, Alt+F4 on Windows)

### Continue

- **All platforms:** `.continue/config.json` in your home directory

**Restart:** Reload VS Code window (Cmd+Shift+P → "Developer: Reload Window")

### Cline

- **All platforms:** VS Code extension configuration

**Restart:** Reload VS Code window (Cmd+Shift+P → "Developer: Reload Window")

## Example Output

```
┌─────────────────────────────────────────────────────┐
│  data.gv.at MCP Installer                             │
│  One-command setup for Austrian Open Data MCP Server  │
└─────────────────────────────────────────────────────┘

[1/3] Scanning for AI tools

✓ Found 2 tool(s)

  ● claude-desktop (~/.config/Claude/claude_desktop_config.json)
  ● continue (~/.continue/config.json)

[2/3] Select tools to configure

? Which tools would you like to configure? (Press <space> to select)
  ◉ claude-desktop
  ◉ continue

[3/3] Writing configuration

✓ Configured 2 tool(s) successfully

──────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│  ✓ Installation complete!                             │
│                                                        │
│  The data.gv.at MCP Server has been configured        │
└─────────────────────────────────────────────────────┘

Next Steps

1. Restart your tools

   claude-desktop
   → Quit and restart Claude Desktop app (Cmd+Q on macOS)

   continue
   → Reload VS Code window (Cmd+Shift+P → 'Developer: Reload Window')

2. Try these example queries

   ○ Find datasets about Vienna population
   ○ Show me datasets with quality score above 80
   ○ What health-related datasets are available?
   ○ Search for datasets about air quality in Austria

3. Learn more

   Documentation: https://datagvat-mcp-docs.vercel.app
   Source code:   https://github.com/yourusername/datagvat-mcp

──────────────────────────────────────────────────────
```

## Troubleshooting

### No tools detected

**Problem:** "No AI tools detected on this system"

**Solution:** Install one of the supported tools first:
- [Claude Desktop](https://claude.ai/download)
- [Continue](https://continue.dev)
- [Cline](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)

Then run the installer again.

### Already configured

**Problem:** "Skipped X tool(s) (already configured)"

**Solution:** This is expected behavior. The installer detected that the MCP server is already configured and skipped it to preserve your settings. To reconfigure, manually remove the `datagvat` entry from your config file and run the installer again.

### Permission denied

**Problem:** Error writing to configuration file

**Solution:**
- **macOS/Linux:** Check file permissions: `ls -la ~/.config/Claude/`
- **Windows:** Run terminal as Administrator if needed
- Ensure the parent directory exists

### Configuration not working after install

**Problem:** Tool doesn't show the MCP server after restart

**Solution:**
1. Verify the configuration file was updated:
   - **Claude Desktop:** Check the JSON file location for your platform
   - **Continue/Cline:** Check `.continue/config.json` in your home directory
2. Look for a `datagvat` entry in the `mcpServers` section
3. Restart the tool completely (quit and reopen, don't just reload)
4. Check tool logs for errors

## What Gets Configured

The installer adds this entry to your tool's MCP configuration:

```json
{
  "mcpServers": {
    "datagvat": {
      "command": "npx",
      "args": [
        "-y",
        "@datagvat/mcp-server"
      ],
      "env": {}
    }
  }
}
```

The configuration:
- Preserves all existing MCP servers
- Uses `npx` to run the latest version automatically
- Works without global installation
- Can be updated by simply restarting your tool

## Development

To contribute or modify the installer:

```bash
# Clone the repository
git clone https://github.com/yourusername/datagvat-mcp.git
cd datagvat-mcp/packages/cli

# Install dependencies
bun install

# Run in development mode
bun src/index.ts init

# Build for distribution
bun run build

# Test the built version
bun dist/index.js init
```

## Links

- **Documentation:** https://datagvat-mcp-docs.vercel.app
- **MCP Server Package:** [@datagvat/mcp-server](https://www.npmjs.com/package/@datagvat/mcp-server)
- **Source Code:** https://github.com/yourusername/datagvat-mcp
- **Report Issues:** https://github.com/yourusername/datagvat-mcp/issues

## License

MIT

---

Built with [Model Context Protocol](https://modelcontextprotocol.io) | Inspired by [shadcn/ui](https://ui.shadcn.com)
