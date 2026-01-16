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

    @mcp.tool(
        name="search_datasets",
        description="Search for datasets across all catalogues or within a specific catalogue.",
        annotations={"readOnlyHint": True},
    )
    async def search_datasets(
        ctx: Context,
        catalogue_id: Annotated[str | None, StringConstraints(min_length=1, max_length=200)] = None,
        limit: Annotated[int, Field(ge=1, le=100)] = 20,
        offset: Annotated[int, Field(ge=0)] = 0,
    ) -> list[dict[str, Any]]:
        client = get_piveau_client(ctx)
        try:
            scope = f" in catalogue '{catalogue_id}'" if catalogue_id else ""
            if ctx:
                await ctx.report_progress(0, 1, f"Searching datasets{scope}...")

            if catalogue_id:
                result = await client.list_catalogue_datasets(catalogue_id, limit, offset)
            else:
                result = await client.list_datasets(limit, offset)

            if ctx:
                await ctx.report_progress(1, 1, f"Retrieved {len(result)} datasets")
            return result
        except Exception as e:
            scope = f" in catalogue '{catalogue_id}'" if catalogue_id else ""
            raise ToolError(f"Failed to search datasets{scope}: {e}") from e

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
