# V4 Reliability Sampling Update

Generated from the current Stage 4 reliability sample, v4 corpus inventories, the v4 coverage summary, and the v4 expansion impact report.

## Summary

| Measure | Value |
| --- | --- |
| V3/v1 prior sample documents | 5 |
| V4 core documents | 48 |
| V4 validation documents | 78 |
| Selected v4 sample-frame documents | 9 |
| Selected v4-core documents | 8 |
| Selected validation documents | 1 |
| Selected original-v1 documents | 3 |
| Selected new v4-core documents | 5 |
| Selected core percentage | 16.67% |

## Corpus-Version Boundary

v3/v1 human reliability remains valid as a prior study tied to the 28-document annotated corpus.

The existing Stage 4H and Stage 4M reliability artifacts remain tied to the 28-document v1 annotated corpus. They should be cited as prior reliability evidence, not as completed v4 reliability.

## V4 Sample Frame

| Doc ID | Tier | Short Title | Period | Genre | Role | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| doc_001 | v4-core | Lyceum Address | early | speech | legacy_positive_anchor | ready_as_legacy_stage4a_anchor |
| doc_004 | v4-core | Peoria Speech | antebellum | speech | legacy_antebellum_slavery_anchor | ready_as_legacy_stage4a_anchor |
| doc_023 | v4-core | First Political Announcement | early | speech | new_early_political_formation | requires_v4_annotation_before_metric_use |
| doc_027 | v4-core | Independence Hall Address | secession_crisis | speech | new_secession_crisis | requires_v4_annotation_before_metric_use |
| doc_028 | v4-core | Annual Message 1861 | early_war | annual_message | new_early_war_policy | requires_v4_annotation_before_metric_use |
| doc_035 | v4-core | Colonization Address | emancipation | speech | new_race_agency_boundary | requires_v4_annotation_before_metric_use |
| doc_041 | v4-core | Bixby Letter | late_war | condolence | new_late_war_sacrifice | requires_v4_annotation_before_metric_use |
| doc_022 | v4-core | Last Address | reconstruction_transition | speech | legacy_reconstruction_transition | ready_as_legacy_stage4a_anchor |
| doc_070 | v4-validation | Commercial Intercourse Proclamation | late_war | proclamation | validation_negative_check | requires_v4_annotation_before_metric_use |

## Sampling Criteria Coverage

| Criterion | Status | Doc IDs |
| --- | --- | --- |
| documents_from_original_v1_corpus | covered | doc_001, doc_004, doc_022 |
| documents_from_new_v4_core_additions | covered | doc_023, doc_027, doc_028, doc_035, doc_041 |
| early_political_formation_text | covered | doc_023 |
| antebellum_slavery_text | covered | doc_004 |
| secession_crisis_text | covered | doc_027 |
| early_war_text | covered | doc_028 |
| emancipation_text | covered | doc_035 |
| late_war_providence_sacrifice_text | covered | doc_041 |
| reconstruction_transition_text | covered | doc_022 |
| positive_metaphor_cases | covered | doc_001, doc_004, doc_027, doc_022 |
| negative_controls | covered | doc_023, doc_028, doc_070 |
| agency_absence_cases | covered | doc_035 |
| disease_purification_negative_check_cases | covered | doc_001, doc_070 |
| ambiguous_cases | covered | doc_004, doc_035, doc_041 |

## Human-Coding Use

New v4 reliability sampling can be used for future v4 human coding after the v4 packet generator converts this frame into blind coding units. The frame intentionally includes original v1 documents, new v4 core additions, and one validation-corpus negative-check candidate.

## Negative Controls and Ambiguity

Negative controls are represented as deterministic sentence candidates for v4-core documents. Ambiguous cases are represented by provenance, authorship, audience, and policy-boundary targets that should receive coder attention during packet generation.

## Methodological Boundaries

- Claims remain limited to the currently annotated core until v4 additions receive full Stage 4A re-analysis.
- Corpus v1/v3 reliability results remain valid for their original corpus version and should not be restated as v4 reliability results.
- New v4 reliability sampling can be used for future human coding only after packet generation, coder assignment, submission ingestion, and adjudication gates run.
- Validation-corpus targets are lightly annotated candidates; they are included to force denominator and negative-check review, not to inflate the fully annotated core.
