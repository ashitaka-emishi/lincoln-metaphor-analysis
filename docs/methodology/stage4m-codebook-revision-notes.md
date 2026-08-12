---
title: "Stage 4M Codebook Revision Notes"
description: "Review notes for codebook clarification needs surfaced by the Stage 4M multi-model reliability layer."
draft: false
---

Stage 4M is a diagnostic AI-assisted reliability stress test. It can identify unstable coding fields, recurring model errors, and cases that should be sent to human review. It cannot revise Stage 4A reference annotations, change the annotation codebook by itself, or establish human inter-annotator reliability.

## Purpose

These notes record what the current Stage 4M comparison artifacts reveal about codebook clarity and coding instability. They are derived from the generated Stage 4M agreement, disagreement, consensus, and adjudication artifacts:

- `data/reliability/model-comparison/model-agreement-results.md`
- `data/reliability/model-comparison/model-disagreement-log.json`
- `data/reliability/model-comparison/model-consensus-report.md`
- `docs/methodology/multi-model-reliability-results.md`
- `docs/methodology/stage4m-adjudication-guide.md`

The current repository state contains no validated external model submissions. The correct codebook-revision posture is therefore conservative: the workflow can preserve review categories and insufficient-evidence states, but no empirical model-disagreement pattern exists yet.

## Categories Confirmed as Stable

No coding category is confirmed stable by Stage 4M at this time.

The current comparison artifacts report `no_submissions`, zero model runs, and no agreement denominator. A `reference_only` packet state means the Stage 4A reference remains the only available coding value; it is not model support.

## Categories Needing Clarification

No category can be classified as needing clarification from observed model disagreement yet.

The generated consensus report preserves these fields as insufficient evidence until validated model submissions exist:

- `agency_or_absence_flag`
- `ambiguity_flag`
- `cluster_id`
- `confidence`
- `koenigsberg_function`
- `lexical_unit_boundary`
- `metaphor_present`
- `obligatory_frame`
- `rival_reading_presence`
- `source_domain`
- `target_domain`
- `violence_logic`

Future Stage 4M runs should revisit this list after at least two validated model-output submissions are ingested and the comparison artifacts have non-zero denominators.

## Common Model Errors

No common model error pattern is currently observed because no model outputs have been submitted.

The implemented disagreement taxonomy is ready to record:

- MIPVU decision errors
- lexical-unit boundary drift
- cluster, source-domain, and target-domain disagreement
- Koenigsberg-function, violence-logic, and obligatory-frame disagreement
- agency or absence miscoding
- confidence, ambiguity, and rival-reading mismatch
- over-interpretation and under-interpretation
- historical-context errors
- model hallucination
- schema noncompliance
- reference challenges requiring human review

## Over-Interpretation Risks

No observed over-interpretation pattern can be reported yet.

The primary current risk is publication overreach: treating the existence of a Stage 4M workflow as though it were an executed robustness result. Until submissions exist, the project may say the Stage 4M workflow, packet, schemas, validation, comparison artifacts, and empty-state reporting are operational. It may not claim model convergence, model disagreement, field stability, or codebook-confirming evidence.

## Under-Interpretation Risks

No observed under-interpretation pattern can be reported yet.

Future runs should watch for model failures to identify metaphor-bearing spans, missed absence or agency flags, and overly literal coding of covenant, body, providence, birth, experiment, and inheritance language. Any such pattern must be recorded in generated disagreement artifacts before it becomes a codebook-revision basis.

## Agency and Absence Coding Notes

`agency_or_absence_flag` remains an insufficient-evidence field in the current Stage 4M artifacts. No model-derived clarification is warranted.

Because agency and absence coding is central to the project's claims, any future Stage 4M disagreement in this field should be routed to human review. Model consensus against Stage 4A should be treated as a reference challenge, not as an automatic correction.

## Disease and Purification Coding Notes

No Stage 4M disease or purification disagreement is currently available.

Future model runs should be reviewed especially carefully for purification over-read: a model may import disease, contagion, cleansing, or enemy-purification logic into passages where the validated Stage 4A coding intentionally records its absence. Any such dispute should remain a human-review candidate and may not alter the corpus-wide zero count without a separately authorized migration.

## Changes Recommended

No codebook change is recommended from the current Stage 4M evidence.

Recommended next evidence step: collect and validate external model submissions under the published Stage 4M workflow, then regenerate agreement, disagreement, consensus, adjudication, and results artifacts before revisiting these notes.

## Changes Accepted

No Stage 4M-derived codebook change is accepted.

Stage 4A, Stage 4B, concordance, analysis, claim audit, and synthesis outputs remain unchanged.

## Changes Deferred

All model-derived codebook revision decisions are deferred until Stage 4M has validated submissions and non-empty disagreement analysis.

Deferred review areas include:

- whether any field definitions need clearer coder-facing examples
- whether the agency and absence categories need additional edge-case language
- whether disease and purification absence needs stronger negative examples
- whether lexical-unit boundary guidance needs tightening
- whether future human double-coding materials should include Stage 4M-discovered ambiguity cases

These deferrals can inform the future two-human coding protocol, but they do not establish a human-human reliability result.
