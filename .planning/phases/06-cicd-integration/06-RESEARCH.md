# Phase 6: CI/CD Integration - Research

**Researched:** 2026-01-22
**Domain:** CI/CD automation with GitHub Actions and pre-commit hooks
**Confidence:** HIGH

## Summary

CI/CD integration for documentation infrastructure uses GitHub Actions for continuous validation and simple-git-hooks for pre-commit checks. The project has **already decided on simple-git-hooks** (not Husky) per prior decision 01-03 (2026-01-20): "simple-git-hooks over husky for lightweight setup - single config object, no .husky/ directory."

The stack is straightforward: GitHub Actions workflows triggered by path filters run Bun-based validation (Biome lint, link validation, full build). Pre-commit hooks use Biome's `--staged` flag for fast, focused checks. The project already has `simple-git-hooks@^2.12.1` installed with a `prepare` script but **no actual hook configuration**.

Key architectural decision: **sequential validation** (lint → links → build) provides clear error identification. The existing CI workflow already has a separate `docs` job running in parallel with Python tests, matching the prior decision for faster feedback.

**Primary recommendation:** Configure simple-git-hooks in package.json with pre-commit validation, enhance existing GitHub Actions workflow with path filters and frozen lockfile, and create CONTRIBUTING.md documenting the validation pipeline.

## Standard Stack

The established tools for documentation CI/CD:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| simple-git-hooks | 2.12.1+ | Git hook management | Zero dependencies, 10.9 kB, single config object in package.json |
| GitHub Actions | N/A | CI/CD platform | Native GitHub integration, free for public repos, mature ecosystem |
| oven-sh/setup-bun | v2 | Bun installation in CI | Official Bun action, built-in caching, auto-version detection |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Biome CLI | 2.3.11 | Staged file linting | Pre-commit (--staged flag) and CI (full check) |
| next-validate-link | 1.6.4 | Link validation | Pre-commit (conditional) and CI (always) |
| actions/upload-artifact | v4 | Build artifact storage | CI only for debugging production builds |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| simple-git-hooks | Husky v9 | Husky is 6.44 kB (lighter) but requires .husky/ directory. Project chose simple-git-hooks explicitly. |
| simple-git-hooks | pre-commit (Python) | 80 kB with ~850 kB dependencies. Overkill for this use case. |
| bun install | bun install --frozen-lockfile | Frozen lockfile required in CI for reproducibility, optional locally. |

**Installation:**
```bash
# Already installed in project
bun install
```

**Configuration:**
```bash
# Apply hooks after configuration
bun run prepare  # Runs simple-git-hooks
```

## Architecture Patterns

### Recommended Project Structure
```
.github/
├── workflows/
│   └── ci.yml           # Already exists with docs job
docs/
├── package.json         # Add simple-git-hooks config
├── biome.json          # Already configured with VCS integration
└── scripts/
    ├── prebuild.ts     # Already exists
    ├── postbuild.ts    # Already exists
    └── validate-links.ts # Already exists
CONTRIBUTING.md          # To be created
```

### Pattern 1: Path-Filtered CI Workflow
**What:** GitHub Actions workflow triggered only when documentation files change
**When to use:** Always - prevents unnecessary CI runs on Python-only changes
**Example:**
```yaml
# Source: GitHub Actions official docs
# https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - '.github/workflows/ci.yml'
  pull_request:
    branches: [main]
    paths:
      - 'docs/**'
      - '.github/workflows/ci.yml'
```

**Key insight:** "A matching negative pattern (prefixed with `!`) after a positive match will exclude the path." Order matters for negation patterns.

### Pattern 2: Sequential Validation Pipeline
**What:** Run checks in order (lint → links → build) to fail fast
**When to use:** Always - identifies problems early without wasting CI time
**Example:**
```yaml
# Each step is a separate run command, not parallel jobs
- name: Run Biome lint
  run: cd docs && bun run lint

- name: Validate links
  run: cd docs && bun run lint:links

- name: Build documentation
  run: cd docs && bun run build
```

