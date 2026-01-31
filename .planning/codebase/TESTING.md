# Testing Patterns

**Analysis Date:** 2026-01-31

## Test Framework

**Runner:**
- Python: pytest 8.0.0+ (`mcp/pyproject.toml` line 36)
- Extensions: pytest-asyncio 0.23.0+, pytest-cov 4.1.0+, pytest-mock 3.12.0+
- Config: `mcp/pyproject.toml` lines 59-71

**Assertion Library:**
- Python: Built-in `assert` statements with pytest introspection

**Run Commands:**
```bash
# From mcp/ directory
pytest                          # Run all tests
pytest -v                       # Verbose output (configured as default)
pytest --cov=app --cov-report=html  # Generate coverage report
pytest -m "not slow"            # Skip slow tests
pytest -m integration           # Run only integration tests
pytest tests/test_resources.py # Run specific test file
```

**Configuration:**
- Asyncio mode: auto (line 60)
- Test paths: `tests/` directory
- Markers: `slow`, `integration` (lines 68-71)
- Verbosity: `-v` flag enabled by default (line 64)
- Traceback: Short format (`--tb=short`)

## Test File Organization

**Location:**
- Python: Separate `tests/` directory at `mcp/tests/`
- Not co-located with source files

**Naming:**
- Python: `test_*.py` prefix (e.g., `test_resources.py`, `test_tools.py`, `test_client.py`)
- Test classes: `Test{Feature}` pattern (e.g., `TestListCatalogues`, `TestGetDataset`)
- Test methods: `test_{behavior}` pattern (e.g., `test_list_catalogues_success`, `test_get_catalogue_not_found`)

**Structure:**
```
mcp/
├── app/
│   ├── tools/
│   │   ├── discovery.py
│   │   ├── analysis.py
│   │   └── vocabularies.py
│   ├── server.py
│   └── client.py
└── tests/
    ├── conftest.py              # Shared fixtures
    ├── test_tools.py            # Tool function tests
    ├── test_resources.py        # Resource registration tests
    ├── test_client.py           # Client API tests
    └── test_middleware.py       # Middleware tests
```

## Test Structure

**Suite Organization:**
```python
# tests/test_tools.py
class TestListCatalogues:
    async def test_list_catalogues_success(self, sample_catalogues_list: list):
        # Arrange
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.list_catalogues.return_value = sample_catalogues_list
        ctx = create_mock_context(client=mock_client)

        # Act
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        list_catalogues = tools["list_catalogues"].fn
        result = await list_catalogues(ctx, limit=100, offset=0, value_type="metadata")

        # Assert
        assert len(result) == 2
        mock_client.list_catalogues.assert_called_once_with(
            limit=100, offset=0, value_type=ValueType.METADATA
        )

    async def test_list_catalogues_with_pagination(self, sample_catalogues_list: list):
        # Test pagination behavior
        ...

    async def test_list_catalogues_reports_progress(self, sample_catalogues_list: list):
        # Test progress reporting
        ...
```

**Patterns:**
- Test classes group related tests (e.g., all tests for `list_catalogues` tool)
- Use Arrange-Act-Assert pattern (implicitly; not commented in actual code)
- One assertion focus per test; some tests verify multiple related aspects
- Descriptive test names indicate expected behavior

## Mocking

**Framework:**
- Python: `unittest.mock` (AsyncMock, MagicMock)

**Patterns:**
```python
# Mock async client
mock_client = AsyncMock(spec=PiveauClient)
mock_client.get_dataset.return_value = sample_dataset

# Mock context
ctx = MagicMock(spec=Context)
ctx.request_context = MagicMock()
ctx.request_context.lifespan_context = app_state
ctx.report_progress = AsyncMock()

# Mock HTTP responses
response = MagicMock(spec=httpx.Response)
response.status_code = 200
response.json.return_value = {"data": "test"}
```

**What to Mock:**
- External API clients (PiveauClient)
- FastMCP Context objects
- HTTP responses (httpx.Response)
- Progress reporting callbacks

**What NOT to Mock:**
- Pydantic models (use real instances)
- Pure functions (e.g., `calculate_quality_score`)
- Enum values

**Verification:**
```python
# Verify method calls
mock_client.list_catalogues.assert_called_once_with(
    limit=100, offset=0, value_type=ValueType.METADATA
)

# Verify progress reporting
assert ctx.report_progress.call_count >= 1
```

## Fixtures and Factories

