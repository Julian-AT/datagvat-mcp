# Phase 19: Getting Started Content - Research

**Researched:** 2026-01-19
**Domain:** Technical Documentation / Getting Started Content
**Confidence:** HIGH

## Summary

Phase 19 creates the critical first-touch documentation that gets new users from zero to their first successful Austria MCP query in under 5 minutes. This phase focuses on practical, copy-paste ready content covering installation, quickstart tutorial, first query walkthrough, quick reference cheat sheet, and troubleshooting guide.

**Core insight:** Getting started content differs from reference documentation. It must be learning-oriented (not reference-oriented), action-driven (not explanation-heavy), and reliability-tested (every step must work exactly as written). The 5-minute time constraint requires ruthless focus on the minimal viable path.

**Primary recommendation:** Structure content as a progressive sequence: Prerequisites → Installation (copy-paste commands) → First Query (guaranteed success) → Quick Reference (scanning aid) → Troubleshooting (safety net). Use Fumadocs Callout components for warnings, Tabs for OS-specific instructions, and code blocks with copy buttons for all commands.

## Standard Stack

All libraries already installed from Phase 18. This phase writes content, not code.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fumadocs-ui | 16.4.7 | Callout, Tabs, code blocks | Official UI library |
| fumadocs-mdx | 14.2.6 | MDX compilation, syntax highlighting | Official MDX integration |
| shiki | 3.21.0 | Syntax highlighting | Industry standard, 200+ languages |
| fumadocs-core | 16.4.7 | remark-steps for sequential tutorials | Official plugins |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-icons | 1.3.2 | Icon set for Callout types | Warning, info, tip icons |
| next-themes | 0.4.6 | Theme-aware code blocks | Light/dark syntax highlighting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fumadocs Callout | Custom alert boxes | Callout provides semantic types, consistent styling |
| Shiki | Prism.js | Shiki has better theme integration, no runtime JS |
| Tabs for OS instructions | Separate pages | Tabs reduce navigation, keep context |

**Installation:**
```bash
# No new packages needed - all installed in Phase 18
cd docs && npm list fumadocs-ui shiki
```

## Architecture Patterns

### Recommended Content Structure
```
docs/getting-started/
├── meta.json                       # Navigation order
├── index.mdx                       # Landing: overview + links
├── installation.mdx                # START-02: step-by-step install
├── quickstart.mdx                  # START-01: <5 min to first query
├── first-query.mdx                 # START-03: tutorial with expected output
├── quick-reference.mdx             # START-04: cheat sheet
└── troubleshooting.mdx             # START-05: common issues + solutions
```

### Pattern 1: Progressive Tutorial Structure (Diataxis)

**What:** Getting Started content follows learning-oriented tutorial pattern

**When to use:** New users with no prior experience, need guaranteed success

**Structure:**
```markdown
# Page Title

[One-line goal statement]

## Prerequisites
[Checklist: what user needs before starting]

## Step 1: [Action Verb]
[Explanation: why this step matters]
[Code block with copy button]
[Expected output]

## Step 2: [Action Verb]
[Same structure]

## Verify Success
[How user knows they succeeded]

## Next Steps
[Links to deeper content]
```

**Example:**
```mdx
---
title: Quickstart Guide
description: Get your first dataset query results in 5 minutes
---

# Quickstart Guide

Search for Austrian open datasets and get results in under 5 minutes.

## Prerequisites

Before starting, ensure you have:

- [ ] Claude Desktop installed ([Download](https://claude.ai/download))
- [ ] Austria MCP server installed ([Installation Guide](/getting-started/installation))
- [ ] Claude Desktop restarted after MCP configuration

## Step 1: Open Claude Desktop

Launch Claude Desktop. Look for the MCP server indicator in the bottom toolbar:

- ✅ **Connected:** "datagvat-local" shows green status
- ❌ **Not connected:** See [Troubleshooting](/getting-started/troubleshooting#server-not-appearing)

## Step 2: Run Your First Search

Ask Claude this exact question:

```
Find datasets about Vienna population
```

Claude will use the `semantic_search_datasets` tool behind the scenes.

**Expected output:**

```json
{
  "results": [
    {
      "id": "abc-123",
      "title": "Vienna Population Statistics 2023",
      "description": "Demographic data for Vienna districts...",
      "quality_score": 95
    }
  ]
}
```

## Verify Success

You've succeeded if:

- [ ] Claude responds with dataset titles and descriptions
- [ ] Results include dataset IDs (needed for next steps)
- [ ] Quality scores appear (0-100 range)

## Next Steps

- **[First Query Tutorial](/getting-started/first-query)** - Deeper walkthrough
- **[Quick Reference](/getting-started/quick-reference)** - Common commands cheat sheet
- **[Searching Guide](/guides/searching)** - Advanced search techniques
```

