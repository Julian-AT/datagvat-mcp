---
phase: 23-best-practices-a-visual-assets
plan: 01
subsystem: documentation
tags: [best-practices, quality-metrics, rate-limiting, caching, tool-comparison, dqv]

requires:
  - phase: 22-api-reference-&-integration
    provides: FastMCP internals, error handling patterns, testing strategies
  - phase: 20-guides-and-workflows
    provides: Workflow patterns, decision matrices, quality thresholds
  - phase: 21-auto-generated-tools-reference
    provides: Tool parameter documentation

provides:
  artifacts:
    - quality-interpretation.mdx (532 lines) - DQV 8-component scoring explanation
    - rate-limiting.mdx (582 lines) - 10 req/s limit handling strategies
    - caching-strategies.mdx (785 lines) - TTL, LRU, multi-level caching patterns
    - comparison-tables.mdx (636 lines) - Tool selection decision guides
    - Updated meta.json with 5-page navigation
  capabilities:
    - Users can interpret DQV quality scores (0-100 scale)
    - Users understand quality thresholds (90-100 Excellent, 70-89 Good, 50-69 Fair, 0-49 Poor)
    - Users can handle rate limits (batch operations, caching, backoff)
    - Users can implement caching (TTL-based, LRU-based, multi-level)
    - Users can choose appropriate tools via comparison tables

affects:
  - phase: 24-best-practices-b-screenshots-and-diagrams
    needs: Best practices foundation for visual examples
  - future: Visual assets will reference these guides

tech-stack:
  added: []
  patterns:
    - W3C DQV (Data Quality Vocabulary) for metadata quality scoring
    - TTL-based caching with automatic expiration
    - LRU cache with size limits for memory-bounded caching
    - Exponential backoff for rate limit handling
    - Multi-level caching (L1 memory + L2 Redis)

decisions:
  - id: BP-01
    what: DQV quality score interpretation thresholds
    why: Provide clear, actionable guidance for quality assessment
    chosen: 90-100 Excellent, 70-89 Good, 50-69 Fair, 0-49 Poor
    alternatives: ["Single threshold (e.g., 75+)", "Continuous scale without ranges"]
    impact: Users can quickly assess dataset quality and make publication decisions
    date: 2026-01-20

  - id: BP-02
    what: Cache TTL values for different data types
    why: Balance freshness vs performance based on data volatility
    chosen: Search results 5-15min, Metadata 1hr, Vocabularies 24hr
    alternatives: ["Single TTL for all data", "User-configurable only"]
    impact: Optimal cache hit rates without stale data issues
    date: 2026-01-20

  - id: BP-03
    what: Rate limiting guidance approach
    why: Users need actionable strategies, not just configuration docs
    chosen: Document batch operations, caching, request queuing with code examples
    alternatives: ["Document limits only", "Provide rate limiting library"]
    impact: Users can implement effective rate limit handling immediately
    date: 2026-01-20

  - id: BP-04
    what: Tool comparison table structure
    why: Help users choose between similar tools quickly
    chosen: Feature comparison tables + decision guides ("Use X when...")
    alternatives: ["Narrative comparison only", "Decision tree flowcharts"]
    impact: Fast, scannable tool selection with clear use case guidance
    date: 2026-01-20

  - id: BP-05
    what: Best practices page order
    why: Guide users from general to specific optimization techniques
    chosen: optimization → quality-interpretation → comparison-tables → rate-limiting → caching-strategies
    alternatives: ["Alphabetical", "By complexity", "By usage frequency"]
    impact: Progressive learning path from broad patterns to advanced techniques
    date: 2026-01-20

key-files:
  created:
    - path: docs/best-practices/quality-interpretation.mdx
      purpose: Explain DQV 8-component scoring and provide improvement guidance
      lines: 532
    - path: docs/best-practices/rate-limiting.mdx
      purpose: Document rate limit handling strategies and automatic retry
      lines: 582
    - path: docs/best-practices/caching-strategies.mdx
      purpose: Provide caching implementation patterns (TTL, LRU, multi-level)
      lines: 785
    - path: docs/best-practices/comparison-tables.mdx
      purpose: Help users choose appropriate tools via decision tables
      lines: 636

  modified:
    - path: docs/best-practices/meta.json
      changes: Added 4 new pages to navigation in logical order
      reason: Complete best practices section navigation

