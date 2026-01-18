"""Tests for similarity functionality."""

from unittest.mock import AsyncMock

import pytest

from app.similarity import (
    calculate_similarity_score,
    extract_features,
    find_related,
)


class TestExtractFeatures:
    """Tests for feature extraction from datasets."""

    def test_extract_themes_from_rdf_format(self):
        """Test extracting themes from RDF-style dataset."""
        dataset = {
            "dcat:theme": [
                {"@id": "http://publications.europa.eu/resource/authority/data-theme/AGRI"},
                {"@id": "http://publications.europa.eu/resource/authority/data-theme/ENVI"},
            ]
        }
        features = extract_features(dataset)
        assert set(features["themes"]) == {"AGRI", "ENVI"}

    def test_extract_themes_from_json_format(self):
        """Test extracting themes from JSON-style dataset."""
        dataset = {"theme": ["AGRI", "ENVI"]}
        features = extract_features(dataset)
        assert set(features["themes"]) == {"AGRI", "ENVI"}

    def test_extract_themes_uri_format(self):
        """Test extracting themes from URI strings."""
        dataset = {
            "dcat:theme": [
                "http://example.org/theme/HEAL",
                "http://example.org/theme/SOCI",
            ]
        }
        features = extract_features(dataset)
        assert set(features["themes"]) == {"HEAL", "SOCI"}

    def test_extract_keywords_multilingual(self):
        """Test extracting keywords from multilingual format."""
        dataset = {
            "dcat:keyword": [
                {"@value": "Gesundheit", "@language": "de"},
                {"@value": "Health", "@language": "en"},
            ]
        }
        features = extract_features(dataset)
        assert set(features["keywords"]) == {"gesundheit", "health"}

    def test_extract_keywords_simple(self):
        """Test extracting keywords from simple string list."""
        dataset = {"keyword": ["environment", "climate", "data"]}
        features = extract_features(dataset)
        assert set(features["keywords"]) == {"environment", "climate", "data"}

    def test_extract_publisher_rdf(self):
        """Test extracting publisher from RDF format."""
        dataset = {"dct:publisher": {"@id": "https://example.org/org/12345"}}
        features = extract_features(dataset)
        assert features["publisher"] == "https://example.org/org/12345"

    def test_extract_publisher_string(self):
        """Test extracting publisher from string format."""
        dataset = {"publisher": "org-12345"}
        features = extract_features(dataset)
        assert features["publisher"] == "org-12345"

    def test_extract_empty_dataset(self):
        """Test extracting features from empty dataset."""
        features = extract_features({})
        assert features["themes"] == []
        assert features["keywords"] == []
        assert features["publisher"] is None

    def test_extract_mixed_formats(self):
        """Test extracting from dataset with mixed field formats."""
        dataset = {
            "dcat:theme": [{"@id": "http://example.org/AGRI"}],
            "keyword": ["test"],
            "dct:publisher": {"@id": "org-1"},
        }
        features = extract_features(dataset)
        assert features["themes"] == ["AGRI"]
        assert features["keywords"] == ["test"]
        assert features["publisher"] == "org-1"


