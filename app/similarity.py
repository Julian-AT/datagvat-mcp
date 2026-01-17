"""Similarity service for finding related datasets."""

from typing import Any

from app.client import PiveauClient


def extract_features(dataset: dict[str, Any]) -> dict[str, Any]:
    """Extract similarity features from a dataset.

    Features extracted:
    - themes: EU DCAT-AP theme codes (e.g., AGRI, ENVI)
    - keywords: Free-text keywords from dataset metadata
    - publisher: Publisher/organization ID

    Args:
        dataset: Dataset metadata dict (from get_dataset or search results)

    Returns:
        Dict with keys: themes (list[str]), keywords (list[str]), publisher (str | None)
    """
    features = {
        "themes": [],
        "keywords": [],
        "publisher": None,
    }

    # Extract themes - try both RDF and JSON formats
    themes = dataset.get("dcat:theme") or dataset.get("theme") or []
    if themes:
        if isinstance(themes, list):
            for theme in themes:
                if isinstance(theme, dict):
                    # RDF format: {"@id": "http://...AGRI"}
                    theme_id = theme.get("@id", "")
                    if "/" in theme_id:
                        code = theme_id.split("/")[-1].upper()
                        if code:
                            features["themes"].append(code)
                elif isinstance(theme, str):
                    # Direct code or URI
                    if "/" in theme:
                        code = theme.split("/")[-1].upper()
                    else:
                        code = theme.upper()
                    if code:
                        features["themes"].append(code)
        elif isinstance(themes, str):
            features["themes"].append(themes.upper())

    # Extract keywords
    keywords = dataset.get("dcat:keyword") or dataset.get("keyword") or []
    if keywords:
        if isinstance(keywords, list):
            for kw in keywords:
                if isinstance(kw, dict):
                    # Multilingual: {"@value": "text", "@language": "de"}
                    val = kw.get("@value", "")
                    if val:
                        features["keywords"].append(val.lower())
                elif isinstance(kw, str):
                    features["keywords"].append(kw.lower())
        elif isinstance(keywords, str):
            features["keywords"].append(keywords.lower())

    # Extract publisher
    publisher = dataset.get("dct:publisher") or dataset.get("publisher")
    if publisher:
        if isinstance(publisher, dict):
            features["publisher"] = publisher.get("@id") or publisher.get("id")
        elif isinstance(publisher, str):
            features["publisher"] = publisher

    return features


def calculate_similarity_score(
    source_features: dict[str, Any],
    candidate_features: dict[str, Any],
) -> float:
    """Calculate similarity score between two datasets based on features.

    Scoring:
    - Theme match: 30 points per matching theme (strong signal)
    - Keyword match: 10 points per matching keyword (weaker signal)
    - Same publisher: 15 points bonus (datasets often related)
    - Max score capped at 100

    Args:
        source_features: Features from source dataset
        candidate_features: Features from candidate dataset

    Returns:
        Similarity score 0-100 where 100 is most similar.
    """
    score = 0.0

    # Theme overlap (30 points each, up to 60 points)
    source_themes = set(source_features.get("themes", []))
    candidate_themes = set(candidate_features.get("themes", []))
    theme_matches = len(source_themes & candidate_themes)
    score += min(theme_matches * 30, 60)

    # Keyword overlap (10 points each, up to 30 points)
    source_keywords = set(source_features.get("keywords", []))
    candidate_keywords = set(candidate_features.get("keywords", []))
    keyword_matches = len(source_keywords & candidate_keywords)
    score += min(keyword_matches * 10, 30)

    # Same publisher bonus (15 points)
    source_pub = source_features.get("publisher")
    candidate_pub = candidate_features.get("publisher")
    if source_pub and candidate_pub and source_pub == candidate_pub:
        score += 15

    return min(score, 100)


