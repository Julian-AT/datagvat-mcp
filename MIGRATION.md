# Migration Guide

This guide helps you update your local setup after the repository reorganization.

## What Changed?

The repository has been reorganized to separate the Python MCP server from the React.js documentation:

- **Before**: Python files in root, docs in `docs/`
- **After**: Python files in `mcp/`, docs in `docs/`

## For Existing Developers

### 1. Pull the Latest Changes

```bash
git pull origin main
```

### 2. Update Your Working Directory

If you were working on the server:

```bash
# Navigate to the new server directory
cd server

# Reinstall dependencies (optional, but recommended)
pip install -e .
```

If you were working on documentation:

```bash
# Navigate to docs directory
cd docs

# Reinstall dependencies (optional, but recommended)
pnpm install
```

### 3. Update Claude Desktop Configuration

**IMPORTANT**: Update your `claude_desktop_config.json` to point to the new `mcp/` directory.

**Location:**
- macOS/Linux: `~/.claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Old Configuration:**
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

**New Configuration:**
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

Or with `uv`:

```json
{
  "mcpServers": {
    "datagvat": {
      "command": "uv",
      "args": [
        "--directory",
        "/path/to/datagvat-mcp/server",
        "run",
        "datagvat-mcp"
      ]
    }
  }
}
```

### 4. Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the new settings.

### 5. Verify Everything Works

**Test Server:**
```bash
cd server
python -m app.server
```

**Test Documentation:**
```bash
cd docs
pnpm dev
```

**Test in Claude Desktop:**
```
list_catalogues(limit=5)
```

## For CI/CD Pipelines

Update your CI/CD configuration to account for the new structure:

### GitHub Actions Example

**Before:**
```yaml
- name: Install Python dependencies
  run: pip install -e .

- name: Run tests
  run: pytest
```

**After:**
```yaml
- name: Install Python dependencies
  run: |
    cd server
    pip install -e .

- name: Run tests
  run: |
    cd server
    pytest
```

### Docker Builds

**Before:**
```bash
docker build -t datagvat-mcp .
```

**After:**
```bash
docker build -t datagvat-mcp mcp/
```

Or from the root:
```bash
docker build -t datagvat-mcp -f mcp/Dockerfile mcp/
```

## For Documentation Contributors

No changes needed! The documentation structure remains the same:

```bash
cd docs
pnpm install
pnpm dev
```

Documentation files are still in `docs/content/docs/`.

## Common Issues

### Issue: "Module not found" error

**Solution:** Make sure you're in the `mcp/` directory when running Python commands:
```bash
cd server
python -m app.server
```

### Issue: Claude Desktop can't find the server

**Solution:** 
1. Check that your `claude_desktop_config.json` points to the `mcp/` directory
2. Use absolute paths, not relative paths
3. Restart Claude Desktop after making changes

### Issue: Tests fail

**Solution:**
```bash
cd server
pip install -e . --force-reinstall
pytest
```

### Issue: Documentation site won't start

**Solution:**
```bash
cd docs
rm -rf node_modules .next
pnpm install
pnpm dev
```

## Environment Variables

If you have a `.env` file, move it to the appropriate location:

**Server environment variables:**
```bash
# Move to server directory
mv .env mcp/.env
```

**Documentation environment variables:**
```bash
# Keep in docs directory or create new one
# See docs/env.template for reference
```

## Need Help?

- Check [STRUCTURE.md](STRUCTURE.md) for the new directory layout
- See [README.md](README.md) for updated setup instructions
- Open an issue on GitHub if you encounter problems

## Rollback (If Needed)

If you need to rollback to the old structure:

```bash
git checkout <previous-commit-hash>
```

Note: This is not recommended as future development will use the new structure.
