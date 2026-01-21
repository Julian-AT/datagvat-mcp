# Phase 1: Infrastructure Modernization - Research

**Researched:** 2026-01-20
**Domain:** Build tooling modernization (Bun runtime, Biome linter/formatter, CI/CD, pre-commit hooks)
**Confidence:** HIGH

## Summary

Phase 1 modernizes the build infrastructure by replacing Node.js/npm with Bun runtime and ESLint/Prettier with Biome. The research validates that all user-specified tools (Bun, Biome, next-validate-link, GitHub Actions) are production-ready and have established patterns for Next.js projects.

**Key findings:**
- Bun 1.x is stable with comprehensive bunfig.toml configuration options for install, test, and run behaviors
- Biome 2.3.11 (already installed in project) provides unified linting and formatting with VCS integration
- Official oven-sh/setup-bun@v2 GitHub Action exists for CI/CD integration
- next-validate-link 1.6.4 provides scanURLs/validateFiles API for Fumadocs link validation
- Pre-commit hooks can use simple-git-hooks (lightweight) or husky (feature-rich)

**Primary recommendation:** Use Bun's built-in shell ($) for all scripts instead of external shell utilities. This provides cross-platform compatibility (including Windows) and eliminates dependencies like tsx/node for script execution.

## Standard Stack

The established tools for this infrastructure modernization:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bun | 1.x (latest stable) | Runtime and package manager | Single binary, faster than Node/npm, native TypeScript/JSX support, cross-platform shell |
| Biome | 2.3.11 | Linter and formatter | 100x faster than ESLint, unified tool (no ESLint+Prettier), official migration tools |
| next-validate-link | 1.6.4 | Link validation | Fumadocs-aware, validates internal links and anchors |
| oven-sh/setup-bun | v2 | GitHub Actions | Official Bun action, caches binary, supports version pinning |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| simple-git-hooks | Latest | Pre-commit hooks | Lightweight (single config object), no postinstall scripts |
| husky | 10.x | Pre-commit hooks (alternative) | Need advanced features (branch-specific hooks, multiple commands) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bun shell ($) | tsx + Node.js | tsx requires Node.js, Bun shell is cross-platform and faster |
| simple-git-hooks | husky | husky is 2kB, more features but more complex setup |
| Biome | ESLint + Prettier | Biome is 100x faster, but ESLint has more plugins/rules |

**Installation:**
```bash
# Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Bun (Windows PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"

# Dependencies (already in project)
# Biome: @biomejs/biome@2.3.11 (devDependencies)
# next-validate-link: next-validate-link@1.6.4 (devDependencies)

# Pre-commit hooks (choose one)
bun add -d simple-git-hooks  # Recommended for simplicity
```

## Architecture Patterns

### Recommended Project Structure
```
docs/
├── scripts/               # TypeScript scripts using Bun shell
│   ├── prebuild.ts       # Pre-build validation (Biome, links, types)
│   ├── postbuild.ts      # Post-build verification (output exists, size)
│   └── validate-links.ts # Link validation using next-validate-link
├── bunfig.toml           # Bun configuration
├── biome.json            # Biome configuration (already exists)
└── package.json          # Scripts use "bun run" commands
```

### Pattern 1: Bun Shell Scripts
**What:** Use Bun's native shell ($) for TypeScript scripts instead of external tools
**When to use:** All script files that need to run shell commands (validation, build, checks)
**Example:**
```typescript
// Source: https://bun.sh/docs/runtime/shell
import { $ } from "bun";

// Run commands cross-platform
await $`biome check .`;

// Capture output
const result = await $`tsc --noEmit`.text();

// Handle errors
try {
  await $`next build`;
} catch (err) {
  console.error(`Build failed: ${err.exitCode}`);
  process.exit(1);
}

// Redirect output
const buffer = Buffer.alloc(1000);
await $`du -sh .next > ${buffer}`;
console.log(buffer.toString());
```

### Pattern 2: Sequential Validation Pipeline
**What:** Pre-build script runs checks in sequence, failing fast on first error
**When to use:** prebuild.ts to ensure quality before Next.js build
**Example:**
```typescript
// Source: User requirements + Bun shell patterns
import { $ } from "bun";

async function prebuild() {
  console.log("Running Biome checks...");
  await $`biome check .`;
  console.log("✓ Biome passed\n");

  console.log("Validating links...");
  await $`bun run scripts/validate-links.ts`;
  console.log("✓ Links validated\n");

  console.log("Type checking...");
  await $`tsc --noEmit`;
  console.log("✓ Types validated\n");
}

prebuild().catch((err) => {
  console.error("Pre-build failed:", err);
  process.exit(1);
});
```

