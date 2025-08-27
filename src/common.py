"""
Common components shared across the application.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
import json
from typing import Any, Dict, Optional

import httpx
from mcp.server.fastmcp import FastMCP

logger = logging.getLogger(__name__)

DEFAULT_API_BASE_URL = "https://qs.data.gv.at/api/hub/repo/"
API_TIMEOUT = 30.0


@dataclass
class AppContext:
    """Application context with HTTP client."""
    http_client: httpx.AsyncClient


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[AppContext]:
    """Manage application lifecycle with HTTP client."""
    import os
    api_base_url = os.getenv("DATA_GV_AT_API_BASE_URL", DEFAULT_API_BASE_URL)
    
    client = httpx.AsyncClient(
        base_url=api_base_url,
        timeout=API_TIMEOUT,
        headers={
            "User-Agent": "data.gv.at-mcp/1.0.0",
            "Accept": "application/json"
        }
    )
    
    logger.info(f"Starting data.gv.at hub-repo MCP server with base URL: {api_base_url}")
    
    try:
        yield AppContext(http_client=client)
    finally:
        await client.aclose()
        logger.info("HTTP client closed")


mcp = FastMCP("datagvat-mcp", lifespan=app_lifespan)




class APIError(Exception):
    """Custom API error."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def make_api_request(
    client: httpx.AsyncClient,
    method: str,
    endpoint: str,
    params: Optional[Dict[str, Any]] = None,
    json_data: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Make API request helper."""
    try:
        request_headers = {}
        if headers:
            request_headers.update(headers)
        
        # Set appropriate content type for RDF endpoints
        if not request_headers.get("Accept"):
            request_headers["Accept"] = "application/json"
        
        response = await client.request(
            method=method,
            url=endpoint,
            params=params or {},
            json=json_data,
            headers=request_headers
        )
        
        # Handle different response types
        if response.status_code == 204:  # No Content
            return {"status": "success", "message": "Operation completed successfully"}
        elif response.status_code == 202:  # Accepted (for notifications)
            return {"status": "accepted", "message": "Request accepted"}
        
        response.raise_for_status()
        
        # Try to parse as JSON first
        try:
            return response.json()
        except (json.JSONDecodeError, ValueError):
            # If not JSON, return the text content
            return {"data": response.text, "content_type": response.headers.get("content-type", "text/plain")}
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
        raise APIError(f"HTTP {e.response.status_code}: {e.response.text}", e.response.status_code)
    except Exception as e:
        logger.error(f"API request failed: {e}")
        raise APIError(f"Request failed: {str(e)}")


def format_response(data: Any, summary: str = "") -> str:
    """Format API response for display."""
    if summary:
        formatted_data = json.dumps(data, indent=2, ensure_ascii=False) if isinstance(data, (dict, list)) else str(data)
        return f"{summary}\n\n{formatted_data}"
    else:
        return json.dumps(data, indent=2, ensure_ascii=False) if isinstance(data, (dict, list)) else str(data)


def get_auth_headers(api_key: Optional[str] = None, bearer_token: Optional[str] = None) -> Dict[str, str]:
    """Get authentication headers if credentials are provided."""
    headers = {}
    if api_key:
        headers["X-API-Key"] = api_key
    elif bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"
    return headers


def extract_count_info(result: Any) -> tuple[int, str]:
    """Extract count information from API result for summary."""
    if isinstance(result, list):
        return len(result), f"Found {len(result)} items"
    elif isinstance(result, dict):
        if "count" in result:
            count = result["count"]
            result_count = len(result.get("results", []))
            return count, f"Found {count} total items (showing {result_count})"
        else:
            return 1, "Retrieved item details"
    else:
        return 0, "No items found"
