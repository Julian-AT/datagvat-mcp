"""HTTP client for the Piveau Hub API."""

import json
import logging
from typing import Any, NoReturn

import httpx
from fastmcp.exceptions import ToolError
from rdflib import Graph

from app.models import ValueType, IdentifierType

logger = logging.getLogger(__name__)


class PiveauApiError(Exception):
    def __init__(self, message: str, status_code: int | None = None, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details


class PiveauNotFoundError(PiveauApiError):
    pass


class PiveauAuthError(PiveauApiError):
    pass


class PiveauClient:
    """Async HTTP client for the Piveau Hub API with RDF content negotiation."""

    ACCEPT_HEADER = "application/ld+json, application/json;q=0.9, text/turtle;q=0.8"
    RDF_CONTENT_TYPES = frozenset(["text/turtle", "application/rdf+xml", "application/n-triples", "text/n3"])

    def __init__(
        self,
        base_url: str,
        api_key: str | None = None,
        timeout: int = 30,
        user_agent: str = "Austria-MCP-Agent/1.0",
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
            headers={"Accept": self.ACCEPT_HEADER, "User-Agent": user_agent},
            follow_redirects=True,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "PiveauClient":
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.close()

    async def _request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
        require_auth: bool = False,
    ) -> dict[str, Any] | list[Any]:
        headers = {}

        if require_auth:
            if not self.api_key:
                raise PiveauAuthError("API key required", status_code=401)
            headers["X-API-Key"] = self.api_key
        elif self.api_key:
            headers["X-API-Key"] = self.api_key

        if json_body is not None:
            headers["Content-Type"] = "application/ld+json"

        try:
            response = await self._client.request(
                method=method,
                url=path,
                params=params,
                json=json_body,
                headers=headers,
            )
            response.raise_for_status()
            return await self._parse_response(response)
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            # API unreachable - provide actionable guidance
            logger.warning(f"Piveau API unavailable at {self.base_url}: {e}")
            raise ToolError(
                f"Piveau API unavailable at {self.base_url}: {e}. "
                "Check network connection and API status at https://www.data.gv.at"
            ) from e
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                # Server error - after retries, provide clear error message
                logger.error(f"Piveau API server error ({e.response.status_code}): {e.response.text[:200]}")
                raise ToolError(
                    f"Piveau API server error ({e.response.status_code}). "
                    "The API is experiencing issues. Please try again later."
                ) from e
            # Client errors (4xx) - use existing detailed handler
            self._handle_http_error(e)
        except httpx.RequestError as e:
            logger.error(f"Request failed: {e}")
            raise PiveauApiError(f"Request failed: {e}") from e

    def _handle_http_error(self, error: httpx.HTTPStatusError) -> NoReturn:
        status = error.response.status_code
        try:
            details = error.response.json()
        except Exception:
            details = error.response.text[:500] if error.response.text else None

        if status == 404:
            raise PiveauNotFoundError("Resource not found", status_code=status, details=details)
        elif status in (401, 403):
            raise PiveauAuthError("Authentication failed", status_code=status, details=details)
        else:
            raise PiveauApiError(f"API error: {status}", status_code=status, details=details)

    async def _parse_response(self, response: httpx.Response) -> dict[str, Any] | list[Any]:
        content_type = response.headers.get("content-type", "").split(";")[0].strip()

        if not response.content:
            return {}

        if "json" in content_type:
            parsed: dict[str, Any] | list[Any] = response.json()
            return parsed

        if content_type in self.RDF_CONTENT_TYPES:
            return self._parse_rdf(response.text, content_type)

        try:
            parsed = response.json()
            return parsed
        except json.JSONDecodeError:
            return {"_raw": response.text}

    def _parse_rdf(self, content: str, content_type: str) -> dict[str, Any]:
        format_map = {
            "text/turtle": "turtle",
            "application/rdf+xml": "xml",
            "application/n-triples": "nt",
            "text/n3": "n3",
        }
        rdf_format = format_map.get(content_type, "turtle")

        try:
            graph = Graph()
            graph.parse(data=content, format=rdf_format)
            serialized = graph.serialize(format="json-ld")
            parsed: dict[str, Any] = json.loads(serialized)
            return parsed
        except Exception as e:
            logger.warning(f"RDF parse failed: {e}")
            return {"_raw": content}

    def _extract_list(self, result: dict[str, Any] | list[Any]) -> list[dict[str, Any]]:
        if isinstance(result, list):
            typed_result: list[dict[str, Any]] = [item if isinstance(item, dict) else {} for item in result]
            return typed_result
        if isinstance(result, dict) and "@graph" in result:
            graph = result["@graph"]
            if isinstance(graph, list):
                typed_graph: list[dict[str, Any]] = [item if isinstance(item, dict) else {} for item in graph]
                return typed_graph
        return []

    # Catalogue operations

    async def list_catalogues(
        self,
        limit: int = 100,
        offset: int = 0,
        value_type: ValueType | str = ValueType.METADATA,
    ) -> list[dict[str, Any]]:
        """List catalogues. The search API returns a simple array of catalogue IDs."""
        result = await self._request("GET", "/catalogues", params={"limit": limit, "offset": offset})
        # API returns an array of catalogue ID strings, convert to dict format
        if isinstance(result, list):
            return [{"id": cat_id} for cat_id in result if isinstance(cat_id, str)]
        return self._extract_list(result)

    async def get_catalogue(self, catalogue_id: str) -> dict[str, Any]:
        """Get catalogue details. The search API returns {"result": {...}}."""
        response = await self._request("GET", f"/catalogues/{catalogue_id}")
        if isinstance(response, dict):
            if "result" in response:
                result = response["result"]
                return result if isinstance(result, dict) else {"data": result}
            return response
        return {"data": response}

    async def list_catalogue_datasets(
        self,
        catalogue_id: str,
        limit: int = 100,
        offset: int = 0,
        value_type: ValueType | str = ValueType.METADATA,
    ) -> list[dict[str, Any]]:
        vt = value_type.value if isinstance(value_type, ValueType) else value_type
        result = await self._request(
            "GET", f"/catalogues/{catalogue_id}/datasets", params={"limit": limit, "offset": offset, "valueType": vt}
        )
        return self._extract_list(result)

    # Dataset operations

    async def list_datasets(
        self,
        limit: int = 100,
        offset: int = 0,
        value_type: ValueType | str = ValueType.METADATA,
    ) -> list[dict[str, Any]]:
        vt = value_type.value if isinstance(value_type, ValueType) else value_type
        result = await self._request("GET", "/datasets", params={"limit": limit, "offset": offset, "valueType": vt})
        return self._extract_list(result)

    async def get_dataset(self, dataset_id: str) -> dict[str, Any]:
        """Get dataset details. The search API returns {"result": {...}}."""
        response = await self._request("GET", f"/datasets/{dataset_id}")
        if isinstance(response, dict):
            if "result" in response:
                result = response["result"]
                return result if isinstance(result, dict) else {"data": result}
            return response
        return {"data": response}

    async def get_distributions(self, dataset_id: str, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
        result = await self._request(
            "GET", f"/datasets/{dataset_id}/distributions", params={"limit": limit, "offset": offset, "valueType": "metadata"}
        )
        return self._extract_list(result)

    async def get_metrics(self, dataset_id: str, historic: bool = False) -> dict[str, Any]:
        result = await self._request("GET", f"/datasets/{dataset_id}/metrics", params={"historic": str(historic).lower()})
        return result if isinstance(result, dict) else {"data": result}

    # Draft operations

    async def list_drafts(self, filter_by_provider: bool = False) -> list[str]:
        result = await self._request(
            "GET", "/drafts/datasets", params={"filterByProvider": str(filter_by_provider).lower()}, require_auth=True
        )
        return result if isinstance(result, list) else []

    async def create_draft(self, catalogue_id: str, payload: dict[str, Any] | None = None) -> str:
        response = await self._client.post(
            "/drafts/datasets",
            params={"catalogue": catalogue_id},
            json=payload or {},
            headers={"X-API-Key": self.api_key, "Content-Type": "application/ld+json"} if self.api_key else {},
        )
        if response.status_code == 401:
            raise PiveauAuthError("API key required", status_code=401)
        response.raise_for_status()

        location = response.headers.get("Location", "")
        if location:
            draft_id: str = location.split("/")[-1]
            return draft_id
        try:
            data = response.json()
            if isinstance(data, dict):
                result = data.get("id") or data.get("@id") or ""
                return str(result)
            return ""
        except Exception:
            return ""

    async def get_draft(self, draft_id: str, catalogue_id: str) -> dict[str, Any]:
        result = await self._request("GET", f"/drafts/datasets/{draft_id}", params={"catalogue": catalogue_id}, require_auth=True)
        return result if isinstance(result, dict) else {"data": result}

    async def update_draft(self, draft_id: str, catalogue_id: str, payload: dict[str, Any]) -> None:
        await self._request(
            "PUT", f"/drafts/datasets/{draft_id}", params={"catalogue": catalogue_id}, json_body=payload, require_auth=True
        )

    async def delete_draft(self, draft_id: str, catalogue_id: str) -> None:
        await self._request("DELETE", f"/drafts/datasets/{draft_id}", params={"catalogue": catalogue_id}, require_auth=True)

    async def publish_draft(self, draft_id: str, catalogue_id: str) -> None:
        await self._request("PUT", f"/drafts/datasets/publish/{draft_id}", params={"catalogue": catalogue_id}, require_auth=True)

    async def hide_dataset(self, dataset_id: str, catalogue_id: str) -> None:
        await self._request("PUT", f"/drafts/datasets/hide/{dataset_id}", params={"catalogue": catalogue_id}, require_auth=True)

    # Identifier operations

    async def check_eligibility(
        self, dataset_id: str, identifier_type: IdentifierType | str = IdentifierType.EU_RA_DOI
    ) -> dict[str, Any]:
        it = identifier_type.value if isinstance(identifier_type, IdentifierType) else identifier_type
        result = await self._request("GET", f"/identifiers/datasets/{dataset_id}/eligibility", params={"type": it})
        return result if isinstance(result, dict) else {"eligible": False}

    # Vocabulary operations

    async def list_vocabularies(
        self, limit: int = 100, offset: int = 0, value_type: ValueType | str = ValueType.METADATA
    ) -> list[dict[str, Any]]:
        vt = value_type.value if isinstance(value_type, ValueType) else value_type
        result = await self._request("GET", "/vocabularies", params={"limit": limit, "offset": offset, "valueType": vt})
        return self._extract_list(result)

    async def get_vocabulary(self, vocabulary_id: str) -> dict[str, Any]:
        result = await self._request("GET", f"/vocabularies/{vocabulary_id}")
        return result if isinstance(result, dict) else {"data": result}

    # Search operations

    async def search_datasets_advanced(
        self,
        query: str | None = None,
        facets: dict[str, list[str]] | None = None,
        min_date: str | None = None,
        max_date: str | None = None,
        sort: str = "relevance+desc",
        limit: int = 20,
        page: int = 0,
    ) -> dict[str, Any]:
        """Search datasets with full filter and sort support.

        Uses Piveau Hub native /search endpoint with Elasticsearch-backed
        faceted search, fuzzy matching, and relevance scoring.

        Args:
            query: Full-text search query. Supports Solr syntax:
                   - Fuzzy: "health~" matches health, heath, healh
                   - Wildcard: "europ*" matches europe, european
                   - Phrase: "open data" (exact phrase)
                   - Boolean: "health AND (data OR dataset)"
            facets: Filter dict for faceted search. OR within same facet,
                    AND between different facets.
                    Example: {"format": ["CSV", "JSON"], "theme": ["AGRI"]}
                    means (CSV OR JSON) AND AGRI theme.
            min_date: Start date for date range filter (ISO 8601 with timezone).
                      Example: "2025-01-01T00:00:00Z"
            max_date: End date for date range filter (ISO 8601 with timezone).
            sort: Sort order. One of:
                  - "relevance+desc" (default, requires query)
                  - "modified+desc" (most recently updated)
                  - "modified+asc" (oldest first)
                  - "issued+desc" (most recently published)
                  - "issued+asc" (oldest published)
                  - "title+asc" (alphabetical)
                  - "title+desc" (reverse alphabetical)
            limit: Results per page (1-100 recommended, max 1000).
            page: Page number (0-indexed). Max result window ~10K.

        Returns:
            Dict with keys:
            - "results": List of dataset dicts
            - "count": Total matching datasets (approximate for large sets)
            - "facets": Dict of facet values with counts, e.g.
                        {"format": {"CSV": 20, "JSON": 15}, "theme": {...}}

        Raises:
            ToolError: If API request fails (connection, 5xx errors)
        """
        params: dict[str, Any] = {
            "limit": limit,
            "page": page,
            "sort": sort,
        }

        if query:
            params["q"] = query

        if facets:
            # Piveau expects facets as JSON string
            params["facets"] = json.dumps(facets)

        if min_date:
            params["minDate"] = min_date
        if max_date:
            params["maxDate"] = max_date

        response = await self._request("GET", "/search", params=params)
        # The search API returns {"result": {"count": N, "results": [...]}}
        if isinstance(response, dict) and "result" in response:
            result = response["result"]
            return {
                "results": result.get("results", []),
                "count": result.get("count", 0),
                "facets": result.get("facets", {}),
            }
        return {"results": [], "count": 0, "facets": {}}
