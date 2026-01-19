---
phase: 20-guides-and-workflows
plan: 03a
type: execute
wave: 2
depends_on: ["01", "02"]
files_modified:
  - docs/workflows/discovery.mdx
  - docs/workflows/quality-assessment.mdx
  - docs/workflows/data-export.mdx
autonomous: true

must_haves:
  truths:
    - "User completes dataset discovery workflow from search to download using Steps component"
    - "User follows quality assessment workflow with verification checkpoints"
    - "User implements automated data export pipeline"
    - "User sees expected outputs at each workflow step for verification"
  artifacts:
    - path: "docs/workflows/discovery.mdx"
      provides: "Complete dataset discovery workflow with Steps component"
      min_lines: 200
    - path: "docs/workflows/quality-assessment.mdx"
      provides: "Data quality evaluation workflow"
      min_lines: 150
    - path: "docs/workflows/data-export.mdx"
      provides: "Data export pipeline workflow"
      min_lines: 150
  key_links:
    - from: "docs/workflows/*.mdx"
      to: "Steps component"
      via: "sequential workflow visualization"
      pattern: "<Steps>|<Step>"
    - from: "docs/workflows/*.mdx"
      to: "docs/guides/*.mdx"
      via: "cross-references to guides"
      pattern: "\\[.*\\]\\(\\/guides\\/"
---

<objective>
Create first 3 end-to-end workflow walkthroughs (discovery, quality-assessment, data-export) with Steps component and expected outputs.

Purpose: Provide complete, actionable workflows showing how to combine Austria MCP tools to accomplish common tasks. Each workflow demonstrates a scenario with step-by-step guidance, expected outputs, and verification criteria.

Output: 3 workflow MDX files with Steps components and complete content including expected outputs.
</objective>

<execution_context>
@C:\Users\travis\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\travis\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\GitHub\datagvat-mcp\.planning\PROJECT.md
@C:\GitHub\datagvat-mcp\.planning\ROADMAP.md
@C:\GitHub\datagvat-mcp\.planning\STATE.md
@C:\GitHub\datagvat-mcp\.planning\REQUIREMENTS.md
@C:\GitHub\datagvat-mcp\.planning\phases\20-guides-and-workflows\20-RESEARCH.md
@C:\GitHub\datagvat-mcp\.planning\phases\18-documentation-foundation\18-01-SUMMARY.md
@C:\GitHub\datagvat-mcp\.planning\phases\19-getting-started-content\19-01-SUMMARY.md
@C:\GitHub\datagvat-mcp\docs\workflows\meta.json
</context>

<tasks>

<task type="auto">
  <name>Create Dataset Discovery Workflow (WORK-01)</name>
  <files>docs/workflows/discovery.mdx</files>
  <action>
Create complete dataset discovery workflow from search query to downloaded data using Steps component and expected output verification from 20-RESEARCH.md Pattern 3.

Use the complete MDX structure from the original 20-03 Task 1, lines 97-481. This includes:
- Complete Example / Step by Step tabs with groupId="workflow-detail" persist
- 6-step workflow using Steps component
- Expected output JSON for each step
- Verification checklists at each step
- Error handling examples
- Troubleshooting section
- Cross-references to related guides and workflows
- Success criteria checklist
- 200-250 lines total

