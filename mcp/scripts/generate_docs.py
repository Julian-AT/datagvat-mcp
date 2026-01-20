#!/usr/bin/env python3
"""Generate API documentation from MCP tool definitions."""

import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

# Add mcp to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.extractors.tool_metadata import extract_all_tools


def generate_tools_mdx(output_path: Path) -> None:
    """Generate tools.mdx from extracted tool metadata.

    Args:
        output_path: Path where generated MDX file should be written

    Raises:
        ValueError: If tool count != 25 (extraction incomplete)
    """
    # Extract metadata
    tools_data = extract_all_tools()

    # Verify tool count
    total_tools = sum(len(tools) for tools in tools_data.values())
    if total_tools != 25:
        raise ValueError(
            f"Expected 25 tools, found {total_tools}. "
            "Generation aborted - extraction incomplete."
        )

    # Load template
    template_dir = Path(__file__).parent / "templates"
    env = Environment(loader=FileSystemLoader(str(template_dir)))
    template = env.get_template("tools.mdx.j2")

    # Render MDX
    mdx_content = template.render(categories=tools_data)

    # Write output
    output_path.write_text(mdx_content, encoding="utf-8")
    print(f"[OK] Generated {output_path}")
    print(f"[OK] Documented {total_tools} tools")


if __name__ == "__main__":
    # Output to docs workspace
    docs_root = Path(__file__).parent.parent.parent / "docs"
    output = docs_root / "api" / "api" / "tools.mdx"

    generate_tools_mdx(output)
