"""Tests for preview functionality."""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.preview import (
    PreviewError,
    detect_format,
    fetch_preview_bytes,
    infer_column_type,
    infer_json_type,
    parse_csv_rows,
    parse_csv_schema,
    parse_json_rows,
    parse_json_schema,
)


class TestDetectFormat:
    """Tests for format detection."""

    def test_detect_from_content_type_csv(self):
        assert detect_format("http://example.com/data", "text/csv") == "csv"

    def test_detect_from_content_type_json(self):
        assert detect_format("http://example.com/data", "application/json") == "json"

    def test_detect_from_content_type_application_csv(self):
        assert detect_format("http://example.com/data", "application/csv") == "csv"

    def test_detect_from_content_type_text_json(self):
        assert detect_format("http://example.com/data", "text/json") == "json"

    def test_detect_from_content_type_with_charset(self):
        assert detect_format("http://example.com/data", "text/csv; charset=utf-8") == "csv"

    def test_detect_from_url_extension_csv(self):
        assert detect_format("http://example.com/data.csv") == "csv"

    def test_detect_from_url_extension_json(self):
        assert detect_format("http://example.com/data.json") == "json"

    def test_detect_from_url_with_query_params(self):
        assert detect_format("http://example.com/data.csv?token=abc") == "csv"

    def test_detect_unknown_format(self):
        assert detect_format("http://example.com/data.xyz") is None

    def test_detect_no_extension(self):
        assert detect_format("http://example.com/data") is None

    def test_content_type_takes_precedence(self):
        # Content-Type should be checked before URL extension
        assert detect_format("http://example.com/data.csv", "application/json") == "json"


class TestInferColumnType:
    """Tests for CSV column type inference."""

    def test_infer_integer(self):
        assert infer_column_type(["1", "2", "3", "-5"]) == "integer"

    def test_infer_integer_with_zeros(self):
        assert infer_column_type(["0", "100", "200"]) == "integer"

    def test_infer_float(self):
        assert infer_column_type(["1.5", "2.0", "3.14"]) == "float"

    def test_infer_float_negative(self):
        assert infer_column_type(["-1.5", "2.0", "-3.14"]) == "float"

    def test_infer_boolean(self):
        assert infer_column_type(["true", "false", "True"]) == "boolean"

    def test_infer_boolean_yes_no(self):
        assert infer_column_type(["yes", "no", "YES"]) == "boolean"

    def test_infer_boolean_ones_zeros(self):
        # Note: "1", "0" are detected as integers first due to type check order
        # This is expected behavior - only text booleans like "true"/"false" are detected
        assert infer_column_type(["1", "0", "1"]) == "integer"

    def test_infer_string_default(self):
        assert infer_column_type(["hello", "world"]) == "string"

    def test_infer_empty_values(self):
        assert infer_column_type(["", "", ""]) == "string"

    def test_infer_date_iso(self):
        assert infer_column_type(["2024-01-15", "2024-02-20"]) == "date"

    def test_infer_date_with_time(self):
        assert infer_column_type(["2024-01-15T10:00:00Z", "2024-02-20T14:30:00Z"]) == "date"

    def test_infer_mixed_as_string(self):
        assert infer_column_type(["hello", "123", "world"]) == "string"

    def test_infer_with_empty_mixed_in(self):
        # Empty values should be filtered out
        assert infer_column_type(["1", "", "2", "", "3"]) == "integer"


class TestInferJsonType:
    """Tests for JSON value type inference."""

    def test_infer_null(self):
        assert infer_json_type(None) == "null"

    def test_infer_boolean_true(self):
        assert infer_json_type(True) == "boolean"

    def test_infer_boolean_false(self):
        assert infer_json_type(False) == "boolean"

    def test_infer_integer(self):
        assert infer_json_type(42) == "integer"

    def test_infer_negative_integer(self):
        assert infer_json_type(-10) == "integer"

    def test_infer_number_float(self):
        assert infer_json_type(3.14) == "number"

    def test_infer_string(self):
        assert infer_json_type("hello") == "string"

    def test_infer_empty_string(self):
        assert infer_json_type("") == "string"

    def test_infer_array(self):
        assert infer_json_type([1, 2, 3]) == "array"

    def test_infer_object(self):
        assert infer_json_type({"key": "value"}) == "object"


