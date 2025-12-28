"""Discovery tools for catalogues and datasets."""

from typing import Annotated, Any

from fastmcp import FastMCP, Context
from pydantic import Field

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
        await ctx.report_progress(0, 1, "Fetching catalogues...")
        vt = ValueType(value_type) if value_type in [e.value for e in ValueType] else ValueType.METADATA
        result = await client.list_catalogues(limit=limit, offset=offset, value_type=vt)
        await ctx.report_progress(1, 1, f"Retrieved {len(result)} catalogues")
        return result

    @mcp.tool(
        name="get_catalogue",
        description="Get detailed information about a specific catalogue.",
        annotations={"readOnlyHint": True},
    )
    async def get_catalogue(
        ctx: Context,
        catalogue_id: Annotated[str, "The catalogue identifier"],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        return await client.get_catalogue(catalogue_id)

    @mcp.tool(
        name="search_datasets",
        description="Search for datasets across all catalogues or within a specific catalogue.",
        annotations={"readOnlyHint": True},
    )
    async def search_datasets(
        ctx: Context,
        catalogue_id: Annotated[str | None, "Filter by catalogue ID"] = None,
        limit: Annotated[int, Field(ge=1, le=100)] = 20,
        offset: Annotated[int, Field(ge=0)] = 0,
    ) -> list[dict[str, Any]]:
        client = get_piveau_client(ctx)
        if catalogue_id:
            return await client.list_catalogue_datasets(catalogue_id, limit, offset)
        return await client.list_datasets(limit, offset)

    @mcp.tool(
        name="get_dataset",
        description="Get detailed metadata for a specific dataset.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset(
        ctx: Context,
        dataset_id: Annotated[str, "The dataset identifier"],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        return await client.get_dataset(dataset_id)

    @mcp.tool(
        name="get_dataset_distributions",
        description="Get all distributions (downloadable files) for a dataset.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset_distributions(
        ctx: Context,
        dataset_id: Annotated[str, "The dataset identifier"],
        limit: Annotated[int, Field(ge=1, le=100)] = 50,
    ) -> list[dict[str, Any]]:
        client = get_piveau_client(ctx)
        return await client.get_distributions(dataset_id, limit=limit)

    @mcp.tool(
        name="get_catalogue_record",
        description="Get the catalogue record (provenance) for a dataset.",
        annotations={"readOnlyHint": True},
    )
    async def get_catalogue_record(
        ctx: Context,
        dataset_id: Annotated[str, "The dataset identifier"],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        result = await client._request("GET", f"/datasets/{dataset_id}/record")
        return result if isinstance(result, dict) else {"data": result}
