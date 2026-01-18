"""Vocabulary tools for controlled vocabularies."""

from typing import Annotated, Any

from fastmcp import Context, FastMCP
from fastmcp.exceptions import ToolError
from pydantic import Field, StringConstraints

from app.dependencies import get_piveau_client


def register_vocabulary_tools(mcp: FastMCP) -> None:
    """Register vocabulary tools for controlled vocabularies and autocomplete.

    Args:
        mcp: The FastMCP server instance to register tools with.
    """
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
            if ctx:
                await ctx.report_progress(0, 1, "Fetching vocabularies...")
            result = await client.list_vocabularies(limit=limit, offset=offset)
            if ctx:
                await ctx.report_progress(1, 1, f"Retrieved {len(result)} vocabularies")
            return result
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
        name="get_autocomplete_suggestions",
        description=(
            "Get autocomplete suggestions for search queries. "
            "Returns vocabulary terms and common patterns matching the query prefix. "
            "Useful for search-as-you-type functionality."
        ),
        annotations={"readOnlyHint": True},
    )
    async def get_autocomplete_suggestions(
        ctx: Context,
        query: Annotated[
            str,
            StringConstraints(min_length=1, max_length=100),
            Field(description="Query prefix to get suggestions for (minimum 1 character)"),
        ],
        limit: Annotated[int, Field(ge=1, le=20, default=10)] = 10,
        language: Annotated[str, StringConstraints(min_length=2, max_length=3)] = "de",
    ) -> dict[str, Any]:
        """Get autocomplete suggestions for search queries.

        Provides suggestions from multiple sources:
        1. EU data theme vocabulary (13 themes)
        2. File format vocabulary (common formats)
        3. Common search patterns

        Args:
            query: Query prefix (e.g., "agri" matches "agriculture")
            limit: Maximum suggestions to return (1-20)
            language: Language code (de, en) for labels

        Returns:
            Dict with:
            - suggestions: List of suggestion dicts with {text, category, score}
            - count: Total suggestions found
        """
        query_lower = query.lower()
        suggestions: list[dict[str, Any]] = []

        # Source 1: EU Data Theme vocabulary (always available, no API call)
        theme_labels = {
            "AGRI": {"de": "Landwirtschaft, Fischerei, Forstwirtschaft und Nahrungsmittel", "en": "Agriculture, fisheries, forestry and food"},
            "ECON": {"de": "Wirtschaft und Finanzen", "en": "Economy and finance"},
            "EDUC": {"de": "Bildung, Kultur und Sport", "en": "Education, culture and sport"},
            "ENER": {"de": "Energie", "en": "Energy"},
            "ENVI": {"de": "Umwelt", "en": "Environment"},
            "GOVE": {"de": "Regierung und öffentlicher Sektor", "en": "Government and public sector"},
            "HEAL": {"de": "Gesundheit", "en": "Health"},
            "INTR": {"de": "Internationale Themen", "en": "International issues"},
            "JUST": {"de": "Justiz, Rechtssystem und öffentliche Sicherheit", "en": "Justice, legal system and public safety"},
            "REGI": {"de": "Regionen und Städte", "en": "Regions and cities"},
            "SOCI": {"de": "Bevölkerung und Gesellschaft", "en": "Population and society"},
            "TECH": {"de": "Wissenschaft und Technologie", "en": "Science and technology"},
            "TRAN": {"de": "Verkehr", "en": "Transport"},
        }

        for code, labels in theme_labels.items():
            label = labels.get(language) or labels.get("en")
            if label and query_lower in label.lower():
                suggestions.append({
                    "text": label,
                    "category": "theme",
                    "code": code,
                    "score": 100 if label.lower().startswith(query_lower) else 50
                })

        # Source 2: Common file formats (no API call)
        formats = ["CSV", "JSON", "XML", "PDF", "GeoJSON", "RDF", "XLSX", "ZIP", "HTML", "TXT"]
        for fmt in formats:
            if query_lower in fmt.lower():
                suggestions.append({
                    "text": fmt,
                    "category": "format",
                    "score": 100 if fmt.lower().startswith(query_lower) else 50
                })

        # Source 3: Common search terms (no API call)
        common_terms = [
            "open data", "statistics", "geodata", "verkehr", "umwelt",
            "gesundheit", "bildung", "wirtschaft", "bevölkerung",
            "transport", "environment", "health", "education", "economy", "population"
        ]
        for term in common_terms:
            if query_lower in term.lower():
                suggestions.append({
                    "text": term,
                    "category": "common",
                    "score": 100 if term.lower().startswith(query_lower) else 50
                })

        # Sort by score (prefix matches first) then alphabetically
        suggestions.sort(key=lambda x: (-x["score"], x["text"].lower()))

        # Limit results
        suggestions = suggestions[:limit]

        if ctx:
            await ctx.report_progress(1, 1, f"Found {len(suggestions)} suggestions for '{query}'")

        return {
            "suggestions": suggestions,
            "count": len(suggestions),
            "query": query
        }

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
                typed_result: list[dict[str, Any]] = [item if isinstance(item, dict) else {} for item in result]
                return typed_result
            if isinstance(result, dict) and "@graph" in result:
                graph = result["@graph"]
                if isinstance(graph, list):
                    typed_graph: list[dict[str, Any]] = [item if isinstance(item, dict) else {} for item in graph]
                    return typed_graph
            return [result] if isinstance(result, dict) else []
        except Exception as e:
            raise ToolError(f"Failed to get resource types: {e}") from e
