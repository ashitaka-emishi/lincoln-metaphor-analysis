---
title: "Stage 7: LCC Metaphor Dataset Verification"
date: 2026-05-02
draft: false
---

The **LCC Metaphor Dataset** (Mohler et al. 2016) is used as a ground-truth benchmark to contextualise the Lincoln metaphor annotations. It is the largest publicly available English metaphor corpus, with ~17k annotations (en_small) and ~87k annotations (en_large), covering ~114 source-concept categories and ~32 target-concept categories.

This stage compares Lincoln's six conceptual clusters against the LCC taxonomy to identify which domains Lincoln's rhetoric covers, over-represents, and systematically avoids.

## Dataset

| File | Annotations | Concept pairs | Use |
| --- | --- | --- | --- |
| `en_small.xml` | ~17k | ~8k | Default; fast iteration |
| `en_large.xml` | ~87k | ~51k | Extended evaluation |

Download from: <https://github.com/lcc-api/metaphor>

Place files in `data/lcc/` before running the scripts below.

## Scripts

### 1. Parse LCC XML → CSV

```bash
python3 scripts/parse_lcc.py \
  --input data/lcc/en_small.xml \
  --output data/lcc_subset/en_small.csv
```

Produces a flat CSV with columns: `docid, sentence, score, is_metaphor, source_concept, target_concept, affect`.

Pass `--inspect` to print the XML element structure before parsing — useful if the schema differs from the expected attribute names.

### 2. Run evaluation and generate report

```bash
# Lincoln-only summary (no LCC data required):
python3 scripts/evaluate_lcc.py

# Full comparison with LCC data:
python3 scripts/evaluate_lcc.py \
  --lcc data/lcc_subset/en_small.csv \
  --output reports/stage7/LCC_report.md
```

The report is written to `reports/stage7/LCC_report.md`.

### 3. Via npm

```bash
npm run stage7:parse   # parse LCC XML → CSV
npm run stage7:eval    # Lincoln-only report
npm run stage7         # parse + full evaluation (requires data/lcc/en_small.xml)
```

## What the Report Contains

**Lincoln-only mode** (no LCC CSV):

- Cluster instance counts for all six clusters
- High-confidence instance count (≥0.90 annotator confidence)

**Full comparison mode** (with LCC CSV):

- All of the above
- LCC dataset summary (total, metaphorical vs literal split)
- Top LCC source-concept distribution
- Domain coverage table: which LCC concept categories map to which Lincoln cluster
- Uncovered LCC concepts: domains absent from Lincoln's metaphor system
- Cluster coverage summary with interpretation note

## Conceptual Mapping

Lincoln's six clusters correspond approximately to these LCC source-concept categories:

| Lincoln Cluster | Primary LCC Concepts |
| --- | --- |
| cluster_01_body_organism — Nation as organism/body | BODY, HEALTH, DISEASE, WOUND |
| cluster_02_covenant_oath — Union as covenant/oath | CONTRACT, LAW, OBLIGATION, SACRED |
| cluster_03_experiment_proposition — Republic as experiment | SCIENCE, EXPERIMENT, PROOF, TEST |
| cluster_04_birth_creation — War as birth/new creation | WAR, CONFLICT, BIRTH, DEATH |
| cluster_05_fathers_inheritance — Founding fathers as inheritance | INHERITANCE, PROPERTY, PATRIMONY |
| cluster_06_providence_theodicy — Providence/divine will | RELIGION, DIVINE, LIGHT |

**Key finding:** Lincoln's metaphor system is highly selective relative to the LCC English baseline. Domains common in general English metaphor (JOURNEY, MACHINE, PLANT, ANIMAL, BUILDING) are largely absent from Lincoln's political rhetoric — an analytically significant systematic absence.

## Implementation Details

- XML parsing uses `xml.etree.ElementTree` (standard library; no extra dependencies)
- Evaluation uses only standard library (`json`, `csv`, `collections`) — no scikit-learn required
- Concept mapping uses keyword matching against LCC attribute names; the `--inspect` flag helps if the XML schema uses non-standard attribute names
- Report output is plain Markdown, compatible with the Quarto site if placed in a QMD file

## License

The LCC dataset is released under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).  
Cite: Mohler, M., Coyne, R., Tomlinson, M., & Bracewell, D. (2016). A Corpus of Rich Metaphor Annotation. In *Proceedings of the Fourth Workshop on Metaphor in NLP*, NAACL.
