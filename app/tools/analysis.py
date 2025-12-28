"""Analysis tools for quality metrics and eligibility."""

from typing import Annotated, Any

from fastmcp import FastMCP, Context

from app.dependencies import get_piveau_client
from app.models import IdentifierType


def register_analysis_tools(mcp: FastMCP) -> None:
    @mcp.tool(
        name="get_dataset_metrics",
        description="Get metadata quality metrics (DQV) for a dataset.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset_metrics(
        ctx: Context,
        dataset_id: Annotated[str, "The dataset identifier"],
        include_history: bool = False,
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        return await client.get_metrics(dataset_id, historic=include_history)

    @mcp.tool(
        name="check_doi_eligibility",
        description="Check if a dataset is eligible for a DOI identifier.",
        annotations={"readOnlyHint": True},
    )
    async def check_doi_eligibility(
        ctx: Context,
        dataset_id: Annotated[str, "The dataset identifier"],
        identifier_type: str = "eu-ra-doi",
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        valid_types = [t.value for t in IdentifierType]
        if identifier_type not in valid_types:
            identifier_type = IdentifierType.EU_RA_DOI.value
        return await client.check_eligibility(dataset_id, identifier_type)

    @mcp.tool(
        name="analyze_dataset_quality",
        description="Perform comprehensive quality analysis of a dataset.",
        annotations={"readOnlyHint": True},
    )
    async def analyze_dataset_quality(
        ctx: Context,
        dataset_id: Annotated[str, "The dataset identifier"],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        analysis: dict[str, Any] = {"dataset_id": dataset_id}

        try:
            dataset = await client.get_dataset(dataset_id)
            analysis["metadata"] = {
                "has_title": bool(dataset.get("dct:title") or dataset.get("title")),
                "has_description": bool(dataset.get("dct:description") or dataset.get("description")),
                "has_publisher": bool(dataset.get("dct:publisher") or dataset.get("publisher")),
            }
        except Exception as e:
            analysis["metadata"] = {"error": str(e)}

        try:
            distributions = await client.get_distributions(dataset_id)
            analysis["distributions"] = {
                "count": len(distributions),
                "formats": list({d.get("format") for d in distributions if d.get("format")}),
            }
        except Exception as e:
            analysis["distributions"] = {"error": str(e)}

        try:
            analysis["metrics"] = await client.get_metrics(dataset_id)
        except Exception:
            analysis["metrics"] = None

        try:
            analysis["doi_eligibility"] = await client.check_eligibility(dataset_id)
        except Exception:
            analysis["doi_eligibility"] = {"eligible": False}

        return analysis
