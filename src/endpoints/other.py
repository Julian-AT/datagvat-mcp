"""
Resources API endpoints (public endpoints only).
"""

from typing import Optional

from mcp.server.fastmcp import Context
from mcp.server.session import ServerSession

from ..common import AppContext, mcp, format_response, get_auth_headers, make_api_request, extract_count_info


# Resources endpoints (public read-only operations)
@mcp.tool()
async def list_resource_types(
    ctx: Context[ServerSession, AppContext]
) -> str:
    """
    Get a list of resource types.
    """
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        "/resources"
    )
    
    count, summary = extract_count_info(result)
    return format_response(result, f"{summary} resource types")


@mcp.tool()
async def list_resources(
    ctx: Context[ServerSession, AppContext],
    resource_type: str
) -> str:
    """
    Get a list of resources of a specific type.
    
    Args:
        resource_type: Type to which the resources belong
    """
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/resources/{resource_type}"
    )
    
    count, summary = extract_count_info(result)
    return format_response(result, f"{summary} resources of type {resource_type}")


@mcp.tool()
async def get_resource(
    ctx: Context[ServerSession, AppContext],
    resource_type: str,
    resource_id: str
) -> str:
    """
    Get a resource with id and type.
    
    Args:
        resource_type: Type to which the resource belongs
        resource_id: ID of the resource
    """
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/resources/{resource_type}/{resource_id}"
    )
    
    title = result.get("title", resource_id) if isinstance(result, dict) else resource_id
    return format_response(result, f"Resource details: {title}")


# The following endpoints are reserved for internal use only and are not available in this public API client:
# 
# DRAFTS ENDPOINTS:
# - GET /drafts/datasets - List dataset drafts
# - POST /drafts/datasets - Create dataset draft
# - GET /drafts/datasets/{id} - Get dataset draft
# - PUT /drafts/datasets/{id} - Create/update dataset draft
# - DELETE /drafts/datasets/{id} - Delete dataset draft
# - PUT /drafts/datasets/publish/{id} - Publish dataset draft
# - PUT /drafts/datasets/hide/{id} - Hide dataset
# 
# IDENTIFIERS ENDPOINTS:
# - PUT /identifiers/datasets/{datasetId} - Create dataset identifier
# - GET /identifiers/datasets/{datasetId}/eligibility - Check identifier eligibility
# 
# RESOURCE MANAGEMENT ENDPOINTS:
# - POST /resources/{type} - Create resource
# - PUT /resources/{type} - Create/update resource
# - DELETE /resources/{type}/{id} - Delete resource
# 
# OTHER ENDPOINTS:
# - POST /action - Call JSON-RPC action
# - POST /translation - Post completed translation