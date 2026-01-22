# Changelog

All notable changes to @datagvat/mcp-installer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-23

### Added

- **Validation**: Zod schema validation for all command inputs with descriptive error messages
- **CI Detection**: Automatic detection of CI/CD environments with `--yes` mode requirement
- **Update Command**: `datagvat-mcp update` shows diff preview before applying configuration changes
- **Doctor Command**: `datagvat-mcp doctor` runs health checks with diagnostic information and fix suggestions
- **Error Messages**: Structured error formatting with problem + fix + example pattern
- **Non-Interactive Mode**: Full support for CI/CD pipelines with automatic fallbacks

### Changed

- Enhanced `init` command with inline validation and immediate feedback on invalid inputs
- Improved error messages to include actionable fix suggestions and examples
- Updated dependencies: added zod, ci-info, diff, execa

### Fixed

- CI environments now properly detected and handle gracefully without hanging on prompts

## [0.1.0] - 2026-01-22

### Added

- Initial release with shadcn-inspired CLI installer
- `init` command for one-command setup of data.gv.at MCP Server
- `add` command for configuring specific tools
- Support for Claude Desktop, Continue, and Cline
- Automatic tool detection and configuration
- Interactive prompts with beautiful UI (chalk + ora + @inquirer/prompts)

[0.2.0]: https://github.com/yourusername/datagvat-mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/datagvat-mcp/releases/tag/v0.1.0