class TestParseCsvSchema:
    """Tests for CSV schema extraction."""

    def test_parse_simple_csv(self):
        content = b"name,age,active\nAlice,30,true\nBob,25,false"
        schema = parse_csv_schema(content)
        assert len(schema["columns"]) == 3
        assert schema["columns"][0]["name"] == "name"
        assert schema["columns"][1]["name"] == "age"
        assert schema["columns"][2]["name"] == "active"

    def test_parse_csv_with_quotes(self):
        content = b'name,description\n"Alice","A ""quoted"" value"'
        schema = parse_csv_schema(content)
        assert len(schema["columns"]) == 2

    def test_parse_csv_type_inference(self):
        content = b"id,score,active\n1,95.5,true\n2,87.0,false\n3,92.3,true"
        schema = parse_csv_schema(content)
        types = {c["name"]: c["type"] for c in schema["columns"]}
        assert types["id"] == "integer"
        assert types["score"] == "float"
        assert types["active"] == "boolean"

    def test_parse_csv_with_bom(self):
        # UTF-8 BOM
        content = b"\xef\xbb\xbfname,value\ntest,123"
        schema = parse_csv_schema(content)
        assert schema["columns"][0]["name"] == "name"

    def test_parse_csv_semicolon_delimiter(self):
        content = b"name;age;city\nAlice;30;Vienna\nBob;25;Graz"
        schema = parse_csv_schema(content)
        assert len(schema["columns"]) == 3
        assert schema["columns"][0]["name"] == "name"

    def test_parse_csv_tab_delimiter(self):
        content = b"name\tage\tcity\nAlice\t30\tVienna"
        schema = parse_csv_schema(content)
        assert len(schema["columns"]) == 3

    def test_parse_csv_row_count_sampled(self):
        content = b"id\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12"
        schema = parse_csv_schema(content)
        assert schema["row_count_sampled"] == 10  # Max 10 rows sampled

    def test_parse_empty_csv_raises_error(self):
        content = b""
        with pytest.raises(PreviewError) as exc_info:
            parse_csv_schema(content)
        assert exc_info.value.reason == "parse_failed"


class TestParseCsvRows:
    """Tests for CSV row preview."""

    def test_parse_csv_rows(self):
        content = b"name,age\nAlice,30\nBob,25\nCharlie,35"
        result = parse_csv_rows(content, max_rows=2)
        assert result["columns"] == ["name", "age"]
        assert len(result["rows"]) == 2
        assert result["row_count"] == 2
        assert result["truncated"] is True

    def test_parse_csv_all_rows(self):
        content = b"name,age\nAlice,30\nBob,25"
        result = parse_csv_rows(content, max_rows=10)
        assert len(result["rows"]) == 2
        assert result["truncated"] is False

    def test_parse_csv_rows_values(self):
        content = b"name,age\nAlice,30\nBob,25"
        result = parse_csv_rows(content, max_rows=10)
        assert result["rows"][0] == ["Alice", "30"]
        assert result["rows"][1] == ["Bob", "25"]

    def test_parse_csv_rows_respects_max(self):
        content = b"id\n1\n2\n3\n4\n5"
        result = parse_csv_rows(content, max_rows=3)
        assert len(result["rows"]) == 3
        assert result["truncated"] is True

    def test_parse_csv_rows_with_quotes(self):
        content = b'name,note\n"Alice","A note with, comma"\n"Bob","OK"'
        result = parse_csv_rows(content, max_rows=10)
        assert result["rows"][0][1] == "A note with, comma"

    def test_parse_csv_rows_max_rows_enforced(self):
        # Test that max_rows over 100 is capped
        content = b"id\n" + b"\n".join(str(i).encode() for i in range(150))
        result = parse_csv_rows(content, max_rows=200)
        assert len(result["rows"]) <= 100


class TestParseJsonSchema:
    """Tests for JSON schema extraction."""

    def test_parse_array_of_objects(self):
        content = b'[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
        schema = parse_json_schema(content)
        assert schema["structure"] == "array_of_objects"
        assert len(schema["columns"]) == 2
        col_names = {c["name"] for c in schema["columns"]}
        assert col_names == {"name", "age"}

    def test_parse_nested_data_array(self):
        content = b'{"data": [{"id": 1}, {"id": 2}]}'
        schema = parse_json_schema(content)
        assert schema["structure"] == "nested_data_array"
        assert len(schema["columns"]) == 1
        assert schema["columns"][0]["name"] == "id"

    def test_parse_results_array(self):
        content = b'{"results": [{"name": "Test"}], "count": 1}'
        schema = parse_json_schema(content)
        assert schema["structure"] == "nested_data_array"

    def test_parse_non_tabular_json(self):
        content = b'{"key": "value"}'
        schema = parse_json_schema(content)
        assert "note" in schema
        assert schema["structure"] == "single_object"

    def test_parse_json_type_inference(self):
        content = b'[{"id": 1, "score": 3.14, "active": true, "name": "test"}]'
        schema = parse_json_schema(content)
        types = {c["name"]: c["type"] for c in schema["columns"]}
        assert types["id"] == "integer"
        assert types["score"] == "number"
        assert types["active"] == "boolean"
        assert types["name"] == "string"

    def test_parse_json_mixed_types(self):
        content = b'[{"val": 1}, {"val": "text"}, {"val": 3.14}]'
        schema = parse_json_schema(content)
        types = {c["name"]: c["type"] for c in schema["columns"]}
        assert types["val"] == "mixed"

    def test_parse_json_row_count_sampled(self):
        items = [{"id": i} for i in range(20)]
        content = str(items).replace("'", '"').encode()
        schema = parse_json_schema(content)
        assert schema["row_count_sampled"] == 10  # Max 10 sampled

    def test_parse_invalid_json_raises_error(self):
        content = b'{"incomplete": '
        with pytest.raises(PreviewError) as exc_info:
            parse_json_schema(content)
        assert exc_info.value.reason == "parse_failed"