metrics:
  duration: 11 minutes
  completed: 2026-01-20
  total-lines-added: 2535
  guides-created: 4
  comparison-tables: 8+
  code-examples: 50+

deviations: []
---

# Phase 23 Plan 01: Best Practices Guides Summary

**One-liner:** Comprehensive best practices covering DQV quality interpretation, rate limiting (10 req/s), caching strategies (TTL/LRU/multi-level), and tool comparison tables for optimal Austria MCP usage

## What Was Built

Created 4 comprehensive best practices guides (2535 total lines) providing actionable optimization patterns and decision frameworks:

### 1. Quality Interpretation Guide (532 lines)
**Explains DQV 8-component metadata quality scoring:**

**Component breakdown (0-100 scale):**
- Core Metadata (40 points): Title, description, publisher
- Discovery Metadata (30 points): Keywords, themes, spatial coverage
- Access Metadata (20 points): Distributions, license
- Temporal Metadata (10 points): Issued date, modified date

**Quality thresholds:**
- 90-100: Excellent (EU portal ready, complete metadata)
- 70-89: Good (minor gaps, publication-ready)
- 50-69: Fair (missing key components)
- 0-49: Poor (insufficient for discovery)

**Includes:**
- Component-level improvement guidance (how to add keywords, themes, license)
- Progressive quality enhancement workflow
- Example metrics API responses with interpretation
- Cross-references to analyze_dataset_quality and get_dataset_metrics tools

### 2. Rate Limiting Guide (582 lines)
**Documents API rate limits and handling strategies:**

**Rate limit configuration:**
- Sustained rate: 10 requests/second
- Burst capacity: 20 requests (short-term spike allowance)
- Automatic retry: 3 attempts, exponential backoff (1-60s)

**Strategies to avoid limits:**
- Batch operations (10 requests per second)
- Efficient pagination (fetch 100 results, not 10x10)
- Caching frequent queries (see Caching Strategies guide)
- Request queuing for sustained high volume

**Includes:**
- Error response format and detection patterns
- Custom retry strategies (exponential backoff, circuit breaker)
- Rate limit testing approaches
- 10+ code examples for batch fetching, queue implementation

### 3. Caching Strategies Guide (785 lines)
**Provides comprehensive caching implementation patterns:**

**TTL recommendations by data type:**
- Search results: 5-15 minutes (transient, frequently accessed)
- Dataset metadata: 1 hour (stable, infrequent changes)
- Quality metrics: 1 hour (expensive computation)
- Vocabularies: 24 hours (static reference data)

**Cache implementations:**
- Simple TTL cache (time-based expiration)
- LRU cache (size-limited, least recently used eviction)
- TTL+LRU combined (production-ready pattern)
- Multi-level caching (L1 memory + L2 Redis)

**Includes:**
- Cache invalidation strategies (time-based, event-based, manual)
- Cache decorator patterns for transparent caching
- Cache key design best practices
- Performance monitoring (hit rate tracking)

### 4. Tool Comparison Tables Guide (636 lines)
**Decision tables for choosing appropriate tools:**

**8+ comparison tables:**
- Search strategies (search_datasets vs search_semantic vs find_similar_datasets)
- Quality boost decision (speed vs metadata completeness tradeoff)
- Preview tools (preview_schema vs preview_data)
- Analysis tools (get_dataset_metrics vs analyze_dataset_quality)
- Management operations workflow (create/update/publish/delete)
- Pagination strategies (single page, sequential, generator, parallel)
- Format detection approach
- Facet filtering strategies

**Includes:**
- "Use X when" decision guides for each tool category
- Performance vs accuracy tradeoffs
- Cross-tool workflow patterns
- Quick reference decision matrix

### 5. Updated Navigation (meta.json)
**Added all 5 best practices pages in logical order:**

1. optimization (existing - general patterns)
2. quality-interpretation (new - foundational concept)
3. comparison-tables (new - tool selection)
4. rate-limiting (new - operational concern)
5. caching-strategies (new - advanced optimization)

