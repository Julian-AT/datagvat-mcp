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
