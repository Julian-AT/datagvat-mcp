---
phase: 20-guides-and-workflows
plan: 03b
type: execute
wave: 3
depends_on: ["03a"]
files_modified:
  - docs/workflows/comparative-analysis.mdx
  - docs/workflows/publication-research.mdx
  - docs/workflows/semantic-exploration.mdx
  - docs/workflows/meta.json
autonomous: true

must_haves:
  truths:
    - "User compares multiple datasets using comparative analysis workflow"
    - "User finds citation-quality datasets using publication research workflow"
    - "User explores unfamiliar domains using semantic exploration workflow"
    - "User navigates workflows section with all 6 workflows visible"
    - "User sees expected outputs at each workflow step for verification"
  artifacts:
    - path: "docs/workflows/comparative-analysis.mdx"
      provides: "Comparative dataset analysis workflow"
      min_lines: 150
    - path: "docs/workflows/publication-research.mdx"
      provides: "Publication research workflow for citations"
      min_lines: 150
    - path: "docs/workflows/semantic-exploration.mdx"
      provides: "Semantic exploration workflow"
      min_lines: 150
    - path: "docs/workflows/meta.json"
      provides: "Workflows navigation with all 6 workflows"
      contains: "\"pages\".*discovery.*quality-assessment.*data-export.*comparative-analysis.*publication-research.*semantic-exploration"
  key_links:
    - from: "docs/workflows/*.mdx"
      to: "Steps component"
      via: "sequential workflow visualization"
      pattern: "<Steps>|<Step>"
    - from: "docs/workflows/*.mdx"
      to: "docs/guides/*.mdx"
      via: "cross-references to guides"
      pattern: "\\[.*\\]\\(\\/guides\\/"
    - from: "docs/workflows/meta.json"
      to: "all 6 workflow files"
      via: "pages array"
      pattern: "\"pages\".*\\[.*\\]"
---

<objective>
Create final 3 workflow walkthroughs (comparative-analysis, publication-research, semantic-exploration) and finalize workflows navigation.

Purpose: Complete the workflows section with specialized and advanced use case patterns, providing coverage for all major Austria MCP scenarios.

Output: 3 workflow MDX files with Steps components and complete content, plus updated workflows/meta.json navigation.
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
  <name>Create Comparative Analysis Workflow (WORK-04)</name>
  <files>docs/workflows/comparative-analysis.mdx</files>
  <action>
Create comparative dataset analysis workflow with complete content (not placeholders).

