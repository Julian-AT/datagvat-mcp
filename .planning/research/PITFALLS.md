# Pitfalls Research

**Researched:** 2026-01-16
**Scope:** MCP server advanced features, FastMCP sampling/files/progress, government data API integration
**Confidence:** HIGH for MCP protocol pitfalls (official docs), MEDIUM for FastMCP-specific (code analysis), MEDIUM for DCAT-AP (training + codebase)

## Executive Summary

This document identifies common mistakes when adding advanced features to MCP servers and integrating with government data APIs like Piveau Hub (DCAT-AP). The research covers three risk domains: (1) MCP protocol compliance issues that break interoperability, (2) FastMCP-specific misuse of sampling, progress reporting, and file handling, and (3) DCAT-AP/RDF parsing edge cases that cause data quality degradation.

**Critical risk areas for Austria MCP v1.1+:**
- Sampling misuse can create security vulnerabilities and poor UX
- Progress reporting without proper completion handling causes client confusion
- JSON-LD `@graph` extraction has multiple failure modes already present in codebase
- Search implementations often fail on multilingual content and special characters

## Critical Pitfalls

| Pitfall | Warning Signs | Prevention | Phase | Severity |
|---------|---------------|------------|-------|----------|
| Sampling without human-in-the-loop | Server initiates LLM calls autonomously | Always design for user approval; use `modelPreferences` not hardcoded models | FastMCP Features | Critical |
| Missing `isError: true` on tool failures | Users see success with error messages in text | Return `isError: true` in result for all business logic failures | Enterprise Error Handling | Critical |
| JSON-LD `@graph` extraction assumes list | Runtime errors on single-object graphs | Handle both `@graph` as list and direct object; current `_extract_list` is partial | Search Phase | High |
| Hardcoded API timeouts without retries | Transient failures become permanent errors | Implement exponential backoff; current 30s timeout has no retry | Enterprise Error Handling | High |
| Multilingual search ignores user locale | German queries return English-only results | Extract and prioritize `de` locale from DCAT-AP multilingual fields | Search Phase | High |

## MCP Protocol Pitfalls

### 1. Two-Tier Error Handling Confusion

**What goes wrong:** The MCP protocol has two distinct error handling mechanisms that are often conflated:
1. **Protocol errors** (JSON-RPC level): Unknown tools, invalid arguments, server errors
2. **Tool execution errors** (`isError: true`): API failures, business logic errors, invalid data

**Current codebase issue:** The `PiveauApiError` exceptions bubble up but may not consistently set `isError: true` in MCP responses. FastMCP may convert some to protocol errors incorrectly.

**Warning signs:**
- Users report "tool succeeded but showed an error"
- LLM retries tools that actually failed
- Audit logs show errors without corresponding MCP isError responses

**Prevention:**
```python
# WRONG: Return error as text content without isError
return {"error": "API rate limit exceeded"}

# RIGHT: FastMCP's ToolError or explicit isError handling
from fastmcp.exceptions import ToolError
raise ToolError("API rate limit exceeded")
```

**Phase:** Enterprise Error Handling (structured error responses)

**Severity:** Critical

---

### 2. Progress Reporting Without Completion Guarantee

**What goes wrong:** Progress reporting starts but operation fails mid-stream, leaving clients in indeterminate state.

**Current codebase issue:** `list_catalogues` calls `ctx.report_progress(0, 1, "Fetching...")` then `ctx.report_progress(1, 1, "Retrieved N")` but if `list_catalogues` raises between these calls, client may never see completion.

**Warning signs:**
- Progress bars stuck at intermediate values
- Clients timeout waiting for completion
- Operations appear hung but have actually failed

**Prevention:**
```python
# WRONG: Progress without exception handling
async def list_catalogues(ctx: Context, ...):
    await ctx.report_progress(0, 1, "Starting...")
    result = await client.list_catalogues()  # Can raise!
    await ctx.report_progress(1, 1, "Done")
    return result

# RIGHT: Ensure progress completes on all paths
async def list_catalogues(ctx: Context, ...):
    await ctx.report_progress(0, 1, "Starting...")
    try:
        result = await client.list_catalogues()
        await ctx.report_progress(1, 1, f"Retrieved {len(result)} items")
        return result
    except Exception as e:
        await ctx.report_progress(1, 1, f"Failed: {e}")
        raise
```

