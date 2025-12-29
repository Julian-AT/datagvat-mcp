import pytest
from unittest.mock import AsyncMock, MagicMock

from fastmcp import FastMCP, Context

from app.client import PiveauClient
from app.config import Settings
from app.server import AppState


def create_mock_context(client: AsyncMock) -> MagicMock:
    settings = Settings(
        piveau_api_base="https://test.api.at",
        piveau_api_key="test-key",
    )
    app_state = AppState(settings=settings, piveau_client=client)
    ctx = MagicMock(spec=Context)
    ctx.request_context = MagicMock()
    ctx.request_context.lifespan_context = app_state
    return ctx


class TestResourceRegistration:
    def test_resources_registered(self):
        from app.resources import register_resources
        mcp = FastMCP("test")
        register_resources(mcp)
        
        resources = mcp._resource_manager._resources
        assert len(resources) > 0

    def test_catalogues_resource_registered(self):
        from app.resources import register_resources
        mcp = FastMCP("test")
        register_resources(mcp)
        
        resources = mcp._resource_manager._resources
        assert "piveau://catalogues" in resources

    def test_vocabularies_resource_registered(self):
        from app.resources import register_resources
        mcp = FastMCP("test")
        register_resources(mcp)
        
        resources = mcp._resource_manager._resources
        assert "piveau://vocabularies" in resources

    def test_resource_functions_are_callable(self):
        from app.resources import register_resources
        mcp = FastMCP("test")
        register_resources(mcp)
        
        resources = mcp._resource_manager._resources
        for uri, resource in resources.items():
            assert callable(resource.fn), f"Resource {uri} fn is not callable"


class TestResourceTemplates:
    def test_catalogue_template_resource(self):
        from app.resources import register_resources
        mcp = FastMCP("test")
        register_resources(mcp)
        
        templates = mcp._resource_manager._templates
        catalogue_templates = [t for t in templates if "catalogues" in str(t)]
        assert len(catalogue_templates) > 0

    def test_dataset_template_resource(self):
        from app.resources import register_resources
        mcp = FastMCP("test")
        register_resources(mcp)
        
        templates = mcp._resource_manager._templates
        dataset_templates = [t for t in templates if "datasets" in str(t)]
        assert len(dataset_templates) > 0

    def test_vocabulary_template_resource(self):
        from app.resources import register_resources
        mcp = FastMCP("test")
        register_resources(mcp)
        
        templates = mcp._resource_manager._templates
        vocab_templates = [t for t in templates if "vocabularies" in str(t)]
        assert len(vocab_templates) > 0
