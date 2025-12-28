"""Dependency injection helpers."""

from typing import TYPE_CHECKING

from fastmcp import Context

if TYPE_CHECKING:
    from app.client import PiveauClient
    from app.config import Settings
    from app.server import AppState


def get_app_state(ctx: Context) -> "AppState":
    """Get the AppState from lifespan context."""
    return ctx.request_context.lifespan_context


def get_piveau_client(ctx: Context) -> "PiveauClient":
    """Get the PiveauClient from server state."""
    return get_app_state(ctx).piveau_client


def get_server_settings(ctx: Context) -> "Settings":
    """Get Settings from server state."""
    return get_app_state(ctx).settings


def has_api_key(ctx: Context) -> bool:
    """Check if an API key is configured."""
    try:
        settings = get_server_settings(ctx)
        return settings.api_key_value is not None
    except (KeyError, RuntimeError, AttributeError):
        return False
