from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastmcp.exceptions import ToolError

from app.client import PiveauApiError, PiveauAuthError, PiveauClient, PiveauNotFoundError
from app.models import IdentifierType


class TestPiveauClientInit:
    def test_init_with_defaults(self):
        client = PiveauClient(base_url="https://api.example.com")
        assert client.base_url == "https://api.example.com"
        assert client.api_key is None
        assert client._client is not None

    def test_init_with_all_options(self):
        client = PiveauClient(
            base_url="https://api.example.com/",
            api_key="test-key",
            timeout=60,
            user_agent="Custom-Agent/2.0",
        )
        assert client.base_url == "https://api.example.com"
        assert client.api_key == "test-key"

    def test_init_strips_trailing_slash(self):
        client = PiveauClient(base_url="https://api.example.com///")
        assert client.base_url == "https://api.example.com"


class TestPiveauClientContextManager:
    async def test_context_manager_enter_exit(self):
        async with PiveauClient(base_url="https://api.example.com") as client:
            assert client is not None
            assert isinstance(client, PiveauClient)

    async def test_close_method(self):
        client = PiveauClient(base_url="https://api.example.com")
        with patch.object(client._client, "aclose", new_callable=AsyncMock) as mock_close:
            await client.close()
            mock_close.assert_called_once()


