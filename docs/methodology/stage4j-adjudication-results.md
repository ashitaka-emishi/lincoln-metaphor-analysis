---
title: "Stage 4J Adjudication Results"
description: "Generated Stage 4J adjudication decision status, review candidates, and limits."
---

# Stage 4J Adjudication Results

Status: **no decisions**

## Purpose

Stage 4J summarizes post-coding human adjudication decisions for Stage 4H disagreements. It identifies review implications without modifying Stage 4A annotations.

This page links conceptually to [Human Inter-Annotator Reliability Results](human-reliability-results.md), which reports the Stage 4H execution state and keeps human-human agreement separate from human-vs-reference comparison.

## Inputs

| Input | Status | Path |
| --- | --- | --- |
| Stage 4J queue | no items | data/reliability/human-adjudication/stage4j-adjudication-queue.json |
| Normalized adjudication decisions | no decisions | data/reliability/human-adjudication/stage4j-adjudication-decisions-normalized.json |
| Human reliability report | designed but not executed | data/reliability/human-comparison/human-reliability-report.json |

## Decision Counts

| Measure | Count |
| --- | --- |
| Queue items | 0 |
| High-priority queue items | 0 |
| Valid decisions | 0 |
| Missing decisions | 0 |
| Stage 4A correction candidates | 0 |
| Codebook change candidates | 0 |
| Claim-audit review candidates | 0 |
| Deferred cases | 0 |

No completed adjudication decisions are available yet. Stage 4J remains pending until human adjudication packets are filled and ingested.

## High-Priority Cases

No high-priority adjudication decision can be reported yet.

## Stage 4A Correction Candidates

No Stage 4A correction candidate has been exported. Any future candidate remains review-only and does not apply a Stage 4A mutation.

## Codebook Change Candidates

No codebook change candidate has been accepted through Stage 4J adjudication yet.

## Claim-Audit Review Candidates

No claim-audit review candidate has been exported from Stage 4J adjudication yet.

## Deferred Cases

No adjudication case is currently marked deferred.

## Limits

- Stage 4J is a post-coding adjudication and review layer; it does not overwrite Stage 4A.
- Stage 4A correction candidates require a separate documented migration before any canonical annotation changes.
- Claim-audit review candidates identify downstream review work; they do not revise synthesis claims automatically.
- Before completed human adjudication packets exist, this page reports design and pending status rather than adjudication findings.
