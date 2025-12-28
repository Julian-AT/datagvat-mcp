"""MCP Resources for data access."""

from typing import Any

from fastmcp import FastMCP, Context

from app.dependencies import get_piveau_client


def register_resources(mcp: FastMCP) -> None:
    @mcp.resource("piveau://catalogues")
    async def catalogues_resource(ctx: Context) -> list[dict[str, Any]]:
        """All available data catalogues."""
        client = get_piveau_client(ctx)
        return await client.list_catalogues(limit=1000)

    @mcp.resource("piveau://catalogues/{catalogue_id}")
    async def catalogue_resource(ctx: Context, catalogue_id: str) -> dict[str, Any]:
        """Specific catalogue metadata."""
        client = get_piveau_client(ctx)
        return await client.get_catalogue(catalogue_id)

    @mcp.resource("piveau://catalogues/{catalogue_id}/datasets")
    async def catalogue_datasets_resource(ctx: Context, catalogue_id: str) -> list[dict[str, Any]]:
        """Datasets within a catalogue."""
        client = get_piveau_client(ctx)
        return await client.list_catalogue_datasets(catalogue_id, limit=100)

    @mcp.resource("piveau://datasets/{dataset_id}")
    async def dataset_resource(ctx: Context, dataset_id: str) -> dict[str, Any]:
        """Specific dataset metadata."""
        client = get_piveau_client(ctx)
        return await client.get_dataset(dataset_id)

    @mcp.resource("piveau://datasets/{dataset_id}/distributions")
    async def distributions_resource(ctx: Context, dataset_id: str) -> list[dict[str, Any]]:
        """Dataset distributions (files)."""
        client = get_piveau_client(ctx)
        return await client.get_distributions(dataset_id, limit=100)

    @mcp.resource("piveau://datasets/{dataset_id}/metrics")
    async def metrics_resource(ctx: Context, dataset_id: str) -> dict[str, Any]:
        """Dataset quality metrics."""
        client = get_piveau_client(ctx)
        return await client.get_metrics(dataset_id)

    @mcp.resource("piveau://vocabularies")
    async def vocabularies_resource(ctx: Context) -> list[dict[str, Any]]:
        """All available vocabularies."""
        client = get_piveau_client(ctx)
        return await client.list_vocabularies(limit=1000)

    @mcp.resource("piveau://vocabularies/{vocabulary_id}")
    async def vocabulary_resource(ctx: Context, vocabulary_id: str) -> dict[str, Any]:
        """Specific vocabulary contents."""
        client = get_piveau_client(ctx)
        return await client.get_vocabulary(vocabulary_id)
