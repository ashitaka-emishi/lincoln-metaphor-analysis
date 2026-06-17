---
title: "Human Double-Coding Follow-Up Protocol"
draft: false
---

# Human Double-Coding Follow-Up Protocol

This protocol defines a small blind human double-coding study that can supplement the current Stage 4B AI-assisted reliability pass. It is a design for future human data collection, not a completed human-human inter-annotator reliability result.

The current implemented reliability result remains the Stage 4A reference layer compared with a Codex second-pass reliability review. Human results should be reported beside that result only after two independent human coders complete the protocol below.

## Study Status

| Item | Status |
| --- | --- |
| Human protocol | Designed |
| Human coders recruited | Not yet |
| Human coding completed | Not yet |
| Human-human metrics | Not yet available |
| Current reliability evidence | AI-assisted Stage 4B pass only |

No publication claim should describe the project as having a completed two-human blind reliability study until the human coding sheets, adjudication log, and human metrics exist as derivative reliability artifacts.

## Sample Selection

Use the existing five-document Stage 4B sample so human results can be compared against the current AI-assisted pass without changing the evidence universe:

| Document | Period | Register | Reason |
| --- | --- | --- | --- |
| `doc_001` Lyceum Address | `phase_1_baseline` | `formal_public_address` | Early baseline evidence for covenant, inheritance, organism, and experiment language |
| `doc_006g` Seventh Lincoln-Douglas Debate | `phase_2_argument` | `campaign_speech` | Debate evidence with Lincoln-primary authorship and transcription-variant risk |
| `doc_010` July 4 Message 1861 | `phase_3_obligation` | `congressional_message` | Obligation logic in a lower-confidence official register |
| `doc_017` Gettysburg Address | `phase_4_transformation` | `formal_public_address` | Dense multi-cluster transformation evidence with manuscript-variant caution |
| `doc_021` Second Inaugural | `phase_5_theodicy` | `formal_public_address` | Concentrated providence, guilt, sacrifice, and reconciliation evidence |

The coding units are the 55 sentence-identification units and 51 field-agreement units already defined in `data/reliability/reliability-sample.json`. Reusing the current sample keeps the follow-up small, preserves the 10-20 percent document sample, and avoids selecting easier cases after seeing the AI-assisted results.

## Coder Assignment and Blinding

Use two independent human coders, labeled `human_coder_a` and `human_coder_b`.

Coders should receive:

- The annotation codebook and controlled vocabularies.
- The relevant source sentences or spans from the reliability template.
- The coding worksheet generated from the Stage 4B sample.
- A short instruction sheet derived from this protocol.

Coders should not receive:

- Stage 4 annotation JSON.
- Stage 4A evidence-chain reference values.
- Codex second-pass overrides or reliability results.
- The other coder's worksheet.
- The adjudication log before both coding sheets are complete.

The adjudicator may inspect Stage 4A and Codex second-pass values only after human-human disagreements have been logged. This order keeps the human agreement result independent while still allowing the project to compare human consensus with the existing annotation layer.

## Coding Tasks

The study has two task types. Report them separately.

| Task | Unit | Coder action | Reliability question |
| --- | --- | --- | --- |
| Identification | `sentence_identification` | Decide whether the sentence contains metaphor-related language and identify lexical unit boundaries | Do human coders find the same metaphor-related lexical units? |
| Field agreement | `field_agreement` | Code an already supplied span for MIPVU, CMT, Koenigsberg, absence, confidence, and ambiguity fields | Do human coders assign the same interpretive fields once a span is identified? |

For identification rows, coders should add one row per candidate lexical unit. If no metaphor-related lexical unit is present, they should mark `mipvu_decision` as `not_metaphor_related` and leave interpretive fields blank.

For field-agreement rows, coders should code the supplied span even if they think it is borderline. If they believe the span is not metaphor-related, they should mark `mipvu_decision` as `not_metaphor_related`, leave downstream fields blank, and explain the decision in `coder_notes`.

## Fields Coded

Human coders should complete the fields already present in `data/reliability/double-coding-template.csv`:

| Field group | Fields |
| --- | --- |
| MIPVU and lexical unit | `candidate_lexical_unit`, `span_char_start`, `span_char_end`, `mipvu_decision`, `contextual_meaning`, `basic_meaning`, `historical_semantics_note` |
| CMT mapping | `cluster_id`, `source_domain`, `target_domain`, `entailments` |
| Koenigsberg function | `fantasy_type`, `violence_logic`, `obligatory_frame` |
| Absence and agency | `absence_flags` |
| Confidence and ambiguity | `confidence_score`, `ambiguity_flag`, `coder_notes` |

Use pipe-separated values for multi-value fields such as `absence_flags`. Use the same controlled vocabulary as the annotation codebook where a controlled vocabulary exists.

## Adjudication Rules

After both human sheets are complete:

1. Compare `human_coder_a` and `human_coder_b` without looking at Stage 4A reference values.
2. Log every substantive disagreement in a derivative human adjudication file.
3. Assign one disagreement category from the existing reliability vocabulary.
4. Record the adjudicated human consensus value and rationale.
5. Only after human consensus is recorded, compare consensus against Stage 4A and the Codex second-pass result.
6. If human consensus suggests an annotation correction, do not edit Stage 4 directly. Create a documented migration or derivative correction layer.

Recommended derivative artifact names:

| Artifact | Role |
| --- | --- |
| `data/reliability/human-double-coding-template.csv` | Human-coder worksheet derived from the Stage 4B sample |
| `data/reliability/human-double-coding-completed.csv` | Completed two-human coding sheet |
| `data/reliability/human-adjudication-log.csv` | Human-human disagreement and consensus log |
| `data/reliability/human-reliability-results.json` | Computed human-human metrics |
| `docs/methodology/human-reliability-results.md` | Rendered human reliability report |

These artifacts are derivative reliability layers. They must not overwrite Stage 4 annotation files, Stage 4A evidence chains, or the existing AI-assisted Stage 4B results.

## Metrics

Report identification and interpretation separately.

| Layer | Required metrics |
| --- | --- |
| Identification | present/absent agreement; Cohen kappa for present/absent decisions; lexical-unit boundary exact match; lexical-unit boundary overlap match; precision, recall, and F1 against adjudicated human consensus |
| CMT mapping | exact `cluster_id` agreement; source-domain family agreement; target-domain family agreement; qualitative entailment overlap |
| Koenigsberg layer | exact `fantasy_type` agreement; `violence_logic` agreement; `obligatory_frame` agreement |
| Absence flags | exact set agreement; Jaccard overlap |
| Confidence | confidence-band agreement; mean absolute score difference |

Do not publish one blended reliability score. Each layer tests a different methodological claim.

## Relationship to Current Reliability Results

Until human data exists, the current reliability language should remain:

- The project has a completed AI-assisted Stage 4B reliability pass.
- The pass compares the Stage 4A reference layer with a Codex second-pass review.
- The result is useful for identifying unstable fields and documenting adjudication.
- It is not independent human-human inter-annotator reliability.

After human coding is complete, report the human-human result as a separate evidence layer. Human results may supersede the AI-assisted limitation only for the fields and sample actually coded by two human coders. The AI-assisted pass should remain useful as a prior stress test and as documentation of where Codex found rival codings, but it should not be averaged with the human-human result.

## Validation

Before publishing human reliability results:

```bash
npm run reliability:sample
npm run reliability:results
npm run validate
quarto render
```

If new human-result builders are added, include them in `npm run pipeline` before relying on generated human metrics in publication prose.