**Full structure:**
```markdown
---
title: Comparative Dataset Analysis
description: Compare multiple datasets to choose the best option for your needs
---

# Comparative Dataset Analysis

Systematically compare multiple datasets on the same topic to select the optimal option.

## Use This Workflow When

- Multiple datasets available for same topic
- Need to choose between alternatives
- Comparing data quality across sources
- Benchmarking dataset characteristics

## Prerequisites

- [ ] Search criteria defined (topic, domain)
- [ ] Comparison criteria prioritized (quality, freshness, completeness)
- [ ] Minimum requirements established

## Time Estimate

20-30 minutes for 3-5 datasets

## Workflow

<Tabs items={['Complete Example', 'Step by Step']} persist groupId="workflow-detail">
  <Tab value="Complete Example">
    ### Full Comparison Script

    ```python
    # Search for datasets
    results = search_datasets(
        query="population statistics",
        themes=["SOCI"],
        formats=["CSV"],
        boost_quality=True
    )

    # Compare top 5 candidates
    candidates = results['results'][:5]
    comparison = []

    for dataset in candidates:
        # Quality analysis
        quality = analyze_dataset_quality(dataset['id'])

        # Get distributions
        distributions = get_dataset_distributions(dataset['id'])
        csv_dist = next((d for d in distributions if d['format'] == 'CSV'), None)

        # Schema preview
        schema = None
        if csv_dist:
            schema = preview_schema(url=csv_dist['downloadURL'])

        # Compile comparison data
        comparison.append({
            'id': dataset['id'],
            'title': dataset['title'],
            'quality_score': quality['metrics']['overall_score'],
            'modified': dataset['modified'],
            'columns': len(schema['columns']) if schema else 0,
            'has_required_columns': all(
                col in [c['name'] for c in schema['columns']]
                for col in ['year', 'value']
            ) if schema else False
        })

    # Create comparison matrix
    print("Dataset Comparison Matrix")
    print("=" * 80)
    for item in sorted(comparison, key=lambda x: x['quality_score'], reverse=True):
        print(f"{item['title'][:40]:<40} | Q:{item['quality_score']:>3} | "
              f"Cols:{item['columns']:>2} | Modified:{item['modified']}")
    ```
  </Tab>

  <Tab value="Step by Step">
    <Steps>
      <Step>
        ### Search for Multiple Candidates

        Find all datasets matching your topic:

        ```python
        results = search_datasets(
            query="population statistics",
            themes=["SOCI"],
            formats=["CSV"],
            boost_quality=True,
            limit=10
        )

        print(f"Found {results['count']} datasets for comparison")
        candidates = results['results'][:5]  # Compare top 5
        ```

        **Expected output:**
        ```json
        {
          "results": [
            {
              "id": "dataset-123",
              "title": "Vienna Population 2024",
              "quality_score": 87,
              "modified": "2024-01-15"
            },
            {
              "id": "dataset-456",
              "title": "Austria Demographics",
              "quality_score": 75,
              "modified": "2023-11-20"
            },
            {
              "id": "dataset-789",
              "title": "Regional Population Data",
              "quality_score": 68,
              "modified": "2024-02-01"
            }
          ],
          "count": 15
        }
        ```

        **Verify:**
        - [ ] Sufficient candidates for comparison (3-10)
        - [ ] All candidates relevant to topic
        - [ ] Quality scores vary (enables meaningful comparison)
      </Step>

      <Step>
        ### Batch Quality Analysis

        Analyze quality for all candidates:

        ```python
        quality_results = {}

        for dataset in candidates:
            quality = analyze_dataset_quality(dataset['id'])
            quality_results[dataset['id']] = {
                'overall_score': quality['metrics']['overall_score'],
                'completeness': quality['metadata']['completeness_score'],
                'has_contact': quality['metadata']['has_contact'],
                'has_temporal': quality['metadata']['has_temporal']
            }

            print(f"{dataset['id']}: {quality['metrics']['overall_score']} "
                  f"(completeness: {quality['metadata']['completeness_score']})")
        ```

        **Expected output:**
        ```
        dataset-123: 87 (completeness: 95)
        dataset-456: 75 (completeness: 80)
        dataset-789: 68 (completeness: 70)

        Quality range: 68-87 (spread: 19 points)
        ```

        **Verify:**
        - [ ] All quality analyses completed
        - [ ] Scores show meaningful variation
        - [ ] Completeness breakdowns available
      </Step>

      <Step>
        ### Schema Comparison

        Compare data structures across datasets:

        ```python
        schema_comparison = {}

        for dataset in candidates:
            distributions = get_dataset_distributions(dataset['id'])
            csv_dist = next((d for d in distributions if d['format'] == 'CSV'), None)

            if csv_dist:
                schema = preview_schema(url=csv_dist['downloadURL'])
                schema_comparison[dataset['id']] = {
                    'columns': [c['name'] for c in schema['columns']],
                    'column_count': len(schema['columns']),
                    'types': {c['name']: c['type'] for c in schema['columns']}
                }

        # Find common columns
        all_columns = [set(s['columns']) for s in schema_comparison.values()]
        common_columns = set.intersection(*all_columns) if all_columns else set()

        print(f"Common columns across all datasets: {common_columns}")
        ```

        **Expected output:**
        ```json
        {
          "dataset-123": {
            "columns": ["year", "district", "population", "growth_rate"],
            "column_count": 4
          },
          "dataset-456": {
            "columns": ["year", "region", "population", "density"],
            "column_count": 4
          },
          "dataset-789": {
            "columns": ["year", "population"],
            "column_count": 2
          }
        }

        Common columns: {'year', 'population'}
        ```

        **Verify:**
        - [ ] Required columns present in at least one dataset
        - [ ] Column types compatible with requirements
        - [ ] Schema complexity appropriate
      </Step>

      <Step>
        ### Create Comparison Matrix

        Compile all criteria into decision matrix:

        ```python
        import pandas as pd
        from datetime import datetime

        matrix = []
        for dataset in candidates:
            quality = quality_results[dataset['id']]
            schema = schema_comparison.get(dataset['id'], {})

            # Calculate recency score
            modified = datetime.fromisoformat(dataset['modified'])
            age_days = (datetime.now() - modified).days
            recency_score = max(0, 100 - (age_days / 3.65))  # 1 point per ~3.6 days

            matrix.append({
                'ID': dataset['id'][-6:],  # Last 6 chars
                'Title': dataset['title'][:30],
                'Quality': quality['overall_score'],
                'Columns': schema.get('column_count', 0),
                'Recency': int(recency_score),
                'Modified': dataset['modified']
            })

        # Create DataFrame for clean display
        df = pd.DataFrame(matrix)
        df = df.sort_values('Quality', ascending=False)

        print(df.to_string(index=False))
        ```

        **Expected output:**
        ```
           ID                          Title  Quality  Columns  Recency    Modified
        at-123        Vienna Population 2024       87        4       99  2024-01-15
        at-456           Austria Demographics       75        4       85  2023-11-20
        at-789        Regional Population Data       68        2      100  2024-02-01
        ```

        **Verify:**
        - [ ] All candidates in matrix
        - [ ] Criteria scored consistently
        - [ ] Rankings clear and actionable
      </Step>

      <Step>
        ### Selection Decision

        Apply decision criteria and select winner:

        ```python
        # Define weights (adjust based on priorities)
        weights = {
            'quality': 0.5,
            'recency': 0.3,
            'completeness': 0.2
        }

        # Calculate weighted scores
        for item in matrix:
            quality_norm = item['Quality'] / 100
            recency_norm = item['Recency'] / 100
            completeness_norm = item['Columns'] / max(m['Columns'] for m in matrix)

            item['weighted_score'] = (
                quality_norm * weights['quality'] +
                recency_norm * weights['recency'] +
                completeness_norm * weights['completeness']
            )

        # Sort by weighted score
        matrix.sort(key=lambda x: x['weighted_score'], reverse=True)

        winner = matrix[0]
        print(f"Selected: {winner['Title']}")
        print(f"  Quality: {winner['Quality']}/100")
        print(f"  Recency: {winner['Recency']}/100")
        print(f"  Columns: {winner['Columns']}")
        print(f"  Weighted Score: {winner['weighted_score']:.2f}")
        ```

        **Decision matrix:**

        | Rank | Dataset | Quality | Recency | Columns | Score |
        |------|---------|---------|---------|---------|-------|
        | 1 | dataset-123 | 87 | 99 | 4 | 0.91 |
        | 2 | dataset-789 | 68 | 100 | 2 | 0.77 |
        | 3 | dataset-456 | 75 | 85 | 4 | 0.76 |

        **Verify:**
        - [ ] Winner aligns with priorities
        - [ ] Runner-up is acceptable backup
        - [ ] Selection rationale documented
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Success Criteria

At completion, you should have:

- [ ] 3-5 datasets compared
- [ ] Quality scores for all candidates
- [ ] Schema structures documented
- [ ] Comparison matrix created
- [ ] Selection decision made with justification

## Troubleshooting

### All Datasets Have Similar Scores

**Symptom:** Quality scores within 5-10 points

**Cause:** All candidates meet minimum quality bar

**Solutions:**
- Add secondary criteria (schema completeness, recency)
- Check metadata details for differentiators
- Test data previews for actual quality
- Consider combining multiple datasets

### Required Columns Missing from All

**Symptom:** No candidate has all required columns

**Cause:** Requirements too strict or naming variations

**Solutions:**
- Review column name variations (case, synonyms)
- Relax requirements to "nice to have"
- Check if data can be derived from available columns
- Expand search to different publishers

### Cannot Decide Between Top Two

**Symptom:** Two datasets tied on all criteria

**Cause:** Genuinely equivalent options

**Solutions:**
- Use both datasets (redundancy, cross-validation)
- Prefer more recent dataset
- Choose publisher with better support
- Test with sample data processing

## Related Workflows

- **[Dataset Discovery Workflow](/workflows/discovery)** - Finding initial candidates
- **[Quality Assessment Workflow](/workflows/quality-assessment)** - Detailed quality evaluation

## Related Guides

- **[Quality Metrics Guide](/guides/quality-metrics)** - Understanding quality scores
- **[Data Preview Guide](/guides/data-preview)** - Schema comparison techniques
```