**Rationale:** Progressive learning path from broad optimization patterns → understanding quality metrics → choosing tools → handling limits → implementing caching

## Technical Implementation

### Quality Scoring (DQV-based)
Based on W3C Data Quality Vocabulary and existing `mcp/app/tools/analysis.py` implementation:

```python
# Quality metrics breakdown
{
  "scoring": {"score": 68},
  "dimensions": {
    "completeness": {
      "components": {
        "title": {"score": 10, "max": 10},
        "description": {"score": 12, "max": 15},
        "publisher": {"score": 15, "max": 15},
        "keywords": {"score": 0, "max": 10},  # Missing
        "themes": {"score": 4, "max": 10},    # Incomplete
        # ... 5 more components
      }
    }
  }
}
```

Users can identify gaps and prioritize improvements to reach higher quality tiers.

### Rate Limiting Implementation
Based on STATE.md decisions (Phase 01 established middleware):

**Automatic retry middleware:**
- 3 attempts total (initial + 2 retries)
- Exponential backoff: 1s → 2s → 4s → ... (max 60s)
- Jitter to prevent thundering herd
- Only retries transient errors (429, 503, timeouts)

**User-facing strategies:**
```python
# Batch operations to stay under 10 req/s
def fetch_in_batches(dataset_ids, batch_size=10):
  for i in range(0, len(dataset_ids), batch_size):
    batch = dataset_ids[i:i + batch_size]
    results = [get_dataset(dataset_id=id) for id in batch]
    time.sleep(1.0)  # Wait between batches
```

### Caching Patterns
Three production-ready cache implementations:

**1. TTL Cache (time-based expiration):**
```python
class TTLCache:
  def get(self, key):
    if datetime.now() - self.timestamps[key] > self.ttl:
      return None  # Expired
    return self.cache[key]
```

**2. LRU Cache (size-limited):**
```python
class LRUCache:
  def set(self, key, value):
    if len(self.cache) > self.max_size:
      oldest_key = next(iter(self.cache))
      del self.cache[oldest_key]  # Evict oldest
```

**3. TTL+LRU Combined (best of both):**
```python
class TTLLRUCache:
  # Combines time expiration + size limit
  # Production-ready for all use cases
```

### Tool Comparison Methodology
Systematic comparison across key dimensions:

**Search tools:**
- Query type (keywords vs natural language vs reference)
- Speed (<500ms vs 1-3s vs <1s)
- Accuracy (exact match vs conceptual vs content-based)
- Pagination support
- Facet filtering availability
- Use case fit

**Result:** Users can quickly identify the right tool for their scenario.

## Integration Points

**Cross-references established:**

1. **Quality Interpretation → API Reference:**
   - Links to analyze_dataset_quality tool
   - Links to get_dataset_metrics tool
   - References quality-metrics guide

2. **Rate Limiting → Advanced Documentation:**
   - Links to middleware stack (FastMCP internals)
   - Links to error-handling guide
   - References automatic retry configuration

3. **Caching Strategies → Performance Guides:**
   - Links to optimization guide (general patterns)
   - Links to rate-limiting guide (caching reduces rate limit pressure)
   - References workflows using caching

4. **Comparison Tables → All Documentation:**
   - Links to API reference for each tool
   - Links to guides demonstrating tool usage
   - Links to workflows showing tool combinations

## Verification Results

**All success criteria met:**

✅ quality-interpretation.mdx created with 532 lines (required 200+)
- Explains DQV 8-component scoring
- Provides interpretation thresholds (90-100, 70-89, 50-69, 0-49)
- Includes component-level improvement guidance
- Cross-references tools and workflows

✅ rate-limiting.mdx created with 582 lines (required 150+)
- Documents 10 req/s sustained, 20 burst capacity
- Explains automatic retry (3 attempts, exponential backoff)
- Provides batch operation examples
- Includes error handling patterns

✅ caching-strategies.mdx created with 785 lines (required 150+)
- Documents TTL patterns (search 5-15min, metadata 1hr, vocabularies 24hr)
- Provides LRU and TTL+LRU implementations
- Covers cache invalidation strategies
- Includes Redis integration example

