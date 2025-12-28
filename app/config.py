"""Configuration via environment variables."""

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings. All prefixed with AUSTRIA_MCP_ in env vars."""

    model_config = SettingsConfigDict(
        env_prefix="AUSTRIA_MCP_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    piveau_api_base: str = Field(default="https://qs.data.gv.at/api/hub/repo")
    piveau_api_key: SecretStr | None = Field(default=None)
    request_timeout: int = Field(default=30, ge=5, le=300)
    user_agent: str = Field(default="Austria-MCP-Agent/1.0")
    log_level: str = Field(default="INFO")

    @property
    def api_key_value(self) -> str | None:
        if self.piveau_api_key:
            return self.piveau_api_key.get_secret_value()
        return None


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