**Target:** 200-250 lines with all expected outputs fully specified.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" discovery.mdx && \
  grep -c "<Step>" discovery.mdx && \
  grep -c "Expected output:" discovery.mdx && \
  grep -c "\\[.*\\](/guides/" discovery.mdx && \
  wc -l discovery.mdx
```

Expected:
- 1 <Steps> wrapper
- 6 <Step> elements
- 6+ "Expected output:" sections
- 3+ cross-references to guides
- 200-250 lines total
  </verify>
  <done>
discovery.mdx exists with Complete Example/Step by Step tabs, 6-step workflow using Steps component, expected outputs for each step, verification checklists, cross-references to guides, 200+ lines
  </done>
</task>

<task type="auto">
  <name>Create Quality Assessment Workflow (WORK-02)</name>
  <files>docs/workflows/quality-assessment.mdx</files>
  <action>
Create comprehensive quality assessment workflow with complete content (not placeholders).

**Full structure:**
```markdown
---
title: Data Quality Assessment Workflow
description: Comprehensive quality evaluation before production use
---

# Data Quality Assessment Workflow

Systematically evaluate dataset quality for production use or research citations.

## Use This Workflow When

- Integrating dataset into production application
- Need citation-quality data for academic work
- Evaluating multiple dataset alternatives
- Verifying data meets organizational standards

## Prerequisites

- [ ] Dataset ID from search results
- [ ] Quality requirements defined (threshold score, required metadata)

## Time Estimate

10-15 minutes per dataset

## Workflow

<Tabs items={['Complete Example', 'Step by Step']} persist groupId="workflow-detail">
  <Tab value="Complete Example">
    ### All-in-One Quality Check Script

    ```python
    # 1. Get dataset metadata
    dataset = get_dataset(dataset_id="dataset-123")

    # 2. Analyze quality
    quality = analyze_dataset_quality(dataset_id="dataset-123")

    # 3. Check metadata completeness
    required_metadata = ['title', 'description', 'license', 'publisher']
    missing = [f for f in required_metadata if not dataset.get(f)]

    # 4. Check data freshness
    from datetime import datetime
    modified = datetime.fromisoformat(dataset['modified'])
    age_days = (datetime.now() - modified).days

    # 5. Validate distributions
    distributions = get_dataset_distributions(dataset_id="dataset-123")

    import requests
    all_accessible = True
    for dist in distributions:
        if dist.get('format') in ['CSV', 'JSON']:
            response = requests.head(dist['downloadURL'])
            if response.status_code != 200:
                all_accessible = False
                print(f"⚠️ {dist['format']} URL inaccessible")

    # 6. Final decision
    approval = {
        'quality_score': quality['metrics']['overall_score'] >= 70,
        'metadata_complete': len(missing) == 0,
        'data_fresh': age_days <= 365,
        'downloads_accessible': all_accessible
    }

    if all(approval.values()):
        print("✓ Dataset approved for production use")
    else:
        print("✗ Dataset fails quality requirements")
        print(f"Failed: {[k for k, v in approval.items() if not v]}")
    ```
  </Tab>

  <Tab value="Step by Step">
    <Steps>
      <Step>
        ### Get Dataset Metadata

        Retrieve complete metadata to verify baseline information:

        ```python
        dataset = get_dataset(dataset_id="dataset-123")
        ```

        **Expected output:**
        ```json
        {
          "id": "dataset-123",
          "title": {"de": "Bevölkerungsdaten Wien"},
          "description": {"de": "Umfassende Bevölkerungsdaten..."},
          "publisher": {
            "name": "Stadt Wien",
            "email": "open@data.wien.gv.at"
          },
          "license": "CC-BY-4.0",
          "modified": "2024-01-15",
          "keywords": ["population", "demographics"],
          "themes": ["SOCI"]
        }
        ```

        **Verify:**
        - [ ] Title present (both de/en if multilingual)
        - [ ] Description present and substantive (>50 characters)
        - [ ] Publisher identified with contact
        - [ ] License explicitly specified
        - [ ] Keywords and themes defined
      </Step>

      <Step>
        ### Analyze Quality Metrics

        Get comprehensive DQV quality scoring:

        ```python
        quality = analyze_dataset_quality(dataset_id="dataset-123")
        ```

        **Expected output:**
        ```json
        {
          "dataset_id": "dataset-123",
          "metadata": {
            "has_title": true,
            "has_description": true,
            "has_license": true,
            "has_contact": true,
            "has_keywords": true,
            "has_themes": true,
            "has_spatial": true,
            "has_temporal": false,
            "completeness_score": 87
          },
          "metrics": {
            "overall_score": 82,
            "completeness": 87,
            "timeliness": 15,
            "compliance": 18,
            "accessibility": 20
          },
          "degraded": false
        }
        ```

        **Quality thresholds by use case:**

        | Use Case | Min Score | Critical Fields |
        |----------|-----------|-----------------|
        | Research/Citations | ≥85 | contact, keywords, temporal |
        | Production Apps | ≥70 | license, description, formats |
        | Exploratory Analysis | ≥50 | title, description |

        **If score below threshold:**
        - Review `metadata` object to see what's missing
        - Determine if missing fields are critical for your use case
        - Consider contacting publisher to request improvements
      </Step>

      <Step>
        ### Verify Metadata Completeness

        Check critical fields based on use case requirements:

        ```python
        required_metadata = ['title', 'description', 'license', 'publisher']
        missing = [f for f in required_metadata if not dataset.get(f)]

        if missing:
            print(f"Missing required fields: {missing}")
        else:
            print("✓ All required metadata present")
        ```

        **Use case-specific requirements:**

        **For research:**
        ```python
        research_fields = ['contact', 'keywords', 'themes', 'temporal']
        research_missing = [f for f in research_fields if not dataset.get(f)]
        ```

        **For production:**
        ```python
        production_fields = ['license', 'modified', 'distributions']
        production_missing = [f for f in production_fields if not dataset.get(f)]
        ```

        **Verify:**
        - [ ] License permits intended use (check restrictions)
        - [ ] Contact point available for questions
        - [ ] Update frequency documented (if needed)
      </Step>

      <Step>
        ### Check Data Freshness

        Evaluate if data is current enough for your requirements:

        ```python
        from datetime import datetime, timedelta

        modified = datetime.fromisoformat(dataset['modified'])
        age_days = (datetime.now() - modified).days

        print(f"Dataset last updated: {modified.strftime('%Y-%m-%d')}")
        print(f"Age: {age_days} days")

        # Timeliness requirements
        if age_days <= 90:
            print("✓ Very fresh (< 3 months)")
        elif age_days <= 365:
            print("✓ Acceptable (< 1 year)")
        elif age_days <= 730:
            print("⚠️ Aging (1-2 years old)")
        else:
            print("✗ Stale (> 2 years old)")
        ```

        **Expected output:**
        ```
        Dataset last updated: 2024-01-15
        Age: 4 days
        ✓ Very fresh (< 3 months)
        ```

        **Freshness requirements vary by domain:**
        - Real-time data (traffic, weather): < 1 day
        - Dynamic data (population, economy): < 1 year
        - Static data (historical, geographic): freshness less critical
      </Step>

      <Step>
        ### Validate Distributions

        Verify download URLs are accessible and formats meet needs:

        ```python
        distributions = get_dataset_distributions(dataset_id="dataset-123")

        import requests
        for dist in distributions:
            print(f"Format: {dist.get('format')}")
            print(f"URL: {dist['downloadURL']}")
            print(f"Size: {dist.get('byteSize', 'Unknown')} bytes")

            # Test accessibility
            if dist.get('format') in ['CSV', 'JSON', 'XML']:
                response = requests.head(dist['downloadURL'], timeout=10)
                if response.status_code == 200:
                    print("✓ URL accessible")
                else:
                    print(f"✗ URL returns {response.status_code}")
        ```

        **Expected output:**
        ```
        Format: CSV
        URL: https://data.wien.gv.at/daten/geo?service=WFS...
        Size: 2048576 bytes
        ✓ URL accessible

        Format: JSON
        URL: https://data.wien.gv.at/daten/data.json
        Size: 1536000 bytes
        ✓ URL accessible
        ```

        **Verify:**
        - [ ] At least one distribution in usable format
        - [ ] Download URLs use HTTPS
        - [ ] File sizes reasonable for your infrastructure
        - [ ] URLs return 200 status (not 404/403)
      </Step>

      <Step>
        ### Quality Decision

        Make approval decision based on all checks:

        ```python
        approval_checklist = {
            'quality_score': quality['metrics']['overall_score'] >= 70,
            'metadata_complete': len(missing) == 0,
            'data_fresh': age_days <= 365,
            'downloads_accessible': all_urls_accessible,
            'license_acceptable': dataset.get('license') in ['CC-BY', 'CC0', 'ODbL']
        }

        print("Quality Assessment Summary:")
        print("=" * 40)
        for check, passed in approval_checklist.items():
            status = "✓" if passed else "✗"
            print(f"{status} {check}: {passed}")

        if all(approval_checklist.values()):
            print("\n✓ Dataset approved for use")
            print("Ready for production integration")
        else:
            failed = [k for k, v in approval_checklist.items() if not v]
            print(f"\n✗ Dataset fails quality requirements")
            print(f"Failed checks: {', '.join(failed)}")
            print("Review failures and determine if acceptable for use case")
        ```

        **Decision matrix:**

        | Failed Checks | Action |
        |---------------|--------|
        | 0 | Approve for use |
        | 1 (non-critical) | Conditional approval with documentation |
        | 2+ | Reject, seek alternative dataset |
        | license_acceptable=False | REJECT (legal risk) |
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Success Criteria

At completion, you should have:

- [ ] Comprehensive quality score for dataset
- [ ] Metadata completeness assessment
- [ ] Data freshness evaluation
- [ ] Distribution accessibility verification
- [ ] Approval/rejection decision with justification

## Troubleshooting

### Quality Score Lower Than Expected

**Symptom:** Overall score < 70 despite dataset appearing complete

**Cause:** Missing non-obvious fields (temporal coverage, spatial extent, update frequency)

**Solutions:**
- Review `metadata` object to see exactly what's missing
- Check if missing fields matter for your use case
- Some fields (temporal, spatial) may not apply to all datasets

### Quality Service Degraded

**Symptom:** `degraded: true` in response

**Cause:** Quality analysis service temporarily unavailable

**Solutions:**
- Response includes cached metrics (may be stale by days/weeks)
- Manually verify critical fields from dataset metadata
- Retry after 5-10 minutes if fresh scores needed

### All Distributions Inaccessible

**Symptom:** All HEAD requests return 403/404

**Cause:** Dataset may be retired, moved, or require authentication

**Solutions:**
- Check dataset `modified` date (if > 2 years, may be archived)
- Try GET request (some servers block HEAD)
- Contact publisher via contact point
- Consider alternative datasets

## Related Workflows

- **[Dataset Discovery Workflow](/workflows/discovery)** - Finding datasets to assess
- **[Data Export Workflow](/workflows/data-export)** - Automating quality gates in pipelines

## Related Guides

- **[Quality Metrics Guide](/guides/quality-metrics)** - Understanding DQV scores
- **[Searching Guide](/guides/searching)** - Quality-aware search techniques
```

**Target:** 150-180 lines with complete expected outputs and decision matrices.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" quality-assessment.mdx && \
  grep -c "<Step>" quality-assessment.mdx && \
  grep -c "Expected output:" quality-assessment.mdx && \
  wc -l quality-assessment.mdx
```

Expected:
- 1 <Steps> wrapper
- 6 <Step> elements
- 2+ "Expected output:" sections
- 150-180 lines total
  </verify>
  <done>
quality-assessment.mdx exists with Complete Example/Step by Step tabs, 6-step quality evaluation workflow, expected outputs, decision matrix, troubleshooting, cross-references, 150-180 lines
  </done>
</task>

<task type="auto">
  <name>Create Data Export Pipeline Workflow (WORK-03)</name>
  <files>docs/workflows/data-export.mdx</files>
  <action>
Create automated data export pipeline workflow with complete content (not placeholders).

**Full structure:**
```markdown
---
title: Automated Data Export Pipeline
description: Build automated pipelines for scheduled data exports with quality gates
---

# Automated Data Export Pipeline

Create production pipelines that search, validate, and export datasets on a schedule.

## Use This Workflow When

- Building automated data ingestion pipelines
- Need scheduled updates from open data sources
- Implementing quality gates for production systems
- Exporting datasets to data warehouses or lakes

## Prerequisites

- [ ] Python environment with requests, schedule libraries
- [ ] Dataset search criteria defined
- [ ] Quality thresholds established
- [ ] Export destination configured

## Time Estimate

Initial setup: 30-45 minutes
Maintenance: 5-10 minutes per week

## Workflow

<Tabs items={['Complete Example', 'Step by Step']} persist groupId="workflow-detail">
  <Tab value="Complete Example">
    ### Full Pipeline Script

    ```python
    import schedule
    import time
    import logging
    from datetime import datetime

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    def export_pipeline():
        """Complete pipeline with search, validation, and export"""
        try:
            # Step 1: Search for datasets
            results = search_datasets(
                themes=["SOCI", "HEAL"],
                formats=["CSV"],
                boost_quality=True,
                min_date="2024-01-01"
            )

            logger.info(f"Found {results['count']} datasets")

            # Step 2: Quality gate
            approved_datasets = []
            for dataset in results['results'][:10]:
                quality = analyze_dataset_quality(dataset['id'])

                if quality['metrics']['overall_score'] >= 70:
                    approved_datasets.append(dataset)
                    logger.info(f"✓ {dataset['id']} passed quality gate")
                else:
                    logger.warning(f"✗ {dataset['id']} failed quality gate")

            # Step 3: Schema validation
            valid_datasets = []
            required_columns = ["year", "value"]

            for dataset in approved_datasets:
                distributions = get_dataset_distributions(dataset['id'])
                csv_dist = next((d for d in distributions if d['format'] == 'CSV'), None)

                if csv_dist:
                    schema = preview_schema(url=csv_dist['downloadURL'])
                    actual_columns = [c['name'] for c in schema['columns']]

                    if all(col in actual_columns for col in required_columns):
                        valid_datasets.append({
                            'dataset': dataset,
                            'download_url': csv_dist['downloadURL']
                        })
                        logger.info(f"✓ {dataset['id']} schema valid")

            # Step 4: Export
            export_dir = "./exports"
            os.makedirs(export_dir, exist_ok=True)

            for item in valid_datasets:
                dataset_id = item['dataset']['id']
                url = item['download_url']

                response = requests.get(url)
                if response.status_code == 200:
                    filename = f"{export_dir}/{dataset_id}_{datetime.now().strftime('%Y%m%d')}.csv"
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    logger.info(f"✓ Exported {dataset_id}")
                else:
                    logger.error(f"✗ Download failed for {dataset_id}: {response.status_code}")

            logger.info(f"Pipeline complete: {len(valid_datasets)} datasets exported")

        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            # Send alert to monitoring system

    # Schedule pipeline to run daily at 2 AM
    schedule.every().day.at("02:00").do(export_pipeline)

    # Run indefinitely
    while True:
        schedule.run_pending()
        time.sleep(60)
    ```
  </Tab>

  <Tab value="Step by Step">
    <Steps>
      <Step>
        ### Search and Filter

        Define search criteria for datasets to export:

        ```python
        results = search_datasets(
            themes=["SOCI", "HEAL"],
            formats=["CSV"],
            boost_quality=True,
            min_date="2024-01-01",
            limit=50
        )
        ```

        **Expected output:**
        ```json
        {
          "results": [
            {
              "id": "dataset-123",
              "title": "Population Statistics 2024",
              "quality_score": 85,
              "modified": "2024-01-15"
            }
          ],
          "count": 42,
          "facets": {
            "themes": {"SOCI": 30, "HEAL": 12}
          }
        }
        ```

        **Verify:**
        - [ ] Results match intended domain (check themes)
        - [ ] Formats are compatible with pipeline (CSV, JSON)
        - [ ] Result count reasonable (not too many/few)
      </Step>

      <Step>
        ### Quality Gate Check

        Filter datasets by quality threshold:

        ```python
        approved_datasets = []
        quality_threshold = 70

        for dataset in results['results']:
            quality = analyze_dataset_quality(dataset['id'])

            if quality['metrics']['overall_score'] >= quality_threshold:
                approved_datasets.append({
                    'dataset': dataset,
                    'quality': quality
                })
                print(f"✓ {dataset['id']}: {quality['metrics']['overall_score']}")
            else:
                print(f"✗ {dataset['id']}: {quality['metrics']['overall_score']} (below threshold)")
        ```

        **Expected output:**
        ```
        ✓ dataset-123: 85
        ✓ dataset-456: 72
        ✗ dataset-789: 65 (below threshold)

        Approved: 2/3 datasets passed quality gate
        ```

        **Verify:**
        - [ ] Quality threshold appropriate for use case
        - [ ] Rejection reasons logged for monitoring
        - [ ] Pass rate acceptable (>50% typically)
      </Step>

      <Step>
        ### Schema Validation

        Verify datasets have required columns:

        ```python
        valid_datasets = []
        required_columns = ["year", "region", "value"]

        for item in approved_datasets:
            dataset = item['dataset']
            distributions = get_dataset_distributions(dataset['id'])

            # Get CSV distribution
            csv_dist = next((d for d in distributions if d['format'] == 'CSV'), None)

            if not csv_dist:
                print(f"✗ {dataset['id']}: No CSV format available")
                continue

            # Preview schema
            schema = preview_schema(url=csv_dist['downloadURL'])
            actual_columns = [c['name'] for c in schema['columns']]

            # Check required columns
            missing = set(required_columns) - set(actual_columns)

            if not missing:
                valid_datasets.append({
                    'dataset': dataset,
                    'download_url': csv_dist['downloadURL'],
                    'schema': schema
                })
                print(f"✓ {dataset['id']}: Schema valid")
            else:
                print(f"✗ {dataset['id']}: Missing columns {missing}")
        ```

        **Expected output:**
        ```
        ✓ dataset-123: Schema valid (columns: year, region, value, population)
        ✗ dataset-456: Missing columns {'region'}

        Valid: 1/2 datasets passed schema validation
        ```

        **Verify:**
        - [ ] Schema check matches requirements
        - [ ] Column name variations handled (case, punctuation)
        - [ ] Type validation included if critical
      </Step>

      <Step>
        ### Data Export

        Download and save validated datasets:

        ```python
        import os
        import requests
        from datetime import datetime

        export_dir = "./exports"
        os.makedirs(export_dir, exist_ok=True)

        for item in valid_datasets:
            dataset_id = item['dataset']['id']
            url = item['download_url']

            try:
                response = requests.get(url, timeout=30)
                response.raise_for_status()

                # Save with timestamp
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{export_dir}/{dataset_id}_{timestamp}.csv"

                with open(filename, 'wb') as f:
                    f.write(response.content)

                file_size = len(response.content)
                print(f"✓ Exported {dataset_id}: {file_size} bytes → {filename}")

            except requests.exceptions.RequestException as e:
                print(f"✗ Export failed for {dataset_id}: {e}")
        ```

        **Expected output:**
        ```
        ✓ Exported dataset-123: 2048576 bytes → ./exports/dataset-123_20240119_140530.csv

        Export summary:
        - Total exported: 1/1 datasets
        - Export directory: ./exports
        - Timestamp: 2024-01-19 14:05:30
        ```

        **Verify:**
        - [ ] Files saved successfully
        - [ ] File sizes reasonable (not 0 bytes or corrupt)
        - [ ] Timestamps correct for versioning
      </Step>

      <Step>
        ### Error Handling and Logging

        Implement robust error handling and monitoring:

        ```python
        import logging

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('pipeline.log'),
                logging.StreamHandler()
            ]
        )
        logger = logging.getLogger(__name__)

        def export_with_monitoring():
            try:
                # Pipeline steps...
                logger.info("Pipeline started")

                # Search
                results = search_datasets(...)
                logger.info(f"Search complete: {results['count']} results")

                # Quality gate
                approved = len(approved_datasets)
                total = len(results['results'])
                logger.info(f"Quality gate: {approved}/{total} passed")

                # Export
                exported = len(valid_datasets)
                logger.info(f"Export complete: {exported} datasets")

                # Success metrics
                pipeline_success = {
                    'timestamp': datetime.now().isoformat(),
                    'datasets_found': total,
                    'quality_pass': approved,
                    'exported': exported,
                    'success_rate': exported / total if total > 0 else 0
                }
                logger.info(f"Pipeline metrics: {pipeline_success}")

                return pipeline_success

            except Exception as e:
                logger.error(f"Pipeline failed: {e}", exc_info=True)
                # Send alert to monitoring system
                send_alert(f"Pipeline failure: {e}")
                return None
        ```

        **Expected log output:**
        ```
        2024-01-19 14:05:30 - pipeline - INFO - Pipeline started
        2024-01-19 14:05:32 - pipeline - INFO - Search complete: 42 results
        2024-01-19 14:05:45 - pipeline - INFO - Quality gate: 25/42 passed
        2024-01-19 14:06:00 - pipeline - INFO - Export complete: 20 datasets
        2024-01-19 14:06:01 - pipeline - INFO - Pipeline metrics: {'success_rate': 0.476}
        ```

        **Verify:**
        - [ ] All steps logged with timestamps
        - [ ] Success/failure metrics tracked
        - [ ] Errors include stack traces
        - [ ] Alerts configured for failures
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Success Criteria

At completion, you should have:

- [ ] Automated pipeline searching and filtering datasets
- [ ] Quality gates rejecting low-quality data
- [ ] Schema validation ensuring compatibility
- [ ] Successful export to target destination
- [ ] Error handling and logging operational
- [ ] Schedule configured for recurring runs

## Troubleshooting

### Pipeline Runs But Exports Nothing

**Symptom:** Pipeline completes but no files exported

**Cause:** Quality gate or schema validation too strict

**Solutions:**
- Review quality threshold (lower from 70 to 60)
- Check required columns match actual data
- Log rejection reasons at each step
- Test with known-good dataset

### Downloads Timeout

**Symptom:** Export step fails with timeout errors

**Cause:** Large files or slow network

**Solutions:**
- Increase timeout parameter (60-120 seconds)
- Implement retry logic with exponential backoff
- Use streaming download for large files
- Schedule during off-peak hours

### Schema Changes Break Pipeline

**Symptom:** Previously valid datasets now fail schema check

**Cause:** Publisher changed column names or structure

**Solutions:**
- Implement fuzzy column matching (case-insensitive)
- Accept column name variations (year vs Year vs YEAR)
- Alert on schema changes for manual review
- Version schema checks per publisher

## Scheduling Options

### Option 1: Python schedule library

```python
import schedule

