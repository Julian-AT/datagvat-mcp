---
status: resolved
trigger: "CRITICAL BUG: CLI installer failing with module resolution errors"
created: 2026-01-22T00:00:00Z
updated: 2026-01-22T00:00:04Z
---

## Current Focus

hypothesis: VERIFIED - All three fixes successful
test: Tested both node and bun execution modes
expecting: CLI works via both modes
next_action: Archive debug session

## Symptoms

expected: CLI executes via `datagvat-mcp` command after `bun link`
actual: Module resolution errors when executing CLI
errors: (to be captured)
reproduction: Execute `bun link` in packages/cli/ then run `datagvat-mcp`
started: Current state blocking Plan 08-03

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-01-22T00:00:00Z
  checked: package.json configuration
  found: bin entry points to "./src/index.ts" (TypeScript source)
  implication: Node.js runtime cannot execute .ts files directly

- timestamp: 2026-01-22T00:00:00Z
  checked: package.json type field
  found: "type": "module" (ES modules enabled)
  implication: Strict ES module rules apply - requires .js extensions in imports

- timestamp: 2026-01-22T00:00:00Z
  checked: tsconfig.json moduleResolution
  found: "moduleResolution": "bundler"
  implication: TypeScript compiler uses bundler resolution, but Node.js runtime uses node16/nodenext

- timestamp: 2026-01-22T00:00:00Z
  checked: index.ts imports
  found: `import { initCommand } from './commands/init';` (no .js extension)
  implication: Will fail in Node.js ES modules which require explicit extensions

- timestamp: 2026-01-22T00:00:01Z
  checked: dist/index.js compiled output
  found: `import { detectTools } from './detect';` (no .js extension)
  implication: TypeScript compiled imports without .js extensions

- timestamp: 2026-01-22T00:00:02Z
  checked: Running node dist/index.js init
  found: Error [ERR_MODULE_NOT_FOUND]: Cannot find module './detect'
  implication: Node.js ES modules require explicit .js extension in imports

## Resolution

root_cause: THREE CRITICAL ISSUES:
1. package.json bin entry pointed to src/index.ts instead of dist/index.js
2. TypeScript imports lacked .js extensions (required by Node.js ES modules)
3. tsconfig.json used "moduleResolution": "bundler" which doesn't enforce Node.js standards

fix:
1. Changed package.json bin entry from "./src/index.ts" to "./dist/index.js"
2. Added .js extensions to all relative imports across 8 TypeScript files
3. Changed tsconfig.json: "moduleResolution": "bundler" -> "node16", "module": "ESNext" -> "Node16"

verification:
✅ node dist/index.js init - Works (detects tools, prompts user)
✅ bun src/index.ts --version - Works (development mode via bun)
✅ bun link successful - CLI linked to ~/.bun/bin/
✅ datagvat-mcp --version - Returns 0.1.0
✅ All dist/*.js files have .js extensions in imports
✅ TypeScript compilation passes with no errors

files_changed:
- C:\GitHub\datagvat-mcp\packages\cli\package.json
- C:\GitHub\datagvat-mcp\packages\cli\tsconfig.json
- C:\GitHub\datagvat-mcp\packages\cli\src\index.ts
- C:\GitHub\datagvat-mcp\packages\cli\src\commands\init.ts
- C:\GitHub\datagvat-mcp\packages\cli\src\configure.ts
- C:\GitHub\datagvat-mcp\packages\cli\src\detect.ts
- C:\GitHub\datagvat-mcp\packages\cli\src\paths.ts
- C:\GitHub\datagvat-mcp\packages\cli\src\messages.ts
- C:\GitHub\datagvat-mcp\packages\cli\src\detect.test.ts