**Target:** 150-180 lines following pattern of quality-assessment.mdx.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" comparative-analysis.mdx && \
  grep -c "<Step>" comparative-analysis.mdx && \
  grep -c "Expected output:" comparative-analysis.mdx && \
  wc -l comparative-analysis.mdx
```

Expected:
- 1 <Steps> wrapper
- 5 <Step> elements
- 3+ "Expected output:" sections
- 150-180 lines total
  </verify>
  <done>
comparative-analysis.mdx exists with Complete Example/Step by Step tabs, 5-step comparison workflow, expected outputs showing multi-dataset comparison, decision matrix, troubleshooting, cross-references, 150-180 lines
  </done>
</task>

<task type="auto">
  <name>Create Publication Research Workflow (WORK-05)</name>
  <files>docs/workflows/publication-research.mdx</files>
  <action>
Create publication research workflow with complete content (not placeholders).

**Full structure:**
```markdown
---
title: Publication Research Workflow
description: Find and validate citation-quality datasets for academic publications
---

# Publication Research Workflow

Identify high-quality, citation-worthy datasets for academic research and publications.

## Use This Workflow When

- Preparing academic papers or theses
- Need citation-quality data sources
- Require reproducible research data
- Publishing in peer-reviewed journals

## Prerequisites

- [ ] Research topic and keywords defined
- [ ] Citation requirements known (license, provenance)
- [ ] Required data characteristics specified

## Time Estimate

30-45 minutes per research topic

## Workflow

