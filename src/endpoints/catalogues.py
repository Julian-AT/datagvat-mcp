"""
Catalogues API endpoints.
"""

from typing import Optional

from mcp.server.fastmcp import Context
from mcp.server.session import ServerSession

from ..common import AppContext, mcp, format_response, get_auth_headers, make_api_request, extract_count_info


@mcp.tool()
async def list_catalogues(
    ctx: Context[ServerSession, AppContext],
    value_type: str = "uriRefs",
    offset: int = 0,
    limit: int = 100
) -> str:
    """
    List all catalogues.
    
    Args:
        value_type: Return value type (uriRefs, identifiers, originalIds, metadata)
        offset: Starting point for counting
        limit: Number of resources to retrieve (1-5000)
    """
    params = {
        "valueType": value_type,
        "offset": offset,
        "limit": limit
    }
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        "/catalogues",
        params=params
    )
    
    count, summary = extract_count_info(result)
    return format_response(result, f"{summary} catalogues")


@mcp.tool()
async def get_catalogue(
    ctx: Context[ServerSession, AppContext],
    catalogue_id: str
) -> str:
    """
    Get details of a specific catalogue.
    
    Args:
        catalogue_id: The unique ID of the catalogue
    """
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/catalogues/{catalogue_id}"
    )
    
    title = result.get("title", catalogue_id) if isinstance(result, dict) else catalogue_id
    return format_response(result, f"Catalogue details: {title}")


@mcp.tool()
async def list_catalogue_datasets(
    ctx: Context[ServerSession, AppContext],
    catalogue_id: str,
    value_type: str = "uriRefs",
    offset: int = 0,
    limit: int = 100
) -> str:
    """
    List datasets of a specific catalogue.
    
    Args:
        catalogue_id: The unique ID of the catalogue
        value_type: Return value type (uriRefs, identifiers, originalIds, metadata)
        offset: Starting point for counting
        limit: Number of resources to retrieve (1-5000)
    """
    params = {
        "valueType": value_type,
        "offset": offset,
        "limit": limit
    }
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/catalogues/{catalogue_id}/datasets",
        params=params
    )
    
    count, summary = extract_count_info(result)
    return format_response(result, f"{summary} datasets in catalogue {catalogue_id}")


@mcp.tool()
async def get_catalogue_dataset_by_origin(
    ctx: Context[ServerSession, AppContext],
    catalogue_id: str,
    original_id: str
) -> str:
    """
    Get a dataset from a catalogue by its original ID.
    
    Args:
        catalogue_id: The unique ID of the catalogue
        original_id: The original ID of the dataset
    """
    params = {"originalId": original_id}
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/catalogues/{catalogue_id}/datasets/origin",
        params=params
    )
    
    title = result.get("title", original_id) if isinstance(result, dict) else original_id
    return format_response(result, f"Dataset details: {title}")


# The following endpoints are reserved for internal use only and are not available in this public API client:
# - PUT /catalogues/{catalogueId} - Create or update catalogue
# - DELETE /catalogues/{catalogueId} - Delete catalogue  
# - POST /catalogues/{catalogueId}/datasets - Add dataset to catalogue
# - PUT /catalogues/{catalogueId}/datasets/origin - Create or update dataset by original ID
# - DELETE /catalogues/{catalogueId}/datasets/origin - Delete dataset by original ID