class TestCalculateSimilarityScore:
    """Tests for similarity score calculation."""

    def test_identical_features_max_score(self):
        """Test that identical features give high score."""
        features = {
            "themes": ["AGRI", "ENVI"],
            "keywords": ["data", "environment", "agriculture"],
            "publisher": "org-1",
        }
        score = calculate_similarity_score(features, features)
        # 2 themes = 60, 3 keywords = 30, same publisher = 15 -> capped at 100
        assert score == 100

    def test_no_overlap_zero_score(self):
        """Test that no overlap gives zero score."""
        source = {"themes": ["AGRI"], "keywords": ["farm"], "publisher": "org-1"}
        candidate = {"themes": ["TECH"], "keywords": ["software"], "publisher": "org-2"}
        score = calculate_similarity_score(source, candidate)
        assert score == 0

    def test_theme_match_weighted_higher(self):
        """Test that theme matches score higher than keyword matches."""
        source = {"themes": ["AGRI"], "keywords": [], "publisher": None}
        candidate = {"themes": ["AGRI"], "keywords": [], "publisher": None}
        theme_score = calculate_similarity_score(source, candidate)

        source2 = {"themes": [], "keywords": ["data"], "publisher": None}
        candidate2 = {"themes": [], "keywords": ["data"], "publisher": None}
        keyword_score = calculate_similarity_score(source2, candidate2)

        # Theme match (30) should be higher than keyword match (10)
        assert theme_score > keyword_score
        assert theme_score == 30
        assert keyword_score == 10

    def test_publisher_bonus(self):
        """Test that same publisher adds bonus points."""
        source = {"themes": ["AGRI"], "keywords": [], "publisher": "org-1"}
        candidate_same = {"themes": ["AGRI"], "keywords": [], "publisher": "org-1"}
        candidate_diff = {"themes": ["AGRI"], "keywords": [], "publisher": "org-2"}

        score_same = calculate_similarity_score(source, candidate_same)
        score_diff = calculate_similarity_score(source, candidate_diff)

        # Same publisher should add 15 points
        assert score_same == score_diff + 15

    def test_theme_score_capped(self):
        """Test that theme score is capped at 60."""
        source = {"themes": ["AGRI", "ENVI", "HEAL", "TECH"], "keywords": [], "publisher": None}
        candidate = {"themes": ["AGRI", "ENVI", "HEAL", "TECH"], "keywords": [], "publisher": None}
        score = calculate_similarity_score(source, candidate)
        # 4 themes x 30 = 120, but capped at 60
        assert score == 60

    def test_keyword_score_capped(self):
        """Test that keyword score is capped at 30."""
        source = {"themes": [], "keywords": ["a", "b", "c", "d", "e"], "publisher": None}
        candidate = {"themes": [], "keywords": ["a", "b", "c", "d", "e"], "publisher": None}
        score = calculate_similarity_score(source, candidate)
        # 5 keywords x 10 = 50, but capped at 30
        assert score == 30

    def test_total_score_capped_at_100(self):
        """Test that total score is capped at 100."""
        # Max possible: 60 (themes) + 30 (keywords) + 15 (publisher) = 105
        source = {"themes": ["AGRI", "ENVI", "HEAL"], "keywords": ["a", "b", "c", "d"], "publisher": "org-1"}
        score = calculate_similarity_score(source, source)
        assert score == 100

    def test_partial_overlap(self):
        """Test partial overlap scoring."""
        source = {"themes": ["AGRI", "ENVI"], "keywords": ["a", "b", "c"], "publisher": None}
        candidate = {"themes": ["AGRI", "TECH"], "keywords": ["a", "d"], "publisher": None}
        score = calculate_similarity_score(source, candidate)
        # 1 theme match (30) + 1 keyword match (10) = 40
        assert score == 40