<Tabs items={['Complete Example', 'Step by Step']} persist groupId="workflow-detail">
  <Tab value="Complete Example">
    ### Citation-Quality Dataset Search

    ```python
    # Search with quality boost
    results = semantic_search_datasets(
        natural_query="Vienna public health outcomes and demographics",
        boost_quality=True,
        limit=20
    )

    # Filter for citation quality (≥85)
    citation_candidates = [
        d for d in results['results']
        if d.get('quality_score', 0) >= 85
    ]

    print(f"Found {len(citation_candidates)}/{results['count']} "
          "citation-quality datasets")

    # Verify citation requirements
    validated = []
    for dataset in citation_candidates:
        # Get full metadata
        full_data = get_dataset(dataset['id'])

        # Check citation criteria
        has_contact = bool(full_data.get('contact'))
        has_doi = bool(full_data.get('identifier', {}).get('doi'))
        has_citation = bool(full_data.get('citation'))
        license_ok = full_data.get('license') in [
            'CC-BY', 'CC-BY-4.0', 'CC0', 'ODbL'
        ]

        if has_contact and license_ok:
            validated.append({
                'dataset': full_data,
                'has_doi': has_doi,
                'has_citation': has_citation,
                'citation_ready': has_doi or has_citation
            })

    # Export citation metadata
    for item in validated:
        dataset = item['dataset']
        print(f"\n{dataset['title']}")
        print(f"  Publisher: {dataset['publisher']['name']}")
        print(f"  DOI: {dataset.get('identifier', {}).get('doi', 'N/A')}")
        print(f"  License: {dataset['license']}")
        print(f"  Citation ready: {item['citation_ready']}")
    ```
  </Tab>

  <Tab value="Step by Step">
    <Steps>
      <Step>
        ### Semantic Search with Quality Boost

        Use natural language query to find relevant datasets:

        ```python
        results = semantic_search_datasets(
            natural_query="Vienna public health outcomes and social demographics",
            boost_quality=True,
            limit=20
        )

        print(f"Found {results['count']} datasets")
        print(f"Query expanded to themes: {results.get('expansion_info', {}).get('semantic_themes', [])}")
        ```

        **Expected output:**
        ```json
        {
          "results": [
            {
              "id": "dataset-health-001",
              "title": "Health Indicators Vienna 2020-2024",
              "quality_score": 92,
              "modified": "2024-01-10"
            },
            {
              "id": "dataset-demog-045",
              "title": "Sociodemographic Statistics Austria",
              "quality_score": 88,
              "modified": "2023-12-15"
            }
          ],
          "count": 15,
          "expansion_info": {
            "detected_language": "en",
            "semantic_themes": ["HEAL", "SOCI"],
            "confidence": 0.89
          }
        }
        ```

        **Verify:**
        - [ ] Query expansion captured research intent
        - [ ] Results include high-quality datasets (>85)
        - [ ] Themes match research domain
      </Step>

      <Step>
        ### Filter for Citation Quality (≥85)

        Apply strict quality threshold for academic use:

        ```python
        citation_threshold = 85

        citation_candidates = [
            d for d in results['results']
            if d.get('quality_score', 0) >= citation_threshold
        ]

        print(f"Citation-quality datasets: {len(citation_candidates)}/{results['count']}")

        for dataset in citation_candidates:
            print(f"  {dataset['id']}: {dataset['quality_score']}/100")
        ```

        **Expected output:**
        ```
        Citation-quality datasets: 8/15

          dataset-health-001: 92/100
          dataset-demog-045: 88/100
          dataset-enviro-023: 87/100
          ...
        ```

        **Quality threshold rationale:**

        | Use Case | Min Score | Why |
        |----------|-----------|-----|
        | Peer-reviewed publications | ≥85 | High metadata completeness required |
        | Theses/Dissertations | ≥80 | Good quality acceptable with caveats |
        | Conference papers | ≥75 | Moderate quality for preliminary work |

        **Verify:**
        - [ ] At least 3-5 candidates meet threshold
        - [ ] If < 3 candidates, consider lowering to 80
      </Step>

      <Step>
        ### Verify Citation Information

        Check for DOI, citation text, and publisher contact:

        ```python
        validated = []

        for dataset in citation_candidates:
            # Get full metadata
            full_data = get_dataset(dataset['id'])

            # Extract citation fields
            has_contact = bool(full_data.get('contact'))
            has_doi = bool(full_data.get('identifier', {}).get('doi'))
            has_citation = bool(full_data.get('citation'))

            # Compile citation info
            citation_info = {
                'id': dataset['id'],
                'title': full_data['title'],
                'publisher': full_data['publisher']['name'],
                'contact': full_data.get('contact', {}),
                'doi': full_data.get('identifier', {}).get('doi'),
                'citation': full_data.get('citation'),
                'license': full_data.get('license'),
                'modified': full_data['modified']
            }

            # Check if citation-ready
            citation_ready = (has_doi or has_citation) and has_contact

            if citation_ready:
                validated.append(citation_info)
                print(f"✓ {dataset['id']}: Citation-ready")
            else:
                missing = []
                if not has_contact: missing.append('contact')
                if not (has_doi or has_citation): missing.append('doi/citation')
                print(f"✗ {dataset['id']}: Missing {', '.join(missing)}")
        ```

        **Expected output:**
        ```
        ✓ dataset-health-001: Citation-ready
          DOI: 10.25365/opendata-vh-2024
          Contact: open@data.wien.gv.at
          Citation: Stadt Wien (2024). Health Indicators Vienna...

        ✗ dataset-demog-045: Missing doi/citation
        ✓ dataset-enviro-023: Citation-ready
        ```

        **Verify:**
        - [ ] DOI or citation text available
        - [ ] Publisher contact information present
        - [ ] At least 2-3 validated datasets
      </Step>

      <Step>
        ### Check Research License

        Verify license permits academic use and citation:

        ```python
        research_licenses = [
            'CC-BY', 'CC-BY-4.0', 'CC-BY-3.0',
            'CC0', 'CC0-1.0',
            'ODbL', 'ODC-BY'
        ]

        research_approved = []

        for item in validated:
            license = item['license']

            if license in research_licenses:
                research_approved.append(item)
                print(f"✓ {item['id']}: {license} - Academic use approved")

                # Check attribution requirements
                requires_attribution = 'BY' in license or 'ODbL' in license
                if requires_attribution:
                    print(f"  ⚠ Requires attribution in citations")
            else:
                print(f"✗ {item['id']}: {license} - Verify restrictions")
        ```

        **Expected output:**
        ```
        ✓ dataset-health-001: CC-BY-4.0 - Academic use approved
          ⚠ Requires attribution in citations
        ✓ dataset-enviro-023: CC0-1.0 - Academic use approved
          (No attribution required, but recommended)
        ```

        **License guide for research:**

        | License | Academic Use | Attribution Required | Modifications OK |
        |---------|--------------|----------------------|------------------|
        | CC-BY | Yes | Yes | Yes |
        | CC0 | Yes | No (but recommended) | Yes |
        | ODbL | Yes | Yes (Share-Alike) | Yes |
        | CC-BY-NC | Depends | Yes | Educational OK |

        **Verify:**
        - [ ] License allows publication use
        - [ ] Attribution requirements understood
        - [ ] No NC (Non-Commercial) restrictions if publishing
      </Step>

      <Step>
        ### Export Citation Metadata

        Generate citation bibliography entries:

        ```python
        for item in research_approved:
            # Generate APA-style citation
            publisher = item['publisher']
            year = item['modified'][:4]
            title = item['title']['en'] if isinstance(item['title'], dict) else item['title']

            apa_citation = f"{publisher}. ({year}). {title}. "

            if item.get('doi'):
                apa_citation += f"https://doi.org/{item['doi']}"
            else:
                apa_citation += f"Retrieved from data portal"

            # Generate BibTeX entry
            bibtex_id = item['id'].replace('-', '_')
            bibtex = f"""@dataset{{{bibtex_id},
              author = {{{publisher}}},
              title = {{{title}}},
              year = {{{year}}},
              note = {{License: {item['license']}}},
              url = {{https://doi.org/{item.get('doi', '')}}}
            }}"""

            print(f"\n{item['id']}:")
            print(f"  APA: {apa_citation}")
            print(f"  BibTeX:\n{bibtex}")

            # Save to file
            with open(f"citations_{item['id']}.txt", 'w') as f:
                f.write(f"APA:\n{apa_citation}\n\n")
                f.write(f"BibTeX:\n{bibtex}\n\n")
                f.write(f"DOI: {item.get('doi', 'N/A')}\n")
                f.write(f"License: {item['license']}\n")
                f.write(f"Contact: {item.get('contact', {}).get('email', 'N/A')}\n")
        ```

        **Expected output:**
        ```
        dataset-health-001:
          APA: Stadt Wien. (2024). Health Indicators Vienna 2020-2024. https://doi.org/10.25365/opendata-vh-2024

          BibTeX:
          @dataset{dataset_health_001,
            author = {Stadt Wien},
            title = {Health Indicators Vienna 2020-2024},
            year = {2024},
            note = {License: CC-BY-4.0},
            url = {https://doi.org/10.25365/opendata-vh-2024}
          }

        Citations saved to:
          - citations_dataset-health-001.txt
          - citations_dataset-enviro-023.txt
        ```

        **Verify:**
        - [ ] Citation formats correct
        - [ ] DOI links functional
        - [ ] License information included
        - [ ] Contact info saved for questions
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Success Criteria

