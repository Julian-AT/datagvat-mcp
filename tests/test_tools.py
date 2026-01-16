import pytest
from unittest.mock import AsyncMock, MagicMock

from fastmcp import FastMCP, Context

from app.client import PiveauClient, PiveauNotFoundError, PiveauApiError
from app.config import Settings
from app.server import AppState
from app.models import ValueType


def create_mock_context(
    settings: Settings | None = None,
    client: AsyncMock | None = None,
) -> MagicMock:
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
    ctx.request_id = "test-request-123"
    return ctx


class TestListCatalogues:
    async def test_list_catalogues_success(self, sample_catalogues_list: list):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.list_catalogues.return_value = sample_catalogues_list
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)
        
        tools = mcp._tool_manager._tools
        list_catalogues = tools["list_catalogues"].fn
        result = await list_catalogues(ctx, limit=100, offset=0, value_type="metadata")
        
        assert len(result) == 2
        mock_client.list_catalogues.assert_called_once_with(
            limit=100, offset=0, value_type=ValueType.METADATA
        )

    async def test_list_catalogues_with_pagination(self, sample_catalogues_list: list):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.list_catalogues.return_value = sample_catalogues_list[:1]
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)
        
        tools = mcp._tool_manager._tools
        list_catalogues = tools["list_catalogues"].fn
        result = await list_catalogues(ctx, limit=1, offset=5, value_type="metadata")
        
        assert len(result) == 1
        mock_client.list_catalogues.assert_called_once()

    async def test_list_catalogues_reports_progress(self, sample_catalogues_list: list):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.list_catalogues.return_value = sample_catalogues_list
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)
        
        tools = mcp._tool_manager._tools
        list_catalogues = tools["list_catalogues"].fn
        await list_catalogues(ctx, limit=100, offset=0, value_type="metadata")
        
        assert ctx.report_progress.call_count >= 1