**Why this works:**
- **Clear goal:** User knows what success looks like (5 minutes, first query results)
- **Prerequisites:** Prevents "it doesn't work" from missing setup
- **Expected output:** User can verify they're on track
- **Checkboxes:** Actionable validation steps
- **Copy-paste code:** Reduces typing errors
- **Next steps:** Progressive disclosure to deeper content

**Source:** Diataxis tutorial pattern (https://docs.divio.com/documentation-system/tutorials/)

### Pattern 2: Installation with OS-Specific Instructions

**What:** Use Tabs component for platform-specific installation steps

**When to use:** Installation differs by OS (Windows/macOS/Linux)

**Example:**
```mdx
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';

## Clone Repository

<Tabs items={['macOS/Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS/Linux">
    ```bash
    git clone https://github.com/yourusername/datagvat-mcp.git
    cd datagvat-mcp/mcp
    ```
  </Tab>

  <Tab value="Windows">
    ```bash
    git clone https://github.com/yourusername/datagvat-mcp.git
    cd datagvat-mcp\mcp
    ```
  </Tab>
</Tabs>

## Configure Claude Desktop

<Tabs items={['macOS', 'Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS">
    Edit `~/.claude/claude_desktop_config.json`:

    ```json
    {
      "mcpServers": {
        "datagvat": {
          "command": "python3",
          "args": ["-m", "app.server"],
          "cwd": "/Users/yourname/datagvat-mcp/mcp"
        }
      }
    }
    ```
  </Tab>

  <Tab value="Linux">
    Edit `~/.config/Claude/claude_desktop_config.json`:

    ```json
    {
      "mcpServers": {
        "datagvat": {
          "command": "python3",
          "args": ["-m", "app.server"],
          "cwd": "/home/yourname/datagvat-mcp/mcp"
        }
      }
    }
    ```
  </Tab>

  <Tab value="Windows">
    Edit `%APPDATA%\Claude\claude_desktop_config.json`:

    ```json
    {
      "mcpServers": {
        "datagvat": {
          "command": "python",
          "args": ["-m", "app.server"],
          "cwd": "C:\\Users\\YourName\\datagvat-mcp\\mcp"
        }
      }
    }
    ```

    <Callout type="warn">
    **Windows paths:** Use double backslashes (`\\`) in JSON paths.
    </Callout>
  </Tab>
</Tabs>
```

**Key features:**
- `groupId="os"` + `persist`: OS selection persists across pages
- User selects OS once, all installation pages show correct commands
- `Callout type="warn"`: Highlights platform-specific gotchas

**Source:** Phase 18 research (Tabs pattern) + existing installation.mdx

### Pattern 3: Callout Types for Safety Rails

**What:** Use semantic Callout types to highlight critical information

**When to use:** Warnings, prerequisites, success criteria, debugging tips

**Available types:**
```mdx
import { Callout } from 'fumadocs-ui/components/callout';

<Callout type="info">
**Tip:** Use `semantic_search_datasets` for natural language queries.
</Callout>

<Callout type="warn">
**Warning:** Use absolute paths in `cwd`, not relative paths or `~`.
</Callout>

<Callout type="error">
**Critical:** Restart Claude Desktop after changing `claude_desktop_config.json`.
</Callout>

<Callout type="note">
**Note:** The server starts automatically when Claude Desktop launches.
</Callout>
```

**Usage guidelines:**
- **info:** Helpful tips, alternative approaches
- **warn:** Common mistakes, data loss risks
- **error:** Critical blockers, security issues
- **note:** Additional context, explanations

**Source:** Fumadocs Callout component (existing in Phase 18)

### Pattern 4: Expected Output Verification

**What:** Show exact expected output after commands for user verification

**When to use:** Every action that produces output (searches, API calls, installs)

**Example:**
```mdx
## Test Installation

Run this command to verify the server loads:

```bash
python -c "from app.server import mcp; print('✅ Server loads successfully')"
```

**Expected output:**

```
✅ Server loads successfully
```

**If you see errors instead:**

- `ModuleNotFoundError: No module named 'app'` → [Wrong working directory](/getting-started/troubleshooting#wrong-working-directory)
- `ModuleNotFoundError: No module named 'fastmcp'` → [Dependencies not installed](/getting-started/troubleshooting#dependencies-missing)
```

**Why this works:**
- **Verification:** User knows if they succeeded
- **Error mapping:** Links specific errors to troubleshooting sections
- **Confidence:** Reduces "did I do it right?" uncertainty

**Source:** Existing installation.mdx + Diataxis tutorial best practices

### Pattern 5: Troubleshooting with Symptom-Cause-Fix Structure

**What:** Organize troubleshooting by observable symptoms, not technical causes

**When to use:** Troubleshooting guide, error reference sections

**Structure:**
```markdown
### [Observable Symptom]

**Symptom:** [What user sees/experiences]

**Cause:** [Why it happens - technical explanation]

**Fix:** [Step-by-step solution]

**Verification:** [How to confirm it's fixed]
```

**Example:**
```mdx
### Server Not Appearing in Claude Desktop

**Symptom:** Austria MCP server doesn't show in Claude Desktop toolbar, tools not available

**Cause:** Configuration file syntax error, invalid path, or Claude Desktop hasn't loaded config

**Fix:**

1. **Check config syntax:**
   ```bash
   python -m json.tool ~/.claude/claude_desktop_config.json
   ```

   If you see errors, fix JSON syntax (missing commas, quotes, brackets)

2. **Verify path is absolute:**
   ```json
   {
     "cwd": "/absolute/path/to/datagvat-mcp/mcp"  // ✅ Correct
     // NOT: "~/datagvat-mcp/mcp"                 // ❌ Relative path fails
   }
   ```

3. **Restart Claude Desktop:**
   - **macOS:** Cmd+Q to quit (not just close window)
   - **Windows:** Right-click system tray → Exit
   - **Linux:** `killall claude-desktop`

   Then relaunch Claude Desktop

**Verification:**

Open Claude Desktop and check toolbar:
- ✅ "datagvat" appears with green status indicator
- ✅ Asking Claude "what MCP servers are connected?" includes datagvat

**Still not working?** See [Log file locations](#log-file-locations) for detailed error messages.
```

**Why this works:**
- **User-centric:** Organized by what user observes, not technical categorization
- **Progressive detail:** Quick fix first, then detailed explanation
- **Verification step:** User knows when problem is solved
- **Escape hatch:** Links to deeper debugging when quick fix fails

**Source:** Existing installation.mdx troubleshooting section + technical writing best practices

### Pattern 6: Quick Reference Cheat Sheet

**What:** Scannable table of common operations for quick lookup

**When to use:** After tutorials, as ongoing reference during usage

**Example:**
```mdx
---
title: Quick Reference
description: Common Austria MCP operations cheat sheet
---

# Quick Reference

Quick lookup for common Austria MCP operations.

## Search Operations

| Goal | Natural Language Query | Expected Result |
|------|------------------------|-----------------|
| Find datasets | "Search for [topic] datasets" | List of matching datasets with titles, IDs |
| Semantic search | "Find data about [concept]" | Relevance-ranked results with quality scores |
| Filter by theme | "Show health datasets from Vienna" | Filtered results (HEAL theme + Vienna publisher) |
| Recent datasets | "Latest datasets updated in 2024" | Time-filtered results |

## Data Preview Operations

| Goal | Natural Language Query | Expected Result |
|------|------------------------|-----------------|
| Get dataset details | "Show details for dataset [ID]" | Full metadata, distributions, license |
| Preview data | "Show first 10 rows of [URL]" | Sample data with schema |
| Check schema | "What columns does [URL] have?" | Column names, types, sample values |

## Quality Analysis

| Goal | Natural Language Query | Expected Result |
|------|------------------------|-----------------|
| Check quality | "Analyze quality of dataset [ID]" | Quality score (0-100) with breakdown |
| Find related | "Find datasets similar to [ID]" | Related datasets with similarity scores |

## Common Parameters

| Parameter | Values | Example |
|-----------|--------|---------|
| `limit` | Number (default: 20) | `limit=10` - Return 10 results |
| `themes` | EU DCAT-AP codes | `themes=["HEAL", "SOCI"]` - Health or social |
| `formats` | CSV, JSON, XML, etc. | `formats=["CSV"]` - Only CSV datasets |
| `quality_boost` | true/false | `quality_boost=true` - Prioritize high quality |

## EU Theme Codes

| Code | Category | Example Datasets |
|------|----------|------------------|
| HEAL | Health | Hospital data, vaccination statistics |
| SOCI | Society & Population | Demographics, census data |
| ENVI | Environment | Air quality, climate data |
| TRAN | Transport | Traffic, public transit schedules |
| ECON | Economy | GDP, employment statistics |
| GOVE | Government | Budget, election results |

## Next Steps

- **[Searching Guide](/guides/searching)** - Advanced search techniques
- **[Quality Metrics](/guides/quality-metrics)** - Understanding quality scores
- **[API Reference](/api/tools)** - Complete tool documentation
```

**Why this works:**
- **Scannable:** Tables enable quick visual lookup
- **Goal-oriented:** Organized by what user wants to accomplish
- **Natural language:** Shows how to phrase questions to Claude
- **Reference values:** Theme codes, parameters readily available
- **Links to depth:** Progressive disclosure to detailed guides

**Source:** Technical documentation best practices + existing index.mdx content

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Manual <pre><code> with CSS | Fumadocs code blocks (Shiki) | Supports 200+ languages, theme-aware, copy button built-in |
| OS-specific instructions | Separate pages or manual divs | Fumadocs Tabs with persist | User selects OS once, choice persists across pages |
| Warning callouts | Custom styled divs | Fumadocs Callout component | Semantic types (warn, error, info), consistent styling, icons |
| Code copy functionality | Custom clipboard JS | Fumadocs code block copy button | Built-in, accessible, works with keyboard navigation |
| Step-by-step tutorials | Numbered lists | Fumadocs Steps component (remark-steps) | Visual progress, numbered styling, mobile-responsive |
| Expected output formatting | Manual JSON highlighting | Fumadocs code blocks with language | Automatic syntax highlighting, line numbers |

**Key insight:** Fumadocs provides all UI patterns needed for getting started content. Focus on content quality (accuracy, clarity, completeness), not component building.

## Common Pitfalls

### Pitfall 1: Assuming Prerequisites Are Obvious

**What goes wrong:** User follows installation steps but commands fail because Python isn't installed

**Why it happens:** Documentation writers assume context (Python, git, terminal knowledge)

**How to avoid:**

```mdx
## Prerequisites

Before installing Austria MCP, ensure you have:

- [ ] **Python 3.11 or higher** - [Download Python](https://www.python.org/downloads/)
  - Verify: `python --version` should show 3.11+
- [ ] **pip or uv package manager** - Included with Python
  - Verify: `pip --version` should display version
- [ ] **Claude Desktop** - [Download Claude Desktop](https://claude.ai/download)
  - Verify: Application launches successfully
- [ ] **git** - [Install git](https://git-scm.com/downloads)
  - Verify: `git --version` displays version

<Callout type="warn">
**Windows users:** Ensure Python is added to PATH during installation (check "Add Python to PATH" in installer).
</Callout>
```

**Warning signs:**
- User reports "command not found" errors
- Installation fails silently
- User asks "what is pip?"

**Prevention:** Explicit prerequisites section with verification commands and installation links

**Source:** Existing installation.mdx + technical writing best practices

### Pitfall 2: No Expected Output for Verification

**What goes wrong:** User runs command but doesn't know if output is correct

**Why it happens:** Documentation shows command but not what success looks like

**How to avoid:**

```mdx
❌ **Bad - no verification:**

Run this command:
```bash
python -m app.server
```

✅ **Good - shows expected output:**

Run this command to test the server:
```bash
python -m app.server
```

**Expected output:**
```
INFO:app.server:Austria MCP Server starting...
INFO:app.server:Registered 25 tools
INFO:app.server:Server ready
```

**If you see errors:**
- `ModuleNotFoundError` → Dependencies missing, run `pip install -e .`
- `SyntaxError` → Python version too old, upgrade to 3.11+
```

**Warning signs:**
- Support questions "is this normal?"
- Users don't know if installation succeeded
- Silent failures go unnoticed

**Prevention:** Show expected output for every command, map common errors to solutions

**Source:** Diataxis tutorial pattern + existing documentation analysis

### Pitfall 3: Deep Explanation in Quickstart (Violates 5-Minute Constraint)

**What goes wrong:** Quickstart includes detailed explanations, taking 15+ minutes to read

**Why it happens:** Writers want to explain "why" before showing "how"

**How to avoid:**

```mdx
❌ **Bad - explanation-heavy:**

# Quickstart Guide

Austria MCP uses the Model Context Protocol to provide programmatic access to
the data.gv.at platform. The protocol defines a standard way for AI assistants
to communicate with external data sources through a JSON-RPC interface over stdio.
The server implements 25 tools organized into discovery, analysis, preview,
management, and vocabulary modules...

[10 more paragraphs of explanation before first action]

✅ **Good - action-first:**

# Quickstart Guide

Search Austrian open datasets in 5 minutes.

## Prerequisites
- Claude Desktop installed
- Austria MCP configured

## Step 1: Run First Search

Ask Claude:
```
Find datasets about Vienna population
```

**Expected result:** List of population datasets

✅ You're done! See [First Query Tutorial](/getting-started/first-query) for details.

## Next Steps
- [Quick Reference](/getting-started/quick-reference) - Command cheat sheet
- [How It Works](/guides/architecture) - Technical deep-dive
```

**Warning signs:**
- Word count >1000 for quickstart page
- Time to first action >2 minutes reading
- "Background" or "Theory" sections in quickstart

**Prevention:**
- START with action, defer explanation to guides
- Link to depth, don't include it inline
- Test with real users, measure time to first success

**Source:** Diataxis tutorial principle: "minimal explanation, maximum action"

### Pitfall 4: Troubleshooting Organized by Technical Cause (Not User Symptom)

**What goes wrong:** Troubleshooting has sections like "Path Issues" but user sees "Server not appearing"

**Why it happens:** Engineers organize by problem domain, not user experience

**How to avoid:**

```mdx
❌ **Bad - technical organization:**

## Configuration Issues

### Path Problems
[Details about absolute vs relative paths]

### JSON Syntax Errors
[Details about JSON formatting]

✅ **Good - symptom-based organization:**

## Server Not Appearing in Claude Desktop

**Symptom:** MCP server doesn't show in toolbar

**Possible causes:**
1. Invalid path in configuration → [Fix: Use absolute paths](#fix-absolute-paths)
2. JSON syntax error → [Fix: Validate JSON](#fix-json-syntax)
3. Claude Desktop not restarted → [Fix: Restart application](#fix-restart)

## Tools Not Working

**Symptom:** Server connected but tool calls fail

**Possible causes:**
1. Dependencies not installed → [Fix: Run pip install](#fix-dependencies)
2. Python version too old → [Fix: Upgrade Python](#fix-python-version)
```

**Warning signs:**
- Users can't find solution for "Server doesn't appear"
- Troubleshooting sections map to code architecture, not user experience
- Multiple sections describe same user-visible problem

**Prevention:**
- Organize by observable symptom (what user sees)
- Map each symptom to possible causes
- Provide verification step after each fix

**Source:** Technical support documentation best practices

### Pitfall 5: Missing Troubleshooting Safety Net

**What goes wrong:** User hits problem not covered, gets stuck, abandons product

**Why it happens:** Documentation assumes happy path, doesn't plan for edge cases

**How to avoid:**

```mdx
## Still Having Problems?

If none of the above solutions work:

### Check Log Files

Claude Desktop logs contain detailed error messages:

<Tabs items={['macOS', 'Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS">
    **Location:** `~/Library/Logs/Claude/`

    ```bash
    tail -f ~/Library/Logs/Claude/mcp.log
    ```
  </Tab>

  <Tab value="Linux">
    **Location:** `~/.config/Claude/logs/`

    ```bash
    tail -f ~/.config/Claude/logs/mcp.log
    ```
  </Tab>

  <Tab value="Windows">
    **Location:** `%APPDATA%\Claude\logs\`

    ```bash
    type "%APPDATA%\Claude\logs\mcp.log"
    ```
  </Tab>
</Tabs>

### Get Help

- **GitHub Issues:** [Report bug or ask question](https://github.com/yourusername/datagvat-mcp/issues)
- **GitHub Discussions:** [Community support](https://github.com/yourusername/datagvat-mcp/discussions)
- **Include in report:**
  - Operating system and version
  - Python version (`python --version`)
  - Full error message from logs
  - Steps to reproduce
```

**Warning signs:**
- High support burden for undocumented issues
- Users report "tried everything, nothing works"
- No escalation path when documentation fails

**Prevention:**
- Always provide "Still stuck?" section
- Show log file locations
- Link to community support
- Specify what info to include in bug reports

**Source:** Open source documentation best practices

## Code Examples

Verified patterns from official sources and existing content:

### Complete Quickstart Page Structure

```mdx
---
title: Quickstart Guide
description: Get your first Austria MCP query results in under 5 minutes
---

# Quickstart Guide

Search for Austrian open datasets and see results in under 5 minutes.

## Prerequisites

Before starting, ensure you have:

- [ ] Claude Desktop installed ([Download](https://claude.ai/download))
- [ ] Austria MCP server installed ([Installation Guide](/getting-started/installation))
- [ ] Claude Desktop restarted after configuration

<Callout type="info">
**First time?** Follow the [Installation Guide](/getting-started/installation) to set up Austria MCP.
</Callout>

## Step 1: Verify Connection

Open Claude Desktop and look for the MCP server indicator in the bottom toolbar:

- ✅ **Connected:** "datagvat" or "datagvat-local" shows green status
- ❌ **Not connected:** [Troubleshooting Guide](/getting-started/troubleshooting#server-not-appearing)

## Step 2: Run Your First Search

Ask Claude this exact question:

```
Find datasets about Vienna population
```

Claude will use the Austria MCP `semantic_search_datasets` tool.

**What happens behind the scenes:**
1. Claude analyzes your natural language query
2. Austria MCP expands query with related terms
3. Server searches data.gv.at catalog
4. Results ranked by relevance and quality

**Expected output:**

Claude will respond with dataset information like:

> I found several population datasets for Vienna:
>
> 1. **Vienna Population Statistics 2023** (ID: abc-123)
>    - Description: Demographic data for Vienna districts
>    - Quality Score: 95/100
>    - Format: CSV, JSON
>    - Publisher: Stadt Wien
>
> 2. **Vienna Demographics Historical Data** (ID: def-456)
>    - Description: Population trends 2000-2023
>    - Quality Score: 87/100
>    - Format: CSV
>    - Publisher: Statistik Austria

## Step 3: Get Dataset Details

Pick a dataset from results and ask for details:

```
Show me details for dataset abc-123
```

**Expected output:**

Claude provides complete metadata including:
- Full description (German)
- All available download formats
- Publisher information
- Update frequency
- License (typically CC-BY-4.0)
- Keywords and themes

## Verify Success

You've successfully completed the quickstart if:

- [ ] Claude responded with dataset titles and descriptions
- [ ] Results included dataset IDs
- [ ] Quality scores appeared (0-100 range)
- [ ] You retrieved details for a specific dataset

✅ **Congratulations!** You've completed your first Austria MCP workflow.

## What You've Learned

- **Semantic search:** Natural language queries work (no need for exact keywords)
- **Quality scores:** Austria MCP rates dataset quality automatically
- **Dataset IDs:** Unique identifiers for accessing specific datasets
- **Tool execution:** Claude uses MCP tools transparently

## Next Steps

### Learn More

- **[First Query Tutorial](/getting-started/first-query)** - Deeper walkthrough with data preview
- **[Quick Reference](/getting-started/quick-reference)** - Common commands cheat sheet
- **[Searching Guide](/guides/searching)** - Advanced search techniques

### Common Workflows

- **[Preview Data](/guides/data-preview)** - Inspect dataset contents before download
- **[Quality Assessment](/workflows/quality-assessment)** - Evaluate dataset reliability
- **[Discovery Workflow](/workflows/discovery)** - Complete search-to-download flow

### Troubleshooting

Hit a problem? See [Troubleshooting Guide](/getting-started/troubleshooting) for solutions to common issues.
```

**Source:** Diataxis tutorial pattern + existing quickstart content + START-01 requirement

### Installation Page with OS-Specific Tabs

```mdx
---
title: Installation & Setup
description: Install Austria MCP server for Claude Desktop
---

# Installation & Setup

Get Austria MCP running in Claude Desktop in minutes.

## Prerequisites

- **Python 3.11 or higher** - [Download Python](https://www.python.org/downloads/)
- **pip or uv package manager** - Included with Python (uv recommended for faster installs)
- **Claude Desktop** - [Download Claude Desktop](https://claude.ai/download)

<Tabs items={['macOS/Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS/Linux">
    Verify Python version:
    ```bash
    python3 --version
    ```
    Should show 3.11 or higher.
  </Tab>

  <Tab value="Windows">
    Verify Python version:
    ```bash
    python --version
    ```
    Should show 3.11 or higher.

    <Callout type="warn">
    **Important:** During Python installation, check "Add Python to PATH".
    </Callout>
  </Tab>
</Tabs>

## Step 1: Clone Repository

<Tabs items={['macOS/Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS/Linux">
    ```bash
    git clone https://github.com/yourusername/datagvat-mcp.git
    cd datagvat-mcp/mcp
    ```
  </Tab>

  <Tab value="Windows">
    ```bash
    git clone https://github.com/yourusername/datagvat-mcp.git
    cd datagvat-mcp\mcp
    ```
  </Tab>
</Tabs>

## Step 2: Install Dependencies

<Tabs items={['uv (Recommended)', 'pip']} groupId="package-manager" persist>
  <Tab value="uv (Recommended)">
    ```bash
    # Install uv if needed
    pip install uv

    # Install dependencies
    uv pip install -e .
    ```

    <Callout type="info">
    **Why uv?** Faster dependency resolution and installs compared to pip.
    </Callout>
  </Tab>

  <Tab value="pip">
    ```bash
    pip install -e .
    ```
  </Tab>
</Tabs>

## Step 3: Test Installation

Verify the server loads correctly:

```bash
python -c "from app.server import mcp; print('✅ Server loads successfully')"
```

**Expected output:**
```
✅ Server loads successfully
```

**If you see errors:**
- `ModuleNotFoundError: No module named 'app'` → [Wrong directory](/getting-started/troubleshooting#wrong-directory)
- `ModuleNotFoundError: No module named 'fastmcp'` → Rerun `pip install -e .`

## Step 4: Configure Claude Desktop

<Tabs items={['macOS', 'Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS">
    Edit `~/.claude/claude_desktop_config.json`:

    ```json
    {
      "mcpServers": {
        "datagvat": {
          "command": "uv",
          "args": [
            "run",
            "--directory",
            "/Users/yourname/datagvat-mcp/mcp",
            "python",
            "-m",
            "app.server"
          ]
        }
      }
    }
    ```

    <Callout type="warn">
    **Important:** Replace `/Users/yourname/datagvat-mcp/mcp` with your actual path.
    </Callout>
  </Tab>

  <Tab value="Linux">
    Edit `~/.config/Claude/claude_desktop_config.json`:

    ```json
    {
      "mcpServers": {
        "datagvat": {
          "command": "uv",
          "args": [
            "run",
            "--directory",
            "/home/yourname/datagvat-mcp/mcp",
            "python",
            "-m",
            "app.server"
          ]
        }
      }
    }
    ```

    <Callout type="warn">
    **Important:** Replace `/home/yourname/datagvat-mcp/mcp` with your actual path.
    </Callout>
  </Tab>

  <Tab value="Windows">
    Edit `%APPDATA%\Claude\claude_desktop_config.json`:

    ```json
    {
      "mcpServers": {
        "datagvat": {
          "command": "uv",
          "args": [
            "run",
            "--directory",
            "C:\\Users\\YourName\\datagvat-mcp\\mcp",
            "python",
            "-m",
            "app.server"
          ]
        }
      }
    }
    ```

    <Callout type="warn">
    **Windows paths:** Use double backslashes (`\\`) in JSON paths.
    </Callout>

    <Callout type="warn">
    **Important:** Replace `C:\\Users\\YourName\\datagvat-mcp\\mcp` with your actual path.
    </Callout>
  </Tab>
</Tabs>

## Step 5: Restart Claude Desktop

<Tabs items={['macOS', 'Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS">
    1. Press `Cmd+Q` to quit Claude Desktop (not just close window)
    2. Relaunch Claude Desktop from Applications
  </Tab>

  <Tab value="Linux">
    1. Quit Claude Desktop completely:
       ```bash
       killall claude-desktop
       ```
    2. Relaunch from application menu
  </Tab>

  <Tab value="Windows">
    1. Right-click Claude Desktop in system tray
    2. Select "Exit"
    3. Relaunch from Start menu
  </Tab>
</Tabs>

## Verify Installation

Open Claude Desktop and check the MCP server indicator:

- ✅ **Success:** "datagvat" appears with green status in bottom toolbar
- ❌ **Problem:** Server not showing → [Troubleshooting Guide](/getting-started/troubleshooting)

## Next Steps

- **[Quickstart Guide](/getting-started/quickstart)** - Run your first query
- **[Troubleshooting](/getting-started/troubleshooting)** - Solve common installation issues
- **[Configuration Guide](/guides/configuration)** - Advanced configuration options
```

**Source:** Existing installation.mdx + Phase 18 Tabs pattern + START-02 requirement

### Troubleshooting Page Structure

```mdx
---
title: Troubleshooting Guide
description: Solutions to common Austria MCP installation and usage issues
---

# Troubleshooting Guide

Solutions to common problems when installing or using Austria MCP.

## Server Not Appearing in Claude Desktop

**Symptom:** Austria MCP server doesn't show in Claude Desktop toolbar

**Common causes and fixes:**

### Fix 1: Check Configuration File Syntax

Invalid JSON prevents Claude Desktop from loading the configuration.

**Validate JSON syntax:**

<Tabs items={['macOS/Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS/Linux">
    ```bash
    python3 -m json.tool ~/.claude/claude_desktop_config.json
    ```
  </Tab>

  <Tab value="Windows">
    ```bash
    python -m json.tool "%APPDATA%\Claude\claude_desktop_config.json"
    ```
  </Tab>
</Tabs>

**Expected output:** Formatted JSON (no errors)

**If you see errors:**
- Missing comma between entries
- Extra comma after last entry
- Unmatched brackets or quotes

### Fix 2: Use Absolute Paths

Relative paths fail in MCP configuration.

❌ **Wrong:**
```json
{
  "cwd": "~/datagvat-mcp/mcp"          // Fails: tilde not expanded
  "cwd": "../datagvat-mcp/mcp"        // Fails: relative path
}
```

✅ **Correct:**
```json
{
  "cwd": "/Users/yourname/datagvat-mcp/mcp"      // macOS/Linux
  "cwd": "C:\\Users\\YourName\\datagvat-mcp\\mcp"  // Windows
}
```

### Fix 3: Restart Claude Desktop Properly

Configuration is only loaded on startup.

<Tabs items={['macOS', 'Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS">
    **Proper restart:**
    1. Press `Cmd+Q` (not just close window)
    2. Wait 5 seconds
    3. Relaunch from Applications

    **Verify quit:** Claude Desktop should NOT appear in Dock
  </Tab>

  <Tab value="Linux">
    **Proper restart:**
    ```bash
    killall claude-desktop
    # Wait 5 seconds
    claude-desktop &
    ```
  </Tab>

  <Tab value="Windows">
    **Proper restart:**
    1. Right-click system tray icon → Exit
    2. Wait 5 seconds
    3. Relaunch from Start menu

    **Verify quit:** No Claude Desktop process in Task Manager
  </Tab>
</Tabs>

**Verification:** After restart, "datagvat" appears in bottom toolbar with green indicator

## Tools Not Working

**Symptom:** Server connected but tool calls fail or return errors

### Fix 1: Check Python Version

Austria MCP requires Python 3.11 or higher.

**Check version:**
```bash
python --version
```

**If version is 3.10 or lower:**
- [Download Python 3.11+](https://www.python.org/downloads/)
- Reinstall dependencies after upgrade

### Fix 2: Reinstall Dependencies

Corrupted or incomplete installation.

<Tabs items={['uv', 'pip']} groupId="package-manager" persist>
  <Tab value="uv">
    ```bash
    cd /path/to/datagvat-mcp/mcp
    uv pip install -e . --force-reinstall
    ```
  </Tab>

  <Tab value="pip">
    ```bash
    cd /path/to/datagvat-mcp/mcp
    pip install -e . --force-reinstall
    ```
  </Tab>
</Tabs>

**Verification:**
```bash
python -c "from app.server import mcp; print('✅ OK')"
```

## Connection Errors When Using Tools

**Symptom:** Tools execute but fail with connection errors

### Fix: Check Network Access

Austria MCP needs HTTPS access to data.gv.at.

**Test API access:**
```bash
curl https://www.data.gv.at/api/hub/search/catalogues
```

**Expected output:** JSON response with catalogue list

**If connection fails:**
- Check firewall settings (allow HTTPS outbound)
- Check corporate proxy configuration
- Try from different network (mobile hotspot)

## Still Having Problems?

### Check Log Files

Claude Desktop logs contain detailed error messages:

<Tabs items={['macOS', 'Linux', 'Windows']} groupId="os" persist>
  <Tab value="macOS">
    **Location:** `~/Library/Logs/Claude/`

    ```bash
    tail -f ~/Library/Logs/Claude/mcp*.log
    ```
  </Tab>

  <Tab value="Linux">
    **Location:** `~/.config/Claude/logs/`

    ```bash
    tail -f ~/.config/Claude/logs/mcp*.log
    ```
  </Tab>

  <Tab value="Windows">
    **Location:** `%APPDATA%\Claude\logs\`

    Open in text editor or view in terminal:
    ```bash
    type "%APPDATA%\Claude\logs\mcp*.log"
    ```
  </Tab>
</Tabs>

### Get Help

- **GitHub Issues:** [Report bug](https://github.com/yourusername/datagvat-mcp/issues)
- **GitHub Discussions:** [Ask questions](https://github.com/yourusername/datagvat-mcp/discussions)

**Include in your report:**
- Operating system and version
- Python version (`python --version`)
- Full error message from logs
- Steps to reproduce the problem
```

**Source:** Existing installation.mdx troubleshooting + technical support best practices + START-05 requirement

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic quickstarts | Time-boxed tutorials (<5 min) | 2023+ | User confidence from guaranteed success |
| Long explanations first | Action-first, explain later | Diataxis 2021+ | Faster time to first success |
| Single-path install docs | OS-specific tabs with persist | Fumadocs v15+ | User picks OS once, all pages adapt |
| Text-only instructions | Expected output verification | Modern tech docs 2024+ | Users validate success at each step |
| Technical troubleshooting | Symptom-based organization | Support best practices | Users find solutions faster |
| Manual copy-paste | Code blocks with copy button | Shiki integration | Reduces typing errors |

**Deprecated/outdated:**
- Long background sections in quickstart: Move to "How It Works" guide
- Combined install/troubleshoot pages: Separate for scanning/linking
- Manual <pre><code> blocks: Use Fumadocs code blocks with syntax highlighting
- Assumptions about prerequisites: Always list and verify explicitly

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal Quickstart Length**
   - What we know: START-01 requires <5 minutes to first query
   - What's unclear: Whether to include data preview in quickstart or separate tutorial
   - Recommendation: Quickstart stops at first search results (3 minutes). First Query Tutorial adds preview (8 minutes total). Measure actual user times in Phase 24 validation.

2. **Troubleshooting Coverage**
   - What we know: START-05 requires common issues covered
   - What's unclear: Which issues are "common" before real user data
   - Recommendation: Start with installation issues from existing docs. Add runtime issues after Phase 24 user testing.

3. **Quick Reference Format**
   - What we know: START-04 requires cheat sheet format
   - What's unclear: Table vs card layout vs accordion for scanning
   - Recommendation: Use tables (proven scannable format). Test alternatives in Phase 24 if users report difficulty finding commands.

4. **Expected Output Detail Level**
   - What we know: Users need to verify success at each step
   - What's unclear: Full output vs summarized output for long responses
   - Recommendation: Show first 3-5 lines of output + "..." for long outputs. Link to "Example Output" in guides for full responses.

## Sources

### Primary (HIGH confidence)
- Diataxis Framework - https://docs.divio.com/documentation-system/tutorials/ (tutorial structure, learning-oriented content)
- Write the Docs Guide - https://www.writethedocs.org/guide/writing/beginners-guide-to-docs/ (quickstart components)
- Existing Codebase - docs/getting-started/*.mdx (current content, Fumadocs patterns)
- Phase 18 Research - .planning/phases/18-documentation-foundation/18-RESEARCH.md (Tabs, Callout, code blocks verified)
- Fumadocs Components - fumadocs-ui package (Callout, Tabs, code blocks already integrated)
- Shiki Syntax Highlighting - shiki 3.21.0 in package.json (200+ languages supported)

### Secondary (MEDIUM confidence)
- Technical Writing Best Practices - Generic industry standards (symptom-based troubleshooting, expected output)
- Open Source Documentation Patterns - Community support, issue reporting (safety net pattern)

### Tertiary (LOW confidence)
- WebSearch: Time to first success metrics (generic, not Austria MCP-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified in package.json from Phase 18
- Content structure: HIGH - Diataxis framework proven, existing content validates patterns
- Fumadocs components: HIGH - Tabs, Callout, code blocks verified in Phase 18-02
- Quickstart patterns: HIGH - Existing quickstart.mdx + Diataxis tutorial principles
- Troubleshooting patterns: MEDIUM - Based on existing content + generic best practices, not user-tested
- Time constraints: MEDIUM - 5-minute goal from requirements, but not validated with real users yet

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable Fumadocs API, content patterns evergreen)
