---
title: "Stage 7: LCC Benchmark Validation"
---

*Completed 2026-05-02 and updated 2026-06-17. Baseline page originally based on en_small.xml (8,724 parsed valid annotations). Stage 7 now also supports and has evaluated the larger LCC English dataset as an optional local benchmark.*

---

## What the LCC Dataset Is

The **LCC Metaphor Dataset** is a multilingual annotated metaphor resource [@mohler2016]. The English small subset used here contains 8,724 valid annotations drawn from general news text, with human metaphoricity scores (0–3), source-concept labels from a roughly 114-category taxonomy, and target-concept labels from a roughly 32-category taxonomy. Multiple annotators score each instance; the aggregated score is used here.

It provides a baseline for what a general English metaphor system looks like — what source-concept categories appear, and at what frequency. Lincoln's six clusters can then be situated against that baseline.

---

## Why This Matters for the Lincoln Project

Lincoln's metaphor system was identified and described from within the corpus. Stage 7 asks a bounded comparative question: how do the project's six Lincoln clusters align with the source-concept taxonomy represented in LCC?

This has two analytical uses:

1. **External benchmark context**: clusters can be compared with categories represented in modern general-news English. A missing direct category match is descriptive of the LCC taxonomy, not proof that a construction is unique to Lincoln.
2. **Category comparison**: LCC shows which prominent source concepts have no equivalent among the project's six predefined Lincoln clusters. Because the Lincoln scheme is cluster-bounded, this is not a complete inventory of every metaphor Lincoln used.

---

## Lincoln Corpus Summary

| Cluster | Name | Instances |
| --- | --- | --- |
| `cluster_01_body_organism` | Nation as organism / body | 34 |
| `cluster_02_covenant_oath` | Union as covenant / oath | 17 |
| `cluster_03_experiment_proposition` | Republic as experiment / proposition | 20 |
| `cluster_04_birth_creation` | War as birth / new creation | 8 |
| `cluster_05_fathers_inheritance` | Founding fathers as inheritance | 35 |
| `cluster_06_providence_theodicy` | Providence / divine will | 22 |

**Total:** 136 instances. High-confidence (≥0.90): 51.

---

## LCC Baseline

| Metric | Value |
| --- | --- |
| Total annotations | 8,724 |
| Metaphorical (avg score > 0) | 4,417 (50.6%) |
| Literal (avg score = 0) | 4,307 (49.4%) |

### Top LCC Source Concepts (metaphorical instances)

| Rank | Concept | Count |
| --- | --- | --- |
| 1 | OTHER | 161 |
| 2 | MOVEMENT | 132 |
| 3 | PROTECTION | 106 |
| 4 | DISEASE | 100 |
| 5 | STRUGGLE | 99 |
| 6 | BUILDING | 91 |
| 7 | PHYSICAL_HARM | 88 |
| 8 | VISION | 85 |
| 9 | RESOURCE | 80 |
| 10 | PHYSICAL_BURDEN | 76 |
| 11 | MACHINE | 74 |
| 12 | BODY_OF_WATER | 72 |
| 13 | CONFINEMENT | 70 |
| 14 | UPWARD_MOVEMENT | 69 |
| 15 | PHYSICAL_LOCATION | 68 |
| 16 | DOWNWARD_MOVEMENT | 68 |
| 17 | SHAPE | 66 |
| 18 | EMOTION_EXPERIENCER | 65 |
| 19 | HUMAN_BODY | 63 |
| 20 | OBJECT_HANDLING | 60 |

### Large LCC Cross-Check

The optional `en_large` path was evaluated locally on 2026-06-17 with `npm run stage7:large`. It parsed 52,118 valid annotations from `en_large.xml`, including 27,956 metaphorical annotations. DISEASE remains a prominent source concept in the larger path: rank 10, with 538 metaphorical instances.

| LCC path | Valid annotations | Metaphorical annotations | DISEASE rank | DISEASE count |
| --- | ---: | ---: | ---: | ---: |
| `en_small` | 8,724 | 4,417 | 4 | 100 |
| `en_large` | 52,118 | 27,956 | 10 | 538 |

The large cross-check strengthens the baseline inference by showing that DISEASE prominence is not an artifact of the small subset. It does not remove the main benchmark limitation: both LCC paths are general English/news-text baselines, not nineteenth-century American political corpora.

---

## Domain Coverage Analysis

### LCC Concepts Matched to Lincoln Clusters

| LCC Source Concept | LCC Count | Lincoln Cluster |
| --- | --- | --- |
| DISEASE | 100 | Nation as organism / body |
| BODY_OF_WATER | 72 | Nation as organism / body |
| UPWARD_MOVEMENT | 69 | War as birth / new creation |
| DOWNWARD_MOVEMENT | 68 | War as birth / new creation |
| HUMAN_BODY | 63 | Nation as organism / body |
| WAR | 54 | War as birth / new creation |
| NATURAL_PHYSICAL_FORCE | 36 | War as birth / new creation |
| LIGHT | 32 | Providence / divine will |
| SCIENCE | 31 | Republic as experiment / proposition |

**4 of 6 Lincoln clusters** have direct LCC concept matches.

### Clusters with No LCC Concept Match

