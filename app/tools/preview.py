"""Preview tools for schema introspection and data sampling."""

from typing import Annotated, Any

from fastmcp import FastMCP, Context
from fastmcp.exceptions import ToolError
from pydantic import Field

from app.preview import (
    fetch_preview_bytes,
    detect_format,
    parse_csv_schema,
    parse_csv_rows,
    parse_json_schema,
    parse_json_rows,
    PreviewError,
    DEFAULT_PREVIEW_BYTES,
    DEFAULT_PREVIEW_ROWS,
    MAX_PREVIEW_ROWS,
    SUPPORTED_FORMATS,
)


def _validate_url(url: str) -> None:
    """Validate URL format.

    Raises:
        ToolError: If URL is not valid HTTP/HTTPS.
    """
    if not url:
        raise ToolError("URL is required")
    if not url.startswith(("http://", "https://")):
        raise ToolError(
            f"Invalid URL: {url}. URL must start with http:// or https://"
        )


def _format_supported_formats() -> str:
    """Format supported formats for error messages."""
    return ", ".join(sorted(f for f in SUPPORTED_FORMATS if "/" not in f))


def register_preview_tools(mcp: FastMCP) -> None:
    """Register preview tools with the MCP server."""

    @mcp.tool(
        name="preview_schema",
        description=(
            "Get the schema (column names and types) of a CSV or JSON dataset. "
            "Fetches only the first portion of the file to infer structure. "
            "Supports CSV files and JSON arrays of objects."
        ),
        annotations={"readOnlyHint": True},
    )
    async def preview_schema(
        ctx: Context,
        url: Annotated[
            str,
            Field(
                description=(
                    "Direct download URL of the dataset file (CSV or JSON). "
                    "Get this from get_dataset_distributions tool's downloadURL field."
                ),
            ),
        ],
        format: Annotated[
            str | None,
            Field(
                default=None,
                description=(
                    "File format: 'csv' or 'json'. Auto-detected from URL if not specified."
                ),
            ),
        ] = None,
    ) -> dict[str, Any]:
        """Get schema information from a dataset file."""
        # Validate URL
        _validate_url(url)

        try:
            # Report progress
            if ctx:
                await ctx.report_progress(0, 2, "Fetching schema...")

            # Fetch preview bytes
            content, is_partial = await fetch_preview_bytes(url)

            # Detect format
            detected_format = format.lower() if format else detect_format(url)

            if not detected_format:
                raise ToolError(
                    f"Could not detect file format from URL. "
                    f"Please specify format parameter. "
                    f"Supported formats: {_format_supported_formats()}"
                )

            if detected_format not in ("csv", "json"):
                raise ToolError(
                    f"Unsupported format: {detected_format}. "
                    f"Supported formats: {_format_supported_formats()}"
                )

            # Parse schema based on format
            if detected_format == "csv":
                schema = parse_csv_schema(content)
            else:
                schema = parse_json_schema(content)

            # Report completion
            if ctx:
                col_count = len(schema.get("columns", []))
                await ctx.report_progress(2, 2, f"Schema extracted: {col_count} columns")

            # Return with metadata
            return {
                "url": url,
                "format": detected_format,
                "partial_fetch": is_partial,
                **schema,
            }

        except PreviewError as e:
            # Convert to user-friendly error
            if e.reason == "fetch_failed":
                raise ToolError(
                    f"Failed to fetch file: {e}. "
                    "Check that the URL is accessible and points to a valid file."
                ) from e
            elif e.reason == "parse_failed":
                raise ToolError(
                    f"Failed to parse file: {e}. "
                    "The file may be malformed or in an unexpected format."
                ) from e
            else:
                raise ToolError(str(e)) from e
        except ToolError:
            raise
        except Exception as e:
            raise ToolError(f"Unexpected error: {e}") from e

    @mcp.tool(
        name="preview_data",
        description=(
            "Preview the first rows of a CSV or JSON dataset. "
            "Fetches only enough data to return the requested number of rows. "
            "Useful for understanding data content before downloading."
        ),
        annotations={"readOnlyHint": True},
    )
    async def preview_data(
        ctx: Context,
        url: Annotated[
            str,
            Field(
                description=(
                    "Direct download URL of the dataset file. "
                    "Get this from get_dataset_distributions tool's downloadURL field."
                ),
            ),
        ],
        max_rows: Annotated[
            int,
            Field(
                ge=1,
                le=100,
                default=20,
                description="Maximum number of rows to return (1-100, default 20).",
            ),
        ] = 20,
        format: Annotated[
            str | None,
            Field(
                default=None,
                description="File format: 'csv' or 'json'. Auto-detected if not specified.",
            ),
        ] = None,
    ) -> dict[str, Any]:
        """Preview the first rows of a dataset file."""
        # Validate URL
        _validate_url(url)

        # Enforce max_rows limit
        if max_rows > MAX_PREVIEW_ROWS:
            max_rows = MAX_PREVIEW_ROWS

        try:
            # Report progress
            if ctx:
                await ctx.report_progress(0, 2, "Fetching preview data...")

            # Calculate bytes to fetch based on max_rows
            # Estimate: CSV ~500 bytes/row, JSON ~200 bytes/object
            # Use conservative estimate + header overhead
            detected_format = format.lower() if format else detect_format(url)
            if detected_format == "json":
                estimated_bytes = max_rows * 200 + 1024
            else:
                estimated_bytes = max_rows * 500 + 512

            # Fetch at least default bytes, or estimated amount
            fetch_bytes = max(DEFAULT_PREVIEW_BYTES, estimated_bytes)

            # Fetch preview bytes
            content, is_partial = await fetch_preview_bytes(url, max_bytes=fetch_bytes)

            # Detect format if not already
            if not detected_format:
                detected_format = detect_format(url)

            if not detected_format:
                raise ToolError(
                    f"Could not detect file format from URL. "
                    f"Please specify format parameter. "
                    f"Supported formats: {_format_supported_formats()}"
                )

            if detected_format not in ("csv", "json"):
                raise ToolError(
                    f"Unsupported format: {detected_format}. "
                    f"Supported formats: {_format_supported_formats()}"
                )

            # Parse rows based on format
            if detected_format == "csv":
                result = parse_csv_rows(content, max_rows=max_rows)
            else:
                result = parse_json_rows(content, max_rows=max_rows)

            # Report completion
            if ctx:
                row_count = result.get("row_count", 0)
                await ctx.report_progress(2, 2, f"Retrieved {row_count} rows")

            # Return with metadata
            return {
                "url": url,
                "format": detected_format,
                "partial_fetch": is_partial,
                **result,
            }

        except PreviewError as e:
            # Convert to user-friendly error
            if e.reason == "fetch_failed":
                raise ToolError(
                    f"Failed to fetch file: {e}. "
                    "Check that the URL is accessible and points to a valid file."
                ) from e
            elif e.reason == "parse_failed":
                raise ToolError(
                    f"Failed to parse file: {e}. "
                    "The file may be malformed or in an unexpected format."
                ) from e
            else:
                raise ToolError(str(e)) from e
        except ToolError:
            raise
        except Exception as e:
            raise ToolError(f"Unexpected error: {e}") from e