class TestPiveauClientRequest:
    @pytest.fixture
    def client(self) -> PiveauClient:
        return PiveauClient(base_url="https://api.example.com", api_key="test-key")

    async def test_request_success_json_response(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{"key": "value"}'
        mock_response.json.return_value = {"key": "value"}
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client._request("GET", "/test")
            assert result == {"key": "value"}
            mock_request.assert_called_once()

    async def test_request_with_auth_header(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{}'
        mock_response.json.return_value = {}
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            await client._request("GET", "/protected", require_auth=True)
            call_kwargs = mock_request.call_args.kwargs
            assert call_kwargs["headers"]["X-API-Key"] == "test-key"

    async def test_request_require_auth_no_key_raises(self):
        client = PiveauClient(base_url="https://api.example.com")
        with pytest.raises(PiveauAuthError) as exc_info:
            await client._request("GET", "/protected", require_auth=True)
        assert exc_info.value.status_code == 401
        assert "API key required" in str(exc_info.value)

    async def test_request_404_raises_not_found(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 404
        mock_response.text = "Not Found"
        mock_response.json.side_effect = ValueError()
        http_error = httpx.HTTPStatusError("404", request=MagicMock(), response=mock_response)
        mock_response.raise_for_status.side_effect = http_error
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            with pytest.raises(PiveauNotFoundError) as exc_info:
                await client._request("GET", "/nonexistent")
            assert exc_info.value.status_code == 404

    async def test_request_401_raises_auth_error(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_response.json.side_effect = ValueError()
        http_error = httpx.HTTPStatusError("401", request=MagicMock(), response=mock_response)
        mock_response.raise_for_status.side_effect = http_error
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            with pytest.raises(PiveauAuthError) as exc_info:
                await client._request("GET", "/protected")
            assert exc_info.value.status_code == 401

    async def test_request_500_raises_api_error(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_response.json.side_effect = ValueError()
        http_error = httpx.HTTPStatusError("500", request=MagicMock(), response=mock_response)
        mock_response.raise_for_status.side_effect = http_error

        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            with pytest.raises(ToolError) as exc_info:
                await client._request("GET", "/error")
            assert "server error (500)" in str(exc_info.value)

    async def test_request_connection_error(self, client: PiveauClient):
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = httpx.ConnectError("Connection failed")
            with pytest.raises(ToolError) as exc_info:
                await client._request("GET", "/test")
            assert "Piveau API unavailable" in str(exc_info.value)


class TestPiveauClientParseResponse:
    @pytest.fixture
    def client(self) -> PiveauClient:
        return PiveauClient(base_url="https://api.example.com")

    async def test_parse_json_response(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.headers = {"content-type": "application/json; charset=utf-8"}
        mock_response.content = b'{"key": "value"}'
        mock_response.json.return_value = {"key": "value"}
        result = await client._parse_response(mock_response)
        assert result == {"key": "value"}

    async def test_parse_ld_json_response(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.headers = {"content-type": "application/ld+json"}
        mock_response.content = b'{"@context": {}}'
        mock_response.json.return_value = {"@context": {}}
        result = await client._parse_response(mock_response)
        assert result == {"@context": {}}

    async def test_parse_empty_response(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b""
        result = await client._parse_response(mock_response)
        assert result == {}


class TestPiveauClientCatalogueOperations:
    @pytest.fixture
    def client(self) -> PiveauClient:
        return PiveauClient(base_url="https://api.example.com")

    async def test_list_catalogues(self, client: PiveauClient, sample_catalogues_list: list):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        # API returns array of ID strings
        mock_response.content = b'["cat-1", "cat-2"]'
        mock_response.json.return_value = ["cat-1", "cat-2"]
        mock_response.raise_for_status = MagicMock()

        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.list_catalogues(limit=10, offset=0)
            assert len(result) == 2
            assert result[0] == {"id": "cat-1"}
            assert result[1] == {"id": "cat-2"}
            mock_request.assert_called_once()
            call_kwargs = mock_request.call_args.kwargs
            assert call_kwargs["params"]["limit"] == 10
            assert call_kwargs["params"]["offset"] == 0

    async def test_list_catalogues_with_graph_wrapper(self, client: PiveauClient):
        response_data = {"@graph": [{"@id": "cat-1"}, {"@id": "cat-2"}]}
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{"@graph": []}'
        mock_response.json.return_value = response_data
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.list_catalogues()
            assert len(result) == 2

    async def test_get_catalogue(self, client: PiveauClient, sample_catalogue: dict):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{}'
        mock_response.json.return_value = sample_catalogue
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.get_catalogue("test-catalogue")
            assert result["@id"] == sample_catalogue["@id"]
            call_kwargs = mock_request.call_args.kwargs
            assert "/catalogues/test-catalogue" in call_kwargs["url"]


class TestPiveauClientDatasetOperations:
    @pytest.fixture
    def client(self) -> PiveauClient:
        return PiveauClient(base_url="https://api.example.com")

    async def test_list_datasets(self, client: PiveauClient, sample_datasets_list: list):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'[]'
        mock_response.json.return_value = sample_datasets_list
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.list_datasets(limit=20)
            assert len(result) == 3

    async def test_get_dataset(self, client: PiveauClient, sample_dataset: dict):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{}'
        mock_response.json.return_value = sample_dataset
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.get_dataset("test-dataset")
            assert result["@id"] == sample_dataset["@id"]

    async def test_get_distributions(self, client: PiveauClient, sample_distributions: list):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'[]'
        mock_response.json.return_value = sample_distributions
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.get_distributions("test-dataset")
            assert len(result) == 2

    async def test_get_metrics(self, client: PiveauClient, sample_metrics: dict):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{}'
        mock_response.json.return_value = sample_metrics
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.get_metrics("test-dataset", historic=True)
            assert result["score"] == 85
            call_kwargs = mock_request.call_args.kwargs
            assert call_kwargs["params"]["historic"] == "true"


class TestPiveauClientDraftOperations:
    @pytest.fixture
    def client(self) -> PiveauClient:
        return PiveauClient(base_url="https://api.example.com", api_key="test-key")

    async def test_list_drafts(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'[]'
        mock_response.json.return_value = ["draft-1", "draft-2"]
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.list_drafts()
            assert result == ["draft-1", "draft-2"]

    async def test_create_draft_with_location_header(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 201
        mock_response.headers = {"Location": "/drafts/datasets/new-draft-123"}
        mock_response.json.return_value = {}
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            result = await client.create_draft("test-catalogue", {"@type": "dcat:Dataset"})
            assert result == "new-draft-123"

    async def test_delete_draft(self, client: PiveauClient):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 204
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b''
        mock_response.json.return_value = {}
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            await client.delete_draft("draft-123", "test-catalogue")
            call_kwargs = mock_request.call_args.kwargs
            assert call_kwargs["method"] == "DELETE"


class TestPiveauClientVocabularyOperations:
    @pytest.fixture
    def client(self) -> PiveauClient:
        return PiveauClient(base_url="https://api.example.com")

    async def test_list_vocabularies(self, client: PiveauClient, sample_vocabularies_list: list):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'[]'
        mock_response.json.return_value = sample_vocabularies_list
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.list_vocabularies()
            assert len(result) == 2

    async def test_get_vocabulary(self, client: PiveauClient, sample_vocabulary: dict):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{}'
        mock_response.json.return_value = sample_vocabulary
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.get_vocabulary("themes")
            assert "hasTopConcept" in result
            assert len(result["hasTopConcept"]) == 3


class TestPiveauClientEligibility:
    @pytest.fixture
    def client(self) -> PiveauClient:
        return PiveauClient(base_url="https://api.example.com")

    async def test_check_eligibility(self, client: PiveauClient, sample_eligibility: dict):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{}'
        mock_response.json.return_value = sample_eligibility
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.check_eligibility("test-dataset", IdentifierType.EU_RA_DOI)
            assert result["eligible"] is True

    async def test_check_eligibility_with_string_type(self, client: PiveauClient, sample_eligibility: dict):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.content = b'{}'
        mock_response.json.return_value = sample_eligibility
        mock_response.raise_for_status = MagicMock()
        
        with patch.object(client._client, "request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await client.check_eligibility("test-dataset", "eu-ra-doi")
            assert result["eligible"] is True