schedule.every().day.at("02:00").do(export_pipeline)
schedule.every().monday.at("08:00").do(export_pipeline)
schedule.every(6).hours.do(export_pipeline)
```

### Option 2: Cron (Linux/Mac)

```bash
# Daily at 2 AM
0 2 * * * /usr/bin/python3 /path/to/pipeline.py

# Every 6 hours
0 */6 * * * /usr/bin/python3 /path/to/pipeline.py
```

### Option 3: Task Scheduler (Windows)

Create scheduled task via Task Scheduler GUI or:

```powershell
schtasks /create /tn "DataExportPipeline" /tr "python C:\path\to\pipeline.py" /sc daily /st 02:00
```

## Related Workflows

- **[Quality Assessment Workflow](/workflows/quality-assessment)** - Quality gate implementation
- **[Dataset Discovery Workflow](/workflows/discovery)** - Manual discovery process

## Related Guides

- **[Searching Guide](/guides/searching)** - Search criteria configuration
- **[Data Preview Guide](/guides/data-preview)** - Schema validation techniques
```

**Target:** 150-180 lines with scheduling examples and error handling patterns.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" data-export.mdx && \
  grep -c "<Step>" data-export.mdx && \
  grep -c "Expected output:" data-export.mdx && \
  wc -l data-export.mdx
