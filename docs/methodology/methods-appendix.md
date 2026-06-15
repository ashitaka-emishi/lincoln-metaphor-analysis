---
title: "Methods Appendix"
draft: false
---

# Methods Appendix

This appendix condenses the publication method into a reproducible checklist.

## Sequence

1. Establish corpus provenance in `corpus/corpus_manifest.json`.
2. Preserve source text and stable sentence IDs through Stages 1-3.
3. Annotate metaphor-related instances in Stage 4 using the annotation codebook.
4. Generate Stage 4A evidence chains from validated Stage 4 annotations.
5. Define Stage 4B reliability sample, completed second-pass coding, adjudication artifacts, and reliability metrics.
6. Generate Stage 4C textual variant apparatus from manifest risk flags and Stage 4 anchors.
7. Generate Stage 5 concordance and Stage 6 analysis.
8. Generate Stage 6A controlled outputs by register and authorship-confidence subset.
9. Generate Stage 8 claim audit for major synthesis claims.
10. Render the Quarto site.

## Commands

```bash
npm run status
npm run validate
npm run pipeline
quarto render
```

Optional LCC benchmark commands:

```bash
npm run stage7:eval
npm run stage7
```

## Evidence Standards

- Every cited sentence must preserve its Stage 3 sentence ID.
- Every metaphor claim must pass through Stage 4 or Stage 4A evidence.
- Every aggregate claim must be inspected in [Controlled Outputs](../../analysis/controlled_outputs.md).
- Every major synthesis claim should cite a claim ID from [Claim-To-Source Audit](../../synthesis/claim_audit.md).
- Source-risk caveats for risk-flagged documents should be checked in [Textual Variant Apparatus](textual-variant-apparatus.md).
- Absence claims require an opportunity structure, not only a zero count.

## AI Assistance

AI systems support implementation and analysis workflow tasks: code generation, validation scripts, corpus inspection, annotation scaffolding, controlled-output generation, audit construction, and prose revision. The human researcher is responsible for research design, source selection, interpretive judgment, final claims, and publication decisions.

AI-generated text or classifications are not evidence. Evidence is the validated structured data, source text, and generated audit chain.

## Archive Boundary

Committed:

- source corpus files;
- segmented and annotated JSON;
- manifest, concordance, analysis, evidence, reliability sample/results, textual variant, controlled-output, and claim-audit artifacts;
- methodology, analysis, synthesis, and publication pages.

Gitignored:

- Quarto build output;
- local caches;
- downloaded LCC XML/CSV files;
- generated Stage 7 report files.