### Pattern 3: Link Validation with Fumadocs
**What:** Use next-validate-link's scanURLs + validateFiles for Fumadocs-aware validation
**When to use:** validate-links.ts script
**Example:**
```typescript
// Source: https://next-validate-link.vercel.app
import { scanURLs, printErrors, readFiles, validateFiles } from 'next-validate-link';

const scanned = await scanURLs({
  preset: 'next',
  // Fumadocs pages are in docs route
});

const files = await readFiles('content/**/*.{md,mdx}');

const results = await validateFiles(files, {
  scanned,
  checkRelativePaths: 'as-url',
});

printErrors(results, true); // exit code 1 on errors
```

### Pattern 4: bunfig.toml Configuration
**What:** Configure Bun's install, test, and run behavior
**When to use:** Project-local bunfig.toml in docs/ directory
**Example:**
```toml
# Source: https://bun.sh/docs/runtime/bunfig
[install]
cache = "~/.bun/install/cache"

[test]
coverage = true

[run]
shell = "bun"  # Use Bun's cross-platform shell
```

### Pattern 5: Biome Configuration (User-Specified)
**What:** Configure Biome with VCS integration and specific rules
**When to use:** biome.json already exists, update to user specifications
**Example:**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "formatWithErrors": false
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNegationElse": "error",
        "useBlockStatements": "warn",
        "useCollapsedElseIf": "error",
        "useShorthandArrayType": "error"
      },
      "complexity": {
        "noExtraBooleanCast": "error",
        "noUselessFragments": "error",
        "useFlatMap": "error"
      },
      "suspicious": {
        "noConsoleLog": "warn",
        "noDebugger": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

### Pattern 6: GitHub Actions Workflow
**What:** Use official oven-sh/setup-bun action for CI/CD
**When to use:** .github/workflows/*.yml files
**Example:**
```yaml
# Source: https://bun.sh/guides/runtime/cicd
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install
      - run: bun run validate  # prebuild checks
      - run: bun run build
```

### Pattern 7: Pre-commit Hooks (simple-git-hooks)
**What:** Configure pre-commit hooks in package.json
**When to use:** Prevent committing broken code
**Example:**
```json
{
  "simple-git-hooks": {
    "pre-commit": "bun run validate"
  },
  "scripts": {
    "prepare": "simple-git-hooks"
  }
}
```

### Anti-Patterns to Avoid
- **Using tsx/node for scripts:** Bun has native TypeScript support and cross-platform shell. Don't add Node.js dependencies.
- **Mixing package managers:** Don't mix npm/pnpm commands with Bun. Use "bun install", "bun run", not "npm run".
- **Ignoring VCS integration:** Biome can respect .gitignore. Always enable vcs.useIgnoreFile to avoid linting generated files.
- **Running checks in parallel:** Pre-build checks should be sequential (Biome → links → types) for clear error messages.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Link validation | Custom MDX parser + URL checker | next-validate-link | Fumadocs-aware, handles anchors, relative paths, custom components |
| Cross-platform shell | Conditional checks (if Windows) | Bun shell ($) | Native cross-platform shell, no platform detection needed |
| Git hook management | Manual .git/hooks scripts | simple-git-hooks | Package.json config, automatic install, workspace-aware |
| TypeScript execution | tsx, ts-node, or compile step | Bun native | Bun runs .ts files directly, no transpilation needed |
| Linter + Formatter | Separate ESLint + Prettier | Biome | Single tool, 100x faster, consistent config, official migration |

**Key insight:** Bun's native TypeScript/JSX support and cross-platform shell eliminate entire categories of tooling complexity. Don't add Node.js tools when Bun provides the capability natively.

## Common Pitfalls

### Pitfall 1: Package Manager Confusion
**What goes wrong:** Mixing "npm run" and "bun run" commands, or using npm install when bun.lockb exists
**Why it happens:** Muscle memory from Node.js projects, CI scripts copy-pasted from Node.js examples
**How to avoid:**
- Audit all package.json scripts to use "bun run" (user already specified this)
- In CI, use "bun install" not "npm install"
- Delete node_modules and package-lock.json before first "bun install"
**Warning signs:**
- Both bun.lockb and package-lock.json exist
- CI fails with "command not found" for bun commands

### Pitfall 2: Biome Configuration Overwrite
**What goes wrong:** Running "biome migrate eslint" overwrites existing biome.json
**Why it happens:** Biome's migrate command has no merge mode, always overwrites
**How to avoid:**
- User already has biome.json (2.3.11) with specific settings
- DO NOT run migrate commands in this project
- User has specified exact Biome configuration in CONTEXT.md
**Warning signs:**
- Biome config missing user-specified rules (noNegationElse, etc.)
- VCS integration disabled (vcs.enabled: false)

### Pitfall 3: Windows Path Separators in Scripts
**What goes wrong:** Scripts using "/" paths fail on Windows, or scripts use "\" and fail on Linux
**Why it happens:** Hardcoded path separators instead of using cross-platform utilities
**How to avoid:**
- Use Bun shell ($) which normalizes paths automatically
- Or use path.join() for dynamic paths in JavaScript
- Never hardcode "C:\\" or "/" in scripts
**Warning signs:**
- CI passes on Linux, fails on Windows (or vice versa)
- Path errors mentioning backslashes or forward slashes

### Pitfall 4: next-validate-link Fumadocs Integration
**What goes wrong:** Link validation doesn't check Fumadocs-generated pages or TOC anchors
**Why it happens:** Not using source.getPages() to enumerate all documentation pages
**How to avoid:**
- Use scanURLs with preset: 'next' (handles Next.js routes)
- Fumadocs pages are in docs/[[...slug]] route, automatically discovered
- User specified: extract heading anchors from page.data.toc for validation
**Warning signs:**
- Validation misses broken links in MDX files
- Anchor links (#heading) not validated

### Pitfall 5: Pre-commit Hook Not Installing
**What goes wrong:** Git hooks don't run on commit, validation bypassed
**Why it happens:** Forgot to run setup command, or package manager didn't run "prepare" script
**How to avoid:**
- Add "prepare" script: "simple-git-hooks" (runs on bun install)
- After install, verify .git/hooks/pre-commit exists
- Test with intentional error: git commit should block
**Warning signs:**
- Can commit code that fails "bun run validate"
- .git/hooks/pre-commit missing or not executable

### Pitfall 6: GitHub Actions Cache Miss
**What goes wrong:** CI installs Bun on every run, slowing down builds
**Why it happens:** oven-sh/setup-bun@v2 caches the Bun binary, but not dependencies
**How to avoid:**
- oven-sh/setup-bun caches the Bun executable by default
- For dependency caching, use actions/cache with ~/.bun/install/cache
- Cache key should include bun.lockb hash
**Warning signs:**
- CI takes >1 minute to install Bun (should be seconds)
- "Downloading Bun" message on every CI run

### Pitfall 7: formatWithErrors Configuration
**What goes wrong:** Biome formats files with syntax errors, hiding bugs
**Why it happens:** Default formatWithErrors is true in some contexts
**How to avoid:**
- User specified: formatWithErrors: false (fail fast on errors)
- This ensures syntax errors are caught before formatting
**Warning signs:**
- Biome formats file but TypeScript compilation fails
- Syntax errors not caught in pre-commit

## Code Examples

Verified patterns from official sources:

### Bun Shell Command Execution
```typescript
// Source: https://bun.sh/docs/runtime/shell
import { $ } from "bun";

// Basic command
await $`echo "Hello World!"`;

// Capture output
const result = await $`tsc --noEmit`.text();

// Handle errors (default: throws on non-zero exit)
try {
  await $`biome check .`;
} catch (err) {
  console.error(`Exit code: ${err.exitCode}`);
  console.error(`Output: ${err.stdout.toString()}`);
  process.exit(1);
}

// Disable throwing for conditional logic
const { exitCode } = await $`some-command`.nothrow();
if (exitCode !== 0) {
  console.warn("Command failed but continuing...");
}
```

### next-validate-link API Usage
```typescript
// Source: https://next-validate-link.vercel.app
import { scanURLs, printErrors, readFiles, validateFiles } from 'next-validate-link';

// 1. Scan site URLs (Next.js preset)
const scanned = await scanURLs({ preset: 'next' });

// 2. Read MDX files
const files = await readFiles('content/**/*.{md,mdx}');

// 3. Validate all links
const results = await validateFiles(files, {
  scanned,
  checkRelativePaths: 'as-url',
});

// 4. Print errors and exit on failure
printErrors(results, true); // true = exit code 1 if errors
```

### Biome CLI Commands
```typescript
// Source: https://biomejs.dev/reference/cli/

// Check (lint + format, no writes)
await $`biome check .`;

// Check and fix
await $`biome check --write .`;

// Format only
await $`biome format --write .`;

// Lint only
await $`biome lint --write .`;

// Type check (TypeScript)
await $`tsc --noEmit`;
```

### GitHub Actions with Bun
```yaml
# Source: https://bun.sh/guides/runtime/cicd
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      # Dependencies cached automatically by setup-bun
      - run: bun install

      # Run validation
      - run: bun run validate

      # Build
      - run: bun run build
```

### simple-git-hooks Configuration
```json
// Source: https://github.com/toplenboren/simple-git-hooks
{
  "simple-git-hooks": {
    "pre-commit": "bun run validate"
  },
  "scripts": {
    "prepare": "simple-git-hooks"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Node.js + npm | Bun runtime | Bun 1.0 (Sept 2023) | 3-5x faster installs, native TypeScript |
| ESLint + Prettier | Biome | Biome 1.0 (Nov 2023) | 100x faster linting, single tool |
| tsx/ts-node | Bun native | Bun 0.1+ (2022) | No transpilation step, faster startup |
| bash/sh scripts | Bun shell ($) | Bun 1.1+ (2024) | Cross-platform (Windows), no external shell |
| husky v4 | husky v10 / simple-git-hooks | v5+ (2021) | Simpler setup, no .husky/ directory clutter |

**Deprecated/outdated:**
- **tsx for script execution:** Bun runs TypeScript natively, no need for tsx
- **npm lifecycle scripts with Node:** Bun respects package.json scripts, runs with Bun runtime
- **ESLint/Prettier in new projects:** Biome is the modern unified tool (ESLint still valid for existing projects with complex plugins)

## Open Questions

Things that couldn't be fully resolved:

1. **Bun + Next.js 16 Compatibility**
   - What we know: Bun 1.x supports Next.js, user currently has Next.js 16.1.3
   - What's unclear: Any specific Next.js 16 features that require Node.js instead of Bun
   - Recommendation: Use "next dev" and "next build" commands (Next.js native), not "bun --bun next dev". This ensures full Next.js compatibility. Bun runs Next.js commands correctly.

2. **Fumadocs TOC Anchor Extraction**
   - What we know: User specified extracting heading anchors from page.data.toc
   - What's unclear: Exact structure of page.data.toc from Fumadocs source
   - Recommendation: Inspect docs source export (docs/.source/server.ts shows page structure) to see toc format. Likely array of {title, url, depth} objects.

3. **Build Size Reporting Format**
   - What we know: User wants build size reporting in postbuild.ts
   - What's unclear: Human-readable (MB/KB) vs exact bytes, summary vs per-route breakdown
   - Recommendation: Start with simple "du -sh .next" output. User marked this as Claude's discretion in CONTEXT.md.

## Sources

### Primary (HIGH confidence)
- [Bun Documentation](https://bun.sh/docs) - Runtime, shell, configuration
- [Bun bunfig.toml Reference](https://bun.sh/docs/runtime/bunfig) - Configuration options
- [Bun Shell Documentation](https://bun.sh/docs/runtime/shell) - $ command usage
- [Bun CI/CD Guide](https://bun.sh/guides/runtime/cicd) - GitHub Actions integration
- [Bun Installation](https://bun.sh/docs/installation) - System requirements, install commands
- [Bun CLI Run](https://bun.sh/docs/cli/run) - Package.json scripts
- [Biome Configuration Reference](https://biomejs.dev/reference/configuration/) - Complete config options
- [Biome CLI Reference](https://biomejs.dev/reference/cli/) - check, format, lint commands
- [Biome Migration Guide](https://biomejs.dev/guides/migrate-eslint-prettier/) - ESLint/Prettier migration
- [next-validate-link Documentation](https://next-validate-link.vercel.app) - API reference
- [oven-sh/setup-bun Action](https://github.com/oven-sh/setup-bun) - GitHub Actions setup

### Secondary (MEDIUM confidence)
- [simple-git-hooks README](https://github.com/toplenboren/simple-git-hooks) - Configuration examples
- [husky Documentation](https://typicode.github.io/husky/) - Pre-commit hooks alternative

### Tertiary (LOW confidence)
- None - All findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools have official docs, stable releases, active maintenance
- Architecture: HIGH - User provided specific configuration in CONTEXT.md, validated against official docs
- Pitfalls: MEDIUM - Based on common migration patterns and documentation warnings, some are inferred

**Research date:** 2026-01-20
**Valid until:** 30 days (stable tooling, no major version changes expected)

**User decisions incorporated:**
- Complete Bun configuration (bunfig.toml) from CONTEXT.md
- Complete Biome configuration (biome.json) with specific rules from CONTEXT.md
- Three required scripts (validate-links.ts, prebuild.ts, postbuild.ts) from CONTEXT.md
- All package.json script commands from CONTEXT.md
- Fumadocs integration specifics (source.getPages(), next-validate-link) from CONTEXT.md

**Research scope:** Focused on infrastructure tooling only. Does not cover:
- Content reorganization (Phase 2)
- Documentation quality (Phase 4)
- API documentation (Phase 7)
- CLI tools (Phase 8)
