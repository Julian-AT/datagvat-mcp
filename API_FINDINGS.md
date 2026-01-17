# data.gv.at API Findings

## Summary

The data.gv.at platform uses a **different base URL** for search operations than the one currently configured in the MCP server.

- **Current (incorrect)**: `https://qs.data.gv.at/api/hub/repo`
- **Correct**: `https://www.data.gv.at/api/hub/search`

## Working Endpoints

### 1. Search Datasets
**Endpoint**: `GET https://www.data.gv.at/api/hub/search/search`

**Parameters**:
- `q` (string): Search query
- `filter` (string): Type filter, e.g., "dataset"
- `limit` (int): Results per page (default: 50)
- `page` (int): Page number (0-indexed)
- `sort` (string): Sort criteria, e.g., "relevance+desc,modified+desc,title.de+asc"
- `facets` (JSON string): Facet filters as JSON object
- `facetOperator` (string): "AND" or "OR" for facets within a group
- `facetGroupOperator` (string): "AND" or "OR" between facet groups
- `dataServices` (boolean): Include data services (default: false)
- `includes` (string): Comma-separated list of fields to include in response

**Facet Categories**:
```json
{
  "superCatalog": [],
  "categories": [],      // e.g., ["SOCI", "ENVI"]
  "publisher": [],
  "format": [],          // e.g., ["CSV", "JSON"]
  "catalog": [],         // e.g., ["l9"]
  "keywords": [],
  "country": [],
  "license": []
}
```

**Response Structure**:
```json
{
  "result": {
    "count": 1368,
    "results": [
      {
        "id": "dataset-id",
        "title": {"de": "Title in German"},
        "description": {"de": "Description in German"},
        "keywords": [{"id": "keyword", "label": "Keyword", "language": "de"}],
        "categories": [{"id": "SOCI", "label": {...}}],
        "distributions": [...],
        "publisher": {"name": "Publisher Name", "type": "Agent"},
        "modified": "2025-11-20",
        "catalog": {...},
        ...
      }
    ]
  }
}
```

**Performance Optimization**:
The `includes` parameter significantly reduces response size:
- Without `includes`: ~3110 bytes per result
- With `includes=id,title,description`: ~212 bytes per result (93% reduction)

**Example Requests**:
```bash
# Basic search
https://www.data.gv.at/api/hub/search/search?q=population&limit=10

# With category filter (SOCI = Population and society)
https://www.data.gv.at/api/hub/search/search?q=population&facets={"categories":["SOCI"]}&limit=10

# With format filter
https://www.data.gv.at/api/hub/search/search?q=data&facets={"format":["CSV"]}&limit=10

# Optimized with includes
https://www.data.gv.at/api/hub/search/search?q=test&includes=id,title.de,description.de,modified,distributions.format&limit=10
```

### 2. List Catalogues
**Endpoint**: `GET https://www.data.gv.at/api/hub/search/catalogues`

**Parameters**:
- `limit` (int): Number of catalogues to return

**Response**: Array of catalogue IDs (strings)
```json
["gga-50605", "gga-50606", "l9", ...]
```

**Total**: ~2408 catalogues

### 3. Get Catalogue Details
**Endpoint**: `GET https://www.data.gv.at/api/hub/search/catalogues/{catalogue_id}`

**Response Structure**:
```json
{
  "result": {
    "id": "l9",
    "title": {"de": "Stadt Wien"},
    "description": {"de": "..."},
    "count": 760,
    "modified": "2025-12-30T22:31:24Z",
    "is_part_of": "data-gv-at",
    "issued": "2025-12-23T14:01:17Z",
    ...
  }
}
```

**Example**:
```bash
https://www.data.gv.at/api/hub/search/catalogues/l9
```

### 4. Get Dataset Details
**Endpoint**: `GET https://www.data.gv.at/api/hub/search/datasets/{dataset_id}`

**Response Structure**:
```json
{
  "result": {
    "id": "dataset-id",
    "title": {"de": "..."},
    "description": {"de": "..."},
    "distributions": [...],
    "categories": [...],
    "keywords": [...],
    "publisher": {...},
    "modified": "2025-11-20",
    "catalog": {...},
    ...
  }
}
```

**Example**:
```bash
https://www.data.gv.at/api/hub/search/datasets/17f04f16-1c02-4f94-90e3-e27e92535a83
```

## Data Statistics

- **Total datasets**: 107,966
- **Total catalogues**: 2,408
- **Example catalogue sizes**:
  - l9 (Stadt Wien): 760 datasets

## Category Codes (EU Data Themes)

- `AGRI` - Agriculture, fisheries, forestry and food
- `ECON` - Economy and finance
- `EDUC` - Education, culture and sport
- `ENER` - Energy
- `ENVI` - Environment
- `GOVE` - Government and public sector
- `HEAL` - Health
- `INTR` - International issues
- `JUST` - Justice, legal system and public safety
- `REGI` - Regions and cities
- `SOCI` - Population and society
- `TECH` - Science and technology
- `TRAN` - Transport

## Sort Options

Multiple sort criteria can be combined with commas:
- `relevance+desc` - Relevance score (requires query)
- `relevance+asc` - Reverse relevance
- `modified+desc` - Most recently modified
- `modified+asc` - Oldest modified
- `title.de+asc` - Alphabetical by German title
- `title.de+desc` - Reverse alphabetical
- `issued+desc` - Most recently published
- `issued+asc` - Oldest published

**Example**: `sort=relevance+desc,modified+desc,title.de+asc`

## Required Changes

### 1. Configuration Update
Update `app/config.py`:
```python
piveau_api_base: str = Field(default="https://www.data.gv.at/api/hub/search")
```

### 2. Client Update
Update `app/client.py` `search_datasets_advanced()` method:
- Change endpoint from `/search` to `/search` (already correct path, just wrong base URL)
- Update parameter mapping to match API expectations
- Handle facets as JSON object, not JSON string
- Add support for new parameters: `filter`, `facetOperator`, `facetGroupOperator`, `dataServices`, `includes`

### 3. Response Structure
The search API returns a different structure than expected:
- Response is `{"result": {"count": N, "results": [...]}}` not just `{"results": [...], "count": N}`
- Dataset structure uses different field names in some cases
- Multilingual fields are objects with language keys, e.g., `{"de": "Title"}`

## Test Results

✅ Search with query works: `q=population` → 1,368 results
✅ Facet filtering works: `facets={"categories":["SOCI"]}` → filters correctly
✅ Format filtering works: `facets={"format":["CSV"]}` → 456 results
✅ Pagination works: `limit=2&page=0` → returns 2 results
✅ Sorting works: `sort=modified+desc` → returns most recent first
✅ Field selection works: `includes=id,title,description` → 93% size reduction
✅ Catalogue listing works: Returns 2,408 catalogue IDs
✅ Catalogue details work: Individual catalogue metadata retrieved
✅ Dataset details work: Individual dataset metadata retrieved