At completion, you should have:

- [ ] 2-3 citation-quality datasets identified (score ≥85)
- [ ] Citation metadata verified (DOI/citation text)
- [ ] Research licenses approved (CC-BY, CC0, ODbL)
- [ ] Bibliography entries generated (APA, BibTeX)
- [ ] Publisher contact information saved

## Troubleshooting

### No Datasets Meet Citation Quality Threshold

**Symptom:** All results < 85 quality score

**Cause:** Domain has sparse metadata or niche topic

**Solutions:**
- Lower threshold to 80 (document decision)
- Expand search to related themes
- Contact publishers to request DOI assignment
- Consider combining multiple lower-quality sources with caveats

### DOI Missing from High-Quality Dataset

**Symptom:** Quality score ≥85 but no DOI

**Cause:** Publisher hasn't assigned persistent identifier

**Solutions:**
- Use provided citation text if available
- Contact publisher to request DOI
- Cite using stable URL from dataset
- Document access date in citation

### License Unclear or Restrictive

**Symptom:** License not in standard list or has NC clause

**Cause:** Non-standard licensing or commercial restrictions

**Solutions:**
- Contact publisher for clarification
- Check if educational/research exemption exists
- Seek alternative dataset with clear license
- Consult with institution's legal counsel if high-value data

## Related Workflows

- **[Dataset Discovery Workflow](/workflows/discovery)** - Finding initial candidates
- **[Quality Assessment Workflow](/workflows/quality-assessment)** - Detailed quality verification

## Related Guides

- **[Quality Metrics Guide](/guides/quality-metrics)** - Understanding quality scores
- **[Searching Guide](/guides/searching)** - Semantic search techniques
```

**Target:** 150-180 lines following pattern of quality-assessment.mdx.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" publication-research.mdx && \
  grep -c "<Step>" publication-research.mdx && \
  grep -c "Expected output:" publication-research.mdx && \
  wc -l publication-research.mdx
```

Expected:
- 1 <Steps> wrapper
- 5 <Step> elements
- 3+ "Expected output:" sections
- 150-180 lines total
  </verify>
  <done>
publication-research.mdx exists with Complete Example/Step by Step tabs, 5-step publication workflow, expected outputs showing citation-quality datasets, research license checks, troubleshooting, cross-references, 150-180 lines
  </done>
</task>

<task type="auto">
  <name>Create Semantic Exploration Workflow (WORK-06)</name>
  <files>docs/workflows/semantic-exploration.mdx</files>
  <action>
Create semantic exploration workflow with complete content (not placeholders).

