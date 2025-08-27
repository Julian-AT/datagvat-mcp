"""
Datasets API endpoints.
"""

from typing import Optional

from mcp.server.fastmcp import Context
from mcp.server.session import ServerSession

from ..common import AppContext, mcp, format_response, get_auth_headers, make_api_request, extract_count_info


@mcp.tool()
async def list_datasets(
    ctx: Context[ServerSession, AppContext],
    value_type: str = "uriRefs",
    offset: int = 0,
    limit: int = 100,
    hydra: bool = False,
    use_paged_collection: bool = False
) -> str:
    """
    List all datasets.
    
    Args:
        value_type: Return value type (uriRefs, identifiers, originalIds, metadata)
        offset: Starting point for counting
        limit: Number of resources to retrieve (1-5000)
        hydra: Use hydra paging (only for valueType=metadata)
        use_paged_collection: Use legacy PagedCollection format for pagination
        
    Note: 
        - The 'catalogue' and 'sourceIds' parameters are deprecated
        - Use GET /catalogues/{catalogueId}/datasets instead for catalogue-specific datasets
    """
    params = {
        "valueType": value_type,
        "offset": offset,
        "limit": limit,
        "hydra": hydra,
        "usePagedCollection": use_paged_collection
    }
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        "/datasets",
        params=params
    )
    
    count, summary = extract_count_info(result)
    return format_response(result, f"{summary} datasets")


@mcp.tool()
async def get_dataset(
    ctx: Context[ServerSession, AppContext],
    dataset_id: str
) -> str:
    """
    Get details of a specific dataset.
    
    Args:
        dataset_id: The unique ID of the dataset
        
    Note:
        - The 'catalogue' parameter is deprecated
        - Use GET /catalogues/{catalogueId}/datasets/origin instead for catalogue-specific operations
    """
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/datasets/{dataset_id}"
    )
    
    title = result.get("title", dataset_id) if isinstance(result, dict) else dataset_id
    return format_response(result, f"Dataset details: {title}")


@mcp.tool()
async def update_dataset(
    ctx: Context[ServerSession, AppContext],
    dataset_id: str,
    dataset_data: dict,
    api_key: Optional[str] = None,
    bearer_token: Optional[str] = None
) -> str:
    """
    Update a dataset (requires authentication).
    
    Args:
        dataset_id: The unique ID of the dataset
        dataset_data: The dataset data in RDF format
        api_key: API key for authentication
        bearer_token: Bearer token for authentication
        
    Note:
        - When using an original dataset ID for creation or update, 
          use PUT /catalogues/{catalogueId}/datasets/origin instead
        - The 'catalogue' parameter is deprecated
    """
    headers = get_auth_headers(api_key, bearer_token)
    headers["Content-Type"] = "application/ld+json"
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "PUT",
        f"/datasets/{dataset_id}",
        json_data=dataset_data,
        headers=headers
    )
    
    return format_response(result, f"Dataset {dataset_id} updated successfully")


