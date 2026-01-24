"""MCP Middleware for authentication and logging."""

import logging
import time
from typing import Any

from fastmcp.server.middleware import Middleware, MiddlewareContext

logger = logging.getLogger(__name__)


class AuditMiddleware(Middleware):
    """Logs tool executions with timing."""

    async def on_call_tool(self, context: MiddlewareContext, call_next: Any) -> Any:
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
                name = context.arguments.get("name", "unknown")
                return str(name) if name is not None else "unknown"
            if hasattr(context, "message") and context.message:
                params = getattr(context.message, "params", None)
                if params:
                    name = getattr(params, "name", "unknown")
                    return str(name) if name is not None else "unknown"
        except Exception:
            pass
        return "unknown"

    def _get_request_id(self, context: MiddlewareContext) -> str:
        try:
            if context.fastmcp_context:
                req_id = context.fastmcp_context.request_id or "no-id"
                return str(req_id)
        except Exception:
            pass
        return f"req-{int(time.time() * 1000)}"