| Cluster | Name | Why No LCC Match |
| --- | --- | --- |
| `cluster_02_covenant_oath` | Union as covenant / oath | CONTRACT, OATH, OBLIGATION are not prominent LCC source-concept categories |
| `cluster_05_fathers_inheritance` | Founding fathers as inheritance | INHERITANCE, PATRIMONY, ANCESTRAL_DEBT have no LCC category equivalent |

These two clusters have no direct category match in the LCC taxonomy. That makes them distinctive relative to this benchmark, but the dataset cannot establish whether they were uncommon in nineteenth-century American political rhetoric or unique to Lincoln.

### LCC Concepts Without Lincoln Cluster Equivalents

These are source-concept categories that rank in the top 20 of general English metaphor usage but have no Lincoln cluster equivalent:

| LCC Concept | LCC Count | Interpretation |
| --- | --- | --- |
| MOVEMENT | 132 | No equivalent among the six Lincoln clusters |
| PROTECTION | 106 | No equivalent among the six Lincoln clusters |
| BUILDING | 91 | No equivalent among the six Lincoln clusters |
| PHYSICAL_HARM | 88 | No equivalent among the six Lincoln clusters |
| VISION | 85 | LIGHT maps only to the Providence cluster; VISION has no direct equivalent |
| RESOURCE | 80 | No equivalent among the six Lincoln clusters |
| MACHINE | 74 | No equivalent among the six Lincoln clusters |
| CONFINEMENT | 70 | No equivalent among the six Lincoln clusters |
| GAME | 57 | No equivalent among the six Lincoln clusters |
| ANIMAL | 55 | No equivalent among the six Lincoln clusters |

---

## Analytical Significance

### Benchmark Result: DISEASE Is Available in LCC General English

DISEASE is the 4th most common source concept in `en_small` (100 instances) and ranks 10th in `en_large` (538 instances). Lincoln's corpus uses disease language but never constructs a social group as pathogen. The benchmark shows that DISEASE is available in modern general-news English; it does not establish a nineteenth-century norm or explain Lincoln's selection by itself.

This evidence has three layers and they should not be collapsed:

1. **Validated zero count**: the Stage 4-6 Lincoln corpus contains zero `disease_and_purification` fantasy-type instances.
2. **Positive absence evidence**: 56 `disease_purification_absent` flags mark cases where purification logic was structurally available but not deployed.
3. **External-baseline inference**: LCC `en_small` and `en_large` show that DISEASE is represented prominently in these modern general-news datasets, making Lincoln's zero pathogen-group mapping notable relative to that limited benchmark.

No implemented contemporary comparison corpus currently tests the same absence against Union, Confederate, abolitionist, or presidential-register controls. Those corpora remain candidate benchmarks in [External Benchmarks](../docs/methodology/external-benchmarks.md). The current external claim is therefore a general-English benchmark claim, not yet a period-specific political-culture claim.

### Benchmark Result: Covenant and Inheritance Lack Direct LCC Categories

The two clusters without direct LCC matches — cluster_02 (covenant/oath) and cluster_05 (founding fathers/inheritance) — are important parts of Lincoln's coded political architecture. The LCC comparison does not show how common those mappings were among Lincoln's contemporaries.

This contextualizes [Finding 4](../synthesis/findings.md): covenant and inheritance carry binding entailments in Lincoln's corpus and are not represented by direct LCC category matches. A contemporary political corpus is needed before attributing that pattern specifically to Lincoln.

### Benchmark Result: Several Prominent LCC Categories Lack Lincoln Cluster Equivalents

MOVEMENT, BUILDING, MACHINE, RESOURCE, GAME, and ANIMAL are prominent LCC categories with no equivalent among this project's six Lincoln clusters. Because the Lincoln annotation scheme is cluster-bounded, this is a comparison of coded category systems rather than proof that Lincoln never used expressions from those domains.

The benchmark supports category-level comparison only. Claims that Lincoln's total metaphor vocabulary excludes these domains would require an open-ended annotation scheme or a separately designed corpus search.

---

## Reproducibility

The Stage 7 validation pipeline is fully automated:

```bash
# Download LCC data (~4.6 MB) and run full comparison:
npm run stage7

# Download and evaluate the larger English LCC dataset:
npm run stage7:large

# Lincoln-only cluster summary (no download needed):
npm run stage7:eval
```

Additional explicit commands:

```bash
npm run stage7:download
npm run stage7:parse
npm run stage7:download:large
npm run stage7:parse:large
```

Scripts: `scripts/download_lcc.py`, `scripts/parse_lcc.py`, `scripts/evaluate_lcc.py`, `scripts/run_stage7.py`

Data: `data/lcc/en_small.xml` and `data/lcc/en_large.xml` are not committed; they are downloaded on demand. Parsed CSV files under `data/lcc_subset/` are also not committed and are generated by `parse_lcc.py`.

The benchmark registry in [External Benchmarks](../docs/methodology/external-benchmarks.md) documents implemented LCC choices, candidate contemporary corpora, licensing, size, redistribution policy, and reproducibility commands.

Source: [LCC Metaphor Dataset](https://github.com/lcc-api/metaphor), CC BY-NC-SA 4.0. Cite: Mohler, M., Coyne, R., Tomlinson, M., & Bracewell, D. (2016). A Corpus of Rich Metaphor Annotation. NAACL Workshop on Metaphor in NLP.
