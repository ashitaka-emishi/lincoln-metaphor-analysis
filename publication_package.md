---
title: "Publication Package"
draft: false
---

This page is the reviewer landing path for the upgraded pipeline and publication package. It explains what the project claims, how the evidence can be inspected, what is reproducible from committed files, where AI assistance enters the workflow, and which limits remain outside the milestone.

## Reader Path

1. Start with [Executive Summary](executive_summary.md) for the argument in brief.
2. Read [Research Design](docs/methodology/research-design.md) for scope, research questions, and method sequence.
3. Inspect [Corpus Register](docs/methodology/corpus-register.qmd) for document provenance, register, authorship confidence, and risk flags.
4. Check [Textual Variant Apparatus](docs/methodology/textual-variant-apparatus.md) for source-risk caveats attached to risk-flagged documents.
5. Read [Annotation Codebook](docs/methodology/annotation-codebook.md) for MIPVU, CMT, Koenigsberg, absence, confidence, and ambiguity rules.
6. Check [External Benchmarks](docs/methodology/external-benchmarks.md) for Stage 7 benchmark choices, candidate comparison corpora, and redistribution limits.
7. Check [Reception Evidence](docs/methodology/reception-evidence.md) for the boundary between Lincoln rhetoric-in-text claims and audience reception claims.
8. Review [Stage 4M Methodology](docs/methodology/multi-model-reliability.md), [Stage 4M Results](docs/methodology/multi-model-reliability-results.md), and [Stage 4M Codebook Revision Notes](docs/methodology/stage4m-codebook-revision-notes.md) for the multi-model reliability stress-test boundary.
9. Use [Controlled Outputs](analysis/controlled_outputs.md) before relying on any aggregate count.
10. Use [Claim-To-Source Audit](synthesis/claim_audit.md) to trace major claims back to instance IDs, sentence IDs, document metadata, and source URLs.
11. End with [Findings](synthesis/findings.md) and [Final Conclusions](synthesis/final_conclusions.md).

## Reproducibility Commands

Run the full publication gate with:

```bash
npm run status
npm run validate
npm run pipeline
quarto render
```

The `pipeline` command validates existing JSON, rebuilds concordance and analysis, regenerates Stage 4A evidence chains, Stage 4B reliability artifacts, Stage 4C textual variant apparatus, Stage 6A controlled outputs, and the Stage 8 claim audit.

Stage 4M is integrated into the validation gate and can also be regenerated directly:

```bash
npm run stage4m
```

With no external model submissions, Stage 4M reports an explicit no-submissions state rather than agreement, disagreement, stability, or consensus findings.

The reception evidence protocol can be regenerated independently with:

```bash
npm run reception:registry
```

## Public Data Package

Committed and reviewable:

- `corpus/corpus_manifest.json`
- `corpus/raw/`, `corpus/text/`, `corpus/segmented/`, `corpus/annotated/`
- `data/concordance.json`
- `analysis/analysis.json`
- `data/evidence/annotation-evidence.json`
- `data/reliability/reliability-sample.json`
- `data/reliability/double-coding-template.csv`
- `data/reliability/double-coding-completed.csv`
- `data/reliability/adjudication-log.csv`
- `data/reliability/reliability-results.json`
- `data/reliability/model-input-packets/`
- `data/reliability/model-comparison/`
- `data/reliability/model-adjudication/`
- `data/metadata/textual-variant-apparatus.json`
- `data/metadata/external-benchmark-corpora.json`
- `data/metadata/reception-evidence-registry.json`
- `analysis/controlled-analysis.json`
- `data/audit/claim-audit.json`
- methodology, analysis, synthesis, release-checklist, and publication pages rendered by Quarto

Generated or local-only:

- `_site/` and `.quarto/` are build outputs and are gitignored.
- `data/lcc/*.xml`, `data/lcc/*.tar.gz`, `data/lcc_subset/*.csv`, and `reports/stage7/*` are downloaded or generated on demand and are gitignored.
- The LCC benchmark site page is committed as `analysis/lcc_validation.md`; the raw LCC data is not redistributed by this repository.

## AI-Use Statement

This project is human-directed, AI-assisted research infrastructure. Andrew Hammer is responsible for research design, source selection, method, interpretation, and final claims. AI tools assist with corpus preparation, schema design, validation scripting, annotation support, generated data products, prose revision, and Stage 4M diagnostic model-review scaffolding. AI output is not treated as evidence. Stage 4M model agreement or disagreement, once submissions exist, can identify coding sensitivity and human-review priorities; it cannot prove a historical claim, establish human-human reliability, or revise Stage 4A. Claims become evidence-backed only when they are represented in validated structured data and traceable through the audit chain.