**Why sequential:** If linting fails, no point validating links or building. Clear error identification.

### Pattern 3: Staged-Only Pre-commit Validation
**What:** Pre-commit hook checks only staged files, not entire codebase
**When to use:** Always - keeps pre-commit fast (<2 seconds typical)
**Example:**
```javascript
// Source: Biome CLI documentation + simple-git-hooks docs
// https://biomejs.dev/reference/cli/
module.exports = {
  'pre-commit': 'cd docs && biome check --staged --write'
}
```

**Key insight:** Biome's `--staged` flag uses Git integration to check only files prepared for commit. The `--write` flag applies safe fixes automatically.

### Pattern 4: Frozen Lockfile in CI
**What:** Use `bun install --frozen-lockfile` to enforce reproducible builds
**When to use:** CI/CD only, not local development
**Example:**
```yaml
# Source: Bun official documentation
# https://bun.sh/docs/cli/install
- name: Install dependencies
  run: cd docs && bun install --frozen-lockfile
```

**Alternative:** Use `bun ci` which is equivalent to `bun install --frozen-lockfile`.

### Pattern 5: Bun Caching via Setup Action
**What:** Leverage oven-sh/setup-bun built-in caching for faster CI
**When to use:** Always - no configuration required, caching enabled by default
**Example:**
```yaml
# Source: oven-sh/setup-bun GitHub repository
# https://github.com/oven-sh/setup-bun
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: latest
# Caching is automatic - no additional steps needed
```

**Key insight:** Action caches Bun executable by default. Set `no-cache: true` only if debugging installation issues.

### Pattern 6: Artifact Upload for Build Debugging
**What:** Upload .next directory on main branch pushes for debugging
**When to use:** Main branch only - helps debug production build issues
**Example:**
```yaml
# Source: GitHub Actions artifact documentation
# https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts
- uses: actions/upload-artifact@v4
  if: github.ref == 'refs/heads/main'
  with:
    name: next-build
    path: docs/.next
    retention-days: 7
```

**Key insight:** v4 artifacts are immutable. Use retention-days to avoid excessive storage costs.

### Anti-Patterns to Avoid
- **Running validation on all files in pre-commit:** Slow, frustrating for developers. Use `--staged` flag.
- **Not using path filters:** Wastes CI minutes running docs checks when only Python code changed.
- **Pinning Bun to specific version in CI:** Project decision is "always use newest" - use `bun-version: latest`.
- **Using `bun install` without frozen lockfile in CI:** Allows dependency drift, non-reproducible builds.
- **Running type-check in CI currently:** Temporarily skipped due to Bun 1.x / TypeScript 5.9 global types conflict (decision 05-05).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Git hook management | Shell scripts in .git/hooks/ | simple-git-hooks | Handles installation, uninstallation, cross-platform compatibility, SKIP_SIMPLE_GIT_HOOKS env var |
| Bun setup in CI | Manual curl/unzip | oven-sh/setup-bun@v2 | Built-in caching, version detection from package.json, PATH configuration, outputs for debugging |
| Checking staged files | `git diff --cached \| xargs` | biome check --staged | Handles file deletions, binary files, special characters in filenames, respects .gitignore |
| Lockfile enforcement | Manual package.json/bun.lock comparison | bun install --frozen-lockfile | Detects version mismatches, handles transitive dependencies, exits with clear error |
| Commit message validation | Grep commit message | conventional-changelog tools | Parses scope, type, breaking changes. (Not required for this phase, but available.) |

**Key insight:** Git hook management has edge cases (Windows paths, node version managers, CI detection). simple-git-hooks handles these via `SIMPLE_GIT_HOOKS_RC` environment variable and `SKIP_SIMPLE_GIT_HOOKS=1` flag.

## Common Pitfalls

