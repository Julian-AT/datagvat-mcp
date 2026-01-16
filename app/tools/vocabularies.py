"""Vocabulary tools for controlled vocabularies."""

from typing import Annotated, Any

from fastmcp import FastMCP, Context
from fastmcp.exceptions import ToolError
from pydantic import Field, StringConstraints

from app.dependencies import get_piveau_client


def register_vocabulary_tools(mcp: FastMCP) -> None:
    @mcp.tool(
        name="list_vocabularies",
        description="List available controlled vocabularies.",
        annotations={"readOnlyHint": True},
    )
    async def list_vocabularies(
        ctx: Context,
        limit: Annotated[int, Field(ge=1, le=5000)] = 100,
        offset: Annotated[int, Field(ge=0)] = 0,
    ) -> list[dict[str, Any]]:
        client = get_piveau_client(ctx)
        try:
            return await client.list_vocabularies(limit=limit, offset=offset)
        except Exception as e:
            raise ToolError(f"Failed to list vocabularies: {e}") from e

    @mcp.tool(
        name="get_vocabulary",
        description="Get the contents of a specific vocabulary.",
        annotations={"readOnlyHint": True},
    )
    async def get_vocabulary(
        ctx: Context,
        vocabulary_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        try:
            return await client.get_vocabulary(vocabulary_id)
        except Exception as e:
            raise ToolError(f"Failed to get vocabulary '{vocabulary_id}': {e}") from e

    @mcp.tool(
        name="search_vocabulary_terms",
        description="Search for terms within a vocabulary.",
        annotations={"readOnlyHint": True},
    )
    async def search_vocabulary_terms(
        ctx: Context,
        vocabulary_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        query: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        language: Annotated[str, StringConstraints(min_length=2, max_length=3)] = "de",
    ) -> list[dict[str, Any]]:
        client = get_piveau_client(ctx)
        try:
            vocab_data = await client.get_vocabulary(vocabulary_id)

            terms = []
            if isinstance(vocab_data, dict):
                if "@graph" in vocab_data:
                    terms = vocab_data["@graph"]
                elif "hasTopConcept" in vocab_data:
                    terms = vocab_data.get("hasTopConcept", [])
            elif isinstance(vocab_data, list):
                terms = vocab_data

            query_lower = query.lower()
            matches = []

            for term in terms:
                if not isinstance(term, dict):
                    continue
                label = None
                for key in ["prefLabel", "skos:prefLabel", "label", "rdfs:label"]:
                    data = term.get(key)
                    if data:
                        if isinstance(data, dict):
                            label = data.get(language) or next(iter(data.values()), None)
                        elif isinstance(data, str):
                            label = data
                        break

                if label and query_lower in label.lower():
                    matches.append({
                        "uri": term.get("@id") or term.get("id"),
                        "label": label,
                    })

            return matches
        except Exception as e:
            raise ToolError(f"Failed to search vocabulary '{vocabulary_id}' for '{query}': {e}") from e

    @mcp.tool(
        name="get_resource_types",
        description="List available resource types.",
        annotations={"readOnlyHint": True},
    )
    async def get_resource_types(ctx: Context) -> list[dict[str, Any]]:
        client = get_piveau_client(ctx)
        try:
            result = await client._request("GET", "/resources")
            if isinstance(result, list):
                return result
            if isinstance(result, dict) and "@graph" in result:
                return result["@graph"]
            return [result] if result else []
        except Exception as e:
            raise ToolError(f"Failed to get resource types: {e}") from e
