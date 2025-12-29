import pytest
from datetime import datetime

from app.models import (
    ValueType,
    IdentifierType,
    Distribution,
    Dataset,
    Catalogue,
    DatasetDraft,
    EligibilityResult,
)


class TestEnums:
    def test_value_type_values(self):
        assert ValueType.URI_REFS.value == "uriRefs"
        assert ValueType.IDENTIFIERS.value == "identifiers"
        assert ValueType.ORIGINAL_IDS.value == "originalIds"
        assert ValueType.METADATA.value == "metadata"

    def test_value_type_is_string_enum(self):
        vt = ValueType.METADATA
        assert str(vt.value) == "metadata"
        assert vt == "metadata"

    def test_identifier_type_values(self):
        assert IdentifierType.EU_RA_DOI.value == "eu-ra-doi"
        assert IdentifierType.MOCK.value == "mock"


class TestDistribution:
    def test_minimal_distribution(self):
        dist = Distribution(id="dist-123")
        assert dist.id == "dist-123"
        assert dist.access_url is None
        assert dist.download_url is None
        assert dist.format is None

    def test_full_distribution(self):
        dist = Distribution(
            id="dist-123",
            access_url="https://example.com/data.csv",
            download_url="https://example.com/data.csv",
            format="CSV",
            media_type="text/csv",
            license="CC-BY-4.0",
            byte_size=1024,
            title={"de": "Daten", "en": "Data"},
            description={"de": "Beschreibung"},
        )
        assert dist.id == "dist-123"
        assert dist.access_url == "https://example.com/data.csv"
        assert dist.format == "CSV"
        assert dist.byte_size == 1024
        assert dist.title == {"de": "Daten", "en": "Data"}

    def test_distribution_with_aliases(self):
        data = {
            "id": "dist-123",
            "accessURL": "https://example.com/data.csv",
            "downloadURL": "https://example.com/data.csv",
            "mediaType": "text/csv",
            "byteSize": 2048,
        }
        dist = Distribution.model_validate(data)
        assert dist.access_url == "https://example.com/data.csv"
        assert dist.download_url == "https://example.com/data.csv"
        assert dist.media_type == "text/csv"
        assert dist.byte_size == 2048

    def test_distribution_string_title(self):
        dist = Distribution(id="dist-123", title="Simple Title")
        assert dist.title == "Simple Title"


class TestDataset:
    def test_minimal_dataset(self):
        ds = Dataset(id="ds-123", title={"de": "Test"})
        assert ds.id == "ds-123"
        assert ds.title == {"de": "Test"}
        assert ds.description is None
        assert ds.keywords == []
        assert ds.distributions == []

    def test_full_dataset(self):
        ds = Dataset(
            id="ds-123",
            title={"de": "Testdatensatz", "en": "Test Dataset"},
            description={"de": "Beschreibung"},
            publisher="Test Publisher",
            issued="2024-01-01",
            modified="2024-01-15",
            keywords=["test", "example"],
            theme=["http://example.org/theme/tech"],
            distributions=[Distribution(id="dist-1", format="CSV")],
            language=["de", "en"],
            spatial=["AT"],
            temporal={"start": "2020-01-01", "end": "2024-01-01"},
            contact_point={"email": "test@example.com"},
            landing_page="https://example.com/dataset",
        )
        assert ds.title == {"de": "Testdatensatz", "en": "Test Dataset"}
        assert len(ds.keywords) == 2
        assert len(ds.distributions) == 1
        assert ds.contact_point == {"email": "test@example.com"}

    def test_dataset_with_datetime(self):
        now = datetime.now()
        ds = Dataset(id="ds-123", title="Test", issued=now)
        assert ds.issued == now

    def test_dataset_string_title(self):
        ds = Dataset(id="ds-123", title="Simple Title")
        assert ds.title == "Simple Title"

    def test_dataset_dict_publisher(self):
        ds = Dataset(
            id="ds-123",
            title="Test",
            publisher={"@id": "https://example.org/pub", "name": "Publisher"},
        )
        assert ds.publisher["@id"] == "https://example.org/pub"


class TestCatalogue:
    def test_minimal_catalogue(self):
        cat = Catalogue(id="cat-123", title={"de": "Katalog"})
        assert cat.id == "cat-123"
        assert cat.title == {"de": "Katalog"}
        assert cat.language == []
        assert cat.themes == []

    def test_full_catalogue(self):
        cat = Catalogue(
            id="cat-123",
            title={"de": "Testkatalog", "en": "Test Catalogue"},
            description={"de": "Ein Testkatalog"},
            publisher="Test Publisher",
            homepage="https://example.com",
            language=["de", "en"],
            issued="2024-01-01",
            modified="2024-01-15",
            spatial=["AT"],
            themes=["tech", "environment"],
        )
        assert cat.homepage == "https://example.com"
        assert len(cat.language) == 2
        assert len(cat.themes) == 2


class TestDatasetDraft:
    def test_minimal_draft(self):
        draft = DatasetDraft(
            title={"de": "Entwurf"},
            description={"de": "Beschreibung"},
        )
        assert draft.title == {"de": "Entwurf"}
        assert draft.description == {"de": "Beschreibung"}
        assert draft.keywords == []

    def test_full_draft(self):
        draft = DatasetDraft(
            title={"de": "Entwurf", "en": "Draft"},
            description={"de": "Beschreibung", "en": "Description"},
            keywords=["test", "draft"],
            theme=["http://example.org/theme"],
            language=["de", "en"],
            publisher={"@id": "https://example.org/pub"},
        )
        assert len(draft.keywords) == 2
        assert draft.publisher == {"@id": "https://example.org/pub"}


class TestEligibilityResult:
    def test_eligible_result(self):
        result = EligibilityResult(
            eligible=True,
            identifier_type="eu-ra-doi",
            message="Dataset is eligible",
        )
        assert result.eligible is True
        assert result.identifier_type == "eu-ra-doi"
        assert result.missing_fields == []

    def test_ineligible_result(self):
        result = EligibilityResult(
            eligible=False,
            identifier_type="eu-ra-doi",
            missing_fields=["publisher", "license"],
            message="Missing required fields",
        )
        assert result.eligible is False
        assert len(result.missing_fields) == 2
        assert "publisher" in result.missing_fields
