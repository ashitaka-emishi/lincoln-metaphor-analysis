---
title: "Change Log"
---

## 2026-04-30 — Annotation Schema Repair

Repository-wide validation exposed schema drift between the Stage 4 annotation files, the documented schema, and the downstream pipeline scripts. All 20 existing annotated JSON files had drifted from the canonical `cmt` / `koenigsberg` / `meta` nested structure; legacy `fantasy_type` labels and absence-flag names were inconsistent with the validator.

**What was done:**

- Added `scripts/migrate_annotations_to_stage4.js` (`npm run migrate:annotations`) to rewrite all legacy instances into canonical shape while preserving interpretive content
- Promoted `disease_purification_absent` to a canonical absence flag in the schema, validator, concordance index, and analysis output — making the project's central structural finding formally trackable
- Fixed Stage 3 validation to match actual filenames in `corpus/segmented/`
- Regenerated Stage 5 concordance and Stage 6 analysis from the repaired data (`npm run pipeline`)
- Added `npm run validate:annotation -- <doc_id>` as a required post-write check after every new Stage 4 file

**Scope:** all 20 Stage 4 JSON files, `data/concordance.json`, `analysis/analysis.json`, schema documentation, and workflow files. Source texts and Stage 3 segmentation unchanged.

Full incident record: [`annotation_schema_repair.md`](annotation_schema_repair.md).

---

## 2026-05-02 — Stage 7: LCC Benchmark Validation

Added external validation pipeline comparing Lincoln's six clusters against the [LCC Metaphor Dataset](https://github.com/lcc-api/metaphor) (8,724 general English annotations).

**New scripts:**

- `scripts/download_lcc.py` — downloads and extracts `en_small.xml` (~4.6 MB) from GitHub
- `scripts/parse_lcc.py` — parses LCC XML → flat CSV with aggregated metaphoricity scores and source/target concepts
- `scripts/evaluate_lcc.py` — compares Lincoln concordance against LCC concept distribution; generates Markdown report
- `scripts/run_stage7.py` — orchestrator; prompts before downloading, caches parsed CSV

**New site page:** [`analysis/lcc_validation.md`](analysis/lcc_validation.md) — methodology, LCC baseline statistics, domain coverage analysis, and analytical significance.

**Findings updated:**

- [Finding 2](synthesis/findings.md) (Absence of Disease-and-Purification Logic) — LCC baseline shows DISEASE is the 4th most common source concept in general English (100/4,417 instances), making Lincoln's zero count measurably anomalous rather than merely internally observed. The "negative confirmation is methodologically weaker" limitation is partially addressed.
- [Finding 4](synthesis/findings.md) (Obligatory Frame as Universal Feature) — The two 100%-obligatory-frame clusters (covenant/oath, founding fathers/inheritance) have no significant parallel in the LCC taxonomy, confirming their obligatory force was architecturally constructed, not inherited from common English figurative usage.

**Docs updated:** `data_reproducibility.md`, `analysis_overview.md`, `methods_summary.md`, `synthesis/open_questions.md`.

**npm scripts added:** `npm run stage7`, `npm run stage7:download`, `npm run stage7:parse`, `npm run stage7:eval`.
