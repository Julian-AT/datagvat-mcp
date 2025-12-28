"""Pydantic models for DCAT-AP entities."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ValueType(str, Enum):
    URI_REFS = "uriRefs"
    IDENTIFIERS = "identifiers"
    ORIGINAL_IDS = "originalIds"
    METADATA = "metadata"


class IdentifierType(str, Enum):
    EU_RA_DOI = "eu-ra-doi"
    MOCK = "mock"


class Distribution(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    access_url: str | None = Field(None, alias="accessURL")
    download_url: str | None = Field(None, alias="downloadURL")
    format: str | None = None
    media_type: str | None = Field(None, alias="mediaType")
    license: str | None = None
    byte_size: int | None = Field(None, alias="byteSize")
    title: dict[str, str] | str | None = None
    description: dict[str, str] | str | None = None


class Dataset(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: dict[str, str] | str
    description: dict[str, str] | str | None = None
    publisher: str | dict[str, Any] | None = None
    issued: datetime | str | None = None
    modified: datetime | str | None = None
    keywords: list[str] = Field(default_factory=list)
    theme: list[str] = Field(default_factory=list)
    distributions: list[Distribution] = Field(default_factory=list)
    language: list[str] = Field(default_factory=list)
    spatial: list[str] | str | None = None
    temporal: dict[str, Any] | None = None
    contact_point: dict[str, Any] | None = Field(None, alias="contactPoint")
    landing_page: str | None = Field(None, alias="landingPage")


class Catalogue(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: dict[str, str] | str
    description: dict[str, str] | str | None = None
    publisher: str | dict[str, Any] | None = None
    homepage: str | None = None
    language: list[str] = Field(default_factory=list)
    issued: datetime | str | None = None
    modified: datetime | str | None = None
    spatial: list[str] | str | None = None
    themes: list[str] = Field(default_factory=list)


class DatasetDraft(BaseModel):
    title: dict[str, str]
    description: dict[str, str]
    keywords: list[str] = Field(default_factory=list)
    theme: list[str] = Field(default_factory=list)
    language: list[str] = Field(default_factory=list)
    publisher: dict[str, Any] | None = None


class EligibilityResult(BaseModel):
    eligible: bool
    identifier_type: str
    missing_fields: list[str] = Field(default_factory=list)
    message: str | None = None
