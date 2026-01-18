"""Semantic search functionality using FastMCP Context.sample() for natural language query understanding."""

import json
import logging
from typing import Any

from fastmcp import Context
from fastmcp.exceptions import ToolError

from app.client import PiveauClient

logger = logging.getLogger(__name__)


def detect_language(query: str) -> str:
    """Auto-detect query language using simple heuristics.

    Args:
        query: The user's natural language query

    Returns:
        "de" for German, "en" for English, "auto" for uncertain
    """
    query_lower = query.lower()

    # German articles and common words
    german_indicators = [
        "der", "die", "das", "den", "dem", "des",  # Articles
        "von", "für", "mit", "zu", "bei", "nach",  # Prepositions
        "und", "oder", "nicht", "ist", "sind",     # Common words
        "daten", "datensatz", "datensätze",        # Data-related
        "österreich", "wien", "graz", "salzburg",  # Locations
        "gesundheit", "umwelt", "wirtschaft",      # Domains
    ]

    # Check for German indicators
    german_matches = sum(1 for indicator in german_indicators if indicator in query_lower)

    # If we find 2+ German indicators, likely German
    if german_matches >= 2:
        return "de"

    # English-specific indicators (less definitive, as many are also valid in other contexts)
    english_indicators = ["health", "environment", "economy", "transport", "data", "dataset", "from", "about"]
    english_matches = sum(1 for indicator in english_indicators if indicator in query_lower)

    # If we find English but no German, likely English
    if english_matches > 0 and german_matches == 0:
        return "en"

    # Default to auto-detection for unclear cases
    return "auto"


