"""Test suite for semantic search functionality."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastmcp import FastMCP, Context
from fastmcp.exceptions import ToolError

from app.semantic import expand_natural_query, semantic_search, detect_language
from app.client import PiveauClient
from app.config import Settings
from app.server import AppState


def create_mock_context(
    settings: Settings | None = None,
    client: AsyncMock | None = None,
) -> MagicMock:
    """Create a mock FastMCP context for testing."""
    if settings is None:
        settings = Settings(
            piveau_api_base="https://test.api.at",
            piveau_api_key="test-key",
        )
    if client is None:
        client = AsyncMock(spec=PiveauClient)

    app_state = AppState(settings=settings, piveau_client=client)
    ctx = MagicMock(spec=Context)
    ctx.request_context = MagicMock()
    ctx.request_context.lifespan_context = app_state
    ctx.report_progress = AsyncMock()
    ctx.sample = AsyncMock()
    ctx.request_id = "test-request-123"
    return ctx


class TestDetectLanguage:
    """Test language detection functionality."""

    def test_detect_language_german_clear(self):
        """Test detection of clear German text."""
        query = "Gesundheitsdaten aus Wien für die Forschung"
        result = detect_language(query)
        assert result == "de"

    def test_detect_language_german_with_articles(self):
        """Test German detection with definite articles."""
        query = "der Datensatz von dem österreichischen Ministerium"
        result = detect_language(query)
        assert result == "de"

    def test_detect_language_english_clear(self):
        """Test detection of clear English text."""
        query = "health data from Vienna for research"
        result = detect_language(query)
        assert result == "en"

    def test_detect_language_english_no_german(self):
        """Test English detection when no German indicators present."""
        query = "transport dataset about economy"
        result = detect_language(query)
        assert result == "en"

    def test_detect_language_mixed_unclear(self):
        """Test auto detection for unclear cases."""
        query = "data mining algorithms"
        result = detect_language(query)
        assert result in ("en", "auto")  # Either English or uncertain

    def test_detect_language_empty_query(self):
        """Test handling of empty/minimal queries."""
        query = ""
        result = detect_language(query)
        assert result == "auto"


class TestExpandNaturalQuery:
    """Test natural language query expansion functionality."""

    @pytest.mark.asyncio
    async def test_expand_english_query_success(self):
        """Test successful expansion of English query."""
        ctx = create_mock_context()

        # Mock LLM response
        mock_response = json.dumps({
            "query": "health vienna medical",
            "themes": ["HEAL", "REGI"],
            "keywords": ["health", "vienna", "medical"],
            "filters": {},
            "expansion_confidence": "high"
        })
        ctx.sample.return_value = mock_response

        result = await expand_natural_query(ctx, "health data from Vienna")

        assert result["query"] == "health vienna medical"
        assert result["themes"] == ["HEAL", "REGI"]
        assert result["keywords"] == ["health", "vienna", "medical"]
        assert result["expansion_confidence"] == "high"
        assert result["original_query"] == "health data from Vienna"
        assert result["detected_language"] == "en"

    @pytest.mark.asyncio
    async def test_expand_german_query_success(self):
        """Test successful expansion of German query."""
        ctx = create_mock_context()

        # Mock LLM response for German
        mock_response = json.dumps({
            "query": "gesundheit wien medizin",
            "themes": ["HEAL", "REGI"],
            "keywords": ["gesundheit", "wien", "medizin"],
            "filters": {},
            "expansion_confidence": "high"
        })
        ctx.sample.return_value = mock_response

        result = await expand_natural_query(ctx, "Gesundheitsdaten aus Wien", "de")

        assert result["query"] == "gesundheit wien medizin"
        assert result["themes"] == ["HEAL", "REGI"]
        assert result["detected_language"] == "de"

    @pytest.mark.asyncio
    async def test_expand_query_auto_detect(self):
        """Test auto language detection during expansion."""
        ctx = create_mock_context()

        mock_response = json.dumps({
            "query": "transport wien öffentlich",
            "themes": ["TRAN", "REGI"],
            "keywords": ["transport", "wien", "öffentlich"],
            "filters": {},
            "expansion_confidence": "medium"
        })
        ctx.sample.return_value = mock_response

        result = await expand_natural_query(ctx, "öffentliche Verkehrsdaten aus Wien")

        assert result["detected_language"] == "de"  # Should detect German
        assert result["expansion_confidence"] == "medium"

    @pytest.mark.asyncio
    async def test_expand_query_with_filters(self):
        """Test expansion that includes format/publisher filters."""
        ctx = create_mock_context()

        mock_response = json.dumps({
            "query": "economy statistics csv",
            "themes": ["ECON"],
            "keywords": ["economy", "statistics", "csv"],
            "filters": {"formats": ["CSV"]},
            "expansion_confidence": "high"
        })
        ctx.sample.return_value = mock_response

        result = await expand_natural_query(ctx, "economic statistics in CSV format")

        assert result["filters"] == {"formats": ["CSV"]}
        assert result["themes"] == ["ECON"]

    @pytest.mark.asyncio
    async def test_expand_query_invalid_themes_filtered(self):
        """Test that invalid theme codes are filtered out."""
        ctx = create_mock_context()

        mock_response = json.dumps({
            "query": "health education data",
            "themes": ["HEAL", "EDUC", "INVALID", "heal"],  # Mix of valid, invalid, lowercase
            "keywords": ["health", "education"],
            "filters": {},
            "expansion_confidence": "medium"
        })
        ctx.sample.return_value = mock_response

        result = await expand_natural_query(ctx, "health and education datasets")

        # Should keep only valid themes, uppercase them
        assert set(result["themes"]) == {"HEAL", "EDUC"}

    @pytest.mark.asyncio
    async def test_expand_query_json_parse_failure(self):
        """Test fallback when LLM returns invalid JSON."""
        ctx = create_mock_context()

        # Mock invalid JSON response
        ctx.sample.return_value = "This is not valid JSON: {broken"

        result = await expand_natural_query(ctx, "health data from Vienna")

        # Should return fallback structure
        assert result["expansion_confidence"] == "fallback"
        assert result["query"] == "health data from Vienna"
        assert result["original_query"] == "health data from Vienna"
        assert result["keywords"] == ["health", "data", "from", "Vienna"]

    @pytest.mark.asyncio
    async def test_expand_query_llm_sampling_failure(self):
        """Test fallback when LLM sampling raises exception."""
        ctx = create_mock_context()

        # Mock LLM failure
        ctx.sample.side_effect = Exception("LLM service unavailable")

        result = await expand_natural_query(ctx, "environment data")

        # Should return fallback structure
        assert result["expansion_confidence"] == "fallback"
        assert result["query"] == "environment data"
        assert result["themes"] == []

    @pytest.mark.asyncio
    async def test_expand_query_partial_json_response(self):
        """Test handling of partial/incomplete JSON from LLM."""
        ctx = create_mock_context()

        # Mock incomplete response (missing some fields)
        mock_response = json.dumps({
            "query": "education datasets",
            "themes": ["EDUC"]
            # Missing keywords, filters, expansion_confidence
        })
        ctx.sample.return_value = mock_response

        result = await expand_natural_query(ctx, "education data for schools")

        # Should fill in missing fields with defaults
        assert result["query"] == "education datasets"
        assert result["themes"] == ["EDUC"]
        assert isinstance(result["keywords"], list)
        assert result["expansion_confidence"] == "medium"  # Default


class TestSemanticSearch:
    """Test semantic search integration functionality."""

    @pytest.mark.asyncio
    async def test_semantic_search_success_with_client(self):
        """Test successful semantic search with provided client."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": [{"id": "test-dataset", "title": "Health Data Vienna"}],
            "count": 1,
            "facets": {"theme": {"HEAL": 1}}
        }

        ctx = create_mock_context(client=mock_client)

        # Mock successful expansion
        with patch('app.semantic.expand_natural_query') as mock_expand:
            mock_expand.return_value = {
                "query": "health vienna medical",
                "themes": ["HEAL", "REGI"],
                "keywords": ["health", "vienna"],
                "filters": {},
                "original_query": "health data from Vienna",
                "detected_language": "en",
                "expansion_confidence": "high"
            }

            result = await semantic_search(ctx, "health data from Vienna", client=mock_client)

            # Check that search was called with expanded parameters
            mock_client.search_datasets_advanced.assert_called_once()
            call_args = mock_client.search_datasets_advanced.call_args
            assert call_args[1]["query"] == "health vienna medical"
            assert set(call_args[1]["themes"]) == {"HEAL", "REGI"}

            # Check expansion info is included
            assert "expansion_info" in result
            assert result["expansion_info"]["original_query"] == "health data from Vienna"
            assert result["expansion_info"]["confidence"] == "high"

    @pytest.mark.asyncio
    async def test_semantic_search_without_client(self):
        """Test semantic search with auto-created client."""
        ctx = create_mock_context()

        # Mock the client from dependencies
        with patch('app.dependencies.get_piveau_client') as mock_get_client:
            mock_client = AsyncMock(spec=PiveauClient)
            mock_client.search_datasets_advanced.return_value = {
                "results": [],
                "count": 0,
                "facets": {}
            }
            mock_get_client.return_value = mock_client

            with patch('app.semantic.expand_natural_query') as mock_expand:
                mock_expand.return_value = {
                    "query": "transport data",
                    "themes": ["TRAN"],
                    "keywords": ["transport"],
                    "filters": {},
                    "original_query": "transport information",
                    "detected_language": "en",
                    "expansion_confidence": "medium"
                }

                result = await semantic_search(ctx, "transport information")

                # Should have called get_piveau_client
                mock_get_client.assert_called_once_with(ctx)
                # Should have called search
                mock_client.search_datasets_advanced.assert_called_once()

    @pytest.mark.asyncio
    async def test_semantic_search_merge_explicit_filters(self):
        """Test merging of explicit filters with semantic expansion."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": [],
            "count": 0,
            "facets": {}
        }

        ctx = create_mock_context(client=mock_client)

        with patch('app.semantic.expand_natural_query') as mock_expand:
            mock_expand.return_value = {
                "query": "health data",
                "themes": ["HEAL"],
                "keywords": ["health"],
                "filters": {"formats": ["CSV"]},  # Semantic detected CSV
                "original_query": "health data",
                "detected_language": "en",
                "expansion_confidence": "high"
            }

            # Call with explicit themes and formats
            result = await semantic_search(
                ctx,
                "health data",
                client=mock_client,
                themes=["REGI"],  # Explicit theme
                formats=["JSON"],  # Explicit format
                publishers=["org-123"]
            )

            # Check merging
            call_args = mock_client.search_datasets_advanced.call_args
            assert set(call_args[1]["themes"]) == {"HEAL", "REGI"}  # Merged
            assert set(call_args[1]["formats"]) == {"CSV", "JSON"}  # Merged
            assert call_args[1]["publishers"] == ["org-123"]  # Explicit only

    @pytest.mark.asyncio
    async def test_semantic_search_low_confidence_fallback(self):
        """Test fallback to original query for low confidence expansion."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": [],
            "count": 0,
            "facets": {}
        }

        ctx = create_mock_context(client=mock_client)

        with patch('app.semantic.expand_natural_query') as mock_expand:
            mock_expand.return_value = {
                "query": "unclear expanded query",
                "themes": [],
                "keywords": ["unclear"],
                "filters": {},
                "original_query": "some unclear request",
                "detected_language": "auto",
                "expansion_confidence": "low"
            }

            result = await semantic_search(ctx, "some unclear request", client=mock_client)

            # Should use original query instead of expanded
            call_args = mock_client.search_datasets_advanced.call_args
            assert call_args[1]["query"] == "some unclear request"

    @pytest.mark.asyncio
    async def test_semantic_search_expansion_failure_fallback(self):
        """Test fallback when semantic expansion fails completely."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": [{"id": "fallback-result"}],
            "count": 1,
            "facets": {}
        }

        ctx = create_mock_context(client=mock_client)

        # First call (expansion) fails, second call (fallback) succeeds
        with patch('app.semantic.expand_natural_query') as mock_expand:
            mock_expand.side_effect = Exception("Expansion service down")

            result = await semantic_search(ctx, "test query", client=mock_client)

            # Should still return results from fallback search
            assert len(result["results"]) == 1
            assert result["expansion_info"]["confidence"] == "fallback"

    @pytest.mark.asyncio
    async def test_semantic_search_total_failure(self):
        """Test when both semantic and fallback search fail."""
        mock_client = AsyncMock(spec=PiveauClient)

        ctx = create_mock_context(client=mock_client)

        # Both expansion and fallback fail
        with patch('app.semantic.expand_natural_query') as mock_expand:
            mock_expand.side_effect = Exception("Expansion failed")
            mock_client.search_datasets_advanced.side_effect = Exception("Search API down")

            with pytest.raises(ToolError) as exc_info:
                await semantic_search(ctx, "test query", client=mock_client)

            assert "Both semantic and fallback search failed" in str(exc_info.value)


class TestSemanticSearchDatasetsTool:
    """Test the semantic_search_datasets MCP tool."""

    @pytest.mark.asyncio
    async def test_semantic_search_datasets_tool_success(self):
        """Test successful execution of semantic_search_datasets tool."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": [
                {"id": "dataset-1", "title": "Health Survey Vienna"},
                {"id": "dataset-2", "title": "Medical Statistics Austria"}
            ],
            "count": 2,
            "facets": {"theme": {"HEAL": 2}}
        }

        ctx = create_mock_context(client=mock_client)

        # Register tools and get semantic search tool
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        semantic_tool = tools["semantic_search_datasets"].fn

        # Mock semantic search function
        with patch('app.tools.discovery.semantic_search') as mock_semantic:
            mock_semantic.return_value = {
                "results": mock_client.search_datasets_advanced.return_value["results"],
                "count": 2,
                "facets": {"theme": {"HEAL": 2}},
                "expansion_info": {
                    "original_query": "health data from Vienna",
                    "expanded_query": "health vienna medical",
                    "semantic_themes": ["HEAL", "REGI"],
                    "semantic_keywords": ["health", "vienna"],
                    "confidence": "high",
                    "language": "en"
                }
            }

            result = await semantic_tool(
                ctx=ctx,
                natural_query="health data from Vienna",
                limit=20
            )

            # Verify tool called semantic_search correctly
            mock_semantic.assert_called_once()
            call_args = mock_semantic.call_args
            assert call_args[1]["query"] == "health data from Vienna"
            assert call_args[1]["limit"] == 20

            # Check result structure
            assert len(result["results"]) == 2
            assert result["count"] == 2
            assert "expansion_info" in result

    @pytest.mark.asyncio
    async def test_semantic_search_datasets_tool_with_filters(self):
        """Test tool with additional explicit filters."""
        ctx = create_mock_context()

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        semantic_tool = tools["semantic_search_datasets"].fn

        with patch('app.tools.discovery.semantic_search') as mock_semantic:
            mock_semantic.return_value = {
                "results": [],
                "count": 0,
                "facets": {},
                "expansion_info": {"confidence": "medium"}
            }

            result = await semantic_tool(
                ctx=ctx,
                natural_query="economic data",
                themes=["ECON", "GOVE"],
                formats=["CSV"],
                min_date="2024-01-01",
                boost_quality=False
            )

            # Verify all parameters passed through
            call_args = mock_semantic.call_args
            assert call_args[1]["themes"] == ["ECON", "GOVE"]
            assert call_args[1]["formats"] == ["CSV"]
            assert call_args[1]["min_date"] == "2024-01-01"
            assert call_args[1]["boost_quality"] is False

    @pytest.mark.asyncio
    async def test_semantic_search_datasets_tool_progress_reporting(self):
        """Test progress reporting functionality."""
        ctx = create_mock_context()

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        semantic_tool = tools["semantic_search_datasets"].fn

        with patch('app.tools.discovery.semantic_search') as mock_semantic:
            mock_semantic.return_value = {
                "results": [{"id": "test"}],
                "count": 1,
                "facets": {},
                "expansion_info": {
                    "confidence": "high",
                    "semantic_themes": ["HEAL", "REGI"]
                }
            }

            await semantic_tool(ctx=ctx, natural_query="health data Vienna")

            # Check progress reporting calls
            assert ctx.report_progress.call_count >= 2

            # First call should be about understanding query
            first_call = ctx.report_progress.call_args_list[0]
            assert "Understanding your natural language query" in first_call[0][2]

            # Last call should include results summary
            last_call = ctx.report_progress.call_args_list[-1]
            assert "Found 1 datasets" in last_call[0][2]
            assert "AI detected themes: HEAL, REGI" in last_call[0][2]

    @pytest.mark.asyncio
    async def test_semantic_search_datasets_tool_error_handling(self):
        """Test error handling in semantic search tool."""
        ctx = create_mock_context()

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        semantic_tool = tools["semantic_search_datasets"].fn

        with patch('app.tools.discovery.semantic_search') as mock_semantic:
            mock_semantic.side_effect = Exception("Search service unavailable")

            with pytest.raises(ToolError) as exc_info:
                await semantic_tool(ctx=ctx, natural_query="test query")

            assert "Failed to perform semantic search" in str(exc_info.value)
            assert "test query" in str(exc_info.value)


