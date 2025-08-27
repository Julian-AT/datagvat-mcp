"""
Distributions API endpoints.
"""

from typing import Optional

from mcp.server.fastmcp import Context
from mcp.server.session import ServerSession

from ..common import AppContext, mcp, format_response, get_auth_headers, make_api_request


@mcp.tool()
async def get_distribution(
    ctx: Context[ServerSession, AppContext],
    distribution_id: str
) -> str:
    """
    Get details of a specific distribution.
    
    Args:
        distribution_id: The unique ID of the distribution
    """
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/distributions/{distribution_id}"
    )
    
    title = result.get("title", distribution_id) if isinstance(result, dict) else distribution_id
    return format_response(result, f"Distribution details: {title}")


# The following endpoints are reserved for internal use only and are not available in this public API client:
# - PUT /distributions/{distributionId} - Update distribution
# - DELETE /distributions/{distributionId} - Delete distribution