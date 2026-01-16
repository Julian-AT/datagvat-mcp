"""Preview service for partial file fetching and schema extraction."""

import csv
import io
import json
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


# JSON parsing functions


def infer_json_type(value: Any) -> str:
    """Infer the JSON type of a value.

    Args:
        value: Any Python value from parsed JSON.

    Returns:
        Type string: "null", "boolean", "integer", "number", "string", "array", "object".
    """
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return "unknown"


def _find_data_array(data: Any) -> tuple[list[dict[str, Any]], str]:
    """Find the main data array in JSON content.

    Args:
        data: Parsed JSON data.

    Returns:
        Tuple of (array of objects, structure type).
    """
    # Direct array of objects
    if isinstance(data, list):
        if all(isinstance(item, dict) for item in data[:10]):
            return data, "array_of_objects"
        return [], "array_of_primitives"

    # Nested data array in object
    if isinstance(data, dict):
        # Check common keys for data arrays
        data_keys = ["data", "results", "items", "records", "rows", "entries", "values"]
        for key in data_keys:
            if key in data and isinstance(data[key], list):
                arr = data[key]
                if arr and all(isinstance(item, dict) for item in arr[:10]):
                    return arr, "nested_data_array"

        # Check any key that holds an array of objects
        for key, val in data.items():
            if isinstance(val, list) and val and all(isinstance(item, dict) for item in val[:10]):
                return val, "nested_data_array"

    return [], "single_object"


def _try_recover_truncated_json(text: str) -> Any:
    """Try to recover valid JSON from truncated content.

    Args:
        text: Potentially truncated JSON string.

    Returns:
        Parsed JSON or raises ValueError.
    """
    # First try parsing as-is
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # For arrays, try to find the last complete object
    if text.strip().startswith("["):
        # Find last complete object by looking for },
        last_complete = text.rfind("},")
        if last_complete > 0:
            recovered = text[: last_complete + 1] + "]"
            try:
                return json.loads(recovered)
            except json.JSONDecodeError:
                pass

        # Try finding last complete object ending with }
        last_obj_end = text.rfind("}")
        if last_obj_end > 0:
            recovered = text[: last_obj_end + 1] + "]"
            try:
                return json.loads(recovered)
            except json.JSONDecodeError:
                pass

    # For objects with nested arrays, try similar approach
    if text.strip().startswith("{"):
        # Try to close the JSON object
        bracket_depth = 0
        brace_depth = 0
        last_valid = 0

        for i, char in enumerate(text):
            if char == "{":
                brace_depth += 1
            elif char == "}":
                brace_depth -= 1
                if brace_depth >= 0:
                    last_valid = i
            elif char == "[":
                bracket_depth += 1
            elif char == "]":
                bracket_depth -= 1

        if last_valid > 0:
            recovered = text[: last_valid + 1]
            try:
                return json.loads(recovered)
            except json.JSONDecodeError:
                pass

    raise ValueError("Could not recover valid JSON from truncated content")


def parse_json_schema(content: bytes, encoding: str = "utf-8") -> dict[str, Any]:
    """Extract schema from JSON content.

    Handles:
    - Array of objects: [{...}, {...}, ...]
    - Object with nested data array: {"data": [{...}, ...], ...}

    Args:
        content: Raw bytes of JSON file (may be partial/truncated).
        encoding: Character encoding (default UTF-8).

    Returns:
        Dict with:
        - "columns": List of {"name": str, "type": str}
        - "row_count_sampled": Number of objects used for inference
        - "structure": "array_of_objects", "nested_data_array", "single_object", etc.
        - "note": Optional message for non-tabular data

    Raises:
        PreviewError: If JSON parsing fails completely.
    """
    try:
        text = content.decode(encoding, errors="replace")
        text = _strip_bom(text)

        # Try to parse JSON, recovering from truncation if needed
        try:
            data = _try_recover_truncated_json(text)
        except ValueError as e:
            raise PreviewError(f"Invalid JSON: {e}", "parse_failed")

        # Find data array
        data_array, structure = _find_data_array(data)

        if not data_array:
            # Non-tabular JSON
            return {
                "columns": [],
                "row_count_sampled": 0,
                "structure": structure,
                "note": "JSON is not tabular (array of objects)",
            }

        # Sample up to 10 objects for schema inference
        sample = data_array[:10]

        # Collect all unique keys and their types
        key_types: dict[str, set[str]] = {}
        for obj in sample:
            for key, value in obj.items():
                if key not in key_types:
                    key_types[key] = set()
                key_types[key].add(infer_json_type(value))

        # Build columns list
        columns = []
        for key in key_types:
            types = key_types[key]
            # Use most specific type, or "mixed" if multiple non-null types
            types_without_null = types - {"null"}
            if len(types_without_null) == 0:
                col_type = "null"
            elif len(types_without_null) == 1:
                col_type = types_without_null.pop()
            else:
                col_type = "mixed"
            columns.append({"name": key, "type": col_type})

        return {
            "columns": columns,
            "row_count_sampled": len(sample),
            "structure": structure,
        }
    except PreviewError:
        raise
    except Exception as e:
        logger.warning(f"JSON parse failed: {e}")
        raise PreviewError(f"Failed to parse JSON: {e}", "parse_failed") from e


def parse_json_rows(
    content: bytes,
    max_rows: int = DEFAULT_PREVIEW_ROWS,
    encoding: str = "utf-8",
) -> dict[str, Any]:
    """Extract preview rows from JSON content.

    Args:
        content: Raw bytes of JSON file (may be partial/truncated).
        max_rows: Maximum number of rows to return.
        encoding: Character encoding (default UTF-8).

    Returns:
        Dict with:
        - "columns": List of all unique field names
        - "rows": List of original objects (up to max_rows)
        - "row_count": Actual rows returned
        - "truncated": True if more rows available
        - "note": Optional message for non-tabular data

    Raises:
        PreviewError: If JSON parsing fails completely.
    """
    try:
        # Enforce max_rows limit
        if max_rows > MAX_PREVIEW_ROWS:
            max_rows = MAX_PREVIEW_ROWS

        text = content.decode(encoding, errors="replace")
        text = _strip_bom(text)

        # Try to parse JSON, recovering from truncation if needed
        try:
            data = _try_recover_truncated_json(text)
        except ValueError as e:
            raise PreviewError(f"Invalid JSON: {e}", "parse_failed")

        # Find data array
        data_array, structure = _find_data_array(data)

        if not data_array:
            # Non-tabular JSON
            return {
                "columns": [],
                "rows": [],
                "row_count": 0,
                "truncated": False,
                "structure": structure,
                "note": "JSON is not tabular (array of objects)",
            }

        # Extract rows
        rows = data_array[:max_rows]
        truncated = len(data_array) > max_rows

        # Collect all unique keys for columns
        all_keys: set[str] = set()
        for obj in rows:
            all_keys.update(obj.keys())

        return {
            "columns": sorted(all_keys),
            "rows": rows,
            "row_count": len(rows),
            "truncated": truncated,
            "structure": structure,
        }
    except PreviewError:
        raise
    except Exception as e:
        logger.warning(f"JSON row parse failed: {e}")
        raise PreviewError(f"Failed to parse JSON rows: {e}", "parse_failed") from e
