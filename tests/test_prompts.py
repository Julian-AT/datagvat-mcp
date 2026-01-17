
from fastmcp import FastMCP


class TestPromptRegistration:
    def test_all_prompts_registered(self):
        from app.prompts import register_prompts
        mcp = FastMCP("test")
        register_prompts(mcp)
        
        prompts = mcp._prompt_manager._prompts
        prompt_names = list(prompts.keys())
        
        expected_prompts = [
            "dataset_search",
            "quality_audit",
            "publication_checklist",
            "compare_datasets",
            "catalogue_overview",
        ]
        
        for name in expected_prompts:
            assert name in prompt_names, f"Prompt {name} not registered"

    def test_prompts_are_callable(self):
        from app.prompts import register_prompts
        mcp = FastMCP("test")
        register_prompts(mcp)
        
        prompts = mcp._prompt_manager._prompts
        for name, prompt in prompts.items():
            assert callable(prompt.fn), f"Prompt {name} is not callable"

    def test_dataset_search_has_description(self):
        from app.prompts import register_prompts
        mcp = FastMCP("test")
        register_prompts(mcp)
        
        prompts = mcp._prompt_manager._prompts
        assert "dataset_search" in prompts
        assert prompts["dataset_search"].description is not None

    def test_quality_audit_has_description(self):
        from app.prompts import register_prompts
        mcp = FastMCP("test")
        register_prompts(mcp)
        
        prompts = mcp._prompt_manager._prompts
        assert "quality_audit" in prompts
        assert prompts["quality_audit"].description is not None

    def test_publication_checklist_has_description(self):
        from app.prompts import register_prompts
        mcp = FastMCP("test")
        register_prompts(mcp)
        
        prompts = mcp._prompt_manager._prompts
        assert "publication_checklist" in prompts
        assert prompts["publication_checklist"].description is not None

    def test_compare_datasets_has_description(self):
        from app.prompts import register_prompts
        mcp = FastMCP("test")
        register_prompts(mcp)
        
        prompts = mcp._prompt_manager._prompts
        assert "compare_datasets" in prompts
        assert prompts["compare_datasets"].description is not None

    def test_catalogue_overview_has_description(self):
        from app.prompts import register_prompts
        mcp = FastMCP("test")
        register_prompts(mcp)
        
        prompts = mcp._prompt_manager._prompts
        assert "catalogue_overview" in prompts
        assert prompts["catalogue_overview"].description is not None