**Phase:** FastMCP Features (progress reporting)

**Severity:** High

---

### 3. Missing outputSchema in Tool Definitions

**What goes wrong:** Without `outputSchema`, clients and LLMs cannot validate or properly parse structured responses. This causes:
- Inconsistent response handling
- LLM parsing errors on complex structures
- Poor developer experience

**Current codebase issue:** Tools return `dict[str, Any]` without schema. FastMCP may not enforce or generate output schemas automatically.

**Warning signs:**
- LLMs ask "what format is this in?" after tool calls
- Client-side parsing errors on valid responses
- Documentation gaps for tool outputs

**Prevention:**
- Define Pydantic response models for all tools
- Use FastMCP's schema generation from return type annotations
- Document expected response structure in tool descriptions

**Phase:** Enterprise Error Handling (schema validation)

**Severity:** Medium

---

### 4. Tool Annotation Misuse

**What goes wrong:** Tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) are informational hints, not enforcement mechanisms. Servers trust them to guide LLM behavior but they cannot prevent misuse.

**Current codebase issue:** Uses annotations correctly but AuthMiddleware enforcement is custom, not protocol-standard.

**Warning signs:**
- LLMs call destructive tools without user confirmation
- Read-only tools somehow modify state
- Idempotent tools behave differently on retry

**Prevention:**
- Never rely solely on annotations for security
- Implement server-side enforcement (as AuthMiddleware does)
- Annotations guide LLM behavior, not replace access control

**Phase:** N/A (already handled)

**Severity:** Medium

---

## Sampling-Specific Pitfalls

### 5. Hardcoding Model Names in Sampling Requests

**What goes wrong:** Server requests `claude-3-sonnet` specifically but client uses OpenAI or a different provider. Request fails or returns unexpected results.

**Warning signs:**
- Sampling works in dev, fails in production
- "Model not found" errors in sampling responses
- Different behavior across MCP client implementations

**Prevention:**
```python
# WRONG: Hardcoded model
sampling_params = {
    "modelPreferences": {
        "hints": [{"name": "claude-3-5-sonnet-20241022"}]
    }
}

# RIGHT: Flexible hints with priority signals
sampling_params = {
    "modelPreferences": {
        "hints": [
            {"name": "claude"},
            {"name": "gpt"}
        ],
        "intelligencePriority": 0.7,  # Need capable model
        "speedPriority": 0.5,
        "costPriority": 0.3
    }
}
```

**Phase:** FastMCP Features (sampling for recommendations)

**Severity:** High

---

### 6. Sampling Without User Approval Handling

**What goes wrong:** Server assumes sampling will succeed, doesn't handle rejection. User denies sampling request, server crashes or hangs.

**Warning signs:**
- Unhandled exceptions when users deny sampling
- Features broken for users who disable sampling
- No fallback behavior when sampling unavailable

**Prevention:**
```python
try:
    recommendation = await ctx.sample(messages=[...])
except SamplingDeniedError:
    # Graceful degradation
    return {"recommendation": "Unable to provide AI recommendation", "fallback": True}
except SamplingError as e:
    logger.warning(f"Sampling failed: {e}")
    return {"recommendation": "Recommendation unavailable", "error": str(e)}
```

**Phase:** FastMCP Features (sampling for recommendations)

**Severity:** High

---

### 7. Nested Sampling Chains Without Visibility

**What goes wrong:** Tool A calls sampling, which triggers Tool B, which calls sampling again. Users cannot see the full chain, costs escalate, latency compounds.

**Warning signs:**
- Unexpectedly high latency for simple operations
- Token usage much higher than expected
- User approval fatigue (multiple prompts for single action)

**Prevention:**
- Limit sampling depth (no sampling from within sampled responses)
- Surface all sampling requests to user in single approval
- Log sampling chain for debugging
- Consider caching sampling results for repeated patterns

**Phase:** FastMCP Features

**Severity:** Medium

---

## API Integration Pitfalls (Piveau Hub / DCAT-AP)

