---
title: "Corpus Expansion Rationale"
description: "Rationale and boundaries for the v4 stratified corpus expansion."
draft: false
---

# Corpus Expansion Rationale

The v1 corpus remains a valid 28-document interpretive corpus. It was built for close reading, stable annotation, and publication-ready claim tracing. V4 does not invalidate that work. It adds a stratified expansion layer so future claims can be tested against a larger and more explicit corpus design.

## Why Expand

The v1 corpus is intentionally wide by register, period, and rhetorical occasion, but it is still a curated corpus. Its strength is interpretive depth. Its main risk is selection bias: a small set of high-value documents can overrepresent canonical public speeches, crisis moments, or texts already known to contain vivid metaphor.

V4 responds by separating the corpus into three tiers:

| Tier | Size | Role | Publication Use |
| --- | --- | --- | --- |
| Tier 1 | 48 documents | Expanded fully annotated core | Supports full interpretive claims after annotation and validation |
| Tier 2 | 75-100 documents | Extended validation corpus | Tests coverage, boundary conditions, and selection-bias risk |
| Tier 3 | open-ended | Search-only reference corpus | Supports discovery, candidate selection, and context searches |

This design lets the project grow without pretending every source has the same evidentiary status.

## What V4 Changes

V4 introduces explicit corpus-version architecture:

- the v1 28-document corpus remains preserved;
- Tier 1 adds 20 priority documents to create a 48-document core;
- Tier 2 defines a broader validation corpus with lighter annotation and coverage controls;
- Tier 3 records a search-only reference layer for discovery and future promotion;
- reports and publication pages must identify which tier and corpus version support each claim.

The expansion should make selection decisions inspectable. It should show why a text belongs in the fully annotated core, broader validation layer, search-only layer, or outside the current project.

## What V4 Does Not Claim

V4 does not claim to analyze all Lincoln writings. It does not make the corpus comprehensive, exhaustive, or representative in a statistical-population sense. It does not make search hits equivalent to annotated evidence. It does not allow future scripts to overwrite v1 corpus files, v1 sentence IDs, or Stage 4 annotations.

Larger corpus size reduces selection-bias risk by widening the comparison frame. It does not eliminate interpretive judgment. The project still depends on documented selection criteria, source-quality controls, annotation discipline, and conservative publication language.

## Preservation Boundary

Existing v1 artifacts are preserved as historical and methodological inputs:

- `corpus/corpus_manifest.json`;
- `corpus/raw/`, `corpus/text/`, `corpus/segmented/`, and `corpus/annotated/`;
- existing document IDs and sentence IDs;
- Stage 4 annotations and generated evidence chains;
- v1-tied reliability and publication outputs.

V4 additions should use separate versioned inventory, metadata, provenance, validation, and output paths until later issues define exact file contracts. A source upgrade or correction to a v1 document requires a documented migration, not an ad hoc replacement.

## Reader Path

Read this rationale with:

- [Corpus Tier Definitions](corpus-tier-definitions.md);
- [Corpus Selection Criteria](corpus-selection-criteria.md);
- [Research Design](../methodology/research-design.md);
- [Corpus Register](../methodology/corpus-register.qmd).
