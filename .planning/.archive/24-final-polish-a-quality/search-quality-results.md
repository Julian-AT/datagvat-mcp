# Search Quality Manual Test Checklist

**Instructions:** Open docs site at http://localhost:3000, execute each search query, verify top 3 results match expected pages.

**Test Date:** [To be filled by user]
**Tester:** [To be filled by user]

**Expected Pass Rate:** ≥85% (48+/56 queries)

---

## All 25 Tools (25 queries)

Test that each tool name returns its documentation and related pages in top 3 results.

- [ ] "search datasets" → Expected: tools/search-datasets, guides/searching, workflows/discovery
- [ ] "get dataset" → Expected: tools/get-dataset, guides/searching, examples
- [ ] "get dataset metadata" → Expected: tools/get-dataset-metadata, guides/metadata
- [ ] "get dataset distributions" → Expected: tools/get-dataset-distributions, guides/data-preview
- [ ] "preview schema" → Expected: tools/preview-schema, guides/data-preview
- [ ] "preview data" → Expected: tools/preview-data, guides/data-preview
- [ ] "get quality metrics" → Expected: tools/get-quality-metrics, best-practices/quality-interpretation
- [ ] "calculate quality score" → Expected: tools/calculate-quality-score, workflows/quality-assessment
- [ ] "find related datasets" → Expected: tools/find-related-datasets, guides/analysis
- [ ] "get catalogue list" → Expected: tools/get-catalogue-list, guides/searching
- [ ] "search with semantic" → Expected: tools/search-with-semantic-expansion, guides/searching
- [ ] "expand query" → Expected: tools/expand-query-semantically, guides/searching
- [ ] "list data formats" → Expected: tools/list-data-formats, guides/searching
- [ ] "list themes" → Expected: tools/list-themes, guides/searching
- [ ] "list categories" → Expected: tools/list-categories, guides/searching
- [ ] "get dataset by title" → Expected: tools/get-dataset-by-title, guides/searching
- [ ] "suggest search terms" → Expected: tools/suggest-search-terms, guides/searching
- [ ] "get theme info" → Expected: tools/get-theme-info, guides/searching
- [ ] "get format info" → Expected: tools/get-format-info, guides/data-preview
- [ ] "compare datasets" → Expected: tools/compare-datasets, workflows/comparative-analysis
- [ ] "validate dataset" → Expected: tools/validate-dataset-quality, workflows/quality-assessment
- [ ] "export search results" → Expected: tools/export-search-results, workflows/data-export
- [ ] "get dataset history" → Expected: tools/get-dataset-history, guides/metadata
- [ ] "check dataset freshness" → Expected: tools/check-dataset-freshness, best-practices/quality-interpretation
- [ ] "get publisher info" → Expected: tools/get-publisher-info, guides/metadata

## Workflow Types (8 queries)

Test that workflow queries find workflow pages and related guides.

- [ ] "discovery workflow" → Expected: workflows/discovery, guides/searching, getting-started/quickstart
- [ ] "quality assessment workflow" → Expected: workflows/quality-assessment, best-practices/quality-interpretation
- [ ] "data export workflow" → Expected: workflows/data-export, guides/data-preview
- [ ] "comparative analysis" → Expected: workflows/comparative-analysis, best-practices/comparison-tables
- [ ] "publication research" → Expected: workflows/publication-research, examples
- [ ] "semantic exploration" → Expected: workflows/semantic-exploration, guides/searching
- [ ] "automated monitoring" → Expected: workflows/discovery, guides/configuration
- [ ] "dataset validation" → Expected: workflows/quality-assessment, best-practices/quality-interpretation

## Core Guide Topics (15 queries)

Test that guide topics find primary guides and related content.

- [ ] "searching datasets" → Expected: guides/searching, workflows/discovery, tools/search-datasets
- [ ] "data preview" → Expected: guides/data-preview, tools/preview-schema, tools/preview-data
- [ ] "quality metrics" → Expected: best-practices/quality-interpretation, tools/get-quality-metrics
- [ ] "metadata" → Expected: guides/metadata, tools/get-dataset-metadata
- [ ] "analysis" → Expected: guides/analysis, workflows/comparative-analysis
- [ ] "configuration" → Expected: guides/configuration, getting-started/installation
- [ ] "setup" → Expected: guides/setup, getting-started/installation
- [ ] "troubleshooting" → Expected: getting-started/troubleshooting, guides/setup
- [ ] "performance" → Expected: best-practices/performance, best-practices/caching-strategies
- [ ] "rate limiting" → Expected: best-practices/rate-limiting, guides/configuration
- [ ] "caching" → Expected: best-practices/caching-strategies, best-practices/performance
- [ ] "error handling" → Expected: advanced/error-handling, guides/troubleshooting
- [ ] "testing" → Expected: advanced/testing, examples
- [ ] "semantic search" → Expected: guides/searching, tools/search-with-semantic-expansion
- [ ] "faceted filtering" → Expected: guides/searching, tools/search-datasets

## Integration Patterns (8 queries)

Test that integration queries find integration docs.

- [ ] "FastMCP client" → Expected: integration/other-clients, advanced/fastmcp-internals
- [ ] "Claude Desktop" → Expected: integration/claude-desktop, getting-started/installation
- [ ] "custom client" → Expected: integration/other-clients, advanced/fastmcp-internals
- [ ] "middleware" → Expected: advanced/architecture, advanced/error-handling
- [ ] "FastMCP internals" → Expected: advanced/fastmcp-internals, advanced/architecture
- [ ] "architecture" → Expected: advanced/architecture, advanced/fastmcp-internals
- [ ] "error patterns" → Expected: advanced/error-handling, guides/troubleshooting
- [ ] "testing patterns" → Expected: advanced/testing, examples

---

## Results Summary

**Tested:** __/56
**Passed:** __/56
**Failed:** __/56
**Pass Rate:** __%

### Failed Queries

List any queries that didn't return relevant results in top 3:

1. [Query] → Got: [actual results] | Expected: [expected results]
2. ...

### Notes

[Any observations about search quality, patterns in failures, suggestions for improvement]

---

## Navigation Flow Tests

After search testing, verify these user journeys work smoothly:

### New User Journey
- [ ] Landing page → Quickstart → First Query → Troubleshooting
- [ ] All navigation links work
- [ ] Breadcrumbs accurate
- [ ] Prev/Next links logical

### Guide Seeker Journey
- [ ] Guides section → Searching → Data Preview → Quality Metrics
- [ ] All cross-references work
- [ ] Examples easy to find
- [ ] Related content linked

### Developer Journey
- [ ] Integration → FastMCP Internals → Error Handling → Testing
- [ ] Code examples present
- [ ] API reference accessible
- [ ] Architecture clear

**Navigation Status:** [PASS | Issues: ...]

---

## Production Build Inspection

Run `npm run build` and inspect output:

- [ ] Build completes successfully
- [ ] Zero warnings in output
- [ ] Route generation: 485+ static pages
- [ ] No broken links or missing pages

**Build Status:** [PASS | Issues: ...]
**Warnings Count:** __
**Pages Generated:** __

---

## Final Assessment

**Requirements Verification:** [All verified | Failures documented]
**Search Quality:** [≥85% | Below threshold]
**Navigation:** [All paths work | Issues found]
**Production Build:** [Zero warnings | Warnings present]

**Overall Status:** [PRODUCTION READY | NEEDS FIXES | NOT READY]