### Pitfall 1: Forgetting to Run `bun run prepare` After Config Changes
**What goes wrong:** Developers add or change pre-commit commands in package.json but hooks don't run because simple-git-hooks wasn't re-applied.
**Why it happens:** Unlike Husky v9+ which auto-installs, simple-git-hooks requires manual `npx simple-git-hooks` after configuration changes.
**How to avoid:** The `prepare` script runs automatically on `bun install`, but after editing config, explicitly run `bun run prepare`.
**Warning signs:** Committing files with linting errors that should have been caught by pre-commit.

### Pitfall 2: Pre-commit Hooks Not Running (Path Issues)
**What goes wrong:** Hooks fail with "command not found" errors for Bun or npm commands.
**Why it happens:** Git hooks run with minimal PATH, may not include Bun location. Critical on Windows or with version managers.
**How to avoid:**
- Create `~/.simple-git-hooks.rc` with PATH additions
- Set `SIMPLE_GIT_HOOKS_RC` environment variable globally
- Use absolute paths in hook commands (e.g., detect Bun location)
**Warning signs:** Hooks work in terminal but fail from GUI clients or VS Code.

### Pitfall 3: 300-File Path Filter Limit
**What goes wrong:** CI workflow doesn't trigger despite docs changes because PR modified >300 files.
**Why it happens:** GitHub generates diffs with 300-file limit. Path filters only evaluate first 300 files.
**How to avoid:** Structure path filters to match most-frequently-changed directories. Consider alternative: trigger on all PRs but add conditional job execution.
**Warning signs:** Large refactoring PRs skip CI despite touching docs/ files.

### Pitfall 4: SKIP_SIMPLE_GIT_HOOKS Not Working
**What goes wrong:** Setting environment variable doesn't bypass hooks as expected.
**Why it happens:** Environment variable must be set BEFORE git command, not in shell profile.
**How to avoid:**
```bash
# Correct
SKIP_SIMPLE_GIT_HOOKS=1 git commit -m "message"

# Also correct
export SKIP_SIMPLE_GIT_HOOKS=1
git commit -m "message"

# Wrong (in some shells)
git commit -m "message"  # $SKIP_SIMPLE_GIT_HOOKS set in .bashrc
```
**Warning signs:** Having to use `--no-verify` repeatedly instead of environment variable.

### Pitfall 5: Artifacts Not Uploading on Main Branch
**What goes wrong:** Artifact upload condition doesn't match despite being on main branch.
**Why it happens:** `github.ref` is `refs/heads/main` not `main` - string comparison fails.
**How to avoid:** Use exact ref format: `if: github.ref == 'refs/heads/main'`
**Warning signs:** Conditional steps showing "skipped" in Actions logs despite correct branch.

### Pitfall 6: Biome `--staged` Flag in Wrong Directory
**What goes wrong:** Biome reports "no files to check" despite staged MDX files.
**Why it happens:** Running `biome check --staged` from repository root when biome.json is in docs/ subdirectory.
**How to avoid:** Always `cd docs` before running Biome commands. VCS integration uses Git root but respects working directory for config resolution.
**Warning signs:** Pre-commit passes but CI fails with linting errors.

### Pitfall 7: Frozen Lockfile Failures on Legitimate Updates
**What goes wrong:** CI fails after adding legitimate dependency because lockfile doesn't match.
**Why it happens:** Developer forgot to commit updated `bun.lock` after `bun add`.
**How to avoid:** Always commit lockfile changes with dependency additions. Pre-commit hook could check for staged package.json without staged bun.lock.
**Warning signs:** CI error "lockfile disagrees with package.json" immediately after merging dependency update.

## Code Examples

Verified patterns from official sources:

### Complete simple-git-hooks Configuration
```javascript
// File: docs/package.json (add to package.json)
// Source: simple-git-hooks official documentation
// https://github.com/toplenboren/simple-git-hooks
{
  "simple-git-hooks": {
    "pre-commit": "cd docs && biome check --staged --write"
  },
  "scripts": {
    "prepare": "simple-git-hooks"
  }
}
```

