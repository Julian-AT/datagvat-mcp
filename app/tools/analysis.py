"""Analysis tools for quality metrics and eligibility."""

import logging
from typing import Annotated, Any

from fastmcp import Context, FastMCP
from fastmcp.exceptions import ToolError
from pydantic import StringConstraints

from app.dependencies import get_piveau_client
from app.models import IdentifierType

logger = logging.getLogger(__name__)


def register_analysis_tools(mcp: FastMCP) -> None:
    """Register analysis tools for quality metrics and eligibility checks.

    Args:
        mcp: The FastMCP server instance to register tools with.
    """
    @mcp.tool(
        name="get_dataset_metrics",
        description="Get metadata quality metrics (DQV) for a dataset.",
        annotations={"readOnlyHint": True},
    )
    async def get_dataset_metrics(
        ctx: Context,
        dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        include_history: bool = False,
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        try:
            return await client.get_metrics(dataset_id, historic=include_history)
        except Exception as e:
            raise ToolError(f"Failed to fetch metrics for dataset '{dataset_id}': {e}") from e

    @mcp.tool(
        name="check_doi_eligibility",
        description="Check if a dataset is eligible for a DOI identifier.",
        annotations={"readOnlyHint": True},
    )
    async def check_doi_eligibility(
        ctx: Context,
        dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
        identifier_type: str = "eu-ra-doi",
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        valid_types = [t.value for t in IdentifierType]
        if identifier_type not in valid_types:
            identifier_type = IdentifierType.EU_RA_DOI.value
        try:
            return await client.check_eligibility(dataset_id, identifier_type)
        except Exception as e:
            raise ToolError(f"Failed to check DOI eligibility for dataset '{dataset_id}': {e}") from e

    @mcp.tool(
        name="analyze_dataset_quality",
        description="Perform comprehensive quality analysis of a dataset.",
        annotations={"readOnlyHint": True},
    )
    async def analyze_dataset_quality(
        ctx: Context,
        dataset_id: Annotated[str, StringConstraints(min_length=1, max_length=200)],
    ) -> dict[str, Any]:
        client = get_piveau_client(ctx)
        analysis: dict[str, Any] = {"dataset_id": dataset_id}
        degradation_reasons: list[str] = []
        total_steps = 4

        # Try to get dataset metadata (critical - fail if this doesn't work)
        try:
            if ctx:
                await ctx.report_progress(1, total_steps, "Fetching dataset metadata...")
            dataset = await client.get_dataset(dataset_id)
            analysis["metadata"] = {
                "has_title": bool(dataset.get("dct:title") or dataset.get("title")),
                "has_description": bool(dataset.get("dct:description") or dataset.get("description")),
                "has_publisher": bool(dataset.get("dct:publisher") or dataset.get("publisher")),
            }
        except Exception as e:
            raise ToolError(f"Failed to analyze dataset '{dataset_id}': {e}") from e

        # Try to get distributions (optional - continue if this fails)
        try:
            if ctx:
                await ctx.report_progress(2, total_steps, "Fetching distributions...")
            distributions = await client.get_distributions(dataset_id)
            analysis["distributions"] = {
                "count": len(distributions),
                "formats": list({d.get("format") for d in distributions if d.get("format")}),
            }
        except Exception as e:
            logger.warning(f"Distributions unavailable for dataset {dataset_id}: {e}")
            analysis["distributions"] = None
            degradation_reasons.append("Distribution information unavailable")

        # Try to get metrics (optional - continue if this fails)
        try:
            if ctx:
                await ctx.report_progress(3, total_steps, "Fetching quality metrics...")
            analysis["metrics"] = await client.get_metrics(dataset_id)
        except Exception as e:
            logger.warning(f"DQV metrics unavailable for dataset {dataset_id}: {e}")
            analysis["metrics"] = None
            degradation_reasons.append("Quality metrics unavailable")

        # Try to check DOI eligibility (optional - continue if this fails)
        try:
            if ctx:
                await ctx.report_progress(4, total_steps, "Checking DOI eligibility...")
            analysis["doi_eligibility"] = await client.check_eligibility(dataset_id)
        except Exception as e:
            logger.warning(f"DOI eligibility check unavailable for dataset {dataset_id}: {e}")
            analysis["doi_eligibility"] = None
            degradation_reasons.append("DOI eligibility check unavailable")

        # Add degradation tracking to response
        if degradation_reasons:
            analysis["degraded"] = True
            analysis["degradation_reasons"] = degradation_reasons
        else:
            analysis["degraded"] = False

        if ctx:
            await ctx.report_progress(total_steps, total_steps, "Analysis complete")

        return analysis