async def expand_natural_query(
    ctx: Context,
    query: str,
    language: str = "auto"
) -> dict[str, Any]:
    """Expand natural language query into structured search parameters using FastMCP Context.sample().

    Uses LLM to understand natural language and convert it into effective search terms,
    themes, and filters for the Piveau API.

    Args:
        ctx: FastMCP context for LLM sampling
        query: Natural language query (e.g., "health data from Vienna")
        language: Language preference ("en", "de", or "auto" for detection)

    Returns:
        Dict with expanded query structure:
        {
            "query": "expanded keyword query for API",
            "themes": ["HEAL", "REGI"],  # EU theme codes
            "keywords": ["health", "vienna", "medical"],
            "filters": {
                "formats": ["CSV", "JSON"],  # if mentioned
                "publishers": ["org-id"]      # if specific org mentioned
            },
            "original_query": "health data from Vienna",
            "detected_language": "en",
            "expansion_confidence": "high"
        }

    Raises:
        No exceptions - gracefully handles LLM failures by returning original query structure
    """
    # Auto-detect language if requested
    if language == "auto":
        language = detect_language(query)

    # Fallback structure in case LLM sampling fails
    fallback_result = {
        "query": query,
        "themes": [],
        "keywords": query.split(),
        "filters": {},
        "original_query": query,
        "detected_language": language,
        "expansion_confidence": "fallback"
    }

    try:
        # Prepare language-specific prompt
        if language == "de":
            prompt = f"""Analysiere diese natürliche Suchanfrage und expandiere sie zu strukturierten Suchparametern für ein österreichisches Open-Data-Portal:

Anfrage: "{query}"

Gib ein JSON-Objekt zurück mit:
- "query": Optimierte Suchbegriffe für die API (Schlüsselwörter extrahieren)
- "themes": EU-Themencodes (AGRI, ECON, EDUC, ENER, ENVI, GOVE, HEAL, INTR, JUST, REGI, SOCI, TECH, TRAN)
- "keywords": Liste relevanter Suchbegriffe
- "filters": Objekt mit "formats" und "publishers" falls erwähnt
- "expansion_confidence": "high", "medium" oder "low"

Beispiel für "Gesundheitsdaten aus Wien":
{{"query": "gesundheit wien medizin", "themes": ["HEAL", "REGI"], "keywords": ["gesundheit", "wien", "medizin"], "filters": {{}}, "expansion_confidence": "high"}}

Nur JSON zurückgeben, keine zusätzlichen Erklärungen:"""
        else:
            # English prompt (also used for "auto" detection)
            prompt = f"""Analyze this natural language search query and expand it into structured search parameters for an Austrian open data portal:

Query: "{query}"

Return a JSON object with:
- "query": Optimized search terms for the API (extract key concepts)
- "themes": EU theme codes (AGRI, ECON, EDUC, ENER, ENVI, GOVE, HEAL, INTR, JUST, REGI, SOCI, TECH, TRAN)
- "keywords": List of relevant search terms
- "filters": Object with "formats" and "publishers" if mentioned
- "expansion_confidence": "high", "medium", or "low"

Example for "health data from Vienna":
{{"query": "health vienna medical", "themes": ["HEAL", "REGI"], "keywords": ["health", "vienna", "medical"], "filters": {{}}, "expansion_confidence": "high"}}

Return only JSON, no additional explanations:"""

        # Sample from LLM
        response = await ctx.sample(prompt)

        # Try to parse the JSON response
        try:
            # Extract string content from SamplingResult
            response_text = str(response).strip()
            expanded = json.loads(response_text)

            # Validate required fields and add missing ones
            result = {
                "query": expanded.get("query", query),
                "themes": expanded.get("themes", []),
                "keywords": expanded.get("keywords", query.split()),
                "filters": expanded.get("filters", {}),
                "original_query": query,
                "detected_language": language,
                "expansion_confidence": expanded.get("expansion_confidence", "medium")
            }

            # Validate themes are valid EU codes
            valid_themes = {"AGRI", "ECON", "EDUC", "ENER", "ENVI", "GOVE",
                          "HEAL", "INTR", "JUST", "REGI", "SOCI", "TECH", "TRAN"}
            result["themes"] = [t.upper() for t in result["themes"] if t.upper() in valid_themes]

            logger.info(f"Successfully expanded query '{query}' with confidence {result['expansion_confidence']}")
            return result

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM response as JSON: {e}")
            response_text = str(response) if response else ""
            logger.debug(f"LLM response was: {response_text[:200]}...")
            return fallback_result

    except Exception as e:
        logger.warning(f"LLM sampling failed for query '{query}': {e}")
        return fallback_result


