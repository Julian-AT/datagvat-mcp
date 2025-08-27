"""
Vocabularies API endpoints.
"""

from typing import Optional

from mcp.server.fastmcp import Context
from mcp.server.session import ServerSession

from ..common import AppContext, mcp, format_response, get_auth_headers, make_api_request, extract_count_info


@mcp.tool()
async def list_vocabularies(
    ctx: Context[ServerSession, AppContext],
    value_type: str = "uriRefs",
    offset: int = 0,
    limit: int = 100
) -> str:
    """
    Get list of indexed (controlled) vocabularies used by the portal.
    
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
        "/vocabularies",
        params=params
    )
    
    count, summary = extract_count_info(result)
    return format_response(result, f"{summary} vocabularies")


@mcp.tool()
async def get_vocabulary(
    ctx: Context[ServerSession, AppContext],
    vocabulary_id: str
) -> str:
    """
    Get details of a specific vocabulary.
    
    Args:
        vocabulary_id: The unique identifier of the vocabulary
    """
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "GET",
        f"/vocabularies/{vocabulary_id}"
    )
    
    title = result.get("title", vocabulary_id) if isinstance(result, dict) else vocabulary_id
    return format_response(result, f"Vocabulary details: {title}")


# DEPRECATED ENDPOINTS (available but deprecated and internal use only):

@mcp.tool()
async def create_or_update_vocabulary_legacy(
    ctx: Context[ServerSession, AppContext],
    vocabulary_id: str,
    uri: str,
    vocabulary_data: dict,
    hash_value: Optional[str] = None,
    chunk_id: int = 0,
    number_of_chunks: int = 1,
    api_key: Optional[str] = None,
    bearer_token: Optional[str] = None
) -> str:
    """
    [DEPRECATED] Create or update a vocabulary using legacy endpoint.
    
    Args:
        vocabulary_id: ID of the vocabulary
        uri: URI of the vocabulary
        vocabulary_data: The vocabulary data in RDF format
        hash_value: Hash of the vocabulary for chunk-wise processing
        chunk_id: ID of the corresponding chunk (default: 0)
        number_of_chunks: Number of total chunks (default: 1)
        api_key: API key for authentication
        bearer_token: Bearer token for authentication
        
    Deprecated:
        This endpoint is deprecated and reserved for internal use only.
    """
    params = {
        "vocabularyId": vocabulary_id,
        "uri": uri,
        "chunkId": chunk_id,
        "numberOfChunks": number_of_chunks
    }
    if hash_value:
        params["hash"] = hash_value
    
    headers = get_auth_headers(api_key, bearer_token)
    headers["Content-Type"] = "application/ld+json"
    
    result = await make_api_request(
        ctx.request_context.lifespan_context.http_client,
        "PUT",
        "/vocabularies",
        params=params,
        json_data=vocabulary_data,
        headers=headers
    )
    
    return format_response(result, f"Vocabulary {vocabulary_id} created/updated successfully (deprecated legacy endpoint)")


# The following endpoints are reserved for internal use only and are not available in this public API client:
# - PUT /vocabularies/{vocabularyId} - Create or update vocabulary
# - DELETE /vocabularies/{vocabularyId} - Delete vocabulary