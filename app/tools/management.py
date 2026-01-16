"""Dataset management tools for drafts and publishing."""

from typing import Annotated, Any

from fastmcp import FastMCP, Context
from fastmcp.exceptions import ToolError
from pydantic import Field, StringConstraints

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
        try:
            return await client.list_drafts(filter_by_provider=filter_by_provider)
        except Exception as e:
            raise ToolError(f"Failed to list dataset drafts: {e}") from e

    @mcp.tool(
        name="get_dataset_draft",
        description="Get the metadata of a specific dataset draft.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset_draft(
        ctx: Context,
        draft_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        try:
            return await client.get_draft(draft_id, catalogue_id)
        except Exception as e:
            raise ToolError(f"Failed to get draft '{draft_id}' from catalogue '{catalogue_id}': {e}") from e

    @mcp.tool(
        name="create_dataset_draft",
        description="Create a new dataset draft. Requires API key.",
        annotations={"readOnlyHint": False, "destructiveHint": False},
    )
    async def create_dataset_draft(
        ctx: Context,
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        title: Annotated[str, StringConstraints(min_length=1, max_length=500)],
        description: Annotated[str, StringConstraints(min_length=1, max_length=5000)],
        language: Annotated[str, StringConstraints(min_length=2, max_length=3)] = "de",
        keywords: list[str] | None = None,
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        try:
            payload = {
                "@type": "dcat:Dataset",
                "dct:title": {language: title},
                "dct:description": {language: description},
            }
            if keywords:
                payload["dcat:keyword"] = keywords

            draft_id = await client.create_draft(catalogue_id, payload)
            return {"draft_id": draft_id, "catalogue_id": catalogue_id}
        except Exception as e:
            raise ToolError(f"Failed to create draft in catalogue '{catalogue_id}': {e}") from e

    @mcp.tool(
        name="update_dataset_draft",
        description="Update an existing dataset draft. Requires API key.",
        annotations={"readOnlyHint": False, "idempotentHint": True},
    )
    async def update_dataset_draft(
        ctx: Context,
        draft_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        title: Annotated[str | None, StringConstraints(min_length=1, max_length=500)] = None,
        description: Annotated[str | None, StringConstraints(min_length=1, max_length=5000)] = None,
        language: Annotated[str, StringConstraints(min_length=2, max_length=3)] = "de",
        keywords: list[str] | None = None,
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        try:
            payload: dict[str, Any] = {"@type": "dcat:Dataset"}
            if title:
                payload["dct:title"] = {language: title}
            if description:
                payload["dct:description"] = {language: description}
            if keywords is not None:
                payload["dcat:keyword"] = keywords

            await client.update_draft(draft_id, catalogue_id, payload)
            return {"draft_id": draft_id, "status": "updated"}
        except Exception as e:
            raise ToolError(f"Failed to update draft '{draft_id}': {e}") from e

    @mcp.tool(
        name="delete_dataset_draft",
        description="Delete a dataset draft permanently. Requires API key.",
        annotations={"readOnlyHint": False, "destructiveHint": True},
    )
    async def delete_dataset_draft(
        ctx: Context,
        draft_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        try:
            await client.delete_draft(draft_id, catalogue_id)
            return {"draft_id": draft_id, "status": "deleted"}
        except Exception as e:
            raise ToolError(f"Failed to delete draft '{draft_id}': {e}") from e

    @mcp.tool(
        name="publish_dataset",
        description="Publish a dataset draft to make it live. Requires API key.",
        annotations={"readOnlyHint": False, "idempotentHint": True},
    )
    async def publish_dataset(
        ctx: Context,
        draft_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        try:
            await client.publish_draft(draft_id, catalogue_id)
            return {"draft_id": draft_id, "status": "published"}
        except Exception as e:
            raise ToolError(f"Failed to publish draft '{draft_id}': {e}") from e

    @mcp.tool(
        name="hide_dataset",
        description="Withdraw a published dataset back to draft. Requires API key.",
        annotations={"readOnlyHint": False, "destructiveHint": True},
    )
    async def hide_dataset(
        ctx: Context,
        dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        try:
            await client.hide_dataset(dataset_id, catalogue_id)
            return {"dataset_id": dataset_id, "status": "hidden"}
        except Exception as e:
            raise ToolError(f"Failed to hide dataset '{dataset_id}': {e}") from e
