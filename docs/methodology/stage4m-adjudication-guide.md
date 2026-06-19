---
title: "Stage 4M Human Adjudication Guide"
draft: false
---

This queue supports human-directed review of model disagreement. Model consensus is diagnostic evidence, not a vote that can overwrite Stage 4A.

## Current Queue

Status: **no items**. Queue items: 0; high priority: 0; medium: 0; low: 0.

No validated model disagreement currently requires queueing. The committed CSV and JSON artifacts intentionally preserve this empty state.

## Review Procedure

1. Review the canonical sentence and the supplied Stage 4A reference value before reading model rationales.
2. Read each model value, confidence, ambiguity flag, rival reading, and justification.
3. Answer the suggested review question independently. Model unanimity may raise priority, but it does not decide the outcome.
4. Record one allowed `decision` in `stage4m-adjudication-template.csv`: `retain_stage4a`, `document_migration_candidate`, `defer_insufficient_evidence`, or `codebook_clarification`.
5. Supply an adjudicated value and rationale. Mark follow-up work explicitly.

## Immutability Boundary

Completing the template does not edit Stage 4A, Stage 4B, concordance, analysis, or synthesis outputs. A proposed correction remains a migration candidate until separately authorized and validated under the repository’s stage-immutability rules.

## Priority Policy

- **High:** all-model challenges to Stage 4A, agency/absence or purification disputes, obligatory-frame disputes, major-document passages, claim-audit anchors, or classifier-mandated human review.
- **Medium:** source-domain differences with stable clusters, confidence differences with stable classification, or partial lexical-boundary overlap.
- **Low:** wording-equivalent differences, same-label submissions with at least one brief justification, ambiguity-only differences, or other interpretive disagreements not promoted by the high/medium rules.

## Files

- Generated queue: `data/reliability/model-adjudication/stage4m-adjudication-queue.json` and `data/reliability/model-adjudication/stage4m-adjudication-queue.csv`
- Human completion template: `data/reliability/model-adjudication/stage4m-adjudication-template.csv`
- Source disagreement log: `data/reliability/model-comparison/model-disagreement-log.json`
