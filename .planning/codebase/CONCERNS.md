# Codebase Concerns

**Analysis Date:** 2025-01-16

## Tech Debt

**Direct Access to Private Client Method:**
- Issue: Tools bypass the public API by calling `client._request()` directly instead of going through proper public methods
- Files: `app/tools/discovery.py:94`, `app/tools/vocabularies.py:91`
- Impact: Tightly couples tools to internal implementation details; refactoring the client could break these tools
- Fix approach: Add public methods `get_catalogue_record()` and `list_resources()` to `PiveauClient` class in `app/client.py`

**Global Mutable Settings Singleton:**
- Issue: Settings use a global mutable singleton pattern with `_settings` module variable
- Files: `app/config.py:30-37`
- Impact: Makes testing harder (must reset global state); prevents running multiple server instances with different configurations
- Fix approach: Pass settings explicitly through dependency injection rather than using global state; already partially done via lifespan context but `get_settings()` still used at startup

**Bare Exception Handlers:**
- Issue: Multiple bare `except Exception:` clauses that swallow all errors silently
- Files: `app/client.py:100,140,232`, `app/middleware.py:40,48,84,94`, `app/tools/analysis.py:60,69,74,79`
- Impact: Hides bugs and makes debugging difficult; errors are silently converted to fallback values
- Fix approach: Catch specific exception types; log warnings for unexpected errors; re-raise or return explicit error states

**Debug Logging Left in Production Code:**
- Issue: `logger.info(f"Catalogues: {result}")` logs entire API response
- Files: `app/client.py:161`
- Impact: Pollutes logs with potentially large data; performance overhead; may expose sensitive data
- Fix approach: Remove or change to debug level; add conditional logging based on log level

## Known Bugs

**Missing Return Type in `_request`:**
- Symptoms: The `_request` method has unreachable code after `_handle_http_error`
- Files: `app/client.py:91-94`
- Trigger: When an HTTP error occurs, `_handle_http_error` raises but function signature suggests return
- Workaround: Works correctly because `_handle_http_error` always raises
- Note: Type checker may complain about missing return; add `Never` return type annotation to `_handle_http_error`

**Inconsistent Draft ID Extraction:**
- Symptoms: `create_draft` may return empty string if neither Location header nor JSON response provides ID
- Files: `app/client.py:226-233`
- Trigger: API returns 201 without Location header and non-standard JSON response
- Workaround: Caller receives empty string and must handle it

## Security Considerations

**API Key Passed via Header Without TLS Verification:**
- Risk: API key sent in `X-API-Key` header; httpx client uses default TLS settings
- Files: `app/client.py:74-76`
- Current mitigation: Relies on HTTPS transport; httpx verifies certificates by default
- Recommendations: Add explicit `verify=True` to httpx client configuration for clarity; consider environment variable for CA bundle in enterprise environments

**No Rate Limiting:**
- Risk: Clients can make unlimited requests to the external API through this server
- Files: `app/server.py`, `app/middleware.py`
- Current mitigation: None
- Recommendations: Add rate limiting middleware to prevent abuse and protect against accidental infinite loops

**SecretStr Exposure in Logs:**
- Risk: While `pydantic.SecretStr` protects the API key in repr/str, the raw value is passed to the client
- Files: `app/config.py:24-27`, `app/server.py:44`
- Current mitigation: SecretStr prevents accidental logging of settings object
- Recommendations: Ensure logging never includes the client object with api_key attribute

## Performance Bottlenecks

**No Connection Pooling Configuration:**
- Problem: Default httpx connection pool settings may be insufficient for high-throughput scenarios
- Files: `app/client.py:45-50`
- Cause: Uses default connection limits; no explicit pool configuration
- Improvement path: Configure `limits=httpx.Limits(max_keepalive_connections=X, max_connections=Y)` based on expected load

