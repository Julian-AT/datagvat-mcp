from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from fastmcp import Context, FastMCP
from fastmcp.server.middleware import MiddlewareContext

from app.client import PiveauClient
from app.config import Settings
from app.server import AppState


@pytest.fixture
def sample_catalogue() -> dict[str, Any]:
    return {
        "@id": "https://data.gv.at/katalog/test-catalogue",
        "@type": "dcat:Catalog",
        "dct:title": {"de": "Test Katalog", "en": "Test Catalogue"},
        "dct:description": {"de": "Ein Testkatalog", "en": "A test catalogue"},
        "dct:publisher": {"@id": "https://data.gv.at/publisher/test"},
        "dct:language": ["de", "en"],
        "dcat:dataset": [],
    }


@pytest.fixture
def sample_catalogues_list() -> list[dict[str, Any]]:
    return [
        {
            "@id": "https://data.gv.at/katalog/cat-1",
            "dct:title": {"de": "Katalog 1"},
        },
        {
            "@id": "https://data.gv.at/katalog/cat-2",
            "dct:title": {"de": "Katalog 2"},
        },
    ]


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
def sample_datasets_list() -> list[dict[str, Any]]:
    return [
        {"@id": "https://data.gv.at/dataset/ds-1", "dct:title": {"de": "Datensatz 1"}},
        {"@id": "https://data.gv.at/dataset/ds-2", "dct:title": {"de": "Datensatz 2"}},
        {"@id": "https://data.gv.at/dataset/ds-3", "dct:title": {"de": "Datensatz 3"}},
    ]


@pytest.fixture
def sample_distributions() -> list[dict[str, Any]]:
    return [
        {
            "@id": "https://data.gv.at/distribution/dist-1",
            "dcat:accessURL": "https://example.com/data.csv",
            "dcat:downloadURL": "https://example.com/data.csv",
            "dct:format": "CSV",
            "dcat:mediaType": "text/csv",
            "dcat:byteSize": 1024,
        },
        {
            "@id": "https://data.gv.at/distribution/dist-2",
            "dcat:accessURL": "https://example.com/data.json",
            "dct:format": "JSON",
            "dcat:mediaType": "application/json",
        },
    ]


@pytest.fixture
def sample_metrics() -> dict[str, Any]:
    return {
        "dataset_id": "test-dataset",
        "score": 85,
        "dimensions": {
            "accessibility": 90,
            "interoperability": 80,
            "reusability": 85,
            "findability": 85,
        },
        "last_updated": "2024-01-15T10:00:00Z",
    }


@pytest.fixture
def sample_eligibility() -> dict[str, Any]:
    return {
        "eligible": True,
        "identifier_type": "eu-ra-doi",
        "missing_fields": [],
        "message": "Dataset is eligible for DOI assignment",
    }


@pytest.fixture
def sample_vocabularies_list() -> list[dict[str, Any]]:
    return [
        {"@id": "https://data.gv.at/vocabulary/themes", "dct:title": {"de": "Themen", "en": "Themes"}},
        {"@id": "https://data.gv.at/vocabulary/licenses", "dct:title": {"de": "Lizenzen", "en": "Licenses"}},
    ]


@pytest.fixture
def sample_vocabulary() -> dict[str, Any]:
    return {
        "@id": "https://data.gv.at/vocabulary/themes",
        "@type": "skos:ConceptScheme",
        "dct:title": {"de": "Themen", "en": "Themes"},
        "hasTopConcept": [
            {"@id": "http://example.org/concept/1", "skos:prefLabel": {"de": "Umwelt", "en": "Environment"}},
            {"@id": "http://example.org/concept/2", "skos:prefLabel": {"de": "Verkehr", "en": "Transport"}},
            {"@id": "http://example.org/concept/3", "skos:prefLabel": {"de": "Gesundheit", "en": "Health"}},
        ],
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
def settings_no_api_key() -> Settings:
    return Settings(
        piveau_api_base="https://test.data.gv.at/api/hub/repo",
        piveau_api_key=None,
        request_timeout=10,
        user_agent="Test-Agent/1.0",
        log_level="DEBUG",
    )


@pytest.fixture
def mock_httpx_client() -> AsyncMock:
    return AsyncMock(spec=httpx.AsyncClient)


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


@pytest.fixture
def app_state(test_settings: Settings) -> AppState:
    mock_client = AsyncMock(spec=PiveauClient)
    return AppState(settings=test_settings, piveau_client=mock_client)


@pytest.fixture
def mock_context(app_state: AppState) -> MagicMock:
    ctx = MagicMock(spec=Context)
    ctx.request_context = MagicMock()
    ctx.request_context.lifespan_context = app_state
    ctx.report_progress = AsyncMock()
    ctx.request_id = "test-request-123"
    return ctx


@pytest.fixture
def mock_middleware_context(mock_context: MagicMock) -> MagicMock:
    middleware_ctx = MagicMock(spec=MiddlewareContext)
    middleware_ctx.fastmcp_context = mock_context
    middleware_ctx.arguments = {"name": "test_tool"}
    middleware_ctx.message = None
    return middleware_ctx


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
    response.content = text_data.encode() if text_data else (b'{}' if json_data is not None else b'')
    
    if json_data is not None:
        response.json.return_value = json_data
        response.content = b'{"data": "test"}'
    else:
        response.json.side_effect = ValueError("No JSON")
    
    return response


@pytest.fixture
def mcp_server() -> FastMCP:
    from app.prompts import register_prompts
    from app.resources import register_resources
    from app.tools.analysis import register_analysis_tools
    from app.tools.discovery import register_discovery_tools
    from app.tools.management import register_management_tools
    from app.tools.vocabularies import register_vocabulary_tools
    
    mcp = FastMCP(
        name="austria-data-test",
        instructions="Test server for Austria Open Data",
    )
    
    register_discovery_tools(mcp)
    register_analysis_tools(mcp)
    register_management_tools(mcp)
    register_vocabulary_tools(mcp)
    register_resources(mcp)
    register_prompts(mcp)
    
    return mcp
