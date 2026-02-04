# Phase 21: Advanced Multi-Runtime Sandboxes

**Phase ID:** 21-multi-runtime-sandboxes
**Goal:** Expand the sandbox architecture to support diverse workloads (React Webapps, Machine Learning, Data Science) via selectable E2B templates and specialized artifact viewers.

**Current Architecture & Gaps:**
- **Current:** Single `python` sandbox using `@e2b/code-interpreter`. Optimized for single-script execution and static image outputs.
- **Gap 1 (React/Webapps):** Requires Node.js environment, multi-file support, dependency management (`npm install`), and port exposure (not just stdout).
- **Gap 2 (Template Selection):** LLM currently has no way to choose the environment (defaults to Python).
- **Gap 3 (Viewer):** Current viewer expects "Console + Images". Webapps need "Browser Preview" (iframe pointing to E2B URL).

## Architecture Changes

### 1. Template Registry & LLM Selection
Define a strict set of available templates to guide the LLM.

```typescript
export const SANDBOX_TEMPLATES = {
  'python-data': {
    id: 'code-interpreter-v1', // Standard E2B Python
    name: 'Data Analysis (Python)',
    description: 'Python environment with pandas, numpy, matplotlib, plotly.',
    tools: ['run_python', 'upload_file']
  },
  'react-webapp': {
    id: 'react-v1', // Custom E2B template or generic Node
    name: 'React Web Application',
    description: 'Node.js environment for building React components/apps.',
    tools: ['write_file', 'run_command', 'get_preview_url']
  },
  'ml-training': {
    id: 'ml-gpu-v1', // Hypothetical GPU template
    name: 'Model Training',
    description: 'Python environment with PyTorch/Scikit-learn.',
    tools: ['run_python_training']
  }
}
```

### 2. Sandbox Executor Refactor
Split `sandbox-executor.ts` into a factory pattern to handle different runtimes.

- **PythonExecutor:** (Existing logic) -> `runCode` -> Parse stdout/images.
- **NodeExecutor:** (New) -> `filesystem.write` -> `process.start('npm run dev')` -> `getHostname(port)`.

### 3. Artifact UI Upgrades
Enhance `SandboxArtifact` to support a "Preview" tab for web content.

- **Code Tab:** Multi-file support (or main file focus).
- **Output Tab:**
  - *Standard:* Logs/Terminal.
  - *Preview:* Iframe rendering `https://<sandbox-id>-<port>.e2b.dev`.

### 4. Interactive "App" Mode
For React apps, the interaction loop changes:
1.  **Scaffold:** AI runs `npx create-react-app` (or uses a pre-baked template).
2.  **Edit:** AI uses `write_file` to update components.
3.  **Preview:** `SandboxArtifact` detects the active port and renders the live view.

## Execution Plans

| # | Name | Description |
|---|------|-------------|
| **21-01** | **Template Infrastructure** | Update `openSandbox` tool to accept `template` ID. Create `SandboxRegistry`. Refactor `useSandboxes` to store template type. |
| **21-02** | **Node.js/React Support** | Implement `NodeExecutor`. Add logic to expose ports and return preview URLs. Create a basic "React App" prompt flow. |
| **21-03** | **Artifact Preview Tab** | Update `SandboxOutputTab` to support a live "Browser" view using the E2B public URL. Handle loading states for dev servers. |
| **21-04** | **Multi-File Editor** | (Stretch) Upgrade the Code Editor to support a simple file tree or tabbed editing for React projects (App.js, index.css, etc.). |

## Success Criteria
1.  User can ask "Build a React dashboard" -> System chooses React template.
2.  React app renders live in the Artifact window.
3.  User can ask "Train a model" -> System chooses ML template.
4.  Existing Python visualization flows remain unaffected.