**Alternative:** Create `.simple-git-hooks.cjs` in repository root:
```javascript
// File: .simple-git-hooks.cjs
// Source: simple-git-hooks documentation
module.exports = {
  'pre-commit': 'cd docs && biome check --staged --write'
};
```

### Complete GitHub Actions Workflow for Docs
```yaml
# File: .github/workflows/ci.yml (enhance existing workflow)
# Source: Compiled from official GitHub Actions, Bun, and project decisions
name: CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'docs/**'
      - '.github/workflows/ci.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'docs/**'
      - '.github/workflows/ci.yml'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          cd docs
          bun install --frozen-lockfile

      - name: Run Biome lint
        run: |
          cd docs
          bun run lint

      - name: Validate links
        run: |
          cd docs
          bun run lint:links

      - name: Build documentation
        run: |
          cd docs
          bun run build

      - name: Upload build artifacts
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v4
        with:
          name: next-build
          path: docs/.next
          retention-days: 7
```

### Biome VCS Configuration for Staged Files
```json
// File: docs/biome.json (already configured correctly)
// Source: Biome CLI documentation
// https://biomejs.dev/reference/cli/
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

**Note:** Project's biome.json already has this configuration. No changes needed.

### CONTRIBUTING.md Template
```markdown
# Contributing to data.gv.at MCP Documentation

## Setup

1. Install Bun: https://bun.sh
2. Install dependencies: `cd docs && bun install`
3. Install git hooks: `bun run prepare`
4. Start dev server: `bun dev`

## Writing Documentation

### Style Guide
- Use active voice, present tense
- Sentence case headings (capitalize first word only)
- Keep sentences under 25 words
- No AI buzzwords ("leverage", "harness", "unlock")
- Use real Austrian dataset examples

### Code Examples
- Add WHY comments explaining non-obvious code
- No emojis in code or output examples
- Test all code examples before committing

## Validation Pipeline

### Pre-commit Checks (Automatic)
When you commit, these checks run automatically:
- Biome linting on staged MDX files
- Fixes are applied automatically where safe

### Manual Validation Commands
Before pushing, run:
```bash
cd docs
bun run validate      # Run all checks
bun run lint:fix      # Fix linting issues
bun run lint:links    # Check for broken links
```

### CI Checks (Automatic)
Pull requests trigger:
1. Biome linting (entire codebase)
2. Link validation (entire content)
3. Full documentation build
4. Type checking (when re-enabled)

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `docs(api): add endpoint examples`
- `fix(links): correct broken reference`
- `feat(search): add Orama integration`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

## Bypassing Pre-commit Hooks

Emergency only:
```bash
# Single commit
git commit --no-verify -m "message"

# Multiple operations
export SKIP_SIMPLE_GIT_HOOKS=1
git commit -m "message"
```