### 8. JSON-LD `@graph` Extraction Fails on Edge Cases

**What goes wrong:** DCAT-AP responses can return:
- `{"@graph": [...]}` (array of objects)
- `{"@graph": {...}}` (single object, rare but valid)
- Direct object without `@graph` wrapper
- Empty responses

**Current codebase issue:** `_extract_list()` handles list and `@graph` but may fail on edge cases:
```python
def _extract_list(self, result: Any) -> list[dict[str, Any]]:
    if isinstance(result, list):
        return result
    if isinstance(result, dict) and "@graph" in result:
        return result["@graph"]  # Assumes list!
    return []
```

**Warning signs:**
- Empty results when API has data
- Type errors on certain datasets
- Inconsistent behavior across different catalogues

**Prevention:**
```python
def _extract_list(self, result: Any) -> list[dict[str, Any]]:
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        graph = result.get("@graph")
        if graph is not None:
            if isinstance(graph, list):
                return graph
            elif isinstance(graph, dict):
                return [graph]  # Single object in graph
        # Maybe the dict itself is the result
        if "@id" in result or "@type" in result:
            return [result]
    return []
```

**Phase:** Search Phase (data extraction reliability)

**Severity:** High

---

### 9. RDF Parsing Silently Falls Back to Raw Content

**What goes wrong:** `_parse_rdf()` catches all exceptions and returns `{"_raw": content}`. Caller doesn't know parsing failed, proceeds with corrupted data structure.

**Current codebase issue:**
```python
def _parse_rdf(self, content: str, content_type: str) -> dict[str, Any]:
    try:
        graph = Graph()
        graph.parse(data=content, format=rdf_format)
        return json.loads(graph.serialize(format="json-ld"))
    except Exception as e:
        logger.warning(f"RDF parse failed: {e}")
        return {"_raw": content}  # Silent degradation!
```

**Warning signs:**
- Tools return `{"_raw": "..."}` instead of structured data
- Downstream code fails on missing expected keys
- Inconsistent response formats

**Prevention:**
- Make RDF parse failures explicit (raise or return error structure)
- Add `_parse_success: bool` field to response
- Log parse failures at ERROR level, not WARNING
- Consider separate code paths for RDF vs JSON responses

**Phase:** Enterprise Error Handling

**Severity:** Medium

---

### 10. Multilingual Fields Handled Inconsistently

**What goes wrong:** DCAT-AP fields like `dct:title` can be:
- String: `"My Dataset"`
- Language map: `{"de": "Mein Datensatz", "en": "My Dataset"}`
- RDF literal with language tag
- Array of above

**Current codebase issue:** Models define `title: dict[str, str] | str` but extraction logic varies. `search_vocabulary_terms` handles this, other tools may not.

**Warning signs:**
- Search returns fewer results than expected
- Titles display as `{"de": "...", "en": "..."}` instead of localized string
- German users see English content or vice versa

**Prevention:**
- Create standardized `extract_localized(data, field, locale="de")` helper
- Always extract user's preferred locale with fallback chain: `de` -> `en` -> first available
- Apply consistently across all tools and resources

**Phase:** Search Phase

**Severity:** Medium

---

### 11. Rate Limiting Without Backoff Causes Cascading Failures

**What goes wrong:** Piveau Hub may rate-limit requests. Without backoff, rapid retries hit limits harder, causing longer outages.

**Current codebase issue:** No retry logic. Single 30s timeout, no backoff.

**Warning signs:**
- Errors spike then persist for minutes
- All users affected simultaneously
- API returns 429 but server keeps hammering

**Prevention:**
```python
# Use tenacity or custom retry logic
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(httpx.HTTPStatusError)
)
async def _request(self, ...):
    ...
```

**Phase:** Enterprise Error Handling

**Severity:** High

---

### 12. DCAT-AP URI vs ID Confusion

**What goes wrong:** DCAT-AP uses `@id` with full URIs like `https://data.gv.at/katalog/my-dataset`. API paths use short IDs like `my-dataset`. Mixing these causes 404s.

**Current codebase issue:** Tools accept `dataset_id: str` but don't validate or extract short ID from URI.

