---
title: "Reliability Sample and Adjudication Workflow"
draft: false
---

# Reliability Sample and Adjudication Workflow

This page defines the reliability layer for the publication-upgrade milestone. It does not claim that double coding has already been completed. Its purpose is to make the sample, coding workflow, disagreement categories, adjudication record, and reporting rules explicit before the annotation claims are used as publication evidence.

Generate the reliability artifacts with:

```bash
npm run reliability:sample
```

The generator writes:

| Artifact | Role |
| --- | --- |
| `data/reliability/reliability-sample.json` | Canonical sample definition, reference values, disagreement categories, and agreement-measure plan |
| `data/reliability/double-coding-template.csv` | Blank coding worksheet for independent coders |
| `data/reliability/adjudication-log.csv` | Traceable adjudication register for coder disagreements |

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

The sample and workflow are implemented. The adjudication log is initialized but empty, meaning double coding has not yet produced disagreements or final reliability statistics.

Before final publication, the reliability report should be updated with:

- coder identifiers or anonymized coder roles;
- completed coding dates;
- agreement metrics by layer;
- adjudication counts by disagreement category;
- any schema or migration changes prompted by adjudication;
- limitations that remain after adjudication.
