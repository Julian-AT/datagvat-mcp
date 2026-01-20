"""Dataset management tools for drafts and publishing."""

from typing import Annotated, Any

from fastmcp import Context, FastMCP
from fastmcp.exceptions import ToolError
from pydantic import Field, StringConstraints

from app.dependencies import get_piveau_client


def register_management_tools(mcp: FastMCP) -> None:
    """Register dataset management tools for drafts and publishing.

    Args:
        mcp: The FastMCP server instance to register tools with.
    """
    @mcp.tool(
        name="list_dataset_drafts",
        description="List dataset drafts you have access to.",
        annotations={"readOnlyHint": True},
    )
    async def list_dataset_drafts(
        ctx: Context,
        filter_by_provider: Annotated[bool, Field(description="Whether to filter drafts by the current provider. Default: False")] = False,
    ) -> list[str]:
        client = get_piveau_client(ctx)
        try:
            if ctx:
                await ctx.report_progress(0, 1, "Fetching dataset drafts...")
            result = await client.list_drafts(filter_by_provider=filter_by_provider)
            if ctx:
                await ctx.report_progress(1, 1, f"Retrieved {len(result)} drafts")
            return result
        except Exception as e:
            raise ToolError(f"Failed to list dataset drafts: {e}") from e

    @mcp.tool(
        name="get_dataset_draft",
        description="Get the metadata of a specific dataset draft.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset_draft(
        ctx: Context,
        draft_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the draft to retrieve")],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the catalogue containing the draft")],
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
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the catalogue to create the draft in")],
        title: Annotated[str, StringConstraints(min_length=1, max_length=500), Field(description="Title of the dataset (1-500 characters)")],
        description: Annotated[str, StringConstraints(min_length=1, max_length=5000), Field(description="Description of the dataset (1-5000 characters)")],
        language: Annotated[str, StringConstraints(min_length=2, max_length=3), Field(description="Language code (ISO 639-1): 'de' for German, 'en' for English")] = "de",
        keywords: Annotated[list[str] | None, Field(description="List of keyword tags for categorizing the dataset")] = None,
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
        draft_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the draft to update")],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the catalogue containing the draft")],
        title: Annotated[str | None, StringConstraints(min_length=1, max_length=500), Field(description="New title for the dataset (1-500 characters). Optional")] = None,
        description: Annotated[str | None, StringConstraints(min_length=1, max_length=5000), Field(description="New description for the dataset (1-5000 characters). Optional")] = None,
        language: Annotated[str, StringConstraints(min_length=2, max_length=3), Field(description="Language code (ISO 639-1): 'de' for German, 'en' for English")] = "de",
        keywords: Annotated[list[str] | None, Field(description="New list of keyword tags. Optional")] = None,
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
        draft_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the draft to delete")],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the catalogue containing the draft")],
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
        draft_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the draft to publish")],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the catalogue containing the draft")],
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
        dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the published dataset to withdraw")],
        catalogue_id: Annotated[str, StringConstraints(min_length=1, max_length=200), Field(description="Unique identifier of the catalogue containing the dataset")],
    ) -> dict[str, str]:
        client = get_piveau_client(ctx)
        try:
            await client.hide_dataset(dataset_id, catalogue_id)
            return {"dataset_id": dataset_id, "status": "hidden"}
        except Exception as e:
            raise ToolError(f"Failed to hide dataset '{dataset_id}': {e}") from e
