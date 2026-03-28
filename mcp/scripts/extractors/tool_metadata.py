"""Tool metadata extraction from FastMCP registered tools."""

from typing import Any

from fastmcp import FastMCP


def extract_tool_metadata(tool_obj: Any) -> dict[str, Any]:
    """Extract metadata from a FastMCP Tool object.

    Uses the Tool object's pre-computed JSON Schema parameters and metadata
    rather than introspecting the function directly.

    Args:
        tool_obj: FastMCP Tool object

    Returns:
        Dictionary with keys: name, description, parameters, return_type
        - parameters: dict mapping param name -> {type, description, default, required}

    Examples:
        >>> # After registering tools with mcp
        >>> tool = mcp._tool_manager._tools['search_datasets']
        >>> meta = extract_tool_metadata(tool)
        >>> meta['name']
        'search_datasets'
        >>> len(meta['parameters'])
        11
    """
    # Extract basic metadata from Tool object
    name = tool_obj.name
    description = tool_obj.description

    # Extract parameters from JSON Schema
    # Tool.parameters is a JSON Schema dict with 'properties' key
    schema_props = tool_obj.parameters.get("properties", {})

    parameters = {}
    for param_name, param_schema in schema_props.items():
        # Map JSON Schema types to TypeScript-style types
        formatted_type = "any"

        # Handle anyOf (used for optional types like str | None or list[str] | None)
        if "anyOf" in param_schema:
            # Extract non-null types from anyOf
            any_of = param_schema["anyOf"]
            for type_option in any_of:
                if type_option.get("type") == "null":
                    continue
                # Found non-null type, use it
                if type_option.get("type") == "array":
                    items = type_option.get("items", {})
                    items_type = items.get("type", "any")
                    formatted_type = f"{items_type}[]"
                else:
                    formatted_type = type_option.get("type", "any")
                break
        # Handle direct type field
        elif "type" in param_schema:
            json_type = param_schema["type"]
            if json_type == "array":
                items = param_schema.get("items", {})
                items_type = items.get("type", "any")
                formatted_type = f"{items_type}[]"
            else:
                formatted_type = json_type

        # Get description, default, and required status
        param_description = param_schema.get("description", "")
        param_default = param_schema.get("default", None)

        # A parameter is required if it has no default value
        has_default = "default" in param_schema

        parameters[param_name] = {
            "type": formatted_type,
            "description": param_description,
            "default": param_default,
            "required": not has_default,
        }

    # Return type - use generic "object" or "array" since we don't have detailed schema
    # (This is acceptable per deferred requirement API-03)
    return_type = "object"  # Most tools return dict or list

    return {
        "name": name,
        "description": description,
        "parameters": parameters,
        "return_type": return_type,
    }


def extract_all_tools() -> dict[str, list[dict[str, Any]]]:
    """Extract metadata for all registered MCP tools.

    Creates temporary FastMCP instance, calls all registration functions,
    and extracts metadata from registered tools.

    Returns:
        Dictionary mapping category name -> list of tool metadata dicts
        Categories: Discovery Tools, Analysis Tools, Preview Tools,
                   Management Tools, Vocabulary Tools

    Raises:
        ImportError: If registration modules cannot be imported
        ValueError: If tool count != 25

    Examples:
        >>> tools_data = extract_all_tools()
        >>> len(tools_data)  # 5 categories
        5
        >>> sum(len(tools) for tools in tools_data.values())  # 25 total tools
        25
    """
    # Import registration functions
    try:
        from app.tools.management import register_management_tools

        from app.tools.analysis import register_analysis_tools
        from app.tools.discovery import register_discovery_tools
        from app.tools.preview import register_preview_tools
        from app.tools.vocabularies import register_vocabulary_tools
    except ImportError as e:
        raise ImportError(
            f"Failed to import tool registration modules: {e}. "
            "Ensure script is run from mcp/ directory."
        ) from e

    # Create temporary MCP instance
    mcp = FastMCP("doc_generator")

    # Register all tools
    register_discovery_tools(mcp)
    register_analysis_tools(mcp)
    register_preview_tools(mcp)
    register_management_tools(mcp)
    register_vocabulary_tools(mcp)

    # Access registered tools from MCP instance
    # Use _tool_manager._tools for synchronous access (get_tools() is async)
    registered_tools = mcp._tool_manager._tools

    # Define category mapping (registration function -> category name)
    # We'll categorize by tool name patterns since we have all tools in one dict
    categories: dict[str, list[dict[str, Any]]] = {
        "Discovery Tools": [],
        "Analysis Tools": [],
        "Preview Tools": [],
        "Management Tools": [],
        "Vocabulary Tools": [],
    }

    # Tool name to category mapping based on known tool functions
    discovery_tools = {
        "list_catalogues",
        "get_catalogue",
        "search_datasets",
        "get_dataset",
        "get_dataset_distributions",
        "get_catalogue_record",
        "find_related_datasets",
        "semantic_search_datasets",
    }

    analysis_tools = {
        "get_dataset_metrics",
        "check_doi_eligibility",
        "analyze_dataset_quality",
    }

    preview_tools = {
        "preview_schema",
        "preview_data",
    }

    management_tools = {
        "list_dataset_drafts",
        "get_dataset_draft",
        "create_dataset_draft",
        "update_dataset_draft",
        "delete_dataset_draft",
        "publish_dataset",
        "hide_dataset",
    }

    vocabulary_tools = {
        "list_vocabularies",
        "get_vocabulary",
        "search_vocabulary_terms",
        "get_autocomplete_suggestions",
        "get_resource_types",
    }

    # Extract metadata for each registered tool
    for tool_key, tool_obj in registered_tools.items():
        # Extract metadata directly from Tool object
        metadata = extract_tool_metadata(tool_obj)
        tool_name = metadata["name"]

        # Categorize tool
        if tool_name in discovery_tools:
            categories["Discovery Tools"].append(metadata)
        elif tool_name in analysis_tools:
            categories["Analysis Tools"].append(metadata)
        elif tool_name in preview_tools:
            categories["Preview Tools"].append(metadata)
        elif tool_name in management_tools:
            categories["Management Tools"].append(metadata)
        elif tool_name in vocabulary_tools:
            categories["Vocabulary Tools"].append(metadata)

    # Verify we got all 25 tools
    total_tools = sum(len(tools) for tools in categories.values())
    if total_tools != 25:
        raise ValueError(
            f"Expected 25 tools, found {total_tools}. "
            "Extraction incomplete - check tool registration and categorization."
        )

    return categories
