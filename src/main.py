#!/usr/bin/env python3
"""
MCP Server for data.gv.at API
Based on the OpenAPI schema from data.gv.at
"""

import json
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx
from mcp.server.fastmcp import Context, FastMCP
from mcp.server.session import ServerSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_BASE_URL = "https://www.data.gv.at/katalog/api/3"
API_TIMEOUT = 30.0


@dataclass
class AppContext:
    """Application context with HTTP client."""
    http_client: httpx.AsyncClient


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[AppContext]:
    """Manage application lifecycle with HTTP client."""
    client = httpx.AsyncClient(
        base_url=API_BASE_URL,
        timeout=API_TIMEOUT,
        headers={
            "User-Agent": "DataGvAt-MCP/1.0.0",
            "Accept": "application/json"
        }
    )
    
    logger.info("Starting data.gv.at MCP server with FastMCP")
    
    try:
        yield AppContext(http_client=client)
    finally:
        await client.aclose()
        logger.info("HTTP client closed")


mcp = FastMCP("datagvat-mcp", lifespan=app_lifespan)


async def _api_request(client: httpx.AsyncClient, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Make API request helper."""
    url = f"/action/{endpoint}"
    
    try:
        response = await client.get(url, params=params or {})
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"API request failed: {e}")
        raise


def _format_response(data: Any, summary: str = "") -> str:
    """Format API response."""
    if summary:
        return f"{summary}\n\n{json.dumps(data, indent=2, ensure_ascii=False)}"
    else:
        return json.dumps(data, indent=2, ensure_ascii=False)


@mcp.tool()
async def package_list(
    ctx: Context[ServerSession, AppContext],
    offset: Optional[int] = None,
    limit: Optional[int] = None
) -> str:
    """List all datasets within given limit."""
    params = {}
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "package_list", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} datasets"
    
    return _format_response(result, summary)


@mcp.tool()
async def package_search(
    ctx: Context[ServerSession, AppContext],
    q: str = "*:*",
    fq: Optional[str] = None,
    sort: str = "relevance asc, metadata_modified desc",
    rows: Optional[int] = None,
    start: Optional[int] = None,
    include_drafts: bool = False
) -> str:
    """Search among all datasets."""
    params = {"q": q, "sort": sort, "include_drafts": include_drafts}
    if fq is not None:
        params["fq"] = fq
    if rows is not None:
        params["rows"] = rows
    if start is not None:
        params["start"] = start
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "package_search", params)
    result = response.get("result", response)
    count = result.get("count", 0) if isinstance(result, dict) else 0
    results_count = len(result.get("results", [])) if isinstance(result, dict) else 0
    summary = f"Found {count} total datasets (showing {results_count})"
    
    return _format_response(result, summary)


@mcp.tool()
async def package_show(
    ctx: Context[ServerSession, AppContext],
    id: str,
    include_tracking: bool = False
) -> str:
    """Get details of one dataset."""
    params = {"id": id, "include_tracking": include_tracking}
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "package_show", params)
    result = response.get("result", response)
    title = ""
    if isinstance(result, dict):
        title = result.get("title") or result.get("name") or "Item"
    summary = f"Details for: {title}"
    
    return _format_response(result, summary)


@mcp.tool()
async def package_autocomplete(
    ctx: Context[ServerSession, AppContext],
    q: str,
    limit: int = 10
) -> str:
    """Return datasets that match a string."""
    params = {"q": q, "limit": limit}
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "package_autocomplete", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} matching datasets"
    
    return _format_response(result, summary)


@mcp.tool()
async def current_package_list_with_resources(
    ctx: Context[ServerSession, AppContext],
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    page: Optional[int] = None
) -> str:
    """Return datasets and their resources, sorted by most recently modified."""
    params = {}
    if limit is not None:
        params["limit"] = limit
    if offset is not None:
        params["offset"] = offset
    if page is not None:
        params["page"] = page
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "current_package_list_with_resources", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} datasets with resources"
    
    return _format_response(result, summary)


# Organization tools
@mcp.tool()
async def organization_list(
    ctx: Context[ServerSession, AppContext],
    sort: str = "name asc",
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    organizations: Optional[str] = None,
    all_fields: bool = False,
    include_dataset_count: bool = True,
    include_extras: bool = False,
    include_tags: bool = False,
    include_groups: bool = False,
    include_users: bool = False
) -> str:
    """List all organizations."""
    params = {
        "sort": sort,
        "all_fields": all_fields,
        "include_dataset_count": include_dataset_count,
        "include_extras": include_extras,
        "include_tags": include_tags,
        "include_groups": include_groups,
        "include_users": include_users
    }
    if limit is not None:
        params["limit"] = limit
    if offset is not None:
        params["offset"] = offset
    if organizations is not None:
        params["organizations"] = organizations
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "organization_list", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} organizations"
    
    return _format_response(result, summary)


# Resource tools
@mcp.tool()
async def resource_show(
    ctx: Context[ServerSession, AppContext],
    id: str,
    include_tracking: bool = False
) -> str:
    """Return the metadata of a resource."""
    params = {"id": id, "include_tracking": include_tracking}
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "resource_show", params)
    result = response.get("result", response)
    title = ""
    if isinstance(result, dict):
        title = result.get("title") or result.get("name") or "Resource"
    summary = f"Details for: {title}"
    
    return _format_response(result, summary)


@mcp.tool()
async def resource_search(
    ctx: Context[ServerSession, AppContext],
    query: str,
    order_by: Optional[str] = None,
    offset: Optional[str] = None,
    limit: Optional[str] = None
) -> str:
    """Search for resources satisfying search criteria."""
    params = {"query": query}
    if order_by is not None:
        params["order_by"] = order_by
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "resource_search", params)
    result = response.get("result", response)
    count = result.get("count", 0) if isinstance(result, dict) else 0
    results_count = len(result.get("results", [])) if isinstance(result, dict) else 0
    summary = f"Found {count} total resources (showing {results_count})"
    
    return _format_response(result, summary)


@mcp.tool()
async def resource_view_show(
    ctx: Context[ServerSession, AppContext],
    id: str
) -> str:
    """Return the metadata of a resource view."""
    params = {"id": id}
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "resource_view_show", params)
    result = response.get("result", response)
    title = ""
    if isinstance(result, dict):
        title = result.get("title") or result.get("name") or "Resource View"
    summary = f"Details for: {title}"
    
    return _format_response(result, summary)


@mcp.tool()
async def resource_view_list(
    ctx: Context[ServerSession, AppContext],
    id: str
) -> str:
    """Return the list of resource views for a resource."""
    params = {"id": id}
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "resource_view_list", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} resource views"
    
    return _format_response(result, summary)


# Tag tools
@mcp.tool()
async def tag_list(
    ctx: Context[ServerSession, AppContext],
    query: Optional[str] = None,
    vocabulary_id: Optional[str] = None,
    all_fields: bool = False
) -> str:
    """Return a list of the site's tags."""
    params = {"all_fields": all_fields}
    if query is not None:
        params["query"] = query
    if vocabulary_id is not None:
        params["vocabulary_id"] = vocabulary_id
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "tag_list", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} tags"
    
    return _format_response(result, summary)


