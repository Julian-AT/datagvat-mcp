"""HTTP client for the Piveau Hub API."""

import json
import logging
from typing import Any

import httpx
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

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
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
        except httpx.HTTPStatusError as e:
            self._handle_http_error(e)
        except httpx.RequestError as e:
            raise PiveauApiError(f"Request failed: {e}") from e

    def _handle_http_error(self, error: httpx.HTTPStatusError) -> None:
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
            return response.json()

        if content_type in self.RDF_CONTENT_TYPES:
            return self._parse_rdf(response.text, content_type)

        try:
            return response.json()
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
            return json.loads(graph.serialize(format="json-ld"))
        except Exception as e:
            logger.warning(f"RDF parse failed: {e}")
            return {"_raw": content}

    def _extract_list(self, result: Any) -> list[dict[str, Any]]:
        if isinstance(result, list):
            return result
        if isinstance(result, dict) and "@graph" in result:
            return result["@graph"]
        return []

    # Catalogue operations

    async def list_catalogues(
        self,
        limit: int = 100,
        offset: int = 0,
        value_type: ValueType | str = ValueType.METADATA,
    ) -> list[dict[str, Any]]:
        vt = value_type.value if isinstance(value_type, ValueType) else value_type
        result = await self._request("GET", "/catalogues", params={"limit": limit, "offset": offset, "valueType": vt})
        return self._extract_list(result)

    async def get_catalogue(self, catalogue_id: str) -> dict[str, Any]:
        result = await self._request("GET", f"/catalogues/{catalogue_id}")
        return result if isinstance(result, dict) else {"data": result}

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
        result = await self._request("GET", f"/datasets/{dataset_id}")
        return result if isinstance(result, dict) else {"data": result}

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
            return location.split("/")[-1]
        try:
            data = response.json()
            return data.get("id", data.get("@id", ""))
        except Exception:
            return ""

    async def get_draft(self, draft_id: str, catalogue_id: str) -> dict[str, Any]:
        return await self._request("GET", f"/drafts/datasets/{draft_id}", params={"catalogue": catalogue_id}, require_auth=True)

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
