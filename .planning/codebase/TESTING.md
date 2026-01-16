# Testing Patterns

**Analysis Date:** 2025-01-16

## Test Framework

**Runner:**
- pytest 8.0.0+
- Config: `pyproject.toml`

**Assertion Library:**
- pytest built-in assertions

**Async Support:**
- pytest-asyncio 0.23.0+
- Mode: `auto` (all async tests run automatically)

**Run Commands:**
```bash
pytest                      # Run all tests
pytest -v                   # Verbose output
pytest --cov=app            # With coverage
pytest --cov=app --cov-report=html  # Coverage with HTML report
pytest -m "not slow"        # Exclude slow tests
pytest -m "not integration" # Exclude integration tests
pytest tests/test_client.py # Run specific file
pytest -k "test_list"       # Run tests matching pattern
```

## Test Configuration

**From `pyproject.toml`:**
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
testpaths = ["tests"]
addopts = [
    "-v",
    "--tb=short",
    "--strict-markers",
]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks tests as integration tests",
]
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root
- Not co-located with source files

**Naming:**
- Files: `test_<module>.py` matching source module names
- Test functions: `test_<scenario>` or `test_<method>_<scenario>`

**Structure:**
```
tests/
├── __init__.py
├── conftest.py          # Shared fixtures
├── test_client.py       # Tests for app/client.py
├── test_config.py       # Tests for app/config.py
├── test_dependencies.py # Tests for app/dependencies.py
├── test_middleware.py   # Tests for app/middleware.py
├── test_models.py       # Tests for app/models.py
├── test_prompts.py      # Tests for app/prompts.py
├── test_resources.py    # Tests for app/resources.py
└── test_tools.py        # Tests for app/tools/*
```

## Test Structure

**Suite Organization:**
```python
class TestListCatalogues:
    async def test_list_catalogues_success(self, sample_catalogues_list: list):
        ...

    async def test_list_catalogues_with_pagination(self, sample_catalogues_list: list):
        ...

    async def test_list_catalogues_reports_progress(self, sample_catalogues_list: list):
        ...
```

**Patterns:**
- Group related tests in classes named `Test<Feature>` or `Test<Method>`
- Use fixtures for test data via parameters
- Async tests are regular methods (pytest-asyncio handles them)

**Single test pattern:**
```python
async def test_get_catalogue_success(self, sample_catalogue: dict):
    # Arrange
    mock_client = AsyncMock(spec=PiveauClient)
    mock_client.get_catalogue.return_value = sample_catalogue
    ctx = create_mock_context(client=mock_client)

    # Act
    from app.tools.discovery import register_discovery_tools
    mcp = FastMCP("test")
    register_discovery_tools(mcp)
    tools = mcp._tool_manager._tools
    get_catalogue = tools["get_catalogue"].fn
    result = await get_catalogue(ctx, catalogue_id="test-catalogue")

    # Assert
    assert result["@id"] == sample_catalogue["@id"]
    mock_client.get_catalogue.assert_called_once_with("test-catalogue")
```

## Mocking

**Framework:** unittest.mock (built-in)

**Imports:**
```python
from unittest.mock import AsyncMock, MagicMock, patch
```

**Patterns:**

**Mock HTTP Client:**
```python
@pytest.fixture
def mock_httpx_client() -> AsyncMock:
    return AsyncMock(spec=httpx.AsyncClient)
```

**Mock Response:**
```python
def create_mock_response(
    status_code: int = 200,
    json_data: Any = None,
    text_data: str = "",
    content_type: str = "application/json",
    headers: dict[str, str] | None = None,
) -> MagicMock:
    response = MagicMock(spec=httpx.Response)
    response.status_code = status_code
    response.headers = {"content-type": content_type, **(headers or {})}
    response.text = text_data

    if json_data is not None:
        response.json.return_value = json_data
    else:
        response.json.side_effect = ValueError("No JSON")

    return response
```

**Mock Context (Application State):**
```python
def create_mock_context(
    settings: Settings | None = None,
    client: AsyncMock | None = None,
) -> MagicMock:
    if settings is None:
        settings = Settings(
            piveau_api_base="https://test.api.at",
            piveau_api_key="test-key",
        )
    if client is None:
        client = AsyncMock(spec=PiveauClient)

    app_state = AppState(settings=settings, piveau_client=client)
    ctx = MagicMock(spec=Context)
    ctx.request_context = MagicMock()
    ctx.request_context.lifespan_context = app_state
    ctx.report_progress = AsyncMock()
    ctx.request_id = "test-request-123"
    return ctx
```

**Patching:**
```python
async def test_request_success_json_response(self, client: PiveauClient):
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    # ... setup

    with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_response
        result = await client._request("GET", "/test")
        assert result == {"key": "value"}
```

**Environment Variable Patching:**
```python
def test_env_prefix(self):
    env_vars = {
        "AUSTRIA_MCP_PIVEAU_API_BASE": "https://custom.api.at/hub",
        "AUSTRIA_MCP_PIVEAU_API_KEY": "my-secret-key",
    }
    with patch.dict(os.environ, env_vars, clear=True):
        settings = Settings()
        assert settings.piveau_api_base == "https://custom.api.at/hub"
```

**What to Mock:**
- HTTP clients and responses
- External API calls
- Context/application state
- Environment variables

**What NOT to Mock:**
- Pydantic models (test actual validation)
- Pure functions
- Internal logic being tested

## Fixtures and Factories

**Shared Fixtures in `tests/conftest.py`:**

