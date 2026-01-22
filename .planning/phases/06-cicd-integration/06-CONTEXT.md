# Phase 6: CI/CD Integration - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated quality checks for documentation infrastructure through GitHub Actions CI pipeline and pre-commit hooks using Husky. Ensures code quality, link integrity, and type safety before commits and merges.

</domain>

<decisions>
## Implementation Decisions

### GitHub Actions Workflow Structure
- File: `.github/workflows/docs-ci.yml`
- Trigger: Pull requests and pushes to main (only when `docs/**` paths change)
- Jobs: Sequential validation job + optional preview deployment job
- Validation steps: Checkout → Setup Bun → Install deps → Lint → Validate links → Build
- Build artifacts: Upload `.next` directory on main branch pushes (7 day retention)
- Preview deployment: Optional PR preview (template provided for Vercel/Netlify)

### Pre-commit Hook Configuration
- Tool: Husky for Git hook management
- Setup: `bunx husky init` to create `.husky/` directory
- Pre-commit checks:
  1. Run Biome on staged MDX files only (not entire codebase)
  2. Run link validation if any files in `docs/content` are staged
  3. Fail commit if either check fails
- Scope: Only check staged files to keep pre-commit fast
- Exit behavior: Block commit on failure with clear error message

### Validation Pipeline
- Biome linting: Check staged MDX files for style/quality issues
- Link validation: Run `bun run lint:links` on content changes
- Build verification: Full `bun run build` in CI to catch build failures
- Frozen lockfile: Use `--frozen-lockfile` in CI to ensure reproducible builds

### Failure Handling
- Pre-commit: Block commit immediately with error message if checks fail
- CI: Block merge if validation job fails (GitHub branch protection)
- Developer escape hatch: Not specified - assume standard `--no-verify` flag available for emergencies
- No auto-retry: Developers must fix issues and re-commit

### Performance Strategy
- Pre-commit: Only check staged files (not entire codebase)
- CI caching: Bun dependency caching via `oven-sh/setup-bun@v1` action
- Parallel jobs: Validation runs sequentially (lint → links → build), preview runs in parallel after validation
- Path filters: Only run on `docs/**` changes to avoid unnecessary runs

### Documentation Standards
- CONTRIBUTING.md file with:
  - Setup instructions (Bun installation, bun dev)
  - Writing style guide (active voice, present tense, sentence case headings)
  - Code example standards (WHY comments, no emojis, test all examples)
  - Commit message format (conventional commits)
  - Manual check commands (validate, lint:fix, lint:links)
- Style rules: No AI buzzwords, real Austrian dataset examples, <25 word sentences

### Claude's Discretion
- Preview deployment service choice (Vercel, Netlify, etc.)
- Exact CI job naming conventions
- Additional optional checks (type-check if re-enabled post-Bun fix)
- CONTRIBUTING.md location (docs/ vs root)

</decisions>

<specifics>
## Specific Ideas

- Ubuntu latest as CI runner (standard GitHub Actions environment)
- Bun latest version (not pinned - always use newest)
- Sequential validation steps to fail fast (lint before build)
- 7-day artifact retention for debugging production builds
- Husky instead of other pre-commit tools (explicit preference)
- Frozen lockfile in CI for reproducibility
- Path filters to avoid running on non-docs changes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-cicd-integration*
*Context gathered: 2026-01-22*