**Warning signs:**
- "Not found" errors for datasets that exist
- Users copy `@id` from one tool, paste into another, it fails
- Inconsistent ID formats in responses

**Prevention:**
```python
def normalize_id(id_or_uri: str) -> str:
    """Extract short ID from full URI or return as-is if already short."""
    if id_or_uri.startswith("http"):
        return id_or_uri.rstrip("/").split("/")[-1]
    return id_or_uri
```

**Phase:** Search Phase (robustness)

**Severity:** Medium

---

## Search Implementation Pitfalls

### 13. Client-Side Search Without Index Causes O(n) Scans

**What goes wrong:** `search_vocabulary_terms` fetches entire vocabulary, then filters in Python. With large vocabularies, this is slow and doesn't scale.

**Current codebase issue:**
```python
async def search_vocabulary_terms(...):
    vocab_data = await client.get_vocabulary(vocabulary_id)  # Fetch all
    # ... loop through all terms checking query ...
```

**Warning signs:**
- Search latency grows with vocabulary size
- High memory usage during search
- Timeouts on large vocabularies

**Prevention:**
- Use API-side search if available (`?q=` parameter)
- If client-side required, implement pagination
- Consider caching vocabulary data with TTL
- Add `limit` parameter to cap results early

**Phase:** Search Phase

**Severity:** Medium

---

### 14. Fuzzy Search Matches Too Broadly or Too Narrowly

**What goes wrong:** Simple `query.lower() in label.lower()` matches:
- "data" matches "Metadata" (too broad)
- "Umwelt" doesn't match "Umweltdaten" typo (too narrow)

**Warning signs:**
- Users complain results are irrelevant
- Exact matches buried under partial matches
- Typos return zero results

**Prevention:**
- Implement ranking: exact > prefix > contains > fuzzy
- Use established fuzzy matching (rapidfuzz, thefuzz)
- Add minimum score threshold
- Weight title matches higher than description matches

**Phase:** Search Phase (relevance)

**Severity:** High

---

### 15. Search Ignores DCAT-AP Controlled Vocabularies

**What goes wrong:** User searches for "environment" but datasets use EU vocabulary URI `http://publications.europa.eu/resource/authority/data-theme/ENVI`. Text search finds nothing.

**Current codebase issue:** No vocabulary-aware search. Theme filtering would need URI mapping.

**Warning signs:**
- Theme/category filters return no results
- Users must know exact vocabulary URIs
- Natural language queries miss categorized datasets

**Prevention:**
- Build theme label -> URI mapping from vocabulary API
- Expand search queries with vocabulary synonyms
- Support both labels and URIs in filter parameters

**Phase:** Search Phase (filtering)

**Severity:** Medium

---

### 16. Special Characters Break Search

**What goes wrong:** Searches containing `&`, `+`, `%`, quotes, or Unicode cause:
- URL encoding errors
- Regex injection (if using regex)
- Empty results due to escaping issues

**Warning signs:**
- Certain searches always fail
- Users report "search is broken"
- Errors in logs with encoded characters

**Prevention:**
- Sanitize and escape all search inputs
- Use parameterized queries not string interpolation
- Test with: `"Gewässer & Umwelt"`, `"50% Förderung"`, `"Nötig"`

**Phase:** Search Phase

**Severity:** Medium

---

## FastMCP-Specific Pitfalls

### 17. Lifespan Context Access Race Conditions

**What goes wrong:** Tools access `ctx.request_context.lifespan_context` but lifespan may not be fully initialized, especially in edge cases or tests.

**Current codebase issue:** `get_app_state()` assumes lifespan_context is always an `AppState`. No None check.

**Warning signs:**
- `AttributeError: 'NoneType' has no attribute 'piveau_client'`
- Intermittent failures on server startup
- Tests fail without proper fixture setup

**Prevention:**
```python
def get_app_state(ctx: Context) -> "AppState":
    state = ctx.request_context.lifespan_context
    if state is None:
        raise RuntimeError("Server not fully initialized")
    return state
```

**Phase:** Enterprise Error Handling

**Severity:** Medium

---

### 18. Middleware Order Affects Behavior

**What goes wrong:** Middleware executes in registration order. If AuditMiddleware logs before AuthMiddleware rejects, logs show "started" for unauthorized requests.