**Full structure:**
```markdown
---
title: Semantic Domain Exploration
description: Discover datasets in unfamiliar domains through iterative semantic search
---

# Semantic Domain Exploration

Explore new research domains by discovering datasets through semantic search and related dataset traversal.

## Use This Workflow When

- Exploring unfamiliar research domains
- Don't know exact keywords or terminology
- Want to discover unexpected data sources
- Building understanding of data landscape

## Prerequisites

- [ ] High-level research question or interest area
- [ ] Willingness to iterate and refine
- [ ] Open to discovering unexpected datasets

## Time Estimate

45-60 minutes for domain exploration

## Workflow

<Tabs items={['Complete Example', 'Step by Step']} persist groupId="workflow-detail">
  <Tab value="Complete Example">
    ### Iterative Exploration Script

    ```python
    # Start with broad question
    initial_query = "What data exists about urban sustainability in Vienna?"

    # Round 1: Broad semantic search
    results_r1 = semantic_search_datasets(
        natural_query=initial_query,
        limit=20
    )

    print(f"Round 1: {results_r1['count']} datasets")
    print(f"Themes discovered: {results_r1.get('expansion_info', {}).get('semantic_themes', [])}")

    # Analyze theme distribution
    themes = results_r1['facets']['themes']
    dominant_themes = sorted(themes.items(), key=lambda x: x[1], reverse=True)[:3]

    print(f"Top themes: {dominant_themes}")

    # Round 2: Refined search with dominant theme
    results_r2 = search_datasets(
        themes=[t[0] for t in dominant_themes],
        boost_quality=True,
        limit=15
    )

    # Round 3: Explore related datasets
    top_dataset = results_r2['results'][0]
    related = find_related_datasets(
        dataset_id=top_dataset['id'],
        min_score=30
    )

    print(f"Round 3: {len(related['related_datasets'])} related datasets")

    # Build dataset collection
    collection = {
        'initial_results': len(results_r1['results']),
        'refined_results': len(results_r2['results']),
        'related_datasets': len(related['related_datasets']),
        'key_themes': [t[0] for t in dominant_themes],
        'recommended': results_r2['results'][:5]
    }

    print(f"\nExploration summary:")
    print(f"  Themes: {collection['key_themes']}")
    print(f"  Total datasets discovered: {collection['initial_results'] + collection['related_datasets']}")
    print(f"  Recommended starting points: {len(collection['recommended'])}")
    ```
  </Tab>

  <Tab value="Step by Step">
    <Steps>
      <Step>
        ### Initial Broad Semantic Search

        Start with natural language question:

        ```python
        initial_query = "What data exists about urban sustainability in Vienna?"

        results = semantic_search_datasets(
            natural_query=initial_query,
            limit=20
        )

        print(f"Found {results['count']} datasets")
        print(f"Query expanded to themes: {results.get('expansion_info', {}).get('semantic_themes', [])}")

        # Review top results
        for dataset in results['results'][:5]:
            print(f"  - {dataset['title'][:60]}")
        ```

        **Expected output:**
        ```json
        {
          "count": 47,
          "expansion_info": {
            "detected_language": "en",
            "semantic_themes": ["ENVI", "ENER", "TRAN", "SOCI"],
            "confidence": 0.82
          },
          "results": [
            {
              "id": "dataset-env-087",
              "title": "Vienna Environmental Indicators 2024"
            },
            {
              "id": "dataset-ener-042",
              "title": "Renewable Energy Statistics Austria"
            },
            {
              "id": "dataset-transport-019",
              "title": "Public Transport Usage Vienna"
            }
          ]
        }
        ```

        **Verify:**
        - [ ] Query expansion captured intent
        - [ ] Multiple relevant themes discovered
        - [ ] Results span multiple datasets types
      </Step>

      <Step>
        ### Analyze Theme Distribution

        Identify dominant themes in results:

        ```python
        themes = results['facets']['themes']

        # Sort by frequency
        theme_ranking = sorted(
            themes.items(),
            key=lambda x: x[1],
            reverse=True
        )

        print("Theme Distribution:")
        for theme, count in theme_ranking[:5]:
            percentage = (count / results['count']) * 100
            print(f"  {theme}: {count} datasets ({percentage:.1f}%)")

        # Select top 2-3 themes for refinement
        dominant_themes = [t[0] for t in theme_ranking[:3]]
        print(f"\nFocusing on: {dominant_themes}")
        ```

        **Expected output:**
        ```
        Theme Distribution:
          ENVI: 18 datasets (38.3%)
          ENER: 12 datasets (25.5%)
          TRAN: 9 datasets (19.1%)
          SOCI: 5 datasets (10.6%)
          GOVE: 3 datasets (6.4%)

        Focusing on: ['ENVI', 'ENER', 'TRAN']
        ```

        **Verify:**
        - [ ] Theme distribution shows clear focus
        - [ ] Top themes align with research interest
        - [ ] Multiple themes suggest interdisciplinary data
      </Step>

      <Step>
        ### Find Related Datasets

        Traverse the dataset graph through relationships:

        ```python
        # Pick most relevant dataset from initial search
        seed_dataset = results['results'][0]

        # Find related datasets
        related = find_related_datasets(
            dataset_id=seed_dataset['id'],
            min_score=30
        )

        print(f"Related to '{seed_dataset['title']}':")
        print(f"  Found {len(related['related_datasets'])} related datasets\n")

        for rel in related['related_datasets'][:5]:
            print(f"  {rel['title'][:60]}")
            print(f"    Similarity: {rel['similarity_score']}")
            print(f"    Match reasons: {rel['match_reasons']}")
            print()
        ```

        **Expected output:**
        ```json
        {
          "reference_dataset_id": "dataset-env-087",
          "related_datasets": [
            {
              "id": "dataset-env-088",
              "title": "Vienna Air Quality Monitoring 2023",
              "similarity_score": 75,
              "match_reasons": {
                "theme_matches": ["ENVI"],
                "keyword_matches": ["environment", "vienna", "monitoring"],
                "same_publisher": true
              }
            },
            {
              "id": "dataset-climate-012",
              "title": "Climate Adaptation Strategies Vienna",
              "similarity_score": 60,
              "match_reasons": {
                "theme_matches": ["ENVI"],
                "keyword_matches": ["climate", "environment"],
                "same_publisher": false
              }
            }
          ]
        }
        ```

        **Verify:**
        - [ ] Related datasets expand domain understanding
        - [ ] Match reasons reveal connections
        - [ ] Similarity scores help prioritize
      </Step>

      <Step>
        ### Iterative Refinement

        Refine search based on discoveries:

        ```python
        # Round 2: Use discovered themes
        refined_results = search_datasets(
            themes=dominant_themes,
            boost_quality=True,
            limit=15
        )

        print(f"Refined search: {refined_results['count']} datasets")

        # Compare facets between rounds
        initial_publishers = set(results['facets']['publishers'].keys())
        refined_publishers = set(refined_results['facets']['publishers'].keys())

        new_publishers = refined_publishers - initial_publishers
        print(f"New publishers discovered: {new_publishers}")

        # Identify high-quality datasets
        high_quality = [
            d for d in refined_results['results']
            if d.get('quality_score', 0) >= 80
        ]

        print(f"High-quality datasets (≥80): {len(high_quality)}")
        ```

        **Expected output:**
        ```
        Refined search: 35 datasets (reduced from 47)

        New publishers discovered: {'magistrat-wien', 'umweltbundesamt'}

        High-quality datasets (≥80): 12

        Quality distribution:
          90-100: 3 datasets
          80-89: 9 datasets
          70-79: 15 datasets
          <70: 8 datasets
        ```

        **Verify:**
        - [ ] Refinement reduced noise
        - [ ] Quality distribution improved
        - [ ] New data sources discovered
      </Step>

      <Step>
        ### Build Dataset Collection

        Compile exploration findings:

        ```python
        exploration_summary = {
            'research_question': initial_query,
            'key_themes': dominant_themes,
            'total_datasets_found': results['count'],
            'high_quality_datasets': len(high_quality),
            'publishers': list(refined_publishers),
            'recommended_starting_points': []
        }

        # Select top 5 recommended datasets
        for dataset in refined_results['results'][:5]:
            quality = analyze_dataset_quality(dataset['id'])

            exploration_summary['recommended_starting_points'].append({
                'id': dataset['id'],
                'title': dataset['title'],
                'quality_score': quality['metrics']['overall_score'],
                'why_recommended': 'High quality' if quality['metrics']['overall_score'] >= 80 else 'Relevant themes'
            })

        # Save summary
        import json
        with open('domain_exploration_summary.json', 'w') as f:
            json.dump(exploration_summary, f, indent=2)

        print("\nExploration Summary:")
        print(f"  Question: {initial_query}")
        print(f"  Themes: {dominant_themes}")
        print(f"  Total datasets: {results['count']}")
        print(f"  High quality: {len(high_quality)}")
        print(f"  Recommended starts: {len(exploration_summary['recommended_starting_points'])}")
        print(f"\nSaved to: domain_exploration_summary.json")
        ```

        **Expected output:**
        ```json
        {
          "research_question": "What data exists about urban sustainability in Vienna?",
          "key_themes": ["ENVI", "ENER", "TRAN"],
          "total_datasets_found": 47,
          "high_quality_datasets": 12,
          "publishers": ["stadt-wien", "magistrat-wien", "umweltbundesamt"],
          "recommended_starting_points": [
            {
              "id": "dataset-env-087",
              "title": "Vienna Environmental Indicators 2024",
              "quality_score": 92,
              "why_recommended": "High quality"
            }
          ]
        }

        Exploration Summary:
          Question: What data exists about urban sustainability in Vienna?
          Themes: ['ENVI', 'ENER', 'TRAN']
          Total datasets: 47
          High quality: 12
          Recommended starts: 5

        Saved to: domain_exploration_summary.json
        ```

        **Verify:**
        - [ ] Exploration findings documented
        - [ ] Recommended datasets actionable
        - [ ] Next steps clear
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Success Criteria

At completion, you should have:

- [ ] Domain landscape mapped (themes, publishers)
- [ ] 3-5 key themes identified
- [ ] 5-10 recommended datasets prioritized
- [ ] Related dataset connections explored
- [ ] Exploration summary documented

## Troubleshooting

### Initial Search Too Broad

**Symptom:** 100+ results with scattered themes

**Cause:** Query too general or domain very large

**Solutions:**
- Add geographic constraint ("in Vienna")
- Add temporal constraint ("since 2020")
- Focus on specific sub-domain
- Use top theme to refine immediately

### No Clear Theme Patterns

**Symptom:** Themes evenly distributed, no dominant focus

**Cause:** Query spans multiple unrelated domains

**Solutions:**
- Rephrase query to be more specific
- Pick one aspect of question to explore first
- Review top results to understand spread
- Split into multiple focused explorations

### Related Datasets Not Helpful

**Symptom:** Related datasets not actually related

**Cause:** Low similarity scores or poor keyword matching

**Solutions:**
- Increase min_score threshold (try 40-50)
- Use different seed dataset
- Explore by publisher instead
- Use theme-based search for connections

## Related Workflows

- **[Dataset Discovery Workflow](/workflows/discovery)** - Focused discovery once domain understood
- **[Comparative Analysis Workflow](/workflows/comparative-analysis)** - Comparing discovered datasets

## Related Guides

- **[Searching Guide](/guides/searching)** - Semantic search techniques
- **[Quality Metrics Guide](/guides/quality-metrics)** - Related datasets feature
```