**Test Data:**
```python
# tests/conftest.py
@pytest.fixture
def sample_dataset() -> dict[str, Any]:
    return {
        "@id": "https://data.gv.at/dataset/test-dataset",
        "@type": "dcat:Dataset",
        "dct:title": {"de": "Test Datensatz", "en": "Test Dataset"},
        "dct:description": {"de": "Ein Testdatensatz", "en": "A test dataset"},
        "dct:publisher": {"@id": "https://data.gv.at/publisher/test"},
        "dcat:keyword": ["test", "example"],
        "dcat:theme": ["http://publications.europa.eu/resource/authority/data-theme/TECH"],
        "dcat:distribution": [],
    }

@pytest.fixture
def test_settings() -> Settings:
    return Settings(
        piveau_api_base="https://test.data.gv.at/api/hub/repo",
        piveau_api_key="test-api-key-12345",
        request_timeout=10,
        user_agent="Test-Agent/1.0",
        log_level="DEBUG",
    )

@pytest.fixture
async def piveau_client(test_settings: Settings) -> AsyncGenerator[PiveauClient, None]:
    client = PiveauClient(
        base_url=test_settings.piveau_api_base,
        api_key=test_settings.api_key_value,
        timeout=test_settings.request_timeout,
        user_agent=test_settings.user_agent,
    )
    yield client
    await client.close()
```

**Location:**
- Shared fixtures in `mcp/tests/conftest.py`
- Fixture types: sample data, settings, mock clients, app state

**Helper Functions:**
```python
# tests/conftest.py
def create_mock_response(
    status_code: int = 200,
    json_data: Any = None,
    text_data: str = "",
    content_type: str = "application/json",
    headers: dict[str, str] | None = None,
) -> MagicMock:
    # Factory function for mock HTTP responses
    ...
```

## Coverage

**Requirements:**
- Target: 80% minimum (configured in `mcp/pyproject.toml` line 87: `fail_under = 80`)
- Branch coverage enabled (`branch = true`)

**View Coverage:**
```bash
cd mcp
pytest --cov=app --cov-report=html
# Open htmlcov/index.html
```

**Exclusions:**
- Test files: `tests/*`
- Debug code: `if __name__ == .__main__.:` blocks
- Type checking imports: `if TYPE_CHECKING:` blocks
- Not implemented methods: `raise NotImplementedError`
- Pragmas: Lines with `# pragma: no cover` comment

**Configuration (pyproject.toml lines 73-87):**
```toml
[tool.coverage.run]
source = ["app"]
branch = true
omit = ["tests/*", "*/__pycache__/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise NotImplementedError",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.:",
]
show_missing = true
fail_under = 80
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and methods with mocked dependencies
- Location: All test files in `mcp/tests/`
- Example: `test_list_catalogues_success` tests tool function with mocked client
- Pattern: Mock external dependencies, test single unit of functionality

**Integration Tests:**
- Scope: Multiple components working together (marked with `@pytest.mark.integration`)
- Example: End-to-end tool registration and execution
- Pattern: Use real FastMCP server instance, mock only external API

**E2E Tests:**
- Not implemented in current codebase
- Would require running actual Piveau API or using recorded fixtures

## Common Patterns

**Async Testing:**
```python
# Pytest-asyncio automatically handles async test functions
async def test_get_dataset_success(self, sample_dataset: dict):
    mock_client = AsyncMock(spec=PiveauClient)
    mock_client.get_dataset.return_value = sample_dataset
    ctx = create_mock_context(client=mock_client)

    result = await get_dataset(ctx, dataset_id="test-dataset")

    assert result["@id"] == sample_dataset["@id"]
```

**Error Testing:**
```python
async def test_get_catalogue_not_found(self):
    mock_client = AsyncMock(spec=PiveauClient)
    mock_client.get_catalogue.side_effect = PiveauNotFoundError("Not found", 404)
    ctx = create_mock_context(client=mock_client)

    from fastmcp.exceptions import ToolError

    with pytest.raises(ToolError):
        await get_catalogue(ctx, catalogue_id="nonexistent")
```

**Parametric Testing:**
```python
# Not heavily used, but available through pytest.mark.parametrize
# Example pattern:
@pytest.mark.parametrize("sort_option,expected_api_format", [
    ("relevance", "relevance+desc"),
    ("modified_desc", "modified+desc"),
    ("title_asc", "title+asc"),
])
async def test_sort_mapping(sort_option, expected_api_format):
    # Test sort option conversions
    ...
```

**Tool Registration Testing:**
```python
# tests/test_resources.py
def test_resources_registered(self):
    from app.resources import register_resources
    mcp = FastMCP("test")
    register_resources(mcp)

    resources = mcp._resource_manager._resources
    assert len(resources) > 0

def test_catalogues_resource_registered(self):
    from app.resources import register_resources
    mcp = FastMCP("test")
    register_resources(mcp)

    resources = mcp._resource_manager._resources
    assert "piveau://catalogues" in resources
```

**Fixture Composition:**
```python
# Fixtures can depend on other fixtures
@pytest.fixture
def app_state(test_settings: Settings) -> AppState:
    mock_client = AsyncMock(spec=PiveauClient)
    return AppState(settings=test_settings, piveau_client=mock_client)

@pytest.fixture
def mock_context(app_state: AppState) -> MagicMock:
    ctx = MagicMock(spec=Context)
    ctx.request_context.lifespan_context = app_state
    return ctx
```

## TypeScript Testing

**Status:** No test framework detected in docs/ directory
- No jest.config.*, vitest.config.*, or test files found
- Documentation site does not include automated tests
- Quality assurance likely manual or performed at build time

---

*Testing analysis: 2026-01-31*
