"""Type hint formatting for TypeScript-style TypeTable display."""

from typing import Any, Union, get_args, get_origin


def format_type(type_hint: Any) -> str:
    """Format Python type hint as TypeScript-style string for TypeTable.

    Handles Annotated types, Optional (Union with None), list/dict generics,
    and maps Python types to TypeScript conventions.

    Args:
        type_hint: Python type hint to format

    Returns:
        TypeScript-style type string (e.g., "string", "integer", "string[]")

    Examples:
        >>> format_type(str)
        'string'
        >>> format_type(list[str])
        'string[]'
        >>> format_type(Optional[int])
        'integer'
        >>> format_type(dict)
        'object'
    """
    # Handle None
    if type_hint is type(None):
        return "null"

    # Unwrap Annotated types to get base type
    origin = get_origin(type_hint)
    if origin is not None:
        # Handle Annotated[T, ...] -> T
        if hasattr(type_hint, "__metadata__"):  # Annotated type
            args = get_args(type_hint)
            if args:
                type_hint = args[0]
                origin = get_origin(type_hint)

        # Handle Optional[T] (Union[T, None]) -> T
        if origin is Union:
            args = get_args(type_hint)
            # Filter out None from Union types
            non_none_args = [arg for arg in args if arg is not type(None)]
            if len(non_none_args) == 1:
                type_hint = non_none_args[0]
                origin = get_origin(type_hint)
            elif len(non_none_args) > 1:
                # Multiple non-None types in Union - format as union
                formatted_types = [format_type(arg) for arg in non_none_args]
                return " | ".join(formatted_types)

        # Handle list[T] -> T[]
        if origin is list:
            args = get_args(type_hint)
            if args:
                element_type = format_type(args[0])
                return f"{element_type}[]"
            return "array"

        # Handle dict types -> object
        if origin is dict:
            return "object"

    # Map Python primitive types to TypeScript
    type_map = {
        int: "integer",
        float: "number",
        str: "string",
        bool: "boolean",
        dict: "object",
        list: "array",
        Any: "any",
    }

    # Check if type_hint is in our map
    if type_hint in type_map:
        return type_map[type_hint]

    # For unknown types, return string representation
    type_str = str(type_hint)

    # Clean up type string representation
    if hasattr(type_hint, "__name__"):
        return type_hint.__name__.lower()

    # Handle typing module types
    if "typing." in type_str:
        type_str = type_str.replace("typing.", "")

    return type_str
