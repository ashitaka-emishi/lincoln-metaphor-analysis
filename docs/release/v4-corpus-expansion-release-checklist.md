---
title: "V4 Corpus Expansion Release Checklist"
description: "Pre-tag checklist for the v4.0 corpus expansion and stratified validation corpus milestone."
draft: false
---

# V4 Corpus Expansion Release Checklist

This checklist is the release gate for the v4.0 corpus expansion milestone. It should be reviewed before tagging v4 or describing the expanded corpus as release-ready.

V4 expands the project from the preserved 28-document v1/Stage 4A interpretive corpus into a tiered corpus architecture: a 48-document core, a 75-100 document validation corpus, and a search-only reference corpus. The expansion reduces selection-bias risk but does not eliminate interpretive judgment, and it does not make validation or reference records equivalent to full Stage 4A annotation.

## Architecture

- [ ] Corpus tiers defined
- [ ] Selection criteria documented
- [ ] Corpus expansion rationale complete
- [ ] Existing v1 corpus preserved

## Metadata

- [ ] Document metadata schema complete
- [ ] Inventory schema complete
- [ ] Provenance schema complete
- [ ] Source authority register complete

## Core Corpus

- [ ] v4 core inventory complete
- [ ] v4 core targets 48 documents
- [ ] All v1 document IDs preserved
- [ ] 20 priority additions reviewed
- [ ] Each core document has selection rationale
- [ ] Each core document has provenance
- [ ] Raw text files added
- [ ] Normalized files generated
- [ ] Segmented files generated
- [ ] Sentence IDs validated

## Validation Corpus

- [ ] v4 validation inventory complete
- [ ] Validation corpus targets 75-100 documents
- [ ] All core documents included
- [ ] Light annotation template created
- [ ] Validation corpus limitations documented

## Reference Corpus

- [ ] Search-only reference corpus inventory created
- [ ] Reference corpus limitations documented
- [ ] Promotion path to validation/core documented

## Reports

- [ ] Coverage report generated
- [ ] Expansion impact report generated
- [ ] Reliability sampling update generated

## Pipeline

- [ ] `npm run corpus:v4` passes
- [ ] `npm run validate` passes
- [ ] `npm run status` reports v4 state
- [ ] `npm run pipeline` passes
- [ ] `quarto render` passes

## Publication Package

- [ ] Corpus description updated
- [ ] Data availability updated
- [ ] Limitations updated
- [ ] Selection rationale linked
- [ ] Reliability sampling discussion updated

## Scholarly Claims

- [ ] No claim says the project analyzes all Lincoln writings
- [ ] No claim treats validation corpus as fully annotated
- [ ] No claim treats reference corpus as interpretive evidence
- [ ] Corpus expansion is described as reducing, not eliminating, selection bias

## Current Pre-Tag Note

In the current repository state, v4 corpus architecture, inventories, core raw ingestion, segmentation, sentence-ID validation, coverage reporting, expansion-impact reporting, reliability sampling, and validation light-annotation templates are implemented. The status gate still reports `core corpus in progress` because validation-corpus raw files are intentionally missing outside release mode, and current interpretive claims remain tied to the fully annotated v1/Stage 4A corpus until v4 additions receive full annotation and re-analysis. This is a valid development state, not yet a v4 release-ready claim.
