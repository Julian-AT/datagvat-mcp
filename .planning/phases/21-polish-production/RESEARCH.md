# Research: Multi-Runtime Sandboxes with E2B

**Date:** 2026-02-04
**Goal:** Enable diverse workloads (React, ML, etc.) using E2B templates and exposed ports.

## 1. E2B Templates Architecture

E2B allows creating custom environments via `e2b.Dockerfile`.
- **Creation:** `e2b template build` generates a unique `templateID`.
- **Usage:** Pass `templateID` to `Sandbox.create(templateID)`.
- **Default Template:** The default `code-interpreter` template is optimized for Python/Jupyter but can be replaced.

### Key Workflows

#### A. React/Next.js Webapps
To support webapps, we need a Node.js-based template.
1.  **Template:** Use `node` base image.
2.  **Start Command:** `npm run dev` or `next dev`.
3.  **Networking:**
    *   E2B sandboxes are isolated micro-VMs.
    *   Ports (e.g., 3000) are automatically exposed via a secure tunnel.
    *   **Access:** `sandbox.getHostname(3000)` returns a URL like `https://<sandbox-id>-3000.e2b.dev`.
    *   **Security:** This URL is publicly accessible (with the random ID) or can be restricted. For our MVP, the random ID provides sufficient obscurity, but we should verify token-based access if possible.

#### B. Machine Learning
To support ML, we need a Python template with heavy libraries pre-installed.
1.  **Template:** Python base image.
2.  **Dependencies:** `torch`, `scikit-learn`, `tensorflow`, etc.
3.  **Hardware:** E2B supports GPU instances (requires specific tier/config).

## 2. Integration Strategy for Datagvat-MCP

### A. Template Registry
We should define a registry of available templates in the codebase.

```typescript
// lib/e2b/templates.ts
export const TEMPLATES = {
  DEFAULT: 'base', // or specific Python template ID
  REACT: 'react-v1', // We need to build and push this
  DATA_SCIENCE: 'ds-v1'
}
```

### B. Sandbox Executor Updates
The current `sandbox-executor.ts` is tightly coupled to `runCode` (Python).
We need to refactor it to support "Long-Running Processes" for webapps.

*   **Python:** `sandbox.runCode()` (Ephemeral or session-based).
*   **Webapp:**
    *   `sandbox.filesystem.write()` (Write code).
    *   `sandbox.commands.run('npm install && npm run dev', { background: true })`.
    *   `sandbox.getHostname(3000)`.

### C. Artifact UI Updates
The `SandboxArtifact` component needs to support a "Preview" mode.
*   **Current:** Code / Output (Console).
*   **New:** Code / Output / **Preview** (Iframe).
*   **Logic:** If the sandbox is a "Webapp" type, show the Preview tab by default.

## 3. Implementation Steps

1.  **Build Templates:**
    *   Create `mcp/templates/react/e2b.Dockerfile`.
    *   Build it to get a real `templateID` (or use a standard E2B Node template if available).
2.  **Update SDK:**
    *   Modify `executeSandboxCode` to accept `templateId`.
    *   Add `getPreviewUrl` function.
3.  **Update UI:**
    *   Add Iframe to `SandboxOutputTab`.
4.  **Prompt Engineering:**
    *   Teach the planner to select the right template.

## 4. Risks & Mitigations
*   **Startup Time:** Custom templates might take longer to cold-start. *Mitigation:* E2B caches snapshots.
*   **Port Availability:** Dev servers might take time to bind port 3000. *Mitigation:* Implement a "Waiting for server..." UI state in the Preview tab.
