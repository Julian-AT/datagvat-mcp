"""Austria Open Data MCP Server."""

import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import TYPE_CHECKING

from fastmcp import FastMCP
from fastmcp.server.middleware.error_handling import RetryMiddleware, ErrorHandlingMiddleware
from fastmcp.server.middleware.rate_limiting import RateLimitingMiddleware
from fastmcp.server.middleware.logging import StructuredLoggingMiddleware

from app.client import PiveauClient
from app.config import get_settings

if TYPE_CHECKING:
    from app.config import Settings

from app.middleware import AuditMiddleware, AuthMiddleware
from app.resources import register_resources
from app.prompts import register_prompts
from app.tools.analysis import register_analysis_tools
from app.tools.discovery import register_discovery_tools
from app.tools.management import register_management_tools
from app.tools.vocabularies import register_vocabulary_tools


@dataclass
class AppState:
    """Application state available during lifespan."""
    settings: "Settings"
    piveau_client: PiveauClient


@asynccontextmanager
async def lifespan(mcp: FastMCP):
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    logger = logging.getLogger(__name__)
    logger.info("Starting Austria MCP Server")

    client = PiveauClient(
        base_url=settings.piveau_api_base,
        api_key=settings.api_key_value,
        timeout=settings.request_timeout,
        user_agent=settings.user_agent,
    )

    try:
        yield AppState(settings=settings, piveau_client=client)
    finally:
        await client.close()
        logger.info("Austria MCP Server stopped")


mcp = FastMCP(
    name="austria-data",
    instructions="Access Austrian Open Government Data from data.gv.at via the Piveau Hub API.",
    lifespan=lifespan,
    middleware=[
        StructuredLoggingMiddleware(
            include_payloads=False,
            include_payload_length=True,
            estimate_payload_tokens=True,
        ),
        ErrorHandlingMiddleware(),
        RetryMiddleware(
            max_retries=3,
            base_delay=1.0,
            max_delay=60.0,
            backoff_multiplier=2.0,
            retry_exceptions=(ConnectionError, TimeoutError),
        ),
        RateLimitingMiddleware(
            max_requests_per_second=10.0,
            burst_capacity=20,
            global_limit=False,
        ),
        AuditMiddleware(),
        AuthMiddleware(),
    ],
)

register_discovery_tools(mcp)
register_management_tools(mcp)
register_analysis_tools(mcp)
register_vocabulary_tools(mcp)
register_resources(mcp)
register_prompts(mcp)


if __name__ == "__main__":
    mcp.run()