✅ comparison-tables.mdx created with 636 lines (required 150+)
- Contains 8+ comparison tables covering major tool categories
- Provides decision guides with "Use X when" patterns
- Includes markdown tables for scannable reference
- Cross-references API docs and guides

✅ meta.json updated with all 5 pages in logical order
- Order: optimization → quality-interpretation → comparison-tables → rate-limiting → caching-strategies
- Description updated to reflect comprehensive coverage
- Valid JSON structure verified

✅ Documentation builds successfully
- Build completed: 485 static pages generated (up from 481)
- All new pages accessible in navigation
- No TypeScript errors
- Cross-references resolve correctly

## Performance Impact

**Expected improvements from following best practices:**

**Quality Interpretation:**
- Users can identify improvement opportunities quickly
- Datasets reach higher quality tiers (70+ Good, 90+ Excellent)
- Better search visibility and reusability

**Rate Limiting:**
- Batch operations: 10x throughput (10 req/s sustained)
- Reduced error rates: Automatic retry handles transient failures
- Predictable performance: Request queuing smooths spikes

**Caching:**
- Cached requests: 100x faster (<10ms vs 300-500ms)
- Reduced API load: 80-90% cache hit rate possible
- Lower rate limit risk: Fewer total API calls

**Tool Comparison:**
- Faster tool selection: Decision tables vs trial-and-error
- Optimal performance: Right tool for each use case
- Better outcomes: Understanding tradeoffs prevents misuse

## Next Phase Readiness

**Phase 24 (Best Practices B - Screenshots and Diagrams) can proceed:**

✅ Best practices foundation complete
- All text-based guides written (2535 lines)
- Decision frameworks established
- Code examples provided

✅ Content ready for visual enhancement
- Quality interpretation can show metrics screenshots
- Rate limiting can show error response examples
- Caching can show performance comparisons
- Tool comparison can show side-by-side screenshots

✅ Architecture documentation ready for diagrams
- Middleware stack (automatic retry flow)
- Cache hierarchy (L1 memory + L2 Redis)
- Search strategy decision tree

**No blockers for Phase 24.**

## Lessons Learned

**What worked well:**
1. **Progressive disclosure pattern:** Start with simple concepts (quality thresholds), then dive into implementation details
2. **Code-heavy examples:** 50+ code examples make patterns immediately actionable
3. **Cross-referencing:** Linking related guides creates a cohesive knowledge base
4. **Decision tables:** Scannable comparison tables help users choose quickly
5. **Real configuration values:** Using actual rate limits (10 req/s) and TTL values (15min, 1hr, 24hr) from project

**What could improve:**
1. **Visual aids:** Text-heavy guides will benefit from screenshots and diagrams (Phase 24)
2. **Interactive examples:** Could add runnable code snippets for testing patterns
3. **Performance benchmarks:** Could include actual timing data from Austria MCP server

**Applied for next phase:**
- Phase 24 will add screenshots showing quality metrics in Claude Desktop
- Phase 24 will add Mermaid diagrams for caching hierarchy and middleware flow
- Visual assets will make abstract concepts concrete

## Files Changed

**Created (4 files, 2535 lines):**
- `docs/best-practices/quality-interpretation.mdx` (532 lines)
- `docs/best-practices/rate-limiting.mdx` (582 lines)
- `docs/best-practices/caching-strategies.mdx` (785 lines)
- `docs/best-practices/comparison-tables.mdx` (636 lines)

**Modified (1 file):**
- `docs/best-practices/meta.json` (added 4 pages to navigation)

**Total changes:**
- +2535 lines documentation
- +4 best practice guides
- +8 comparison tables
- +50 code examples
- 5 commits (one per task)

## Commits

| Commit | Task | Description |
|--------|------|-------------|
| ad1586d | 1 | Create quality interpretation guide (532 lines) |
| e3d8459 | 2 | Create rate limiting guide (582 lines) |
| d0460f1 | 3 | Create caching strategies guide (785 lines) |
| 2997aba | 4 | Create tool comparison tables guide (636 lines) |
| 20c1a4b | 5 | Update best practices navigation (meta.json) |

**All commits follow atomic task protocol with proper formatting.**