**Note:** CI will still enforce all checks. Bypass only for urgent hotfixes.
```

### Pre-commit Hook with Conditional Link Validation
```javascript
// File: .simple-git-hooks.cjs or package.json
// Source: simple-git-hooks documentation + project requirements
module.exports = {
  'pre-commit': 'cd docs && biome check --staged --write && (git diff --cached --name-only | grep -q "^docs/content/" && bun run lint:links || true)'
};
```

**Note:** This runs link validation only if files in `docs/content/` are staged. May be too complex - consider running link validation in CI only.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Husky v4 | Husky v9 | ~2023 | Removed Node.js dependencies, uses Git core.hooksPath, 53.5 kB → 6.44 kB |
| npm install | bun install | Bun 1.0 (2023) | 10-25x faster installs, built-in lockfile support |
| binary bun.lockb | text-based bun.lock | Bun v1.2 (2024) | Lockfile now git-diff friendly, mergeable |
| actions/upload-artifact@v3 | @v4 | 2024 | Artifacts are now immutable, different storage backend |

**Deprecated/outdated:**
- **Husky v4 (4.3.8):** Used `node_modules/.bin` and scripts. Replaced by v9 which uses Git's native `core.hooksPath`.
- **`--frozen-lockfile` without `bun ci` alias:** Bun now provides `bun ci` as shorthand, recommended for CI/CD.
- **Checking entire codebase in pre-commit:** Modern approach uses `--staged` flag for fast validation.

**Current best practice:** simple-git-hooks + Biome `--staged` + GitHub Actions with path filters + frozen lockfile for reproducibility.

## Open Questions

Things that couldn't be fully resolved:

1. **Should link validation run in pre-commit hook?**
   - What we know: Context says "Run link validation if any files in `docs/content` are staged"
   - What's unclear: Link validation may be slow (needs testing). Conditional execution adds complexity.
   - Recommendation: Start with CI-only link validation. Add to pre-commit if fast enough (<1 second).

2. **Should type-check be added back to CI when Bun issue is resolved?**
   - What we know: Temporarily skipped due to Bun 1.x / TypeScript 5.9 global types conflict (decision 05-05)
   - What's unclear: Timeline for Bun 2.0 or TypeScript 5.10 fix
   - Recommendation: Monitor Bun changelog. Re-enable when conflict resolved. Add to workflow with `continue-on-error: true` initially.

3. **CONTRIBUTING.md location: docs/ vs repository root?**
   - What we know: Context lists as "Claude's Discretion"
   - What's unclear: Discoverability trade-off
   - Recommendation: **Repository root** - GitHub shows CONTRIBUTING.md link automatically on PR/issue pages. Symlink or mention in docs/ README if needed.

4. **Should preview deployments be included in initial implementation?**
   - What we know: Context says "optional PR preview (template provided for Vercel/Netlify)"
   - What's unclear: Deployment platform not chosen, may require secrets configuration
   - Recommendation: Provide commented-out template in workflow. Document setup steps. Don't activate until deployment platform confirmed.

## Sources

### Primary (HIGH confidence)
- simple-git-hooks GitHub repository - Installation, configuration, comparison with Husky
  https://github.com/toplenboren/simple-git-hooks
- oven-sh/setup-bun GitHub repository - Action inputs, outputs, caching behavior, examples
  https://github.com/oven-sh/setup-bun
- Biome CLI documentation - `--staged` flag, VCS integration, git hooks usage
  https://biomejs.dev/reference/cli/
- Bun lockfile documentation - bun.lock format, frozen lockfile, CI best practices
  https://bun.sh/docs/install/lockfile
- Bun install CLI documentation - `--frozen-lockfile` flag, `bun ci` command
  https://bun.sh/docs/cli/install
- GitHub Actions workflow syntax - Path filters, glob patterns, job dependencies
  https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- GitHub Actions artifacts - Upload/download actions, retention, immutability
  https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts
- Conventional Commits specification - Format, types, breaking changes
  https://www.conventionalcommits.org/en/v1.0.0/

### Secondary (MEDIUM confidence)
- Existing CI workflow (C:\Development\Private\datagvat_mcp\datagvat-mcp\.github\workflows\ci.yml) - Shows current docs job structure
- Project package.json - Shows simple-git-hooks 2.12.1 already installed, prepare script configured
- Project biome.json - Shows VCS integration already enabled
- Recent commit history - Confirms conventional commits format in use

### Tertiary (LOW confidence)
- None - All findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation for all tools, simple-git-hooks already installed in project
- Architecture: HIGH - Path filters, staged checks, frozen lockfile all documented in official sources
- Pitfalls: HIGH - Based on official documentation warnings and common issues sections
- Pre-commit setup: HIGH - simple-git-hooks usage documented, Biome `--staged` flag verified
- CI workflow: HIGH - GitHub Actions syntax verified, oven-sh/setup-bun@v2 usage confirmed

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - GitHub Actions and Bun are stable, infrequent breaking changes)

**Critical correction:** Phase context mentioned "Husky" but prior decision 01-03 explicitly chose "simple-git-hooks over husky for lightweight setup." This research reflects the actual decision. Planner should use simple-git-hooks, not Husky.