async def semantic_search(
    ctx: Context,
    query: str,
    client: PiveauClient | None = None,
    **kwargs: Any
) -> dict[str, Any]:
    """Perform semantic search by expanding natural language query then calling advanced search.

    Wrapper function that combines natural language understanding with the existing
    search functionality. Falls back to direct search if expansion fails.

    Args:
        ctx: FastMCP context for LLM sampling and progress reporting
        query: Natural language query
        client: Piveau client instance (will create one if not provided)
        **kwargs: Additional search parameters (themes, formats, publishers, etc.)
                 These explicit filters will be merged with semantic expansion results

    Returns:
        Search results dict with additional expansion_info:
        {
            "results": [...],
            "count": 42,
            "facets": {...},
            "expansion_info": {
                "original_query": "health data from Vienna",
                "expanded_query": "health vienna medical",
                "semantic_themes": ["HEAL", "REGI"],
                "semantic_keywords": ["health", "vienna", "medical"],
                "confidence": "high"
            }
        }

    Raises:
        ToolError: If underlying search API fails
    """
    try:
        # Import here to avoid circular dependency
        from app.dependencies import get_piveau_client

        if client is None:
            client = get_piveau_client(ctx)

        # Step 1: Expand natural language query
        if ctx:
            await ctx.report_progress(0, 2, "Expanding natural language query...")

        expansion = await expand_natural_query(ctx, query, kwargs.pop("language", "auto"))

        # Step 2: Merge semantic expansion with explicit filters
        search_params = dict(kwargs)  # Copy explicit parameters

        # Use expanded query if it's different and more specific
        if expansion["expansion_confidence"] in ("high", "medium"):
            search_params["query"] = expansion["query"]
        else:
            search_params["query"] = query  # Use original query if expansion uncertain

        # Merge themes (explicit + semantic)
        explicit_themes = search_params.get("themes", [])
        semantic_themes = expansion.get("themes", [])
        if semantic_themes:
            all_themes = list(set(explicit_themes + semantic_themes))
            search_params["themes"] = all_themes

        # Merge formats if mentioned in semantic expansion
        semantic_formats = expansion.get("filters", {}).get("formats", [])
        if semantic_formats:
            explicit_formats = search_params.get("formats", [])
            all_formats = list(set(explicit_formats + semantic_formats))
            search_params["formats"] = all_formats

        # Merge publishers if mentioned in semantic expansion
        semantic_publishers = expansion.get("filters", {}).get("publishers", [])
        if semantic_publishers:
            explicit_publishers = search_params.get("publishers", [])
            all_publishers = list(set(explicit_publishers + semantic_publishers))
            search_params["publishers"] = all_publishers

        # Step 3: Execute search
        if ctx:
            semantic_desc = f"themes={semantic_themes}" if semantic_themes else "keyword expansion"
            await ctx.report_progress(1, 2, f"Searching with {semantic_desc}...")

        # Build facets dict for advanced search
        facets_dict: dict[str, list[str]] = {}
        if "themes" in search_params and search_params["themes"]:
            theme_list = search_params.pop("themes")
            if isinstance(theme_list, list):
                facets_dict["categories"] = theme_list
        if "formats" in search_params and search_params["formats"]:
            format_list = search_params.pop("formats")
            if isinstance(format_list, list):
                facets_dict["format"] = format_list
        if "publishers" in search_params and search_params["publishers"]:
            pub_list = search_params.pop("publishers")
            if isinstance(pub_list, list):
                facets_dict["publisher"] = pub_list

        # Extract valid parameters for search_datasets_advanced
        query_param = search_params.pop("query", None)
        min_date = search_params.pop("min_date", None)
        max_date = search_params.pop("max_date", None)
        sort = search_params.pop("sort", "relevance+desc")
        limit = search_params.pop("limit", 20)
        page = search_params.pop("page", 0)

        # Call the advanced search from client
        result = await client.search_datasets_advanced(
            query=query_param if isinstance(query_param, str) else None,
            facets=facets_dict if facets_dict else None,
            min_date=min_date if isinstance(min_date, str) else None,
            max_date=max_date if isinstance(max_date, str) else None,
            sort=sort if isinstance(sort, str) else "relevance+desc",
            limit=limit if isinstance(limit, int) else 20,
            page=page if isinstance(page, int) else 0,
        )

        # Step 4: Add expansion information to results
        result["expansion_info"] = {
            "original_query": query,
            "expanded_query": expansion["query"],
            "semantic_themes": semantic_themes,
            "semantic_keywords": expansion.get("keywords", []),
            "confidence": expansion["expansion_confidence"],
            "language": expansion["detected_language"]
        }

        return result

    except Exception as e:
        # If semantic search fails completely, try fallback to direct search
        logger.warning(f"Semantic search failed, falling back to direct search: {e}")

        if client is None:
            from app.dependencies import get_piveau_client
            client = get_piveau_client(ctx)

        try:
            # Simple fallback search with original query
            result = await client.search_datasets_advanced(query=query)
            result["expansion_info"] = {
                "original_query": query,
                "expanded_query": query,
                "semantic_themes": [],
                "semantic_keywords": [],
                "confidence": "fallback",
                "language": "unknown"
            }
            return result
        except Exception as fallback_error:
            raise ToolError(f"Both semantic and fallback search failed: {fallback_error}") from fallback_error