class TestGetCatalogue:
    async def test_get_catalogue_success(self, sample_catalogue: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_catalogue.return_value = sample_catalogue
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_catalogue = tools["get_catalogue"].fn
        result = await get_catalogue(ctx, catalogue_id="test-catalogue")
        
        assert result["@id"] == sample_catalogue["@id"]
        mock_client.get_catalogue.assert_called_once_with("test-catalogue")

    async def test_get_catalogue_not_found(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_catalogue.side_effect = PiveauNotFoundError("Not found", 404)
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_catalogue = tools["get_catalogue"].fn
        
        with pytest.raises(PiveauNotFoundError):
            await get_catalogue(ctx, catalogue_id="nonexistent")


class TestSearchDatasets:
    async def test_search_datasets_all(self, sample_datasets_list: list):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": sample_datasets_list,
            "count": 3,
            "facets": {}
        }
        ctx = create_mock_context(client=mock_client)

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        search_datasets = tools["search_datasets"].fn
        result = await search_datasets(ctx, catalogue_id=None, limit=20, page=0)

        assert isinstance(result, dict)
        assert "results" in result
        assert "count" in result
        assert "facets" in result
        assert len(result["results"]) == 3
        assert result["count"] == 3
        mock_client.search_datasets_advanced.assert_called_once()

    async def test_search_datasets_in_catalogue(self, sample_datasets_list: list):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.list_catalogue_datasets.return_value = sample_datasets_list
        ctx = create_mock_context(client=mock_client)

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        search_datasets = tools["search_datasets"].fn
        result = await search_datasets(ctx, catalogue_id="test-cat", limit=20, page=0)

        # Backward compatibility: catalogue_id-only still uses legacy list_catalogue_datasets
        # but returns dict format
        assert isinstance(result, dict)
        assert "results" in result
        assert "count" in result
        assert "facets" in result
        assert len(result["results"]) == 3
        mock_client.list_catalogue_datasets.assert_called_once_with("test-cat", 20, 0)

    async def test_search_datasets_with_query(self, sample_datasets_list: list):
        """Test text query search with fuzzy matching support."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": sample_datasets_list[:1],
            "count": 1,
            "facets": {"theme": {"AGRI": 1}}
        }
        ctx = create_mock_context(client=mock_client)

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        search_datasets = tools["search_datasets"].fn
        result = await search_datasets(
            ctx,
            query="agriculture~",
            limit=20,
            page=0
        )

        assert len(result["results"]) == 1
        assert result["count"] == 1
        call_args = mock_client.search_datasets_advanced.call_args
        assert call_args[1]["query"] == "agriculture~"

    async def test_search_datasets_with_theme_filter(self, sample_datasets_list: list):
        """Test theme filtering with EU DCAT-AP codes."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": sample_datasets_list[:2],
            "count": 2,
            "facets": {
                "theme": {"AGRI": 2},
                "format": {"CSV": 1, "JSON": 1}
            }
        }
        ctx = create_mock_context(client=mock_client)

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        search_datasets = tools["search_datasets"].fn
        result = await search_datasets(
            ctx,
            themes=["AGRI", "ENVI"],
            limit=20,
            page=0
        )

        assert len(result["results"]) == 2
        assert result["count"] == 2
        assert "facets" in result
        call_args = mock_client.search_datasets_advanced.call_args
        assert call_args[1]["facets"] == {"theme": ["AGRI", "ENVI"]}

    async def test_search_datasets_with_multiple_filters(self, sample_datasets_list: list):
        """Test combining query, theme, format, and date filters."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": sample_datasets_list[:1],
            "count": 1,
            "facets": {
                "theme": {"AGRI": 1},
                "format": {"CSV": 1}
            }
        }
        ctx = create_mock_context(client=mock_client)

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        search_datasets = tools["search_datasets"].fn
        result = await search_datasets(
            ctx,
            query="crops",
            themes=["AGRI"],
            formats=["CSV"],
            min_date="2025-01-01",
            max_date="2025-12-31",
            sort_by="modified_desc",
            limit=10,
            page=0
        )

        assert len(result["results"]) == 1
        assert result["count"] == 1

        call_args = mock_client.search_datasets_advanced.call_args
        assert call_args[1]["query"] == "crops"
        assert call_args[1]["facets"] == {"theme": ["AGRI"], "format": ["CSV"]}
        assert call_args[1]["min_date"] == "2025-01-01T00:00:00Z"
        assert call_args[1]["max_date"] == "2025-12-31T23:59:59Z"
        assert call_args[1]["sort"] == "modified+desc"
        assert call_args[1]["limit"] == 10
        assert call_args[1]["page"] == 0

    async def test_search_datasets_sort_options(self, sample_datasets_list: list):
        """Test all 7 sort options map correctly to API format."""
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.search_datasets_advanced.return_value = {
            "results": sample_datasets_list,
            "count": 3,
            "facets": {}
        }
        ctx = create_mock_context(client=mock_client)

        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)

        tools = mcp._tool_manager._tools
        search_datasets = tools["search_datasets"].fn

        # Test relevance sort (default)
        await search_datasets(ctx, sort_by="relevance", limit=20, page=0)
        call_args = mock_client.search_datasets_advanced.call_args
        assert call_args[1]["sort"] == "relevance+desc"

        # Test date sorts
        await search_datasets(ctx, sort_by="modified_desc", limit=20, page=0)
        call_args = mock_client.search_datasets_advanced.call_args
        assert call_args[1]["sort"] == "modified+desc"

        # Test title sort
        await search_datasets(ctx, sort_by="title_asc", limit=20, page=0)
        call_args = mock_client.search_datasets_advanced.call_args
        assert call_args[1]["sort"] == "title+asc"


class TestGetDataset:
    async def test_get_dataset_success(self, sample_dataset: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_dataset.return_value = sample_dataset
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_dataset = tools["get_dataset"].fn
        result = await get_dataset(ctx, dataset_id="test-dataset")
        
        assert result["@id"] == sample_dataset["@id"]


class TestGetDatasetDistributions:
    async def test_get_distributions_success(self, sample_distributions: list):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_distributions.return_value = sample_distributions
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.discovery import register_discovery_tools
        mcp = FastMCP("test")
        register_discovery_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_distributions = tools["get_dataset_distributions"].fn
        result = await get_distributions(ctx, dataset_id="test-dataset", limit=50)
        
        assert len(result) == 2
        mock_client.get_distributions.assert_called_once_with("test-dataset", limit=50)


class TestGetDatasetMetrics:
    async def test_get_metrics_success(self, sample_metrics: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_metrics.return_value = sample_metrics
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.analysis import register_analysis_tools
        mcp = FastMCP("test")
        register_analysis_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_metrics = tools["get_dataset_metrics"].fn
        result = await get_metrics(ctx, dataset_id="test-dataset", include_history=False)
        
        assert result["score"] == 85
        mock_client.get_metrics.assert_called_once_with("test-dataset", historic=False)

    async def test_get_metrics_with_history(self, sample_metrics: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_metrics.return_value = sample_metrics
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.analysis import register_analysis_tools
        mcp = FastMCP("test")
        register_analysis_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_metrics = tools["get_dataset_metrics"].fn
        await get_metrics(ctx, dataset_id="test-dataset", include_history=True)
        
        mock_client.get_metrics.assert_called_once_with("test-dataset", historic=True)


class TestCheckDoiEligibility:
    async def test_check_eligibility_success(self, sample_eligibility: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.check_eligibility.return_value = sample_eligibility
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.analysis import register_analysis_tools
        mcp = FastMCP("test")
        register_analysis_tools(mcp)
        
        tools = mcp._tool_manager._tools
        check_eligibility = tools["check_doi_eligibility"].fn
        result = await check_eligibility(ctx, dataset_id="test-dataset")
        
        assert result["eligible"] is True

    async def test_check_eligibility_invalid_type_defaults(self, sample_eligibility: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.check_eligibility.return_value = sample_eligibility
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.analysis import register_analysis_tools
        mcp = FastMCP("test")
        register_analysis_tools(mcp)
        
        tools = mcp._tool_manager._tools
        check_eligibility = tools["check_doi_eligibility"].fn
        await check_eligibility(ctx, dataset_id="test-dataset", identifier_type="invalid")
        
        mock_client.check_eligibility.assert_called_once_with("test-dataset", "eu-ra-doi")


class TestAnalyzeDatasetQuality:
    async def test_analyze_quality_success(
        self,
        sample_dataset: dict,
        sample_distributions: list,
        sample_metrics: dict,
        sample_eligibility: dict,
    ):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_dataset.return_value = sample_dataset
        mock_client.get_distributions.return_value = sample_distributions
        mock_client.get_metrics.return_value = sample_metrics
        mock_client.check_eligibility.return_value = sample_eligibility
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.analysis import register_analysis_tools
        mcp = FastMCP("test")
        register_analysis_tools(mcp)
        
        tools = mcp._tool_manager._tools
        analyze_quality = tools["analyze_dataset_quality"].fn
        result = await analyze_quality(ctx, dataset_id="test-dataset")
        
        assert result["dataset_id"] == "test-dataset"
        assert "metadata" in result
        assert "distributions" in result
        assert "metrics" in result
        assert "doi_eligibility" in result

    async def test_analyze_quality_handles_errors(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_dataset.side_effect = PiveauApiError("Failed")
        mock_client.get_distributions.side_effect = PiveauApiError("Failed")
        mock_client.get_metrics.side_effect = Exception("Failed")
        mock_client.check_eligibility.side_effect = Exception("Failed")
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.analysis import register_analysis_tools
        mcp = FastMCP("test")
        register_analysis_tools(mcp)
        
        tools = mcp._tool_manager._tools
        analyze_quality = tools["analyze_dataset_quality"].fn
        result = await analyze_quality(ctx, dataset_id="test-dataset")
        
        assert result["dataset_id"] == "test-dataset"
        assert "error" in result["metadata"]
        assert "error" in result["distributions"]
        assert result["metrics"] is None
        assert result["doi_eligibility"] == {"eligible": False}


class TestListDatasetDrafts:
    async def test_list_drafts_success(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.list_drafts.return_value = ["draft-1", "draft-2", "draft-3"]
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.management import register_management_tools
        mcp = FastMCP("test")
        register_management_tools(mcp)
        
        tools = mcp._tool_manager._tools
        list_drafts = tools["list_dataset_drafts"].fn
        result = await list_drafts(ctx, filter_by_provider=False)
        
        assert len(result) == 3
        mock_client.list_drafts.assert_called_once_with(filter_by_provider=False)


class TestCreateDatasetDraft:
    async def test_create_draft_success(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.create_draft.return_value = "new-draft-123"
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.management import register_management_tools
        mcp = FastMCP("test")
        register_management_tools(mcp)
        
        tools = mcp._tool_manager._tools
        create_draft = tools["create_dataset_draft"].fn
        result = await create_draft(
            ctx,
            catalogue_id="test-cat",
            title="New Dataset",
            description="A new dataset",
            language="de",
            keywords=["test"],
        )
        
        assert result["draft_id"] == "new-draft-123"
        assert result["catalogue_id"] == "test-cat"

    async def test_create_draft_payload_structure(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.create_draft.return_value = "draft-123"
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.management import register_management_tools
        mcp = FastMCP("test")
        register_management_tools(mcp)
        
        tools = mcp._tool_manager._tools
        create_draft = tools["create_dataset_draft"].fn
        await create_draft(
            ctx,
            catalogue_id="cat",
            title="Title",
            description="Desc",
            language="en",
            keywords=["a", "b"],
        )
        
        call_args = mock_client.create_draft.call_args
        payload = call_args[0][1]
        assert payload["@type"] == "dcat:Dataset"
        assert payload["dct:title"] == {"en": "Title"}
        assert payload["dct:description"] == {"en": "Desc"}
        assert payload["dcat:keyword"] == ["a", "b"]


class TestUpdateDatasetDraft:
    async def test_update_draft_success(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.update_draft.return_value = None
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.management import register_management_tools
        mcp = FastMCP("test")
        register_management_tools(mcp)
        
        tools = mcp._tool_manager._tools
        update_draft = tools["update_dataset_draft"].fn
        result = await update_draft(
            ctx,
            draft_id="draft-123",
            catalogue_id="test-cat",
            title="Updated Title",
        )
        
        assert result["draft_id"] == "draft-123"
        assert result["status"] == "updated"


class TestDeleteDatasetDraft:
    async def test_delete_draft_success(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.delete_draft.return_value = None
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.management import register_management_tools
        mcp = FastMCP("test")
        register_management_tools(mcp)
        
        tools = mcp._tool_manager._tools
        delete_draft = tools["delete_dataset_draft"].fn
        result = await delete_draft(ctx, draft_id="draft-123", catalogue_id="test-cat")
        
        assert result["status"] == "deleted"
        mock_client.delete_draft.assert_called_once()


class TestPublishDataset:
    async def test_publish_success(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.publish_draft.return_value = None
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.management import register_management_tools
        mcp = FastMCP("test")
        register_management_tools(mcp)
        
        tools = mcp._tool_manager._tools
        publish = tools["publish_dataset"].fn
        result = await publish(ctx, draft_id="draft-123", catalogue_id="test-cat")
        
        assert result["status"] == "published"


class TestHideDataset:
    async def test_hide_success(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.hide_dataset.return_value = None
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.management import register_management_tools
        mcp = FastMCP("test")
        register_management_tools(mcp)
        
        tools = mcp._tool_manager._tools
        hide = tools["hide_dataset"].fn
        result = await hide(ctx, dataset_id="ds-123", catalogue_id="test-cat")
        
        assert result["status"] == "hidden"


class TestListVocabularies:
    async def test_list_vocabularies_success(self, sample_vocabularies_list: list):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.list_vocabularies.return_value = sample_vocabularies_list
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.vocabularies import register_vocabulary_tools
        mcp = FastMCP("test")
        register_vocabulary_tools(mcp)
        
        tools = mcp._tool_manager._tools
        list_vocabs = tools["list_vocabularies"].fn
        result = await list_vocabs(ctx, limit=100, offset=0)
        
        assert len(result) == 2


class TestGetVocabulary:
    async def test_get_vocabulary_success(self, sample_vocabulary: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_vocabulary.return_value = sample_vocabulary
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.vocabularies import register_vocabulary_tools
        mcp = FastMCP("test")
        register_vocabulary_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_vocab = tools["get_vocabulary"].fn
        result = await get_vocab(ctx, vocabulary_id="themes")
        
        assert "hasTopConcept" in result


class TestSearchVocabularyTerms:
    async def test_search_terms_success(self, sample_vocabulary: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_vocabulary.return_value = sample_vocabulary
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.vocabularies import register_vocabulary_tools
        mcp = FastMCP("test")
        register_vocabulary_tools(mcp)
        
        tools = mcp._tool_manager._tools
        search_terms = tools["search_vocabulary_terms"].fn
        result = await search_terms(ctx, vocabulary_id="themes", query="umwelt", language="de")
        
        assert len(result) == 1
        assert result[0]["label"] == "Umwelt"

    async def test_search_terms_case_insensitive(self, sample_vocabulary: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_vocabulary.return_value = sample_vocabulary
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.vocabularies import register_vocabulary_tools
        mcp = FastMCP("test")
        register_vocabulary_tools(mcp)
        
        tools = mcp._tool_manager._tools
        search_terms = tools["search_vocabulary_terms"].fn
        result = await search_terms(ctx, vocabulary_id="themes", query="VERKEHR", language="de")
        
        assert len(result) == 1
        assert result[0]["label"] == "Verkehr"

    async def test_search_terms_no_match(self, sample_vocabulary: dict):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client.get_vocabulary.return_value = sample_vocabulary
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.vocabularies import register_vocabulary_tools
        mcp = FastMCP("test")
        register_vocabulary_tools(mcp)
        
        tools = mcp._tool_manager._tools
        search_terms = tools["search_vocabulary_terms"].fn
        result = await search_terms(ctx, vocabulary_id="themes", query="nonexistent", language="de")
        
        assert len(result) == 0


class TestGetResourceTypes:
    async def test_get_resource_types_list(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client._request.return_value = [{"@id": "type-1"}, {"@id": "type-2"}]
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.vocabularies import register_vocabulary_tools
        mcp = FastMCP("test")
        register_vocabulary_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_types = tools["get_resource_types"].fn
        result = await get_types(ctx)
        
        assert len(result) == 2

    async def test_get_resource_types_graph_wrapper(self):
        mock_client = AsyncMock(spec=PiveauClient)
        mock_client._request.return_value = {"@graph": [{"@id": "type-1"}]}
        ctx = create_mock_context(client=mock_client)
        
        from app.tools.vocabularies import register_vocabulary_tools
        mcp = FastMCP("test")
        register_vocabulary_tools(mcp)
        
        tools = mcp._tool_manager._tools
        get_types = tools["get_resource_types"].fn
        result = await get_types(ctx)
        
        assert len(result) == 1
