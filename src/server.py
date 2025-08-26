"""Main entry point for data.gv.at MCP server."""

import asyncio
import logging
import sys

from .main import main as server_main


def configure_logging(log_level: str = "INFO") -> None:
    """Configure logging."""
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stderr)],
    )


async def async_main() -> None:
    """Async main entry point for the MCP server."""
    configure_logging()
    await server_main()


def main() -> None:
    """Synchronous entry point for Poetry scripts."""
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
