"""Preview service for partial file fetching and schema extraction."""

import csv
import io
import logging
import re
from typing import Any
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

# Constants for preview limits
DEFAULT_PREVIEW_BYTES = 64 * 1024  # 64KB - enough for ~1000 CSV rows typically
MAX_PREVIEW_BYTES = 512 * 1024  # 512KB hard limit
DEFAULT_PREVIEW_ROWS = 20
MAX_PREVIEW_ROWS = 100
SUPPORTED_FORMATS = {"csv", "json", "text/csv", "application/json"}


class PreviewError(Exception):
    """Exception raised when preview operations fail."""

    def __init__(self, message: str, reason: str = "unknown"):
        super().__init__(message)
        self.reason = reason


async def fetch_preview_bytes(
    url: str,
    max_bytes: int = DEFAULT_PREVIEW_BYTES,
    timeout: int = 30,
) -> tuple[bytes, bool]:
    """Fetch partial content from a URL using HTTP Range requests.

    Args:
        url: The URL to fetch content from.
        max_bytes: Maximum bytes to fetch (default 64KB).
        timeout: Request timeout in seconds.

    Returns:
        Tuple of (content bytes, is_partial). is_partial is True if
        server returned partial content (206), False if full content
        was returned and truncated.

    Raises:
        PreviewError: If fetch fails for any reason.
    """
    # Validate max_bytes
    if max_bytes > MAX_PREVIEW_BYTES:
        max_bytes = MAX_PREVIEW_BYTES

    headers = {
        "Range": f"bytes=0-{max_bytes - 1}",
        "User-Agent": "Austria-MCP-Agent/1.0",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)

            if response.status_code == 206:
                # Server supports Range requests, got partial content
                return response.content, True
            elif response.status_code == 200:
                # Server doesn't support Range, got full content - truncate
                content = response.content[:max_bytes]
                is_partial = len(response.content) > max_bytes
                return content, is_partial
            elif response.status_code == 404:
                raise PreviewError("Resource not found", "fetch_failed")
            else:
                raise PreviewError(
                    f"HTTP error {response.status_code}: {response.reason_phrase}",
                    "fetch_failed",
                )
    except httpx.TimeoutException as e:
        raise PreviewError("Request timed out", "fetch_failed") from e
    except httpx.ConnectError as e:
        raise PreviewError("Could not connect to URL", "fetch_failed") from e
    except httpx.RequestError as e:
        raise PreviewError(f"Request failed: {e}", "fetch_failed") from e


def detect_format(url: str, content_type: str | None = None) -> str | None:
    """Detect file format from content type or URL extension.

    Args:
        url: The URL to check for extension.
        content_type: Optional Content-Type header value.

    Returns:
        Normalized format string ("csv" or "json") or None if unknown.
    """
    # Check content type first if provided
    if content_type:
        ct = content_type.lower().split(";")[0].strip()
        if ct in ("text/csv", "application/csv"):
            return "csv"
        if ct in ("application/json", "text/json"):
            return "json"

    # Fall back to URL extension
    parsed = urlparse(url)
    path = parsed.path.lower()
    if path.endswith(".csv"):
        return "csv"
    if path.endswith(".json"):
        return "json"

    return None


def _strip_bom(text: str) -> str:
    """Strip UTF-8 BOM if present."""
    if text.startswith("\ufeff"):
        return text[1:]
    return text


def infer_column_type(values: list[str]) -> str:
    """Infer the data type of a column from sample values.

    Args:
        values: List of string values from the column.

    Returns:
        Inferred type: "integer", "float", "boolean", "date", or "string".
    """
    # Filter out empty values and sample up to 10
    non_empty = [v.strip() for v in values if v and v.strip()][:10]

    if not non_empty:
        return "string"

    # Check integer pattern
    int_pattern = re.compile(r"^-?\d+$")
    if all(int_pattern.match(v) for v in non_empty):
        return "integer"

    # Check float pattern (includes integers with decimal point)
    float_pattern = re.compile(r"^-?\d+\.?\d*$|^-?\d*\.\d+$")
    if all(float_pattern.match(v) for v in non_empty):
        return "float"

    # Check boolean pattern
    bool_values = {"true", "false", "yes", "no", "1", "0"}
    if all(v.lower() in bool_values for v in non_empty):
        return "boolean"

    # Check date pattern (YYYY-MM-DD and variants)
    date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}")
    if all(date_pattern.match(v) for v in non_empty):
        return "date"

    return "string"