```

Expected:
- 1 <Steps> wrapper
- 5 <Step> elements
- 5+ "Expected output:" sections
- 150-180 lines total
  </verify>
  <done>
data-export.mdx exists with Complete Example/Step by Step tabs, 5-step export pipeline workflow, expected outputs, error handling, troubleshooting, cross-references, 150-180 lines
  </done>
</task>

</tasks>

<verification>
After completion:

1. **All Workflow Files Created:**
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && ls -1 *.mdx | head -3
```
Expected: discovery.mdx, quality-assessment.mdx, data-export.mdx

2. **Steps Component Usage:**
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -l "<Steps>" discovery.mdx quality-assessment.mdx data-export.mdx | wc -l
```
Expected: 3 files with Steps

3. **Expected Outputs Present:**
```bash
grep -c "Expected output:" docs/workflows/discovery.mdx docs/workflows/quality-assessment.mdx docs/workflows/data-export.mdx
```
Expected: 6+, 2+, 5+ per file respectively

4. **Line Counts:**
```bash
wc -l docs/workflows/discovery.mdx docs/workflows/quality-assessment.mdx docs/workflows/data-export.mdx
```
Expected: ~200-250, ~150-180, ~150-180 lines
</verification>

<success_criteria>
1. discovery.mdx complete with 6-step workflow (WORK-01 satisfied)
2. quality-assessment.mdx complete with quality evaluation workflow (WORK-02 satisfied)
3. data-export.mdx complete with export pipeline workflow (WORK-03 satisfied)
4. All workflows use Steps component for sequential steps
5. Expected outputs shown at each step with JSON examples
6. Cross-references connect workflows to guides
7. No placeholder content ("[Similar structure...]" removed)
</success_criteria>

<output>
After completion, create `.planning/phases/20-guides-and-workflows/20-03a-SUMMARY.md` following summary template. Note that 20-03b must complete before full phase summary.
</output>