## Limitations

- The corpus is Lincoln-only and contains 28 selected documents, not the whole Lincoln archive.
- The 1863 and 1864 Annual Messages are not included; current congressional-message claims are bounded to `doc_010`, `doc_014`, and register-controlled outputs rather than a complete annual-message series.
- Debate, manuscript, date, version, and collaborative-revision traditions carry source risk; those risks are recorded in the corpus register and textual variant apparatus.
- The reliability workflow reports an AI-assisted Stage 4B second-pass result, not a two-human blind inter-annotator study; the human double-coding follow-up protocol is designed but not yet executed.
- Stage 4M reports multi-model AI reliability stress testing. It is a methodological triangulation layer, not a two-human blind inter-annotator reliability result. In the current repository state, Stage 4M is designed and operational but not executed because no validated external model submissions are present; it therefore supports no model-convergence, model-disagreement, or field-stability claim yet.
- The purification-rhetoric contrast is structural, not moral equivalence; Koenigsberg's Hitler analysis is used as bounded theoretical background, not as the project's headline comparative object.
- The project studies public rhetoric and selected fragments; it does not establish audience reception, private belief, or full political causality.
- Reception evidence is protocolized separately; candidate collections are not evidence until item-level records are cited and rights-checked.
- Negative findings, especially `disease_and_purification` absence, depend on a validated corpus-wide zero count plus 56 positive opportunity-structure flags concentrated in texts dated 1838–1862. Later-war support comes from reviewed negative cases, not complete opportunity-flag coverage.

## Publication Checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Research design in public docs | Complete | [Research Design](docs/methodology/research-design.md) |
| Corpus provenance layer | Complete | [Corpus Register](docs/methodology/corpus-register.qmd) |
| Textual variant apparatus | Complete | [Textual Variant Apparatus](docs/methodology/textual-variant-apparatus.md) |
| External benchmark registry | Complete | [External Benchmarks](docs/methodology/external-benchmarks.md) |
| Reception evidence protocol | Complete | [Reception Evidence](docs/methodology/reception-evidence.md) |
| Annotation codebook | Complete | [Annotation Codebook](docs/methodology/annotation-codebook.md) |
| Evidence-chain schema | Complete | [Evidence Chain Schema](docs/methodology/evidence-chain-schema.md) |
| Stage 4B reliability workflow | Complete with AI-assisted limitation | [Reliability Workflow](docs/methodology/reliability-report.md), [Reliability Results](docs/methodology/reliability-results.md) |
| Stage 4M model-review workflow | Designed and operational; no submissions yet | [Stage 4M Methodology](docs/methodology/multi-model-reliability.md), [Stage 4M Results](docs/methodology/multi-model-reliability-results.md), [Stage 4M Codebook Revision Notes](docs/methodology/stage4m-codebook-revision-notes.md), [V2 Release Checklist](docs/release/v2-stage4m-release-checklist.md) |
| Future human double-coding | Designed, not executed | [Human Coding Protocol](docs/methodology/human-double-coding-protocol.md) |
| Register/authorship controls | Complete | [Controlled Outputs](analysis/controlled_outputs.md) |
| Claim-to-source audit | Complete | [Claim-To-Source Audit](synthesis/claim_audit.md) |
| Synthesis revision | Complete | [Findings](synthesis/findings.md), [Final Conclusions](synthesis/final_conclusions.md) |
| AI-use statement | Complete | This page and [Methods Appendix](docs/methodology/methods-appendix.md) |
| Publication-focused review | Complete for release candidate | [Publication Review](docs/publication-review.md) |
| Final validation/render gate | Required per PR | `npm run status`, `npm run validate`, `npm run pipeline`, `quarto render` |

## Follow-Up Work

Future research directions are bounded in [Open Questions](synthesis/open_questions.md), [External Benchmarks](docs/methodology/external-benchmarks.md), and [Reconstruction Extension Scope](docs/methodology/reconstruction-extension-scope.md). They are not prerequisites for the current publication package.

The v2 Stage 4M release-readiness gate is tracked in the [V2 Stage 4M Release Checklist](docs/release/v2-stage4m-release-checklist.md).