class TestFindRelated:
    """Tests for find_related function."""

    @pytest.mark.asyncio
    async def test_find_related_with_themes(self):
        """Test finding related datasets via theme matching."""
        mock_client = AsyncMock()

        # Source dataset
        mock_client.get_dataset.return_value = {
            "dct:title": "Agriculture Data",
            "dcat:theme": [{"@id": "http://example.org/AGRI"}],
            "dcat:keyword": [{"@value": "farming"}],
        }

        # Search results
        mock_client.search_datasets_advanced.return_value = {
            "results": [
                {
                    "@id": "http://example.org/datasets/related-1",
                    "dct:title": "Farm Statistics",
                    "dcat:theme": [{"@id": "http://example.org/AGRI"}],
                    "dcat:keyword": [{"@value": "farming"}],
                },
                {
                    "@id": "http://example.org/datasets/related-2",
                    "dct:title": "Crop Data",
                    "dcat:theme": [{"@id": "http://example.org/AGRI"}],
                    "dcat:keyword": [],
                },
            ],
            "count": 2,
        }

        result = await find_related(mock_client, "source-dataset", limit=10)

        assert result["source_id"] == "source-dataset"
        assert result["source_title"] == "Agriculture Data"
        assert len(result["related"]) == 2
        # First result should score higher (theme + keyword match)
        assert result["related"][0]["similarity_score"] > result["related"][1]["similarity_score"]

    @pytest.mark.asyncio
    async def test_find_related_no_features(self):
        """Test that empty features returns no related datasets."""
        mock_client = AsyncMock()
        mock_client.get_dataset.return_value = {
            "dct:title": "Empty Dataset",
            # No themes or keywords
        }

        result = await find_related(mock_client, "empty-dataset")

        assert result["source_id"] == "empty-dataset"
        assert result["related"] == []
        assert "note" in result
        assert "No themes or keywords" in result["note"]

    @pytest.mark.asyncio
    async def test_find_related_excludes_source(self):
        """Test that source dataset is excluded from results."""
        mock_client = AsyncMock()
        mock_client.get_dataset.return_value = {
            "@id": "http://example.org/datasets/source",
            "dcat:theme": [{"@id": "http://example.org/AGRI"}],
        }
        mock_client.search_datasets_advanced.return_value = {
            "results": [
                {"@id": "http://example.org/datasets/source", "dcat:theme": [{"@id": "http://example.org/AGRI"}]},
                {"@id": "http://example.org/datasets/other", "dcat:theme": [{"@id": "http://example.org/AGRI"}]},
            ],
            "count": 2,
        }

        result = await find_related(mock_client, "source")

        # Source should be excluded, only "other" remains
        assert len(result["related"]) == 1
        assert result["related"][0]["id"] == "other"

    @pytest.mark.asyncio
    async def test_find_related_respects_min_score(self):
        """Test that min_score filters out low-scoring results."""
        mock_client = AsyncMock()
        mock_client.get_dataset.return_value = {
            "dcat:theme": [{"@id": "http://example.org/AGRI"}],
            "dcat:keyword": [{"@value": "farming"}, {"@value": "crops"}],
        }
        mock_client.search_datasets_advanced.return_value = {
            "results": [
                {
                    "@id": "http://example.org/datasets/high-match",
                    "dcat:theme": [{"@id": "http://example.org/AGRI"}],
                    "dcat:keyword": [{"@value": "farming"}, {"@value": "crops"}],
                },
                {
                    "@id": "http://example.org/datasets/low-match",
                    "dcat:theme": [{"@id": "http://example.org/TECH"}],  # Different theme
                    "dcat:keyword": [],
                },
            ],
            "count": 2,
        }

        result = await find_related(mock_client, "source", min_score=30)

        # Only high-match should pass the 30-point threshold
        assert len(result["related"]) == 1
        assert result["related"][0]["id"] == "high-match"

    @pytest.mark.asyncio
    async def test_find_related_respects_limit(self):
        """Test that limit parameter is respected."""
        mock_client = AsyncMock()
        mock_client.get_dataset.return_value = {
            "dcat:theme": [{"@id": "http://example.org/AGRI"}],
        }
        mock_client.search_datasets_advanced.return_value = {
            "results": [
                {"@id": f"http://example.org/datasets/ds-{i}", "dcat:theme": [{"@id": "http://example.org/AGRI"}]}
                for i in range(20)
            ],
            "count": 20,
        }

        result = await find_related(mock_client, "source", limit=5, min_score=0)

        assert len(result["related"]) == 5

    @pytest.mark.asyncio
    async def test_find_related_deduplicates(self):
        """Test that duplicate results are deduplicated."""
        mock_client = AsyncMock()
        mock_client.get_dataset.return_value = {
            "dcat:theme": [{"@id": "http://example.org/AGRI"}],
            "dcat:keyword": [{"@value": "data"}],
        }
        # Simulate same dataset appearing in both theme and keyword search
        mock_client.search_datasets_advanced.side_effect = [
            {
                "results": [
                    {"@id": "http://example.org/datasets/dup", "dcat:theme": [{"@id": "http://example.org/AGRI"}]}
                ],
                "count": 1,
            },
            {
                "results": [{"@id": "http://example.org/datasets/dup", "dcat:keyword": [{"@value": "data"}]}],
                "count": 1,
            },
        ]

        result = await find_related(mock_client, "source", min_score=0)

        # Should have only one result despite appearing twice
        ids = [r["id"] for r in result["related"]]
        assert ids.count("dup") == 1

    @pytest.mark.asyncio
    async def test_find_related_title_extraction(self):
        """Test that titles are properly extracted from various formats."""
        mock_client = AsyncMock()
        mock_client.get_dataset.return_value = {
            "dct:title": [{"@value": "Source Title", "@language": "en"}],
            "dcat:theme": [{"@id": "http://example.org/AGRI"}],
        }
        mock_client.search_datasets_advanced.return_value = {
            "results": [
                {
                    "@id": "http://example.org/datasets/r1",
                    "title": "Simple Title",
                    "dcat:theme": [{"@id": "http://example.org/AGRI"}],
                },
            ],
            "count": 1,
        }

        result = await find_related(mock_client, "source", min_score=0)

        assert result["source_title"] == "Source Title"
        assert result["related"][0]["title"] == "Simple Title"