@mcp.tool()
async def list_dataset_distributions(
    ctx: Context[ServerSession, AppContext],
    dataset_id: str,
    value_type: str = "uriRefs",
    offset: int = 0,
    limit: int = 100
) -> str:
    """
    List distributions of a specific dataset.
    
    Args:
        dataset_id: The unique ID of the dataset
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
        f"/datasets/{dataset_id}/distributions",
        params=params
    )
    
    count, summary = extract_count_info(result)
    return format_response(result, f"{summary} distributions for dataset {dataset_id}")


@mcp.tool()
async def get_dataset_metrics(
    ctx: Context[ServerSession, AppContext],
    dataset_id: str,
    historic: bool = False
) -> str:
    """
    Get metrics for a dataset.
    
    Args:
        dataset_id: The unique ID of the dataset
        historic: Whether to return historic metrics graph
    """
    params = {"historic": historic}
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/datasets/{dataset_id}/metrics",
        params=params
    )
    
    return format_response(result, f"Metrics for dataset {dataset_id}")


@mcp.tool()
async def get_dataset_catalogue_record(
    ctx: Context[ServerSession, AppContext],
    dataset_id: str
) -> str:
    """
    Get the catalogue record for a dataset.
    
    Args:
        dataset_id: The unique ID of the dataset
    """
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/datasets/{dataset_id}/record"
    )
    
    return format_response(result, f"Catalogue record for dataset {dataset_id}")


# DEPRECATED ENDPOINTS (available but deprecated):

@mcp.tool()
async def add_dataset_legacy(
    ctx: Context[ServerSession, AppContext],
    catalogue: str,
    dataset_data: dict,
    api_key: Optional[str] = None,
    bearer_token: Optional[str] = None
) -> str:
    """
    [DEPRECATED] Add dataset (legacy endpoint).
    
    Args:
        catalogue: The catalogue to add the dataset
        dataset_data: The dataset data in RDF format
        api_key: API key for authentication
        bearer_token: Bearer token for authentication
        
    Deprecated:
        Use POST /catalogues/{catalogueId}/datasets/origin instead.
        Note: This endpoint is also for internal use only.
    """
    params = {"catalogue": catalogue}
    headers = get_auth_headers(api_key, bearer_token)
    headers["Content-Type"] = "application/ld+json"
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "POST",
        "/datasets",
        params=params,
        json_data=dataset_data,
        headers=headers
    )
    
    return format_response(result, "Dataset added successfully (legacy endpoint)")


@mcp.tool()
async def create_or_update_dataset_legacy(
    ctx: Context[ServerSession, AppContext],
    dataset_id: str,
    catalogue: str,
    dataset_data: dict,
    data: bool = False,
    api_key: Optional[str] = None,
    bearer_token: Optional[str] = None
) -> str:
    """
    [DEPRECATED] Create or update dataset (legacy endpoint).
    
    Args:
        dataset_id: The dataset ID
        catalogue: The catalogue ID
        dataset_data: The dataset data in RDF format
        data: Generate data URL
        api_key: API key for authentication
        bearer_token: Bearer token for authentication
        
    Deprecated:
        Use PUT /catalogues/{catalogueId}/datasets/origin instead.
        Note: This endpoint is also for internal use only.
    """
    params = {"id": dataset_id, "catalogue": catalogue, "data": data}
    headers = get_auth_headers(api_key, bearer_token)
    headers["Content-Type"] = "application/ld+json"
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "PUT",
        "/datasets",
        params=params,
        json_data=dataset_data,
        headers=headers
    )
    
    return format_response(result, "Dataset created/updated successfully (legacy endpoint)")


@mcp.tool()
async def delete_dataset_legacy(
    ctx: Context[ServerSession, AppContext],
    dataset_id: str,
    catalogue: str,
    api_key: Optional[str] = None,
    bearer_token: Optional[str] = None
) -> str:
    """
    [DEPRECATED] Delete dataset (legacy endpoint).
    
    Args:
        dataset_id: The dataset ID
        catalogue: The catalogue ID
        api_key: API key for authentication
        bearer_token: Bearer token for authentication
        
    Deprecated:
        Use DELETE /catalogues/{catalogueId}/datasets/origin instead.
        Note: This endpoint is also for internal use only.
    """
    params = {"id": dataset_id, "catalogue": catalogue}
    headers = get_auth_headers(api_key, bearer_token)
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "DELETE",
        "/datasets",
        params=params,
        headers=headers
    )
    
    return format_response(result, "Dataset deleted successfully (legacy endpoint)")


@mcp.tool()
async def get_catalogue_record_legacy(
    ctx: Context[ServerSession, AppContext],
    dataset_id: str,
    catalogue: Optional[str] = None
) -> str:
    """
    [DEPRECATED] Get catalogue record (legacy endpoint).
    
    Args:
        dataset_id: The unique ID of the dataset
        catalogue: The catalogue ID (deprecated parameter)
        
    Deprecated:
        Use GET /datasets/{datasetId}/record instead.
    """
    params = {}
    if catalogue:
        params["catalogue"] = catalogue
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/records/{dataset_id}",
        params=params
    )
    
    return format_response(result, f"Catalogue record for dataset {dataset_id} (legacy endpoint)")


# The following endpoints are reserved for internal use only and are not available in this public API client:
# - DELETE /datasets/{datasetId} - Delete dataset
# - POST /datasets/{datasetId}/distributions - Add distribution to dataset
# - PUT /datasets/{datasetId}/metrics - Create/update metrics
# - DELETE /datasets/{datasetId}/metrics - Delete metrics
# - GET /datasets/{datasetId}/index - Index/reindex dataset