**Vocabulary Search Loads Entire Vocabulary:**
- Problem: `search_vocabulary_terms` fetches entire vocabulary then filters in-memory
- Files: `app/tools/vocabularies.py:48-82`
- Cause: API may not support server-side filtering; current implementation downloads all terms
- Improvement path: Cache vocabulary data; check if API supports query parameters; paginate large vocabularies

**No Caching of Immutable Data:**
- Problem: Repeated calls fetch same data (e.g., vocabularies, catalogue metadata)
- Files: `app/client.py` (all read methods)
- Cause: No caching layer implemented
- Improvement path: Add LRU cache for stable endpoints; use ETags/If-Modified-Since for conditional requests

## Fragile Areas

**Middleware Tool Name Extraction:**
- Files: `app/middleware.py:32-42,76-86`
- Why fragile: Multiple fallback attempts to extract tool name from different context structures; relies on fastmcp internal implementation details
- Safe modification: Changes to fastmcp context structure could break tool name extraction
- Test coverage: Basic tests exist but don't cover all fallback paths

**RDF Parsing:**
- Files: `app/client.py:127-142`
- Why fragile: Attempts to parse various RDF formats; silently returns raw content on failure
- Safe modification: Test with actual RDF responses from Piveau API; add more robust format detection
- Test coverage: No tests for RDF parsing paths; only JSON responses tested

**JSON-LD @graph Extraction:**
- Files: `app/client.py:144-149`
- Why fragile: Assumes specific JSON-LD structure; returns empty list if structure differs
- Safe modification: API changes to response format could break extraction
- Test coverage: Limited tests for @graph wrapper scenario

## Scaling Limits

**Single httpx Client Instance:**
- Current capacity: One connection pool shared across all requests
- Limit: Default httpx limits (100 connections, 20 keepalive)
- Scaling path: Configure explicit limits; consider multiple client instances for different priority levels

**In-Memory Settings:**
- Current capacity: Single server instance
- Limit: Cannot dynamically reload configuration
- Scaling path: Add config reload mechanism; use environment variable watching for cloud deployments

## Dependencies at Risk

**fastmcp Middleware API:**
- Risk: Using `fastmcp.server.middleware.MiddlewareContext` which may be unstable/internal API
- Impact: Major version updates to fastmcp could break middleware
- Migration plan: Pin fastmcp version; monitor changelog; abstract middleware context access

**rdflib for RDF Parsing:**
- Risk: Heavy dependency (rdflib) for potentially unused feature
- Impact: Larger container image; slower startup; potential security surface
- Migration plan: Make rdflib optional; lazy import only when RDF content-type encountered

## Missing Critical Features

**No Health Check Endpoint:**
- Problem: No way to verify server health in container orchestration
- Blocks: Kubernetes/Docker health probes; load balancer health checks

**No Request Timeout per Tool:**
- Problem: Global timeout applies to all operations
- Blocks: Long-running operations like bulk analysis

**No Pagination Cursor Support:**
- Problem: Only offset-based pagination; large result sets require calculating offsets
- Blocks: Efficient iteration over all datasets/catalogues

## Test Coverage Gaps

**No Integration Tests:**
- What's not tested: Actual HTTP communication with Piveau API
- Files: All `app/client.py` methods
- Risk: API contract changes undetected until production
- Priority: Medium - add integration tests with VCR/responses library

**No RDF Response Handling Tests:**
- What's not tested: Parsing of text/turtle, application/rdf+xml, etc.
- Files: `app/client.py:127-142`
- Risk: RDF parsing failures in production; silent data corruption
- Priority: High - API frequently returns RDF formats

**No Error State Tests for Resources:**
- What's not tested: Resource handlers when client raises exceptions
- Files: `app/resources.py` (all resource functions)
- Risk: Unhandled exceptions expose stack traces
- Priority: Medium - add error handling tests for each resource

**No Concurrent Request Tests:**
- What's not tested: Behavior under concurrent load; connection pool exhaustion
- Files: `app/client.py`, `app/server.py`
- Risk: Race conditions; connection leaks under load
- Priority: Low - add asyncio concurrency tests if production issues arise

---

*Concerns audit: 2025-01-16*
