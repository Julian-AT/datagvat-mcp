import os
import pytest
from unittest.mock import patch

from pydantic import SecretStr

from app.config import Settings, get_settings


class TestSettings:
    def test_default_values(self):
        with patch.dict(os.environ, {}, clear=True):
            settings = Settings()
            assert settings.piveau_api_base == "https://qs.data.gv.at/api/hub/repo"
            assert settings.piveau_api_key is None
            assert settings.request_timeout == 30
            assert settings.user_agent == "Austria-MCP-Agent/1.0"
            assert settings.log_level == "INFO"

    def test_env_prefix(self):
        env_vars = {
            "AUSTRIA_MCP_PIVEAU_API_BASE": "https://custom.api.at/hub",
            "AUSTRIA_MCP_PIVEAU_API_KEY": "my-secret-key",
            "AUSTRIA_MCP_REQUEST_TIMEOUT": "60",
            "AUSTRIA_MCP_USER_AGENT": "Custom-Agent/2.0",
            "AUSTRIA_MCP_LOG_LEVEL": "DEBUG",
        }
        with patch.dict(os.environ, env_vars, clear=True):
            settings = Settings()
            assert settings.piveau_api_base == "https://custom.api.at/hub"
            assert settings.piveau_api_key is not None
            assert settings.piveau_api_key.get_secret_value() == "my-secret-key"
            assert settings.request_timeout == 60
            assert settings.user_agent == "Custom-Agent/2.0"
            assert settings.log_level == "DEBUG"

    def test_api_key_is_secret(self):
        env_vars = {"AUSTRIA_MCP_PIVEAU_API_KEY": "secret-key-123"}
        with patch.dict(os.environ, env_vars, clear=True):
            settings = Settings()
            assert isinstance(settings.piveau_api_key, SecretStr)
            assert "secret-key-123" not in str(settings.piveau_api_key)
            assert "secret-key-123" not in repr(settings.piveau_api_key)

    def test_api_key_value_property(self):
        env_vars = {"AUSTRIA_MCP_PIVEAU_API_KEY": "my-api-key"}
        with patch.dict(os.environ, env_vars, clear=True):
            settings = Settings()
            assert settings.api_key_value == "my-api-key"

    def test_api_key_value_none_when_not_set(self):
        with patch.dict(os.environ, {}, clear=True):
            settings = Settings()
            assert settings.api_key_value is None

    def test_timeout_validation_minimum(self):
        env_vars = {"AUSTRIA_MCP_REQUEST_TIMEOUT": "3"}
        with patch.dict(os.environ, env_vars, clear=True):
            with pytest.raises(ValueError):
                Settings()

    def test_timeout_validation_maximum(self):
        env_vars = {"AUSTRIA_MCP_REQUEST_TIMEOUT": "500"}
        with patch.dict(os.environ, env_vars, clear=True):
            with pytest.raises(ValueError):
                Settings()

    def test_timeout_valid_range(self):
        for timeout in [5, 30, 150, 300]:
            env_vars = {"AUSTRIA_MCP_REQUEST_TIMEOUT": str(timeout)}
            with patch.dict(os.environ, env_vars, clear=True):
                settings = Settings()
                assert settings.request_timeout == timeout

    def test_extra_env_vars_ignored(self):
        env_vars = {
            "AUSTRIA_MCP_UNKNOWN_SETTING": "value",
            "AUSTRIA_MCP_LOG_LEVEL": "DEBUG",
        }
        with patch.dict(os.environ, env_vars, clear=True):
            settings = Settings()
            assert settings.log_level == "DEBUG"
            assert not hasattr(settings, "unknown_setting")


class TestGetSettings:
    def test_get_settings_returns_settings(self):
        import app.config
        app.config._settings = None
        settings = get_settings()
        assert isinstance(settings, Settings)

    def test_get_settings_cached(self):
        import app.config
        app.config._settings = None
        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1 is settings2

    def test_get_settings_after_reset(self):
        import app.config
        app.config._settings = None
        settings1 = get_settings()
        app.config._settings = None
        settings2 = get_settings()
        assert settings1 is not settings2
