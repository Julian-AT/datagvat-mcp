"""MCP Middleware for authentication and logging."""

import time
import logging

from fastmcp.server.middleware import Middleware, MiddlewareContext
from fastmcp.exceptions import ToolError

logger = logging.getLogger(__name__)


class AuditMiddleware(Middleware):
    """Logs tool executions with timing."""

    async def on_call_tool(self, context: MiddlewareContext, call_next):
        tool_name = self._get_tool_name(context)
        request_id = self._get_request_id(context)
        start = time.perf_counter()

        logger.info(f"[{request_id}] {tool_name} started")

        try:
            result = await call_next(context)
            elapsed = (time.perf_counter() - start) * 1000
            logger.info(f"[{request_id}] {tool_name} completed in {elapsed:.2f}ms")
            return result
        except Exception as e:
            elapsed = (time.perf_counter() - start) * 1000
            logger.error(f"[{request_id}] {tool_name} failed after {elapsed:.2f}ms: {e}")
            raise

    def _get_tool_name(self, context: MiddlewareContext) -> str:
        try:
            if hasattr(context, "arguments") and context.arguments:
                return context.arguments.get("name", "unknown")
            if hasattr(context, "message") and context.message:
                params = getattr(context.message, "params", None)
                if params:
                    return getattr(params, "name", "unknown")
        except Exception:
            pass
        return "unknown"

    def _get_request_id(self, context: MiddlewareContext) -> str:
        try:
            if context.fastmcp_context:
                return context.fastmcp_context.request_id or "no-id"
        except Exception:
            pass
        return f"req-{int(time.time() * 1000)}"


class AuthMiddleware(Middleware):
    """Enforces API key for write operations."""

    WRITE_TOOLS = frozenset({
        "create_dataset_draft",
        "update_dataset_draft",
        "delete_dataset_draft",
        "publish_dataset",
        "hide_dataset",
    })

    async def on_call_tool(self, context: MiddlewareContext, call_next):
        tool_name = self._get_tool_name(context)

        if tool_name in self.WRITE_TOOLS:
            if not self._has_api_key(context):
                raise ToolError(
                    f"API key required for '{tool_name}'. "
                    "Set AUSTRIA_MCP_PIVEAU_API_KEY environment variable."
                )

        return await call_next(context)

    def _get_tool_name(self, context: MiddlewareContext) -> str:
        try:
            if hasattr(context, "arguments") and context.arguments:
                return context.arguments.get("name", "")
            if hasattr(context, "message") and context.message:
                params = getattr(context.message, "params", None)
                if params:
                    return getattr(params, "name", "")
        except Exception:
            pass
        return ""

    def _has_api_key(self, context: MiddlewareContext) -> bool:
        try:
            if context.fastmcp_context and context.fastmcp_context.request_context:
                app_state = context.fastmcp_context.request_context.lifespan_context
                if app_state and hasattr(app_state, "settings"):
                    return app_state.settings.api_key_value is not None
        except Exception:
            pass
        return False
