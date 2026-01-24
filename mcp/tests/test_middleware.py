import logging
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastmcp.server.middleware import MiddlewareContext

from app.client import PiveauClient
from app.config import Settings
from app.middleware import AuditMiddleware
from app.server import AppState


def create_middleware_context(
    tool_name: str = "test_tool",
    has_api_key: bool = True,
    request_id: str = "test-123",
) -> MagicMock:
    ctx = MagicMock(spec=MiddlewareContext)
    ctx.arguments = {"name": tool_name}
    ctx.message = None
    ctx.fastmcp_context = MagicMock()
    ctx.fastmcp_context.request_id = request_id
    
    settings = Settings(
        piveau_api_base="https://test.api.at",
        piveau_api_key="test-key" if has_api_key else None,
    )
    mock_client = AsyncMock(spec=PiveauClient)
    app_state = AppState(settings=settings, piveau_client=mock_client)
    ctx.fastmcp_context.request_context = MagicMock()
    ctx.fastmcp_context.request_context.lifespan_context = app_state
    
    return ctx


class TestAuditMiddleware:
    def test_middleware_initialization(self):
        middleware = AuditMiddleware()
        assert middleware is not None

    async def test_logs_tool_start(self, caplog):
        middleware = AuditMiddleware()
        ctx = create_middleware_context(tool_name="list_catalogues")
        call_next = AsyncMock(return_value="result")
        
        with caplog.at_level(logging.INFO):
            await middleware.on_call_tool(ctx, call_next)
        
        assert any("list_catalogues" in record.message and "started" in record.message 
                   for record in caplog.records)

    async def test_logs_tool_completion(self, caplog):
        middleware = AuditMiddleware()
        ctx = create_middleware_context(tool_name="get_dataset")
        call_next = AsyncMock(return_value="result")
        
        with caplog.at_level(logging.INFO):
            await middleware.on_call_tool(ctx, call_next)
        
        assert any("get_dataset" in record.message and "completed" in record.message 
                   for record in caplog.records)

    async def test_logs_timing(self, caplog):
        middleware = AuditMiddleware()
        ctx = create_middleware_context()
        
        async def slow_call_next(ctx):
            await AsyncMock()()
            return "result"
        
        with caplog.at_level(logging.INFO):
            await middleware.on_call_tool(ctx, slow_call_next)
        
        assert any("ms" in record.message for record in caplog.records)

    async def test_logs_error_on_failure(self, caplog):
        middleware = AuditMiddleware()
        ctx = create_middleware_context(tool_name="failing_tool")
        call_next = AsyncMock(side_effect=ValueError("Test error"))
        
        with caplog.at_level(logging.ERROR):
            with pytest.raises(ValueError):
                await middleware.on_call_tool(ctx, call_next)
        
        assert any("failing_tool" in record.message and "failed" in record.message 
                   for record in caplog.records)

    async def test_passes_through_result(self):
        middleware = AuditMiddleware()
        ctx = create_middleware_context()
        expected_result = {"data": "test"}
        call_next = AsyncMock(return_value=expected_result)
        result = await middleware.on_call_tool(ctx, call_next)
        assert result == expected_result

    async def test_reraises_exception(self):
        middleware = AuditMiddleware()
        ctx = create_middleware_context()
        call_next = AsyncMock(side_effect=RuntimeError("Test"))
        
        with pytest.raises(RuntimeError, match="Test"):
            await middleware.on_call_tool(ctx, call_next)

    async def test_includes_request_id(self, caplog):
        middleware = AuditMiddleware()
        ctx = create_middleware_context(request_id="req-12345")
        call_next = AsyncMock(return_value="result")
        
        with caplog.at_level(logging.INFO):
            await middleware.on_call_tool(ctx, call_next)
        
        assert any("req-12345" in record.message for record in caplog.records)

    def test_get_tool_name_from_arguments(self):
        middleware = AuditMiddleware()
        ctx = MagicMock()
        ctx.arguments = {"name": "my_tool"}
        ctx.message = None
        name = middleware._get_tool_name(ctx)
        assert name == "my_tool"

    def test_get_tool_name_fallback_unknown(self):
        middleware = AuditMiddleware()
        ctx = MagicMock()
        ctx.arguments = None
        ctx.message = None
        name = middleware._get_tool_name(ctx)
        assert name == "unknown"
