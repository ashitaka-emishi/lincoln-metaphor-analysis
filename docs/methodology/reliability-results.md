---
title: "Reliability Results"
draft: false
---

These are Stage 4B reliability results for the five-document sample defined in [Reliability Sample and Adjudication Workflow](reliability-report.md).

The future two-human study design is defined in [Human Double-Coding Follow-Up Protocol](human-double-coding-protocol.md). No human-human reliability metrics are reported here.

## Coding Design

Coder A is the Stage 4A reference annotation layer. Coder B is a Codex second-pass reliability review. This is a completed AI-assisted reliability pass, not a two-human blind inter-annotator study.

The completed coding sheet is `data/reliability/double-coding-completed.csv`. The adjudication log is `data/reliability/adjudication-log.csv`.

## Sample

| Measure | Value |
| --- | --- |
| Documents | 5 |
| Sample percentage | 17.86% |
| Sentence-identification units | 55 |
| Field-agreement units | 51 |

## Identification Reliability

| Measure | Value |
| --- | --- |
| Agreement | 52 / 55 (94.55%) |
| Cohen kappa, present/absent | 0.86 |
| True positive | 39 |
| True negative | 13 |
| False positive | 2 |
| False negative | 1 |
| Precision against Stage 4A reference | 95.12% |
| Recall against Stage 4A reference | 97.5% |
| F1 against Stage 4A reference | 96.3% |
| Boundary exact rate when both present | 100% |
| Boundary overlap rate when both present | 100% |

## Field Agreement

| Field | Agreements | Units | Rate |
| --- | --- | --- | --- |
| mipvu_decision | 50 | 51 | 98.04% |
| cluster_id | 49 | 51 | 96.08% |
| source_domain | 50 | 51 | 98.04% |
| target_domain | 50 | 51 | 98.04% |
| fantasy_type | 49 | 51 | 96.08% |
| violence_logic | 50 | 51 | 98.04% |
| obligatory_frame | 50 | 51 | 98.04% |
| absence_flags | 50 | 51 | 98.04% |
| confidence_band | 49 | 51 | 96.08% |
| ambiguity_flag | 51 | 51 | 100% |
| absence_flags_mean_jaccard | 0.9902 | 1.0000 max |  |
| confidence_score_mean_absolute_difference | 0.0065 | 0.0000 min |  |

## Adjudication

| Category | Count |
| --- | --- |
| agency_or_absence_flag | 1 |
| cluster_assignment | 1 |
| confidence_band | 1 |
| fantasy_type | 1 |
| mipvu_decision | 3 |
| textual_or_provenance_uncertainty | 1 |

Total adjudicated disagreements: 8.

## Limits

- This is a completed AI-assisted reliability pass, not a two-human blind coding study.
- The results are useful for locating unstable fields and documenting adjudication, but should not be reported as independent human-human inter-annotator reliability.
- The human double-coding follow-up protocol is designed separately; no human-human reliability metrics exist until the derivative human coding sheets, adjudication log, and results are produced.
- The second pass is intentionally conservative: it records explicit disagreements only where the reliability review found a concrete rival coding.