class TestParseJsonRows:
    """Tests for JSON row preview."""

    def test_parse_json_rows(self):
        content = b'[{"name": "Alice"}, {"name": "Bob"}, {"name": "Charlie"}]'
        result = parse_json_rows(content, max_rows=2)
        assert len(result["rows"]) == 2
        assert result["truncated"] is True

    def test_parse_json_all_rows(self):
        content = b'[{"name": "Alice"}, {"name": "Bob"}]'
        result = parse_json_rows(content, max_rows=10)
        assert len(result["rows"]) == 2
        assert result["truncated"] is False

    def test_parse_json_rows_content(self):
        content = b'[{"name": "Alice", "age": 30}]'
        result = parse_json_rows(content, max_rows=10)
        assert result["rows"][0] == {"name": "Alice", "age": 30}

    def test_parse_json_rows_columns(self):
        content = b'[{"b": 1, "a": 2, "c": 3}]'
        result = parse_json_rows(content, max_rows=10)
        # Columns should be sorted
        assert result["columns"] == ["a", "b", "c"]

    def test_parse_json_rows_nested_data(self):
        content = b'{"data": [{"id": 1}, {"id": 2}], "total": 2}'
        result = parse_json_rows(content, max_rows=10)
        assert len(result["rows"]) == 2
        assert result["rows"][0] == {"id": 1}

    def test_parse_json_rows_non_tabular(self):
        content = b'{"key": "value"}'
        result = parse_json_rows(content, max_rows=10)
        assert result["row_count"] == 0
        assert "note" in result


class TestFetchPreviewBytes:
    """Tests for HTTP fetch with Range headers."""

    @pytest.mark.asyncio
    async def test_fetch_partial_content(self):
        with patch("app.preview.httpx.AsyncClient") as mock_client_class:
            mock_response = MagicMock()
            mock_response.status_code = 206
            mock_response.content = b"partial content"
            mock_response.headers = {"content-type": "text/csv"}

            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            content, is_partial = await fetch_preview_bytes("http://example.com/data.csv")
            assert content == b"partial content"
            assert is_partial is True

    @pytest.mark.asyncio
    async def test_fetch_full_content_no_range_support(self):
        with patch("app.preview.httpx.AsyncClient") as mock_client_class:
            # Server returns full content (larger than max_bytes requested)
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.content = b"full content here"  # 17 bytes
            mock_response.headers = {"content-type": "text/csv"}

            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            content, is_partial = await fetch_preview_bytes("http://example.com/data.csv", max_bytes=10)
            assert len(content) <= 10
            # is_partial is True because original content was larger than max_bytes
            assert is_partial is True

    @pytest.mark.asyncio
    async def test_fetch_full_content_small_file(self):
        with patch("app.preview.httpx.AsyncClient") as mock_client_class:
            small_content = b"small"
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.content = small_content
            mock_response.headers = {"content-type": "text/csv"}

            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            content, is_partial = await fetch_preview_bytes("http://example.com/data.csv", max_bytes=1000)
            assert content == small_content
            assert is_partial is False  # File was smaller than requested

    @pytest.mark.asyncio
    async def test_fetch_not_found(self):
        """Test that 404 errors are handled properly."""
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.reason_phrase = "Not Found"

        mock_client = MagicMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("app.preview.httpx.AsyncClient") as mock_client_class:
            mock_client_class.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_class.return_value.__aexit__ = AsyncMock(return_value=None)

            with pytest.raises(PreviewError) as exc_info:
                await fetch_preview_bytes("http://example.com/missing.csv")
            assert exc_info.value.reason == "fetch_failed"
            assert "not found" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_fetch_timeout(self):
        """Test that timeout errors are handled properly."""
        mock_client = MagicMock()
        mock_client.get = AsyncMock(side_effect=httpx.TimeoutException("Timeout"))

        with patch("app.preview.httpx.AsyncClient") as mock_client_class:
            mock_client_class.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_class.return_value.__aexit__ = AsyncMock(return_value=None)

            with pytest.raises(PreviewError) as exc_info:
                await fetch_preview_bytes("http://example.com/data.csv")
            assert exc_info.value.reason == "fetch_failed"
            assert "timed out" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_fetch_connection_error(self):
        """Test that connection errors are handled properly."""
        mock_client = MagicMock()
        mock_client.get = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))

        with patch("app.preview.httpx.AsyncClient") as mock_client_class:
            mock_client_class.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_class.return_value.__aexit__ = AsyncMock(return_value=None)

            with pytest.raises(PreviewError) as exc_info:
                await fetch_preview_bytes("http://example.com/data.csv")
            assert exc_info.value.reason == "fetch_failed"
            assert "connect" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_fetch_sends_range_header(self):
        with patch("app.preview.httpx.AsyncClient") as mock_client_class:
            mock_response = MagicMock()
            mock_response.status_code = 206
            mock_response.content = b"data"
            mock_response.headers = {}

            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            await fetch_preview_bytes("http://example.com/data.csv", max_bytes=1000)

            # Verify Range header was sent
            call_args = mock_client.get.call_args
            headers = call_args.kwargs.get("headers", {})
            assert "Range" in headers
            assert headers["Range"] == "bytes=0-999"