# Integration tests for coverage

class TestSemanticIntegration:
    """Integration tests to ensure high coverage."""

    def test_detect_language_edge_cases(self):
        """Test edge cases for language detection."""
        # Mixed language query
        assert detect_language("health Gesundheit data") in ("de", "en", "auto")

        # Very short query
        assert detect_language("data") in ("en", "auto")

        # Query with numbers and symbols
        assert detect_language("data-2024 #health") in ("en", "auto")

    @pytest.mark.asyncio
    async def test_expand_natural_query_edge_cases(self):
        """Test edge cases for query expansion."""
        ctx = create_mock_context()

        # Empty response from LLM
        ctx.sample.return_value = ""
        result = await expand_natural_query(ctx, "test")
        assert result["expansion_confidence"] == "fallback"

        # Response that's valid JSON but missing required fields
        ctx.sample.return_value = "{}"
        result = await expand_natural_query(ctx, "test")
        assert result["query"] == "test"  # Fallback to original

    @pytest.mark.asyncio
    async def test_semantic_search_coverage_branches(self):
        """Test remaining branches for full coverage."""
        mock_client = AsyncMock(spec=PiveauClient)
        ctx = create_mock_context()

        # Test with None client and patch get_piveau_client to succeed
        with patch('app.dependencies.get_piveau_client') as mock_get_client:
            mock_get_client.return_value = mock_client
            mock_client.search_datasets_advanced.return_value = {"results": [], "count": 0}

            with patch('app.semantic.expand_natural_query') as mock_expand:
                mock_expand.return_value = {
                    "query": "test",
                    "themes": [],
                    "keywords": [],
                    "filters": {},
                    "original_query": "test",
                    "detected_language": "en",
                    "expansion_confidence": "fallback"
                }

                result = await semantic_search(ctx, "test", client=None)
                assert result is not None