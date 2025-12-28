"""Dependency injection helpers."""

from typing import TYPE_CHECKING

from fastmcp import Context

if TYPE_CHECKING:
    from app.client import PiveauClient
    from app.config import Settings


def get_piveau_client(ctx: Context) -> "PiveauClient":
    """Get the PiveauClient from server state."""
    return ctx.fastmcp.state["piveau_client"]


def get_server_settings(ctx: Context) -> "Settings":
    """Get Settings from server state."""
    return ctx.fastmcp.state["settings"]


def has_api_key(ctx: Context) -> bool:
    """Check if an API key is configured."""
    try:
        settings = get_server_settings(ctx)
        return settings.api_key_value is not None
    except (KeyError, RuntimeError):
        return False
