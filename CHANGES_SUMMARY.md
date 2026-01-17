# API Integration Fix Summary

## Problem

The MCP server was configured to use the wrong API endpoint:
- **Old endpoint**: `https://qs.data.gv.at/api/hub/repo`
- **Issue**: The `/search` endpoint returned 404 errors, making dataset search functionality completely broken

## Solution

Updated the API base URL to the correct search API endpoint:
- **New endpoint**: `https://www.data.gv.at/api/hub/search`

## Changes Made

### 1. Configuration (`app/config.py`)
- Updated `piveau_api_base` default from `https://qs.data.gv.at/api/hub/repo` to `https://www.data.gv.at/api/hub/search`

### 2. Client Response Handling (`app/client.py`)

#### `search_datasets_advanced()` (line 360-369)
- Updated to handle the new API response structure: `{"result": {"count": N, "results": [...]}}`
- Extracts nested result data properly
- Returns consistent format with `results`, `count`, and `facets` keys

#### `list_catalogues()` (line 170-181)
- Removed obsolete `valueType` parameter (not supported by search API)
- Handles response as array of catalogue ID strings
- Converts to dict format `[{"id": "cat-id"}]` for consistency

#### `get_catalogue()` (line 183-188)
- Updated to unwrap `{"result": {...}}` response structure
- Returns catalogue details directly

#### `get_dataset()` (line 215-220)
- Updated to unwrap `{"result": {...}}` response structure
- Returns dataset details directly

### 3. Tool Parameter Mapping (`app/tools/discovery.py`)

#### Line 283
- Fixed facet parameter name: `facets["categories"]` instead of `facets["theme"]`
- The search API uses "categories" not "theme" for EU data theme filtering

## Test Results

All endpoints tested successfully with the new API:

✅ **Search datasets**: 1,368 results for "population"
✅ **Category filtering**: Works with SOCI (Population and society)
✅ **Format filtering**: Works with CSV, JSON, etc.
✅ **Catalogue listing**: Returns 2,408 catalogues
✅ **Catalogue details**: Successfully retrieves Stadt Wien (l9) with 760 datasets
✅ **Dataset details**: Full metadata retrieval working
✅ **Sorting**: Modified date sorting working correctly

## How to Apply Changes

### Option 1: Restart the MCP Server
The simplest way to apply these changes:
```bash
# Stop the current MCP server (Ctrl+C or equivalent)
# Restart it
mcp run
```

### Option 2: Set Environment Variable (Optional)
If you want to override the default in production:
```bash
export AUSTRIA_MCP_PIVEAU_API_BASE="https://www.data.gv.at/api/hub/search"
```

## Verification

Run the test script to verify everything works:
```bash
python test_api.py
```

Expected output:
```
Using API base: https://www.data.gv.at/api/hub/search

============================================================
TEST 1: Search datasets for 'population'
============================================================
[OK] Total results: 1368
[OK] Returned: 3 datasets
...
============================================================
ALL TESTS PASSED!
============================================================
```

## API Documentation

For complete API details, parameter descriptions, and examples, see:
- `API_FINDINGS.md` - Comprehensive API documentation with all endpoints, parameters, and examples

## Breaking Changes

None. The changes are backward compatible:
- All MCP tool interfaces remain the same
- Response formats are consistent
- Only internal implementation updated

## Files Modified

1. `app/config.py` - API base URL configuration
2. `app/client.py` - Response handling for search, catalogue, and dataset endpoints
3. `app/tools/discovery.py` - Facet parameter name correction

## Files Added

1. `API_FINDINGS.md` - Complete API documentation
2. `test_api.py` - Comprehensive test suite
3. `CHANGES_SUMMARY.md` - This file
