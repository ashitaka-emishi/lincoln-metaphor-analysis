---
title: "Stage 4J — Human Adjudication and Codebook Revision"
description: "Architecture and operating rules for adjudicating Stage 4H human coder disagreements."
draft: false
---

## Purpose

Stage 4J is the **human adjudication and codebook revision layer**. It operates after both Stage 4H coders have submitted their independent sheets and the human-human disagreements have been logged. The adjudicator reviews disagreements, records a human consensus value and rationale for each, and identifies passages or fields that reveal codebook gaps requiring clarification.

Stage 4J may recommend corrections to Stage 4A annotations. It must not automatically apply those corrections. Every proposed change remains a migration candidate until separately authorized and validated under the repository's stage-immutability rules.

## Relation to Stage 4H and Stage 4A

| Layer | Role | Immutability |
| --- | --- | --- |
| **Stage 4A** | Validated reference annotations and evidence chains | Immutable; Stage 4J may not edit these files |
| **Stage 4H** | Blind two-human inter-annotator coding | Immutable after submission; Stage 4J reads but does not alter |
| **Stage 4J** | Human adjudication of Stage 4H disagreements and codebook revision | Derivative; produces review candidates only |

Stage 4J is a methodologically distinct stage from Stage 4H. Adjudication requires access to both coding sheets and, after human consensus is reached, to Stage 4A and Stage 4B reference values for comparison. These access patterns are incompatible with the blindness conditions that govern Stage 4H coders. Stage 4J is therefore a separate post-coding layer.

## Adjudication Procedure

1. Receive both completed Stage 4H coding sheets only after both coders have submitted.
2. Log every substantive disagreement in the human adjudication log before consulting Stage 4A or Stage 4B values.
3. Assign one disagreement category to each logged item (see categories below).
4. Record an adjudicated human consensus value and written rationale.
5. Only after consensus is recorded, compare against Stage 4A and Stage 4B to determine whether correction is warranted.
6. If correction appears warranted, record the proposed change as a migration candidate. Do not edit Stage 4A or Stage 4B directly.
7. Record codebook notes for passages or fields that reveal genuine ambiguity or missing rules.

## Disagreement Categories

Use the existing reliability vocabulary from Stage 4B adjudication records.

| Category | Meaning |
| --- | --- |
| `boundary_difference` | Coders agree a unit is present but mark different span boundaries |
| `identification_difference` | One coder marks a unit present; the other marks it absent |
| `cluster_difference` | Coders agree on span but assign different CMT cluster or source domain |
| `field_difference` | Coders agree on span and cluster but differ on a downstream interpretive field |
| `confidence_difference` | Coders agree on substantive fields but assign different confidence scores |
| `codebook_gap` | Disagreement traceable to an unresolved rule or missing definition in the codebook |

A single disagreement may carry more than one category when multiple dimensions differ simultaneously.

## Correction Candidates

If human consensus differs from Stage 4A, the adjudicator records a correction candidate with:

- the sentence and span identifier;
- the Stage 4A reference value;
- the adjudicated human consensus value;
- the rationale for the proposed change;
- a recommendation for human-review priority (`high`, `medium`, or `low`); and
- any codebook revision that, if adopted, would prevent recurrence.

Correction candidates are not corrections. They remain in the adjudication log and migration candidate file until a separately authorized migration process applies them under full validation. Stage 4J completion does not authorize any Stage 4A edit.

## Codebook Revision Notes

Where adjudication reveals codebook gaps, Stage 4J produces codebook revision notes documenting:

- the specific rule or field that produced systematic ambiguity;
- the passage or passages that exposed the gap;
- a proposed revision or clarification; and
- whether the revision would affect any existing Stage 4A judgments.

Codebook revisions are advisory. They do not take effect until reviewed and adopted through the project's codebook update process.

## Immutability Boundary

Stage 4J may not edit:
- Stage 4A annotation files or evidence chains;
- Stage 4B completed coding, adjudication records, or reliability results;
- Stage 4H submitted coding sheets (after submission these are immutable inputs);
- Stage 4M model submissions, comparison outputs, or human-queue items; or
- concordance, analysis, or synthesis outputs.

A correction candidate becomes a real change only through a separately authorized and validated migration.

## Artifacts

| Artifact | Role |
| --- | --- |
| `data/reliability/human-adjudication-log.csv` | Logged disagreements with category, consensus value, and rationale |
| `data/reliability/human-migration-candidates.json` | Proposed Stage 4A corrections awaiting separate authorization |
| `docs/methodology/human-adjudication-guide.md` | This file; operating rules and procedure |
| `docs/methodology/human-adjudication-results.md` | Generated results page (pending, depends on Stage 4H completion) |

## Current Status

| Item | Status |
| --- | --- |
| Adjudication architecture | Designed |
| Stage 4H coding | Pending |
| Human disagreement log | Not yet |
| Migration candidates | Not yet |
| Codebook revision notes | Not yet |

Stage 4J work cannot begin until both Stage 4H coding sheets have been validated and submitted.
