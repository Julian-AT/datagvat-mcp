# Code Example Test Results

**Test Date:** [To be filled]
**Tester:** [To be filled]
**Status:** 0/20 tested

## Instructions

For each example below:
1. Copy the code exactly as shown
2. Run in appropriate environment (Node.js for TS, Python venv for Python, bash shell)
3. Mark ✓ PASS if runs without errors, ✗ FAIL if errors
4. Document any issues in notes

**Environments:**
- TypeScript: `node` (or `npx tsx` for TypeScript files)
- Python: Fresh virtual environment with `pip install datagvat-mcp` (or dev install)
- Bash: Standard bash/zsh shell

---

## Example 1: guides (python)

**Location:** C:/GitHub/datagvat-mcp//docs/guides/data-preview (line 42)

**Code:**
```python
# First, get download URL
distributions = get_dataset_distributions(dataset_id="dataset-123")
csv_url = next(d['downloadURL'] for d in distributions
               if d.get('format') == 'CSV')

# Preview schema
schema = preview_schema(url=csv_url, format="csv")
```

**Context:** Data preview example

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 2: guides (bash)

**Location:** C:/GitHub/datagvat-mcp//docs/guides/setup (line 508)

**Code:**
```bash
python -m app.server
```

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 3: guides (bash)

**Location:** C:/GitHub/datagvat-mcp//docs/guides/configuration (line 151)

**Code:**
```bash
# Fast network
AUSTRIA_MCP_REQUEST_TIMEOUT=10

# Slow network or large datasets
AUSTRIA_MCP_REQUEST_TIMEOUT=60

# Very slow network
AUSTRIA_MCP_REQUEST_TIMEOUT=120
```

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 4: guides (bash)

**Location:** C:/GitHub/datagvat-mcp//docs/guides/setup (line 317)

**Code:**
```bash
fastmcp dev app.server:mcp
```

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 5: guides (bash)

**Location:** C:/GitHub/datagvat-mcp//docs/guides/setup (line 280)

**Code:**
```bash
# API Configuration
AUSTRIA_MCP_PIVEAU_API_BASE=https://www.data.gv.at/api/hub/search
AUSTRIA_MCP_REQUEST_TIMEOUT=30

# Logging
AUSTRIA_MCP_LOG_LEVEL=INFO
AUSTRIA_MCP_LOG_FORMAT=json

# Development
AUSTRIA_MCP_DEV_MODE=false
```

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 6: workflows (python)

**Location:** C:/GitHub/datagvat-mcp//docs/workflows/data-export (line 428)

**Code:**
```python
import schedule

schedule.every().day.at("02:00").do(export_pipeline)
schedule.every().monday.at("08:00").do(export_pipeline)
schedule.every(6).hours.do(export_pipeline)
```

**Context:** Multi-step workflow pattern

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 7: workflows (python)

**Location:** C:/GitHub/datagvat-mcp//docs/workflows/publication-research (line 90)

**Code:**
```python
results = semantic_search_datasets(
    natural_query="Vienna public health outcomes and social demographics",
    boost_quality=True,
    limit=20
)

print(f"Found {results['count']} datasets")
print(f"Query expanded to themes: {results.get('expansion_info', {}).get('semantic_themes', [])}")
```

**Context:** Dataset search example

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 8: workflows (python)

**Location:** C:/GitHub/datagvat-mcp//docs/workflows/comparative-analysis (line 228)

**Code:**
```python
import pandas as pd
from datetime import datetime

matrix = []
for dataset in candidates:
    quality = quality_results[dataset['id']]
    schema = schema_comparison.get(dataset['id'], {})

    # Calculate recency score
    modified = datetime.fromisoformat(dataset['modified'])
    age_days = (datetime.now() - modified).days
    recency_score = max(0, 100 - (age_days / 3.65))  # 1 point per ~3.6 days

    matrix.append({
        'ID': dataset['id'][-6:],  # Last 6 chars
        'Title': dataset['title'][:30],
        'Quality': quality['overall_score'],
        'Columns': schema.get('column_count', 0),
        'Recency': int(recency_score),
        'Modified': dataset['modified']
    })

# Create DataFrame for clean display
df = pd.DataFrame(matrix)
df = df.sort_values('Quality', ascending=False)

print(df.to_string(index=False))
```

