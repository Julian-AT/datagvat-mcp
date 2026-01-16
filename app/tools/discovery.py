"""Discovery tools for catalogues and datasets."""

from typing import Annotated, Any

from fastmcp import FastMCP, Context
from fastmcp.exceptions import ToolError
from pydantic import Field, StringConstraints

from app.dependencies import get_piveau_client
from app.models import ValueType


def register_discovery_tools(mcp: FastMCP) -> None:
    @mcp.tool(
        name="list_catalogues",
        description="List available data catalogues in the Austrian Open Data Portal.",
        annotations={"readOnlyHint": True},
    )
    async def list_catalogues(
        ctx: Context,
        limit: Annotated[int, Field(ge=1, le=5000)] = 100,
        offset: Annotated[int, Field(ge=0)] = 0,
        value_type: str = "metadata",
    ) -> list[dict[str, Any]]:
        client = get_piveau_client(ctx)
        try:
            if ctx:
                await ctx.report_progress(0, 1, "Fetching catalogues...")
            vt = ValueType(value_type) if value_type in [e.value for e in ValueType] else ValueType.METADATA
            result = await client.list_catalogues(limit=limit, offset=offset, value_type=vt)
            if ctx:
                await ctx.report_progress(1, 1, f"Retrieved {len(result)} catalogues")
            return result
        except Exception as e:
            raise ToolError(f"Failed to list catalogues: {e}") from e

    @mcp.tool(
        name="get_catalogue",
        description="Get detailed information about a specific catalogue.",
        annotations={"readOnlyHint": True},
    )
    async def get_catalogue(
        ctx: Context,
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        try:
            return await client.get_catalogue(catalogue_id)
        except Exception as e:
            raise ToolError(f"Failed to get catalogue '{catalogue_id}': {e}") from e

    # Advanced Search Patterns:
    #
    # Fuzzy matching for typo tolerance:
    #   query="health~" matches health, heath, healh (1 edit distance)
    #   query="environment~2" allows 2 edit distance
    #
    # Wildcards:
    #   query="europ*" matches europe, european, europa
    #   query="*data" matches metadata, opendata
    #
    # Phrases:
    #   query='"open data"' searches exact phrase
    #
    # Boolean operators:
    #   query="health AND (data OR dataset)" - explicit logic
    #   query="health data" - implicit AND
    #   query="health -covid" - exclude covid results
    #
    # Filter logic:
    #   themes=["AGRI", "ENVI"] → Agriculture OR Environment (OR within facet)
    #   themes=["AGRI"], formats=["CSV"] → Agriculture AND CSV (AND between facets)
    #
    # Sorting:
    #   sort_by="relevance" - Best match first (requires query)
    #   sort_by="modified_desc" - Most recently updated
    #   sort_by="title_asc" - Alphabetical order
    #
    # Pagination:
    #   limit=20, page=0 → First 20 results
    #   limit=20, page=1 → Results 21-40
    #   Result window max ~10,000 (use page 0-499 with limit=20)
    #
    # Date filtering:
    #   min_date="2025-01-01" → Datasets modified/issued after Jan 1, 2025
    #   max_date="2025-12-31" → Before Dec 31, 2025
    #   Date range uses modified OR issued date (whichever is present)
    @mcp.tool(
        name="search_datasets",
        description=(
            "Search for datasets with text queries and faceted filtering. "
            "Supports full-text search with fuzzy matching, theme/format/publisher filters, "
            "date range filtering, and multiple sort options. Returns paginated results with total count."
        ),
        annotations={"readOnlyHint": True},
    )
    async def search_datasets(
        ctx: Context,
        query: Annotated[
            str | None,
            Field(
                default=None,
                description=(
                    "Search query for titles, descriptions, keywords. "
                    "Supports fuzzy search (add ~ for typo tolerance, e.g. 'health~'), "
                    "wildcards (e.g. 'europ*'), phrases (e.g. '\"open data\"'), "
                    "and boolean operators (AND, OR, NOT). Leave empty to list all datasets."
                ),
            ),
        ] = None,
        themes: Annotated[
            list[str] | None,
            Field(
                default=None,
                description=(
                    "Filter by EU data theme codes. Valid codes: AGRI (Agriculture), "
                    "ECON (Economy), EDUC (Education), ENER (Energy), ENVI (Environment), "
                    "GOVE (Government), HEAL (Health), INTR (International), JUST (Justice), "
                    "REGI (Regions), SOCI (Society), TECH (Technology), TRAN (Transport). "
                    "Multiple values use OR logic."
                ),
            ),
        ] = None,
        formats: Annotated[
            list[str] | None,
            Field(
                default=None,
                description=(
                    "Filter by file format (e.g. CSV, JSON, XML, PDF, GeoJSON). "
                    "Multiple values use OR logic. Case-insensitive."
                ),
            ),
        ] = None,
        publishers: Annotated[
            list[str] | None,
            Field(
                default=None,
                description=(
                    "Filter by publisher/organization ID. "
                    "Multiple values use OR logic."
                ),
            ),
        ] = None,
        min_date: Annotated[
            str | None,
            Field(
                default=None,
                pattern=r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}Z)?$",
                description=(
                    "Filter datasets modified/issued after this date. "
                    "Format: YYYY-MM-DD or ISO 8601 (2025-01-01T00:00:00Z)."
                ),
            ),
        ] = None,
        max_date: Annotated[
            str | None,
            Field(
                default=None,
                pattern=r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}Z)?$",
                description=(
                    "Filter datasets modified/issued before this date. "
                    "Format: YYYY-MM-DD or ISO 8601 (2025-01-01T23:59:59Z)."
                ),
            ),
        ] = None,
        sort_by: Annotated[
            str,
            Field(
                default="relevance",
                description=(
                    "Sort order. Options: relevance (default with query), "
                    "modified_desc (most recent), modified_asc (oldest), "
                    "title_asc (alphabetical), title_desc (reverse alphabetical), "
                    "issued_desc (most recently published), issued_asc (oldest published)."
                ),
            ),
        ] = "relevance",
        limit: Annotated[int, Field(ge=1, le=100, default=20)] = 20,
        page: Annotated[int, Field(ge=0, default=0)] = 0,
        catalogue_id: Annotated[
            str | None,
            StringConstraints(min_length=1, max_length=200),
        ] = None,
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        try:
            # Backward compatibility: if ONLY catalogue_id provided (no query/filters), use legacy behavior
            has_filters = query or themes or formats or publishers or min_date or max_date
            if catalogue_id and not has_filters:
                # Legacy simple list behavior
                scope = f" in catalogue '{catalogue_id}'"
                if ctx:
                    await ctx.report_progress(0, 1, f"Listing datasets{scope}...")
                result = await client.list_catalogue_datasets(catalogue_id, limit, page)
                if ctx:
                    await ctx.report_progress(1, 1, f"Retrieved {len(result)} datasets")
                return {"results": result, "count": len(result), "facets": {}}

            # Enhanced search with filters
            # Build facets dict
            facets = {}
            if themes:
                # Validate and uppercase theme codes
                valid_themes = ["AGRI", "ECON", "EDUC", "ENER", "ENVI", "GOVE",
                                "HEAL", "INTR", "JUST", "REGI", "SOCI", "TECH", "TRAN"]
                themes_upper = [t.upper() for t in themes]
                invalid = [t for t in themes_upper if t not in valid_themes]
                if invalid:
                    raise ToolError(
                        f"Invalid theme codes: {invalid}. "
                        f"Valid codes: {', '.join(valid_themes)}"
                    )
                facets["theme"] = themes_upper

            if formats:
                # Uppercase for consistency (API is case-insensitive but uppercase is standard)
                facets["format"] = [f.upper() for f in formats]

            if publishers:
                facets["catalog"] = publishers  # Piveau uses "catalog" for publisher facet

            # Map sort_by to API format
            sort_map = {
                "relevance": "relevance+desc",
                "modified_desc": "modified+desc",
                "modified_asc": "modified+asc",
                "issued_desc": "issued+desc",
                "issued_asc": "issued+asc",
                "title_asc": "title+asc",
                "title_desc": "title+desc",
            }
            sort = sort_map.get(sort_by, "relevance+desc")

            # Normalize dates to ISO 8601
            if min_date and "T" not in min_date:
                min_date = f"{min_date}T00:00:00Z"
            if max_date and "T" not in max_date:
                max_date = f"{max_date}T23:59:59Z"

            # Progress reporting
            if ctx:
                filter_parts = []
                if query:
                    filter_parts.append(f"query='{query}'")
                if themes:
                    filter_parts.append(f"{len(themes)} themes")
                if formats:
                    filter_parts.append(f"{len(formats)} formats")
                if publishers:
                    filter_parts.append(f"{len(publishers)} publishers")
                if min_date or max_date:
                    filter_parts.append("date range")

                desc = f"Searching with {', '.join(filter_parts)}" if filter_parts else "Listing datasets"
                await ctx.report_progress(0, 1, desc)

            # Call advanced search
            result = await client.search_datasets_advanced(
                query=query,
                facets=facets if facets else None,
                min_date=min_date,
                max_date=max_date,
                sort=sort,
                limit=limit,
                page=page,
            )

            if ctx:
                count = result.get("count", 0)
                results_len = len(result.get("results", []))
                await ctx.report_progress(1, 1, f"Found {count} datasets, showing {results_len}")

            return result
        except ToolError:
            raise
        except Exception as e:
            raise ToolError(f"Failed to search datasets: {e}") from e

    @mcp.tool(
        name="get_dataset",
        description="Get detailed metadata for a specific dataset.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset(
        ctx: Context,
        dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        try:
            return await client.get_dataset(dataset_id)
        except Exception as e:
            raise ToolError(f"Failed to get dataset '{dataset_id}': {e}") from e

    @mcp.tool(
        name="get_dataset_distributions",
        description="Get all distributions (downloadable files) for a dataset.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset_distributions(
        ctx: Context,
        dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        limit: Annotated[int, Field(ge=1, le=100)] = 50,
    ) -> list[dict[str, Any]]:
        client = get_piveau_client(ctx)
        try:
            return await client.get_distributions(dataset_id, limit=limit)
        except Exception as e:
            raise ToolError(f"Failed to get distributions for dataset '{dataset_id}': {e}") from e

    @mcp.tool(
        name="get_catalogue_record",
        description="Get the catalogue record (provenance) for a dataset.",
        annotations={"readOnlyHint": True},
    )
    async def get_catalogue_record(
        ctx: Context,
        dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        try:
            result = await client._request("GET", f"/datasets/{dataset_id}/record")
            return result if isinstance(result, dict) else {"data": result}
        except Exception as e:
            raise ToolError(f"Failed to get catalogue record for dataset '{dataset_id}': {e}") from e