**Target:** 150-180 lines following pattern of quality-assessment.mdx.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -c "<Steps>" semantic-exploration.mdx && \
  grep -c "<Step>" semantic-exploration.mdx && \
  grep -c "Expected output:" semantic-exploration.mdx && \
  wc -l semantic-exploration.mdx
```

Expected:
- 1 <Steps> wrapper
- 5 <Step> elements
- 3+ "Expected output:" sections
- 150-180 lines total
  </verify>
  <done>
semantic-exploration.mdx exists with Complete Example/Step by Step tabs, 5-step exploration workflow, expected outputs showing iterative discovery, troubleshooting, cross-references, 150-180 lines
  </done>
</task>

<task type="auto">
  <name>Update workflows meta.json with complete navigation</name>
  <files>docs/workflows/meta.json</files>
  <action>
Update workflows section navigation to include all 6 workflows in logical order.

**Current state:**
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Workflows",
  "description": "End-to-end workflow examples and scenarios",
  "icon": "Workflow",
  "root": true,
  "pages": []
}
```

**Updated configuration:**
```json
{
  "$schema": "../.source/json-schema/docs.meta.json",
  "title": "Workflows",
  "description": "Complete end-to-end workflows for common data tasks",
  "icon": "Workflow",
  "root": true,
  "pages": [
    "discovery",
    "quality-assessment",
    "data-export",
    "comparative-analysis",
    "publication-research",
    "semantic-exploration"
  ]
}
```

