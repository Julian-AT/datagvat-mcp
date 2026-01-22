# Phase 8: CLI Installer - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a shadcn-like one-command installer (`npx @datagvat/mcp-installer init`) that detects AI tools (Claude Desktop, Continue, Cline) and automatically configures the MCP server in their config files.

</domain>

<decisions>
## Implementation Decisions

### Package structure
- Monorepo structure: `packages/cli/` directory
- TypeScript with ES modules
- Bun as runtime and package manager
- CLI binary name: `datagvat-mcp`
- Package name: `@datagvat/mcp-installer`
- Entry point: `src/index.ts` with shebang for npx execution

### Command interface
- Main command: `init` (shadcn-style)
- Additional commands: `add <tool>` (alias for `init --tool <name>`)
- Flags: `--yes` (skip prompts), `--tool <name>` (configure specific tool)
- Default behavior: Interactive prompts with checkbox selection
- Output style: Simple text-based with prefixes (Success:, Error:, Info:)

### Tool detection strategy
- Filesystem-based detection (check if config file or parent directory exists)
- Platform-specific config paths for macOS/Windows/Linux
- Supported tools: Claude Desktop, Continue, Cline (VS Code extension)
- Detection checks both config file existence and parent directory existence

### Configuration behavior
- Interactive default: Show checkbox with all detected tools (all checked by default)
- --yes flag: Configure all detected tools without prompts
- --tool flag: Configure specific tool only
- Existing config handling: Skip and inform (warning message, don't overwrite)
- Missing config directory: Auto-create directory and file without asking
- Invalid JSON: Create new config file with warning

### Installation flow
- Detect tools → Display results → Prompt selection → Configure → Show post-install instructions
- No tools detected: Friendly guidance with list of supported tools and how to install them
- Progress feedback: Spinner for detection, success/error messages for each tool
- Error recovery: Continue to next tool if one fails

### Configuration templates
- MCP server config: `{ command: "npx", args: ["-y", "@datagvat/mcp-server"] }`
- Merge with existing config (preserve other mcpServers)
- Server key: `datagvat` in all tools
- Tool-specific config formats handled per tool's requirements

### Post-install guidance
- Tool-specific restart instructions
- Example queries for Claude Desktop
- Documentation link
- Clear next steps for each configured tool

### Claude's Discretion
- Error message wording (as long as actionable)
- Spinner animation style
- Exact file structure organization
- Dependency versions (within compatible ranges)
- Build optimization settings

</decisions>

<specifics>
## Specific Ideas

- "shadcn-like" installer — users expect `npx @package/cli init` pattern, no global install needed
- Checkbox selection with all tools pre-checked — user can uncheck unwanted tools
- Platform-aware config paths — macOS (Library/Application Support), Windows (AppData/Roaming), Linux (.config)
- Graceful degradation — if one tool fails, continue with others and report at end

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-cli-installer*
*Context gathered: 2026-01-22*
