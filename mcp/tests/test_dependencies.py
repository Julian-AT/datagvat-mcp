from unittest.mock import AsyncMock, MagicMock

from fastmcp import Context

from app.client import PiveauClient
from app.config import Settings
from app.dependencies import get_app_state, get_piveau_client, get_server_settings, has_api_key
from app.server import AppState


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
    return ctx


class TestGetAppState:
    def test_returns_app_state(self):
        ctx = create_mock_context()
        result = get_app_state(ctx)
        assert isinstance(result, AppState)

    def test_app_state_has_settings(self):
        settings = Settings(piveau_api_base="https://custom.api.at")
        ctx = create_mock_context(settings=settings)
        result = get_app_state(ctx)
        assert result.settings.piveau_api_base == "https://custom.api.at"

    def test_app_state_has_client(self):
        mock_client = AsyncMock(spec=PiveauClient)
        ctx = create_mock_context(client=mock_client)
        result = get_app_state(ctx)
        assert result.piveau_client is mock_client


class TestGetPiveauClient:
    def test_returns_client(self):
        mock_client = AsyncMock(spec=PiveauClient)
        ctx = create_mock_context(client=mock_client)
        result = get_piveau_client(ctx)
        assert result is mock_client

    def test_client_is_from_app_state(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.base_url = "https://test.api.at"
        ctx = create_mock_context(client=mock_client)
        result = get_piveau_client(ctx)
        assert result.base_url == "https://test.api.at"


class TestGetServerSettings:
    def test_returns_settings(self):
        settings = Settings(
            piveau_api_base="https://custom.api.at",
            log_level="DEBUG",
        )
        ctx = create_mock_context(settings=settings)
        result = get_server_settings(ctx)
        assert isinstance(result, Settings)
        assert result.piveau_api_base == "https://custom.api.at"
        assert result.log_level == "DEBUG"


class TestHasApiKey:
    def test_returns_true_when_key_set(self):
        settings = Settings(piveau_api_key="my-secret-key")
        ctx = create_mock_context(settings=settings)
        result = has_api_key(ctx)
        assert result is True

    def test_returns_false_when_key_not_set(self):
        settings = Settings(piveau_api_key=None)
        ctx = create_mock_context(settings=settings)
        result = has_api_key(ctx)
        assert result is False

    def test_returns_false_on_error(self):
        ctx = MagicMock(spec=Context)
        ctx.request_context = None
        result = has_api_key(ctx)
        assert result is False

    def test_returns_false_when_lifespan_context_missing(self):
        ctx = MagicMock(spec=Context)
        ctx.request_context = MagicMock()
        ctx.request_context.lifespan_context = None
        result = has_api_key(ctx)
        assert result is False
