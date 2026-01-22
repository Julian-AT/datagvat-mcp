# Contributing to data.gv.at MCP Server Documentation

Thank you for your interest in contributing to the data.gv.at MCP Server documentation. This guide will help you set up your development environment and understand our validation pipeline.

## Setup

1. **Install Bun:** Download and install from https://bun.sh
2. **Install dependencies:**
   ```bash
   cd docs
   bun install
   ```
3. **Install git hooks:**
   ```bash
   bun run prepare
   ```
   This installs pre-commit hooks that automatically validate your changes.
4. **Start development server:**
   ```bash
   bun dev
   ```
   Open http://localhost:3000 to view the documentation.

## Writing Documentation

### Style Guide

Follow these conventions for consistency:

- **Active voice and present tense:** Write "You can search" instead of "Datasets can be searched"
- **Sentence case headings:** Capitalize only the first word (e.g., "Getting started" not "Getting Started")
- **Keep sentences under 25 words:** Break long sentences into shorter ones
- **No AI buzzwords:** Avoid terms like "leverage", "harness", "unlock", "revolutionary"
- **Use real Austrian dataset examples:** Reference actual datasets like "Bevölkerung Wien 2020-2024" or "Luftqualität Österreich" instead of generic placeholders like "dataset-123"
- **Natural contractions allowed:** Use "don't", "can't", "you'll" for a conversational professional tone

### Code Examples

When adding code examples:

- **Add WHY comments:** Explain non-obvious code decisions
- **No emojis:** Keep code and output examples professional
- **Test all examples:** Run every code snippet before committing to ensure it works

### Using Real Austrian Datasets

Find real dataset IDs and details at https://www.data.gv.at/katalog/dataset. Good examples include:

- `bev-stat-wien-2024` - Population statistics for Vienna
- `luftqualitat-wien` - Air quality measurements
- `gesundheit-indikatoren-wien-2024` - Health indicators

## Validation Pipeline

### Pre-commit Checks (Automatic)

When you commit changes, the following checks run automatically:

- **Biome linting** on staged MDX and TypeScript files
- **Automatic fixes** applied where safe (formatting, import sorting)

If the hook blocks your commit, review the errors and fix them before committing again.

### Manual Validation Commands

Before pushing your changes, run these commands to catch issues early:

```bash
cd docs

# Run all validation checks
bun run validate

# Fix linting issues automatically
bun run lint:fix

# Check for broken links
bun run lint:links
```

### CI Checks (Automatic)

When you open a pull request, GitHub Actions runs:

1. **Biome linting** on the entire codebase
2. **Link validation** across all content
3. **Full documentation build** to ensure no build errors

All checks must pass before your pull request can be merged.

## Automated Workflows

### OpenAPI Schema Updates

The OpenAPI schema is automatically updated weekly from data.gv.at.

**Schedule:** Every Monday at 09:00 UTC

**Process:**
1. Workflow downloads latest schema from https://qs.data.gv.at/api/hub/repo/openapi.yaml
2. If schema changed, PR is created automatically
3. Review the PR for breaking changes before merging
4. PR is merged or closed based on review

**Manual trigger:** You can manually trigger the update workflow:
1. Go to GitHub Actions > Update OpenAPI Schema
2. Click "Run workflow"
3. Select the branch and click "Run workflow"

**Reviewing schema PRs:**

When a schema update PR is created, check the following:

- **Breaking changes:** Look for removed endpoints (breaks existing links in documentation)
- **New endpoints:** Verify new endpoints have clear descriptions
- **Build verification:** Test locally with `cd docs && bun run build`
- **Documentation quality:** Check if endpoint descriptions are helpful

If the schema has breaking changes, coordinate with the team before merging. The automated workflow creates PRs (not direct commits) specifically to enable review.

### Type Checking Status

Type checking is **temporarily disabled** in the validation pipeline due to a Bun 1.x / TypeScript 5.9 compatibility issue (see [decision 05-05](.planning/decisions/05-05.md)). It will be re-enabled when Bun 2.x with full TypeScript 5.9+ support is available.

You can still run type checking manually if needed:

```bash
cd docs
bun run type-check
```

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
```

### Common Types

- `docs` - Documentation changes
- `fix` - Bug fixes
- `feat` - New features
- `style` - Formatting changes (no code logic changes)
- `refactor` - Code refactoring
- `test` - Test additions or changes
- `chore` - Build process, dependencies, tooling

### Examples

```bash
git commit -m "docs(api): add endpoint examples for search_datasets"
git commit -m "fix(links): correct broken reference to installation guide"
git commit -m "feat(search): add Orama integration for client-side search"
```

## Bypassing Pre-commit Hooks

In rare emergency situations (e.g., urgent hotfix), you can bypass pre-commit hooks:

### Single Commit Bypass

```bash
git commit --no-verify -m "message"
```

### Multiple Operations Bypass

```bash
export SKIP_SIMPLE_GIT_HOOKS=1
git commit -m "message"
git commit -m "another message"
```

On Windows PowerShell:
```powershell
$env:SKIP_SIMPLE_GIT_HOOKS=1
git commit -m "message"
```

**Important:** CI will still enforce all checks. Use bypass only for urgent situations where pre-commit validation is blocking necessary work. Your pull request may fail CI if validation issues exist.

## Project Structure

```
docs/
├── content/
│   └── docs/          # MDX documentation files
├── scripts/
│   ├── prebuild.ts    # Validation before build
│   ├── postbuild.ts   # Verification after build
│   └── validate-links.ts # Link validation
├── app/               # Next.js application code
├── public/            # Static assets
├── biome.json         # Biome configuration
└── package.json       # Dependencies and scripts
```

## Getting Help

- **File an issue:** https://github.com/YourOrg/datagvat-mcp/issues
- **Ask in discussions:** https://github.com/YourOrg/datagvat-mcp/discussions
- **Review existing docs:** Start with the [Getting Started guide](docs/content/docs/getting-started/index.mdx)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