**Navigation order rationale:**
1. **discovery:** Most common workflow (start here)
2. **quality-assessment:** Natural follow-up to discovery
3. **data-export:** Automation/integration (intermediate)
4. **comparative-analysis:** Advanced (comparing multiple)
5. **publication-research:** Specialized (academic)
6. **semantic-exploration:** Exploratory (domain discovery)

Order follows complexity: basic → intermediate → advanced → specialized.
  </action>
  <verify>
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  cat meta.json | jq '.pages | length' && \
  cat meta.json | jq '.pages[0]' && \
  cat meta.json | jq '.pages[-1]'
```

Expected:
- pages array length: 6
- First page: "discovery"
- Last page: "semantic-exploration"
  </verify>
  <done>
meta.json updated with all 6 workflows in complexity order (discovery, quality-assessment, data-export, comparative-analysis, publication-research, semantic-exploration), description updated to emphasize end-to-end workflows
  </done>
</task>

</tasks>

<verification>
After completion:

1. **All Workflow Files Created:**
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && ls -1 *.mdx | wc -l
```
Expected: 6 files total

2. **Steps Component Usage:**
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  grep -r "<Steps>" *.mdx | wc -l && \
  grep -r "<Step>" *.mdx | wc -l
```
Expected: 6 <Steps> wrappers, 30+ <Step> elements

3. **Expected Outputs Present:**
```bash
grep -r "Expected output:" docs/workflows/*.mdx | wc -l
```
Expected: 30+ instances (5+ per workflow)

4. **Cross-References:**
```bash
grep -r "/guides/" docs/workflows/*.mdx | wc -l && \
  grep -r "/workflows/" docs/workflows/*.mdx | wc -l
```
Expected: 18+ guide references, 12+ workflow cross-references

5. **Navigation Complete:**
```bash
cd C:/GitHub/datagvat-mcp/docs/workflows && \
  cat meta.json | jq '.pages'
```
Expected: Array with all 6 workflows

6. **Line Counts:**
```bash
wc -l docs/workflows/comparative-analysis.mdx docs/workflows/publication-research.mdx docs/workflows/semantic-exploration.mdx
```
Expected: ~150-180 lines each
</verification>

<success_criteria>
1. comparative-analysis.mdx complete with comparison workflow (WORK-04 satisfied)
2. publication-research.mdx complete with research workflow (WORK-05 satisfied)
3. semantic-exploration.mdx complete with exploration workflow (WORK-06 satisfied)
4. All workflows use Steps component for sequential steps (WORK-07 satisfied)
5. Expected outputs shown at each step (COMP-02 requirement satisfied)
6. Cross-references connect workflows to guides
7. meta.json includes all 6 workflows in logical order
8. No placeholder content ("[Similar structure...]" removed)
</success_criteria>

<output>
After completion, create `.planning/phases/20-guides-and-workflows/20-03b-SUMMARY.md` following summary template. This completes the workflows portion of Phase 20.
</output>