**Context:** Multi-step workflow pattern

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 9: workflows (python)

**Location:** C:/GitHub/datagvat-mcp//docs/workflows/discovery (line 84)

**Code:**
```python
# 1. Search for datasets
results = semantic_search_datasets(
    natural_query="health data from Vienna",
    formats=["CSV"],
    boost_quality=True
)

# 2. Get top result details
dataset_id = results['results'][0]['id']
dataset = get_dataset(dataset_id=dataset_id)

# 3. Analyze quality
quality = analyze_dataset_quality(dataset_id=dataset_id)

if quality['metrics']['overall_score'] < 70:
    print("⚠️ Quality below threshold")
    # Fall back to second result or adjust criteria

# 4. Get download URL
distributions = get_dataset_distributions(dataset_id=dataset_id)
csv_url = next(d['downloadURL'] for d in distributions
               if d.get('format') == 'CSV')

# 5. Preview schema
schema = preview_schema(url=csv_url, format="csv")

# 6. Verify required columns
required_columns = ["year", "region", "value"]
actual_columns = [c['name'] for c in schema['columns']]

if all(col in actual_columns for col in required_columns):
    print("✓ Schema validated - ready to download")
    print(f"Download URL: {csv_url}")
else:
    missing = set(required_columns) - set(actual_columns)
    print(f"✗ Missing columns: {missing}")
```

**Context:** Multi-step workflow pattern

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 10: tutorials (python)

**Location:** C:/GitHub/datagvat-mcp//docs/getting-started/index (line 38)

**Code:**
```python
search_datasets(
  query="health",
  themes=["HEAL"],
  formats=["CSV"]
)
```

**Context:** Search tool usage

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 11: tutorials (bash)

**Location:** C:/GitHub/datagvat-mcp//docs/getting-started/installation.de (line 529)

**Code:**
```bash
python --version  # Sollte 3.11 oder höher sein
```

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 12: examples (python)

**Location:** C:/GitHub/datagvat-mcp//docs/examples/search (line 292)

**Code:**
```python
# Datasets modified in 2024
search_datasets(
  query="",
  min_date="2024-01-01",
  max_date="2024-12-31",
  limit=10
)

# Recently updated datasets (last 30 days)
search_datasets(
  query="",
  min_date="2024-12-15",
  limit=10
)

# Datasets published before 2020
search_datasets(
  query="",
  max_date="2020-01-01",
  limit=10
)
```

**Context:** Dataset search example

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 13: examples (python)

**Location:** C:/GitHub/datagvat-mcp//docs/examples/workflows (line 146)

**Code:**
```python
# Verify structure matches expectations
expected_columns = ["year", "region", "cases"]
actual_columns = [c['name'] for c in schema['columns']]

if all(col in actual_columns for col in expected_columns):
  print("✓ Schema validated")
  # Proceed with full download using download_url
  # (Download implementation depends on your environment)
else:
  print("✗ Schema mismatch, check dataset")
```

**Context:** Multi-step workflow pattern

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 14: examples (python)

**Location:** C:/GitHub/datagvat-mcp//docs/examples/search (line 212)

**Code:**
```python
# Vienna or Graz data
search_datasets(
  query="traffic",
  publishers=["Stadt Wien", "Stadt Graz"],
  limit=10
)

# Multiple federal sources
search_datasets(
  query="",
  publishers=["Bundesministerium", "Statistik Austria"],
  formats=["CSV"],
  limit=10
)
```

**Context:** Dataset search example

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 15: examples (python)

**Location:** C:/GitHub/datagvat-mcp//docs/examples/workflows.de (line 125)

**Code:**
```python
# Schema zuerst prüfen
schema = preview_schema(url=download_url, format="CSV")

print("Spalten:")
for col in schema['columns']:
  print(f"  - {col['name']}: {col['type']}")

# Beispieldaten in Vorschau anzeigen
vorschau = preview_data(url=download_url, max_rows=20, format="CSV")

print(f"\nZeige {vorschau['row_count']} Beispielzeilen:")
for row in vorschau['data'][:5]:
  print(row)
```

**Context:** Multi-step workflow pattern

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 16: advanced (python)