async def find_related(
    client: PiveauClient,
    dataset_id: str,
    limit: int = 10,
    min_score: float = 20.0,
) -> dict[str, Any]:
    """Find datasets related to a source dataset.

    Strategy:
    1. Fetch source dataset metadata
    2. Extract themes and keywords
    3. Search for datasets with matching themes
    4. Score each candidate by similarity
    5. Return top N results above minimum score

    Args:
        client: PiveauClient instance
        dataset_id: ID of the source dataset
        limit: Maximum number of related datasets to return
        min_score: Minimum similarity score to include (0-100)

    Returns:
        Dict with:
        - source_id: The input dataset ID
        - source_title: Title of source dataset (if available)
        - features: Extracted features from source
        - related: List of related datasets with similarity scores
        - total_candidates: Number of candidates evaluated
    """
    # Fetch source dataset
    source = await client.get_dataset(dataset_id)

    # Extract features
    features = extract_features(source)

    # Get source title for response
    source_title = None
    title_field = source.get("dct:title") or source.get("title")
    if title_field:
        if isinstance(title_field, list):
            # Multilingual - take first
            first = title_field[0]
            source_title = first.get("@value", str(first)) if isinstance(first, dict) else str(first)
        elif isinstance(title_field, dict):
            source_title = title_field.get("@value", "")
        else:
            source_title = str(title_field)

    # If no themes or keywords, return empty
    if not features["themes"] and not features["keywords"]:
        return {
            "source_id": dataset_id,
            "source_title": source_title,
            "features": features,
            "related": [],
            "total_candidates": 0,
            "note": "No themes or keywords found - unable to find related datasets",
        }

    # Search by themes (primary signal)
    candidates = []
    if features["themes"]:
        # Search for datasets with any of the source themes
        theme_results = await client.search_datasets_advanced(
            facets={"theme": features["themes"]},
            limit=50,  # Fetch more to filter
            page=0,
        )
        candidates.extend(theme_results.get("results", []))

    # If few theme matches, also search by keywords
    if len(candidates) < 20 and features["keywords"]:
        # Use first few keywords as query (most specific)
        keyword_query = " OR ".join(features["keywords"][:5])
        keyword_results = await client.search_datasets_advanced(
            query=keyword_query,
            limit=30,
            page=0,
        )
        candidates.extend(keyword_results.get("results", []))

    # Deduplicate candidates by ID
    seen_ids = {dataset_id}  # Exclude source dataset
    unique_candidates = []
    for candidate in candidates:
        cand_id = candidate.get("@id") or candidate.get("id") or ""
        # Extract ID from URI if needed
        if "/" in cand_id:
            cand_id = cand_id.split("/")[-1]
        if cand_id and cand_id not in seen_ids:
            seen_ids.add(cand_id)
            unique_candidates.append(candidate)

    # Score each candidate
    scored = []
    for candidate in unique_candidates:
        cand_features = extract_features(candidate)
        score = calculate_similarity_score(features, cand_features)

        if score >= min_score:
            # Extract candidate ID and title
            cand_id = candidate.get("@id") or candidate.get("id") or ""
            if "/" in cand_id:
                cand_id = cand_id.split("/")[-1]

            cand_title = None
            title_field = candidate.get("dct:title") or candidate.get("title")
            if title_field:
                if isinstance(title_field, list):
                    first = title_field[0]
                    cand_title = first.get("@value", str(first)) if isinstance(first, dict) else str(first)
                elif isinstance(title_field, dict):
                    cand_title = title_field.get("@value", "")
                else:
                    cand_title = str(title_field)

            scored.append({
                "id": cand_id,
                "title": cand_title,
                "similarity_score": score,
                "matching_themes": list(set(features["themes"]) & set(cand_features["themes"])),
                "matching_keywords": list(set(features["keywords"]) & set(cand_features["keywords"]))[:5],
                "same_publisher": features["publisher"] == cand_features["publisher"] if features["publisher"] else False,
            })

    # Sort by score descending, take top N
    scored.sort(key=lambda x: x["similarity_score"], reverse=True)
    related = scored[:limit]

    return {
        "source_id": dataset_id,
        "source_title": source_title,
        "features": {
            "themes": features["themes"],
            "keywords": features["keywords"][:10],  # Limit for readability
        },
        "related": related,
        "total_candidates": len(unique_candidates),
    }
