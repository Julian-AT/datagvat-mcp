# Phase 1: Infrastructure Modernization - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build system runs on modern tooling (Bun runtime, Biome linter) with consistent quality enforcement and professional development workflows. Replace Node.js/npm with Bun, replace ESLint/Prettier with Biome, and rewrite all existing scripts professionally. All scripts must integrate into CI/CD with pre/post build hooks.

**What this phase delivers:**
- Migration from Node.js/npm to Bun
- Code quality enforcement via Biome
- Pre-commit hooks and CI/CD validation
- Professional, maintainable scripts (no AI-generated slop)
- Consistent development/production build pipeline

</domain>

<decisions>
## Implementation Decisions

### Runtime and Package Manager
- **Bun as primary runtime** — All scripts use Bun, not Node.js
- **Complete npm replacement** — All package.json scripts use "bun run" instead of "npm run"
- **Bun install for dependencies** — Replace "npm install" with "bun install"
- **Setup script for Bun installation** — Add installation check to package.json scripts

### Configuration Files Required
- **docs/bunfig.toml** — Bun configuration with install cache, test coverage, bash shell
- **docs/biome.json** — Comprehensive Biome configuration with specific rules (see specifics below)
- **VCS integration enabled** — Biome uses .gitignore via vcs.useIgnoreFile

### Code Quality Enforcement
- **Biome replaces ESLint and Prettier** — Single tool for linting and formatting
- **Strict linting rules** — Recommended rules enabled, plus custom style/complexity/suspicious rules
- **Format with errors disabled** — formatWithErrors: false (fail fast on errors)
- **Line width 100 characters** — Enforced across all files
- **Single quotes, semicolons always** — JavaScript formatting conventions

### Linting Rule Specifics
- **Style rules:** noNegationElse (error), useBlockStatements (warn), useCollapsedElseIf (error), useShorthandArrayType (error)
- **Complexity rules:** noExtraBooleanCast (error), noUselessFragments (error), useFlatMap (error)
- **Suspicious rules:** noConsoleLog (warn), noDebugger (error)
- **Ignored paths:** node_modules, .next, dist, build, *.min.js

### Build Pipeline Integration
- **Pre-build validation** — Must pass Biome linting, link validation, TypeScript type checking before build
- **Post-build validation** — Verify build output exists (.next/server, .next/static), report build size
- **Fail-fast strategy** — Any check failure exits with code 1 (blocks build)
- **Sequential checks** — Biome → Links → Types → Build → Post-validation

### Script Architecture
- **All scripts in TypeScript** — docs/scripts/*.ts (professional, maintainable)
- **Bun shell utilities** — Use `import { $ } from 'bun'` for shell commands
- **No AI slop** — Clean, professional code with proper error handling
- **Documentation required** — docs/scripts/README.md explains all scripts

### Specific Scripts Required
1. **validate-links.ts** — Scans MDX files, validates internal links/anchors using next-validate-link
2. **prebuild.ts** — Runs Biome lint, link validation, type checking in sequence
3. **postbuild.ts** — Verifies build output structure, reports build size

### Link Validation Details
- **Fumadocs integration** — Uses source.getPages() to get all documentation pages
- **Anchor extraction** — Extracts heading anchors from TOC for validation
- **Custom components** — Validates href attributes in Card, Callout, Tabs components
- **Relative path checking** — checkRelativePaths: 'as-url' mode
- **Error reporting** — printErrors with verbose flag, exit 1 on failure

### Package.json Script Commands
- **dev:** next dev (unchanged)
- **build:** bun run prebuild && next build && bun run postbuild
- **prebuild:** bun run scripts/prebuild.ts
- **postbuild:** bun run scripts/postbuild.ts
- **lint:** biome check .
- **lint:fix:** biome check --write .
- **lint:links:** bun run scripts/validate-links.ts
- **format:** biome format --write .
- **type-check:** tsc --noEmit
- **validate:** bun run lint && bun run lint:links && bun run type-check

### Claude's Discretion
- Exact error message formatting in scripts
- Build size reporting format (human-readable vs bytes)
- Whether to add color output to script console logs
- Whether to add progress indicators for long-running checks

</decisions>

<specifics>
## Specific Ideas

**Biome configuration structure:**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "formatter": { "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true, ... } },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always" } }
}
```

**Bunfig.toml structure:**
```toml
[install]
cache = "~/.bun/install/cache"

[test]
coverage = true

[run]
shell = "bash"
```

**Script error handling pattern:**
```typescript
try {
  await $`command`;
  console.log(`✓ Check passed\n`);
} catch (error) {
  console.error(`✗ Check failed`);
  process.exit(1);
}
```

**Link validation integration:**
- Use next-validate-link's scanURLs, validateFiles, printErrors
- Populate docs/[[...slug]] route with Fumadocs source pages
- Extract heading anchors from page.data.toc
- Pass custom MDX components (Card, Callout, Tabs) with href attributes

**Build verification checks:**
- Existence checks for .next/server, .next/static directories
- Build size reporting using `du -sh .next`
- Exit code 1 if any expected output missing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (infrastructure tooling and build pipeline)

</deferred>

---

*Phase: 01-infrastructure-modernization*
*Context gathered: 2026-01-20*