**Location:** C:/GitHub/datagvat-mcp//docs/integration/other-clients (line 326)

**Code:**
```python
import pytest
from fastmcp.client import Client
from app.server import mcp

@pytest.mark.asyncio
async def test_search_datasets():
    """Test dataset search functionality."""
    async with Client(mcp) as client:
        # Test basic search
        result = await client.call_tool(
            "search_datasets",
            arguments={"query": "population", "limit": 10}
        )

        assert result["count"] > 0
        assert len(result["results"]) <= 10
        assert all("title" in r for r in result["results"])

@pytest.mark.asyncio
async def test_tool_validation():
    """Test parameter validation."""
    async with Client(mcp) as client:
        # Invalid limit should raise ValidationError
        with pytest.raises(Exception) as exc_info:
            await client.call_tool(
                "search_datasets",
                arguments={"limit": -1}  # Invalid
            )

        assert "validation" in str(exc_info.value).lower()
```

**Context:** Search tool usage

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 17: advanced (python)

**Location:** C:/GitHub/datagvat-mcp//docs/advanced/fastmcp-internals (line 263)

**Code:**
```python
from dataclasses import dataclass
from fastmcp import FastMCP, Context
from contextlib import asynccontextmanager

@dataclass
class AppState:
    """Application state available to all tools."""
    settings: Settings
    piveau_client: PiveauClient
    # Add any shared resources (DB connections, HTTP clients, etc.)

@asynccontextmanager
async def lifespan(mcp: FastMCP):
    """Initialize and cleanup application resources."""
    settings = get_settings()
    client = PiveauClient(base_url=settings.api_url, timeout=30)

    try:
        yield AppState(settings=settings, piveau_client=client)
    finally:
        await client.close()  # Cleanup on shutdown

mcp = FastMCP(
    name="my-server",
    lifespan=lifespan,  # Attach lifespan handler
)

# Access state in tools
@mcp.tool()
async def search(ctx: Context, query: str) -> dict:
    # Get app state from Context
    app_state = ctx.request_context.lifespan_context
    client = app_state.piveau_client

    # Use shared client for API calls
    results = await client.search(query)
    return results
```

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 18: advanced (python)

**Location:** C:/GitHub/datagvat-mcp//docs/advanced/fastmcp-internals (line 1082)

**Code:**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    rate_limit: float = 10.0
    model_config = SettingsConfigDict(env_prefix="MY_SERVER_")

@asynccontextmanager
async def lifespan(mcp: FastMCP):
    settings = Settings()  # ✅ From environment
    yield AppState(settings=settings)

settings = Settings()
mcp = FastMCP(
    name="my-server",
    middleware=[
        RateLimitingMiddleware(
            max_requests_per_second=settings.rate_limit  # ✅ Configurable
        ),
    ]
)
```

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 19: best-practices (python)

**Location:** C:/GitHub/datagvat-mcp//docs/best-practices/comparison-tables (line 90)

**Code:**
```python
# Use find_similar_datasets - content-based similarity
similar = find_similar_datasets(
  dataset_id="vienna-health-2024",
  limit=5,
  min_score=30
)
```

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Example 20: best-practices (python)

**Location:** C:/GitHub/datagvat-mcp//docs/best-practices/rate-limiting (line 523)

**Code:**
```python
from unittest.mock import patch, MagicMock

def test_rate_limit_handling():
  """Test that code handles rate limits gracefully."""

  # Create mock that raises rate limit error
  mock_search = MagicMock(side_effect=ToolError("Rate limit exceeded"))

  with patch('app.tools.search_datasets', mock_search):
    try:
      results = search_datasets(query="test")
      assert False, "Should have raised ToolError"
    except ToolError as e:
      assert "Rate limit exceeded" in str(e)

  print("Rate limit handling test passed")

# Run test
test_rate_limit_handling()
```

**Context:** Search tool usage

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Summary

Total tested: __/20
Pass rate: __%

### Issues Found

[List any failing examples with error details]

### Status Assessment

- [ ] **PASS** (19-20/20 = 95-100% pass rate) - Production quality
- [ ] **MARGINAL** (17-18/20 = 85-94% pass rate) - Needs fixes
- [ ] **FAIL** (<17/20 = <85% pass rate) - Systematic quality issues