@mcp.tool()
async def tag_show(
    ctx: Context[ServerSession, AppContext],
    id: str,
    vocabulary_id: Optional[str] = None,
    include_datasets: Optional[bool] = None
) -> str:
    """Return the details of a tag and all its datasets."""
    params = {"id": id}
    if vocabulary_id is not None:
        params["vocabulary_id"] = vocabulary_id
    if include_datasets is not None:
        params["include_datasets"] = include_datasets
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "tag_show", params)
    result = response.get("result", response)
    title = ""
    if isinstance(result, dict):
        title = result.get("title") or result.get("name") or "Tag"
    summary = f"Details for: {title}"
    
    return _format_response(result, summary)


@mcp.tool()
async def tag_search(
    ctx: Context[ServerSession, AppContext],
    query: str,
    vocabulary_id: Optional[str] = None,
    limit: Optional[str] = None,
    offset: Optional[str] = None
) -> str:
    """Return tags whose names contain a given string."""
    params = {"query": query}
    if vocabulary_id is not None:
        params["vocabulary_id"] = vocabulary_id
    if limit is not None:
        params["limit"] = limit
    if offset is not None:
        params["offset"] = offset
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "tag_search", params)
    result = response.get("result", response)
    count = result.get("count", 0) if isinstance(result, dict) else 0
    results_count = len(result.get("results", [])) if isinstance(result, dict) else 0
    summary = f"Found {count} total tags (showing {results_count})"
    
    return _format_response(result, summary)


# Activity tools
@mcp.tool()
async def package_activity_list(
    ctx: Context[ServerSession, AppContext],
    id: str,
    offset: Optional[int] = None,
    limit: Optional[int] = None,
    include_hidden_activity: Optional[bool] = None
) -> str:
    """Return a package's activity stream."""
    params = {"id": id}
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit
    if include_hidden_activity is not None:
        params["include_hidden_activity"] = include_hidden_activity
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "package_activity_list", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} activity items"
    
    return _format_response(result, summary)


@mcp.tool()
async def organization_activity_list(
    ctx: Context[ServerSession, AppContext],
    id: str,
    offset: Optional[int] = None,
    limit: Optional[int] = None,
    include_hidden_activity: Optional[bool] = None
) -> str:
    """Return an organization's activity stream."""
    params = {"id": id}
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit
    if include_hidden_activity is not None:
        params["include_hidden_activity"] = include_hidden_activity
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "organization_activity_list", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} activity items"
    
    return _format_response(result, summary)


@mcp.tool()
async def recently_changed_packages_activity_list(
    ctx: Context[ServerSession, AppContext],
    offset: Optional[int] = None,
    limit: Optional[int] = None
) -> str:
    """Return activity stream of all recently added or changed packages."""
    params = {}
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "recently_changed_packages_activity_list", params)
    result = response.get("result", response)
    count = len(result) if isinstance(result, list) else 0
    summary = f"Found {count} activity items"
    
    return _format_response(result, summary)


@mcp.tool()
async def activity_show(
    ctx: Context[ServerSession, AppContext],
    id: str,
    include_data: Optional[bool] = None
) -> str:
    """Show details of an activity stream item."""
    params = {"id": id}
    if include_data is not None:
        params["include_data"] = include_data
    
    response = await _api_request(ctx.request_context.lifespan_context.http_client, "activity_show", params)
    result = response.get("result", response)
    title = ""
    if isinstance(result, dict):
        title = result.get("title") or result.get("name") or "Activity"
    summary = f"Details for: {title}"
    
    return _format_response(result, summary)


# Utility tools
# @mcp.tool()
# async def help_show(
#     ctx: Context[ServerSession, AppContext],
#     name: Optional[str] = None
# ) -> str:
#     """Return help string for a particular API action."""
#     params = {}
#     if name is not None:
#         params["name"] = name
    
#     response = await _api_request(ctx.request_context.lifespan_context.http_client, "help_show", params)
#     result = response.get("result", response)
#     summary = f"Help for API action: {name or 'general'}"
    
#     return _format_response(result, summary)


def main():
    """Synchronous entry point for Poetry scripts."""
    # FastMCP handles its own event loop internally
    mcp.run()


if __name__ == "__main__":
    main()