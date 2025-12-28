"""Dataset management tools for drafts and publishing."""

from typing import Annotated, Any

from fastmcp import FastMCP, Context

from app.dependencies import get_piveau_client


def register_management_tools(mcp: FastMCP) -> None:
    @mcp.tool(
        name="list_dataset_drafts",
        description="List dataset drafts you have access to.",
        annotations={"readOnlyHint": True},
    )
    async def list_dataset_drafts(
        ctx: Context,
        filter_by_provider: bool = False,
    ) -> list[str]:
        client = get_piveau_client(ctx)
        return await client.list_drafts(filter_by_provider=filter_by_provider)

    @mcp.tool(
        name="get_dataset_draft",
        description="Get the metadata of a specific dataset draft.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset_draft(
        ctx: Context,
        draft_id: Annotated[str, "The draft identifier"],
        catalogue_id: Annotated[str, "The catalogue ID"],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        return await client.get_draft(draft_id, catalogue_id)

    @mcp.tool(
        name="create_dataset_draft",
        description="Create a new dataset draft. Requires API key.",
        annotations={"readOnlyHint": False, "destructiveHint": False},
    )
    async def create_dataset_draft(
        ctx: Context,
        catalogue_id: Annotated[str, "Target catalogue ID"],
        title: Annotated[str, "Dataset title"],
        description: Annotated[str, "Dataset description"],
        language: str = "de",
        keywords: list[str] | None = None,
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        payload = {
            "@type": "dcat:Dataset",
            "dct:title": {language: title},
            "dct:description": {language: description},
        }
        if keywords:
            payload["dcat:keyword"] = keywords

        draft_id = await client.create_draft(catalogue_id, payload)
        return {"draft_id": draft_id, "catalogue_id": catalogue_id}

    @mcp.tool(
        name="update_dataset_draft",
        description="Update an existing dataset draft. Requires API key.",
        annotations={"readOnlyHint": False, "idempotentHint": True},
    )
    async def update_dataset_draft(
        ctx: Context,
        draft_id: Annotated[str, "The draft identifier"],
        catalogue_id: Annotated[str, "The catalogue ID"],
        title: str | None = None,
        description: str | None = None,
        language: str = "de",
        keywords: list[str] | None = None,
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        payload: dict[str, Any] = {"@type": "dcat:Dataset"}
        if title:
            payload["dct:title"] = {language: title}
        if description:
            payload["dct:description"] = {language: description}
        if keywords is not None:
            payload["dcat:keyword"] = keywords

        await client.update_draft(draft_id, catalogue_id, payload)
        return {"draft_id": draft_id, "status": "updated"}

    @mcp.tool(
        name="delete_dataset_draft",
        description="Delete a dataset draft permanently. Requires API key.",
        annotations={"readOnlyHint": False, "destructiveHint": True},
    )
    async def delete_dataset_draft(
        ctx: Context,
        draft_id: Annotated[str, "The draft identifier"],
        catalogue_id: Annotated[str, "The catalogue ID"],
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        await client.delete_draft(draft_id, catalogue_id)
        return {"draft_id": draft_id, "status": "deleted"}

    @mcp.tool(
        name="publish_dataset",
        description="Publish a dataset draft to make it live. Requires API key.",
        annotations={"readOnlyHint": False, "idempotentHint": True},
    )
    async def publish_dataset(
        ctx: Context,
        draft_id: Annotated[str, "The draft identifier"],
        catalogue_id: Annotated[str, "The catalogue ID"],
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        await client.publish_draft(draft_id, catalogue_id)
        return {"draft_id": draft_id, "status": "published"}

    @mcp.tool(
        name="hide_dataset",
        description="Withdraw a published dataset back to draft. Requires API key.",
        annotations={"readOnlyHint": False, "destructiveHint": True},
    )
    async def hide_dataset(
        ctx: Context,
        dataset_id: Annotated[str, "The dataset identifier"],
        catalogue_id: Annotated[str, "The catalogue ID"],
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        await client.hide_dataset(dataset_id, catalogue_id)
        return {"dataset_id": dataset_id, "status": "hidden"}