def parse_csv_schema(content: bytes, encoding: str = "utf-8") -> dict[str, Any]:
    """Extract schema from CSV content.

    Args:
        content: Raw bytes of CSV file (may be partial).
        encoding: Character encoding (default UTF-8).

    Returns:
        Dict with "columns" list (each with "name" and "type") and
        "row_count_sampled" indicating how many rows were used for inference.

    Raises:
        PreviewError: If CSV parsing fails.
    """
    try:
        text = content.decode(encoding, errors="replace")
        text = _strip_bom(text)

        # Try to detect delimiter
        try:
            sample = text[:4096]
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        except csv.Error:
            # Fall back to comma
            dialect = csv.excel

        reader = csv.reader(io.StringIO(text), dialect)

        # Read header
        try:
            header = next(reader)
        except StopIteration:
            raise PreviewError("CSV file is empty", "parse_failed")

        # Read up to 10 data rows for type inference
        data_rows: list[list[str]] = []
        for row in reader:
            if len(data_rows) >= 10:
                break
            # Skip rows that don't match header length (likely incomplete)
            if len(row) == len(header):
                data_rows.append(row)

        # Infer types for each column
        columns = []
        for i, col_name in enumerate(header):
            col_values = [row[i] for row in data_rows if i < len(row)]
            col_type = infer_column_type(col_values)
            columns.append({"name": col_name, "type": col_type})

        return {
            "columns": columns,
            "row_count_sampled": len(data_rows),
        }
    except PreviewError:
        raise
    except Exception as e:
        logger.warning(f"CSV parse failed: {e}")
        raise PreviewError(f"Failed to parse CSV: {e}", "parse_failed") from e


def parse_csv_rows(
    content: bytes,
    max_rows: int = DEFAULT_PREVIEW_ROWS,
    encoding: str = "utf-8",
) -> dict[str, Any]:
    """Extract preview rows from CSV content.

    Args:
        content: Raw bytes of CSV file (may be partial).
        max_rows: Maximum number of data rows to return.
        encoding: Character encoding (default UTF-8).

    Returns:
        Dict with "columns" (header names), "rows" (list of value lists),
        "row_count" (actual rows returned), "truncated" (if more available).

    Raises:
        PreviewError: If CSV parsing fails.
    """
    try:
        # Enforce max_rows limit
        if max_rows > MAX_PREVIEW_ROWS:
            max_rows = MAX_PREVIEW_ROWS

        text = content.decode(encoding, errors="replace")
        text = _strip_bom(text)

        # Try to detect delimiter
        try:
            sample = text[:4096]
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        except csv.Error:
            dialect = csv.excel

        reader = csv.reader(io.StringIO(text), dialect)

        # Read header
        try:
            header = next(reader)
        except StopIteration:
            raise PreviewError("CSV file is empty", "parse_failed")

        # Read data rows
        rows: list[list[str]] = []
        truncated = False
        incomplete_row = False

        for row in reader:
            if len(rows) >= max_rows:
                truncated = True
                break
            # Check if row is complete (same number of fields as header)
            if len(row) == len(header):
                rows.append(row)
            elif len(row) > 0 and len(row) < len(header):
                # Potentially incomplete row from truncated content
                incomplete_row = True

        # If we had incomplete row and didn't hit max_rows, content was truncated
        if incomplete_row and not truncated:
            truncated = True

        return {
            "columns": header,
            "rows": rows,
            "row_count": len(rows),
            "truncated": truncated,
        }
    except PreviewError:
        raise
    except Exception as e:
        logger.warning(f"CSV row parse failed: {e}")
        raise PreviewError(f"Failed to parse CSV rows: {e}", "parse_failed") from e