**Sample Data Fixtures:**
```python
@pytest.fixture
def sample_catalogue() -> dict[str, Any]:
    return {
        "@id": "https://data.gv.at/katalog/test-catalogue",
        "@type": "dcat:Catalog",
        "dct:title": {"de": "Test Katalog", "en": "Test Catalogue"},
        "dct:description": {"de": "Ein Testkatalog", "en": "A test catalogue"},
        ...
    }

@pytest.fixture
def sample_dataset() -> dict[str, Any]:
    return {
        "@id": "https://data.gv.at/dataset/test-dataset",
        "@type": "dcat:Dataset",
        ...
    }

@pytest.fixture
def sample_datasets_list() -> list[dict[str, Any]]:
    return [
        {"@id": "https://data.gv.at/dataset/ds-1", ...},
        {"@id": "https://data.gv.at/dataset/ds-2", ...},
    ]
```

**Settings Fixture:**
```python
@pytest.fixture
def test_settings() -> Settings:
    return Settings(
        piveau_api_base="https://test.data.gv.at/api/hub/repo",
        piveau_api_key="test-api-key-12345",
        request_timeout=10,
        user_agent="Test-Agent/1.0",
        log_level="DEBUG",
    )
```

**Client Fixture (Async Generator):**
```python
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

**MCP Server Fixture:**
```python
@pytest.fixture
def mcp_server() -> FastMCP:
    from app.tools.discovery import register_discovery_tools
    # ... other imports

    mcp = FastMCP(
        name="austria-data-test",
        instructions="Test server for Austria Open Data",
    )

    register_discovery_tools(mcp)
    register_analysis_tools(mcp)
    # ... register all tools

    return mcp
```

**File-Local Fixtures:**
```python
# In test_client.py
@pytest.fixture
def client(self) -> PiveauClient:
    return PiveauClient(base_url="https://api.example.com", api_key="test-key")
```

## Coverage

**Requirements:** 80% minimum (enforced in CI)

**Configuration in `pyproject.toml`:**
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

**View Coverage:**
```bash
pytest --cov=app                        # Console summary
pytest --cov=app --cov-report=html      # HTML report in htmlcov/
pytest --cov=app --cov-report=term-missing  # Show missing lines
```

## Test Types

**Unit Tests:**
- Test individual functions/methods in isolation
- Mock all external dependencies
- Located in: `tests/test_*.py`
- Example: `test_client.py::TestPiveauClientInit`

**Integration Tests:**
- Test component interactions (not yet implemented extensively)
- Mark with: `@pytest.mark.integration`
- Example: `test_middleware.py::TestMiddlewareIntegration`

**E2E Tests:**
- Not currently implemented
- Would test actual API calls

## Common Patterns

**Testing Async Functions:**
```python
async def test_close_method(self):
    client = PiveauClient(base_url="https://api.example.com")
    with patch.object(client._client, "aclose", new_callable=AsyncMock) as mock_close:
        await client.close()
        mock_close.assert_called_once()
```

**Testing Exceptions:**
```python
async def test_get_catalogue_not_found(self):
    mock_client = AsyncMock(spec=PiveauClient)
    mock_client.get_catalogue.side_effect = PiveauNotFoundError("Not found", 404)
    ctx = create_mock_context(client=mock_client)

    # ... setup

    with pytest.raises(PiveauNotFoundError):
        await get_catalogue(ctx, catalogue_id="nonexistent")
```

**Testing Validation Errors:**
```python
def test_timeout_validation_minimum(self):
    env_vars = {"AUSTRIA_MCP_REQUEST_TIMEOUT": "3"}
    with patch.dict(os.environ, env_vars, clear=True):
        with pytest.raises(ValueError):
            Settings()
```

**Testing Logs:**
```python
async def test_logs_tool_start(self, caplog):
    middleware = AuditMiddleware()
    ctx = create_middleware_context(tool_name="list_catalogues")
    call_next = AsyncMock(return_value="result")

    with caplog.at_level(logging.INFO):
        await middleware.on_call_tool(ctx, call_next)

    assert any("list_catalogues" in record.message and "started" in record.message
               for record in caplog.records)
```

**Testing Tool Registration:**
```python
def test_resources_registered(self):
    from app.resources import register_resources
    mcp = FastMCP("test")
    register_resources(mcp)

    resources = mcp._resource_manager._resources
    assert len(resources) > 0
    assert "piveau://catalogues" in resources
```

**Testing Pydantic Models:**
```python
def test_distribution_with_aliases(self):
    data = {
        "id": "dist-123",
        "accessURL": "https://example.com/data.csv",
        "downloadURL": "https://example.com/data.csv",
        "mediaType": "text/csv",
        "byteSize": 2048,
    }
    dist = Distribution.model_validate(data)
    assert dist.access_url == "https://example.com/data.csv"
    assert dist.byte_size == 2048
```

**Testing Singleton Caching:**
```python
def test_get_settings_cached(self):
    import app.config
    app.config._settings = None
    settings1 = get_settings()
    settings2 = get_settings()
    assert settings1 is settings2
```

## Test Data Conventions

**Use realistic DCAT-AP data structures:**
- Include `@id`, `@type` properties
- Use `dct:` and `dcat:` prefixes
- Provide multilingual title/description as dicts

**Fixture naming:**
- `sample_*` for reusable test data
- `test_*` for test-specific configuration
- `mock_*` for mock objects

---

*Testing analysis: 2025-01-16*
