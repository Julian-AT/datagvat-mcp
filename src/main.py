#!/usr/bin/env python3
"""
MCP Server for data.gv.at hub-repo service API
Based on the OpenAPI schema for DCAT-AP dataset management
"""

import logging

# Import the common FastMCP instance
from .common import mcp

logging.basicConfig(level=logging.INFO)

# Import all endpoint modules to register the tools
from .endpoints import catalogues   
from .endpoints import datasets   
from .endpoints import distributions   
from .endpoints import vocabularies   
from .endpoints import other  # Only contains public resource endpoints


def main():
    """Synchronous entry point for Poetry scripts."""
    # FastMCP handles its own event loop internally
    mcp.run()


if __name__ == "__main__":
    main()