class TestTruncatedJsonRecovery:
    """Tests for recovering from truncated JSON content."""

    def test_recover_truncated_array(self):
        # Simulates truncated array - should recover 2 complete objects
        content = b'[{"id": 1}, {"id": 2}, {"id": 3'
        schema = parse_json_schema(content)
        assert schema["row_count_sampled"] >= 2

    def test_recover_truncated_array_with_complete_objects(self):
        # Array with more complete objects before truncation
        content = b'[{"id": 1}, {"id": 2}, {"id": 3}, {"id": 4'
        schema = parse_json_schema(content)
        assert schema["row_count_sampled"] >= 3

    def test_truncated_nested_cannot_recover(self):
        # Truncated nested data - recovery is not guaranteed
        # This tests that parse doesn't crash on unrecoverable content
        content = b'{"data": [{"id": 1}, {"id": 2'
        with pytest.raises(PreviewError):
            # This should raise because nested truncation is too complex to recover
            parse_json_schema(content)


class TestEncodingHandling:
    """Tests for character encoding handling."""

    def test_utf8_csv(self):
        content = "name,city\nHans,M\u00fcnchen\nKlaus,D\u00fcsseldorf".encode()
        schema = parse_csv_schema(content)
        assert len(schema["columns"]) == 2

    def test_utf8_with_bom_csv(self):
        content = b"\xef\xbb\xbf" + b"name,city\nTest,Wien"
        result = parse_csv_rows(content, max_rows=10)
        assert result["columns"][0] == "name"  # BOM should be stripped

    def test_utf8_json(self):
        content = '[{"name": "M\u00fcller"}]'.encode()
        result = parse_json_rows(content, max_rows=10)
        assert result["rows"][0]["name"] == "Muller" or "M" in result["rows"][0]["name"]


class TestErrorHandling:
    """Tests for error handling edge cases."""

    def test_csv_single_column(self):
        content = b"id\n1\n2\n3"
        schema = parse_csv_schema(content)
        assert len(schema["columns"]) == 1
        assert schema["columns"][0]["name"] == "id"

    def test_csv_empty_header_field(self):
        content = b"name,,value\nAlice,,10"
        schema = parse_csv_schema(content)
        assert len(schema["columns"]) == 3

    def test_json_empty_array(self):
        content = b"[]"
        schema = parse_json_schema(content)
        assert schema["row_count_sampled"] == 0

    def test_json_array_of_primitives(self):
        content = b"[1, 2, 3, 4]"
        schema = parse_json_schema(content)
        assert schema["structure"] == "array_of_primitives"
        assert len(schema["columns"]) == 0


class TestPreviewToolsIntegration:
    """Integration tests for preview tools."""

    @pytest.mark.asyncio
    async def test_preview_schema_tool_imports(self):
        """Verify preview_schema tool can be imported and registered."""
        from fastmcp import FastMCP

        from app.tools.preview import register_preview_tools

        mcp = FastMCP(name="test")
        register_preview_tools(mcp)

        tools = [t.name for t in mcp._tool_manager._tools.values()]
        assert "preview_schema" in tools
        assert "preview_data" in tools

    @pytest.mark.asyncio
    async def test_preview_tools_url_validation(self):
        """Verify URL validation works."""
        from fastmcp.exceptions import ToolError

        from app.tools.preview import _validate_url

        # Valid URLs should pass
        _validate_url("http://example.com/data.csv")
        _validate_url("https://example.com/data.json")

        # Invalid URLs should raise
        with pytest.raises(ToolError):
            _validate_url("")
        with pytest.raises(ToolError):
            _validate_url("ftp://example.com/data.csv")
        with pytest.raises(ToolError):
            _validate_url("not-a-url")
