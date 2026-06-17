---
title: "Reliability Sample and Adjudication Workflow"
draft: false
---

# Reliability Sample and Adjudication Workflow

This page defines the reliability layer for the publication-upgrade milestone. The current Stage 4B result compares the Stage 4A reference annotation layer with a Codex second-pass reliability review. It reports completed coding, adjudication, and metrics while explicitly avoiding a two-human blind inter-annotator reliability claim.

The follow-up design for a future two-human blind study is defined separately in [Human Double-Coding Follow-Up Protocol](human-double-coding-protocol.md). That protocol is not yet a completed human reliability result.

Generate the reliability artifacts with:

```bash
npm run reliability:sample
```

The generator writes:

| Artifact | Role |
| --- | --- |
| `data/reliability/reliability-sample.json` | Canonical sample definition, reference values, disagreement categories, and agreement-measure plan |
| `data/reliability/double-coding-template.csv` | Blank coding worksheet for independent coders |
| `data/reliability/double-coding-completed.csv` | Completed Stage 4A-reference and Codex second-pass coding sheet |
| `data/reliability/adjudication-log.csv` | Traceable adjudication register for coder disagreements |
| `data/reliability/reliability-results.json` | Computed reliability metrics and limitations |
| `docs/methodology/reliability-results.md` | Rendered reliability results page |

## Sample Definition

The reliability sample is a five-document, document-stratified sample from the 28-document corpus: 5 / 28 = 17.86 percent. This satisfies the 10-20 percent reliability-sample requirement.

The sample chooses one document from each diachronic phase, favoring high analytical priority, dense evidence, and known provenance risks:

| Document | Period | Register | Reason |
| --- | --- | --- | --- |
| `doc_001` Lyceum Address | `phase_1_baseline` | `formal_public_address` | Early baseline evidence for covenant, inheritance, organism, and experiment language |
| `doc_006g` Seventh Lincoln-Douglas Debate | `phase_2_argument` | `campaign_speech` | Debate evidence with Lincoln-primary authorship and transcription-variant risk |
| `doc_010` July 4 Message 1861 | `phase_3_obligation` | `congressional_message` | Obligation logic in a lower-confidence official register |
| `doc_017` Gettysburg Address | `phase_4_transformation` | `formal_public_address` | Dense multi-cluster transformation evidence with manuscript-variant caution |
| `doc_021` Second Inaugural | `phase_5_theodicy` | `formal_public_address` | Concentrated providence, guilt, sacrifice, and reconciliation evidence |

The sample cannot cover every register within a 20 percent document cap. It therefore prioritizes diachronic coverage and high-impact claims. Later register-controlled analysis should still test the full corpus, especially legal documents, semi-public letters, and private fragments.

## Coding Units

The generated sample separates two coding tasks:

| Unit type | What it tests | Source |
| --- | --- | --- |
| `sentence_identification` | Whether coders independently identify metaphor-related lexical units and boundaries | Positive Stage 4A anchor sentences plus deterministic negative controls |
| `field_agreement` | Whether coders assign the same CMT, Koenigsberg, absence, confidence, and ambiguity fields for an already identified span | Stage 4A evidence-chain records |

This distinction matters. MIPVU identification reliability is not the same thing as agreement about the ideological function of an already identified metaphor.

## Double-Coding Workflow

1. Run `npm run pipeline` and `npm run reliability:sample`.
2. Give each coder a fresh copy of `data/reliability/double-coding-template.csv`.
3. For `sentence_identification` rows, coders read the sentence and record every metaphor-related lexical unit they identify. If a sentence contains more than one candidate unit, duplicate the row and fill one lexical unit per row.
4. For `field_agreement` rows, coders use the supplied span text and independently code the MIPVU-facing fields, CMT mapping, Koenigsberg function, absence flags, confidence, and ambiguity.
5. Compare the two completed coder sheets against each other and against the Stage 4A reference values stored in `reliability-sample.json`.
6. Enter every substantive disagreement in `data/reliability/adjudication-log.csv`.
7. If adjudication changes an annotation-level judgment, do not edit Stage 4 directly. Create a documented migration or derivative correction layer.

## Disagreement Categories

The adjudication log uses these categories:

- `mipvu_decision`
- `lexical_unit_boundary`
- `basic_or_contextual_meaning`
- `historical_semantics`
- `cluster_assignment`
- `source_domain`
- `target_domain`
- `entailment`
- `fantasy_type`
- `violence_logic`
- `obligatory_frame`
- `agency_or_absence_flag`
- `confidence_band`
- `textual_or_provenance_uncertainty`
- `out_of_scope`

The category is not a verdict. It tells the reviewer what kind of instability was found and whether the problem belongs to identification, conceptual mapping, interpretation, provenance, or scope control.

## Agreement Measures

Report identification reliability separately from interpretive agreement:

| Layer | Measures |
| --- | --- |
| Identification | sentence-level present/absent agreement; lexical-unit boundary exact match and overlap match; precision, recall, and F1 against adjudicated consensus |
| CMT mapping | exact agreement on `cluster_id`; source-domain and target-domain family agreement; qualitative entailment overlap |
| Koenigsberg layer | exact agreement on `fantasy_type`; agreement on `violence_logic` and `obligatory_frame`; Jaccard overlap for `absence_flags` |
| Confidence | same confidence-band agreement; mean absolute score difference |

Do not publish a single blended reliability score. A coder pair might agree strongly that a phrase is metaphor-related while disagreeing over whether the political-psychological function is `experiment_and_proof` or `sacrifice_and_redemption`. Those are different methodological claims.

## Current Status

The sample, completed coding sheet, adjudication log, and metrics are implemented. The current results are summarized in [Reliability Results](reliability-results.md):

| Layer | Result |
| --- | --- |
| Sentence-identification agreement | 52 / 55 units = 94.55%; present/absent kappa = 0.86 |
| Identification precision / recall / F1 against Stage 4A reference | 95.12% / 97.5% / 96.3% |
| CMT cluster agreement | 49 / 51 units = 96.08% |
| Fantasy-type agreement | 49 / 51 units = 96.08% |
| Absence-flag agreement | 50 / 51 units = 98.04%; mean Jaccard = 0.9902 |
| Confidence-band agreement | 49 / 51 units = 96.08% |
| Adjudicated disagreements | 8 |

The limits are part of the result. Coder A is the Stage 4A reference layer. Coder B is a Codex second-pass review. The results are useful for surfacing unstable fields and documenting adjudication, but they should not be cited as a two-human blind reliability study.

## Human Follow-Up Boundary

The human follow-up protocol preserves the same five-document sample and uses derivative reliability artifacts rather than edits to validated Stage 4 files. Human coders would be blind to Stage 4A reference values, Codex second-pass overrides, and each other's sheets until both have completed coding.

Until those human artifacts exist, the current reliability claim remains limited to the AI-assisted Stage 4B pass. Future human-human metrics should be reported beside the current result, not averaged into it.