**Current codebase issue:** Order is `[AuditMiddleware(), AuthMiddleware()]`. Audit logs unauthorized attempts which may be desired, but execution order matters.

**Warning signs:**
- Unexpected log entries for rejected requests
- Auth checks appear to run after other middleware
- Debugging middleware interactions is confusing

**Prevention:**
- Document middleware order explicitly
- Test middleware interaction scenarios
- Consider: Auth before Audit (fewer logs) vs Audit before Auth (security audit trail)

**Phase:** N/A (design decision, document it)

**Severity:** Low

---

### 19. Resource Limits Hidden in Hardcoded Values

**What goes wrong:** Resources like `catalogues_resource` hardcode `limit=1000`. If > 1000 catalogues exist, users get truncated results silently.

**Current codebase issue:**
```python
@mcp.resource("piveau://catalogues")
async def catalogues_resource(ctx: Context) -> list[dict[str, Any]]:
    return await client.list_catalogues(limit=1000)  # Hardcoded!
```

**Warning signs:**
- Resources return exactly 1000/100 items
- Users report missing data
- No pagination in resource responses

**Prevention:**
- Resources should return reasonable defaults but document limits
- Consider adding pagination to resource URIs: `piveau://catalogues?page=2`
- Or implement MCP resource pagination if protocol supports

**Phase:** FastMCP Features

**Severity:** Medium

---

## Observability Pitfalls

### 20. Correlation IDs Not Propagated to External APIs

**What goes wrong:** Request has `request_id` from MCP client but HTTP calls to Piveau don't include it. When API errors occur, cannot correlate with client request.

**Current codebase issue:** `AuditMiddleware` extracts request_id but `PiveauClient` doesn't send it in headers.

**Warning signs:**
- Cannot trace requests end-to-end
- API errors logged without context
- Debugging requires timestamp correlation

**Prevention:**
```python
# Add correlation header to external requests
headers["X-Request-ID"] = correlation_id
headers["X-Correlation-ID"] = correlation_id
```

**Phase:** Enterprise Error Handling (logging)

**Severity:** Medium

---

## Phase Mapping Summary

| Phase | Pitfalls to Address |
|-------|---------------------|
| **Search Phase** | #8 JSON-LD extraction, #10 Multilingual fields, #12 URI vs ID, #13 O(n) search, #14 Fuzzy matching, #15 Vocabulary awareness, #16 Special characters |
| **Enterprise Error Handling** | #1 Two-tier errors, #2 Progress completion, #3 Output schemas, #9 RDF fallback, #11 Rate limiting, #17 Lifespan races, #20 Correlation IDs |
| **FastMCP Features** | #5 Model hardcoding, #6 Sampling rejection, #7 Nested sampling, #19 Resource limits |

## Sources

### Primary (HIGH confidence)
- MCP Protocol Specification - Tools: https://modelcontextprotocol.io/docs/concepts/tools
  - Two-tier error handling, outputSchema, annotations, protocol compliance
- MCP Protocol Specification - Sampling: https://modelcontextprotocol.io/docs/concepts/sampling
  - Human-in-the-loop, model preferences, security considerations

### Secondary (MEDIUM confidence)
- Current codebase analysis (`app/client.py`, `app/tools/*.py`, `app/middleware.py`)
  - Identified existing patterns and gaps
- DCAT-AP specification knowledge (training data)
  - JSON-LD structures, multilingual handling, controlled vocabularies

### Tertiary (LOW confidence - needs validation)
- FastMCP-specific behavior inferred from code patterns
  - Progress reporting semantics, lifespan context access
- Search relevance patterns from general knowledge
  - Fuzzy matching strategies, ranking algorithms

## Metadata

**Confidence breakdown:**
- MCP Protocol: HIGH - Official documentation fetched
- API Integration: MEDIUM - Codebase analysis + DCAT-AP knowledge
- FastMCP Specifics: MEDIUM - Inferred from code patterns
- Search Implementation: MEDIUM - General patterns, not project-specific testing

**Research date:** 2026-01-16
**Valid until:** 2026-02-16 (30 days - stable domain, protocol unlikely to change)
