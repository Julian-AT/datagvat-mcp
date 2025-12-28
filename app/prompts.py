"""MCP Prompts for common workflows."""

from fastmcp import FastMCP
from fastmcp.prompts import Prompt, Message


def register_prompts(mcp: FastMCP) -> None:
    @mcp.prompt()
    def dataset_search(topic: str, catalogue_id: str | None = None) -> Prompt:
        """Find datasets about a specific topic."""
        if catalogue_id:
            instruction = f"Search for datasets about '{topic}' in catalogue '{catalogue_id}' using the search_datasets tool."
        else:
            instruction = f"Search for datasets about '{topic}' using the search_datasets tool."

        return Prompt(
            messages=[
                Message(
                    role="user",
                    content=f"{instruction}\n\nFor each result, provide the title, description, and list of available formats.",
                )
            ]
        )

    @mcp.prompt()
    def quality_audit(dataset_id: str) -> Prompt:
        """Audit the quality of a dataset."""
        return Prompt(
            messages=[
                Message(
                    role="user",
                    content=f"""Perform a quality audit on dataset '{dataset_id}':

1. Use get_dataset to fetch the metadata
2. Use get_dataset_distributions to check available files
3. Use get_dataset_metrics to check quality scores
4. Use check_doi_eligibility to verify DOI readiness

Summarize findings and suggest improvements.""",
                )
            ]
        )

    @mcp.prompt()
    def publication_checklist(draft_id: str, catalogue_id: str) -> Prompt:
        """Pre-publication checklist for a dataset draft."""
        return Prompt(
            messages=[
                Message(
                    role="user",
                    content=f"""Review draft '{draft_id}' in catalogue '{catalogue_id}' for publication:

1. Fetch the draft metadata
2. Verify required fields (title, description, publisher)
3. Check for attached distributions
4. Review keywords and themes
5. Confirm license information

Provide a go/no-go recommendation with specific issues to address.""",
                )
            ]
        )

    @mcp.prompt()
    def compare_datasets(dataset_ids: list[str]) -> Prompt:
        """Compare multiple datasets."""
        ids_str = ", ".join(dataset_ids)
        return Prompt(
            messages=[
                Message(
                    role="user",
                    content=f"""Compare these datasets: {ids_str}

For each dataset, retrieve:
- Title and description
- Publisher
- Available formats
- Quality metrics

Create a comparison table and recommend which to use based on quality and completeness.""",
                )
            ]
        )

    @mcp.prompt()
    def catalogue_overview(catalogue_id: str) -> Prompt:
        """Overview of a catalogue's contents."""
        return Prompt(
            messages=[
                Message(
                    role="user",
                    content=f"""Provide an overview of catalogue '{catalogue_id}':

1. Fetch catalogue metadata
2. List datasets (first 20)
3. Identify common themes and topics
4. Check data quality trends

Summarize the catalogue's focus areas and overall data quality.""",
                )
            ]
        )
