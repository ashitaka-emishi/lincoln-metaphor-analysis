---
title: "Publication Package"
draft: false
---

# Publication Package

This page is the reviewer landing path for the upgraded pipeline and publication package. It explains what the project claims, how the evidence can be inspected, what is reproducible from committed files, where AI assistance enters the workflow, and which limits remain outside the milestone.

## Reader Path

1. Start with [Executive Summary](executive_summary.md) for the argument in brief.
2. Read [Research Design](docs/methodology/research-design.md) for scope, research questions, and method sequence.
3. Inspect [Corpus Register](docs/methodology/corpus-register.qmd) for document provenance, register, authorship confidence, and risk flags.
4. Check [Textual Variant Apparatus](docs/methodology/textual-variant-apparatus.md) for source-risk caveats attached to risk-flagged documents.
5. Read [Annotation Codebook](docs/methodology/annotation-codebook.md) for MIPVU, CMT, Koenigsberg, absence, confidence, and ambiguity rules.
6. Use [Controlled Outputs](analysis/controlled_outputs.md) before relying on any aggregate count.
7. Use [Claim-To-Source Audit](synthesis/claim_audit.md) to trace major claims back to instance IDs, sentence IDs, document metadata, and source URLs.
8. End with [Findings](synthesis/findings.md) and [Final Conclusions](synthesis/final_conclusions.md).

## Reproducibility Commands

Run the full publication gate with:

```bash
npm run status
npm run validate
npm run pipeline
quarto render
```

The `pipeline` command validates existing JSON, rebuilds concordance and analysis, regenerates Stage 4A evidence chains, Stage 4B reliability artifacts, Stage 4C textual variant apparatus, Stage 6A controlled outputs, and the Stage 8 claim audit.

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
- `data/metadata/textual-variant-apparatus.json`
- `analysis/controlled-analysis.json`
- `data/audit/claim-audit.json`
- methodology, analysis, synthesis, and publication pages rendered by Quarto

Generated or local-only:

- `_site/` and `.quarto/` are build outputs and are gitignored.
- `data/lcc/*.xml`, `data/lcc_subset/*.csv`, and `reports/stage7/*` are downloaded or generated on demand and are gitignored.
- The LCC benchmark site page is committed as `analysis/lcc_validation.md`; the raw LCC data is not redistributed by this repository.

## AI-Use Statement

This project is human-directed, AI-assisted research infrastructure. Andrew Hammer is responsible for research design, source selection, method, interpretation, and final claims. AI tools assist with corpus preparation, schema design, validation scripting, annotation support, generated data products, and prose revision. AI output is not treated as evidence. Claims become evidence-backed only when they are represented in validated structured data and traceable through the audit chain.

## Limitations

- The corpus is Lincoln-only and contains 28 selected documents, not the whole Lincoln archive.
- Debate, manuscript, date, version, and collaborative-revision traditions carry source risk; those risks are recorded in the corpus register and textual variant apparatus.
- The reliability workflow now reports an AI-assisted second-pass reliability result, not a two-human blind inter-annotator study.
- The Lincoln/Hitler comparison is structural, not moral equivalence.
- The project studies public rhetoric and selected fragments; it does not establish audience reception, private belief, or full political causality.
- Negative findings, especially `disease_and_purification` absence, depend on validated zero counts plus positive opportunity-structure flags.

## Publication Checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Research design in public docs | Complete | [Research Design](docs/methodology/research-design.md) |
| Corpus provenance layer | Complete | [Corpus Register](docs/methodology/corpus-register.qmd) |
| Textual variant apparatus | Complete | [Textual Variant Apparatus](docs/methodology/textual-variant-apparatus.md) |
| Annotation codebook | Complete | [Annotation Codebook](docs/methodology/annotation-codebook.md) |
| Evidence-chain schema | Complete | [Evidence Chain Schema](docs/methodology/evidence-chain-schema.md) |
| Reliability workflow | Complete with AI-assisted limitation | [Reliability Workflow](docs/methodology/reliability-report.md), [Reliability Results](docs/methodology/reliability-results.md) |
| Register/authorship controls | Complete | [Controlled Outputs](analysis/controlled_outputs.md) |
| Claim-to-source audit | Complete | [Claim-To-Source Audit](synthesis/claim_audit.md) |
| Synthesis revision | Complete | [Findings](synthesis/findings.md), [Final Conclusions](synthesis/final_conclusions.md) |
| AI-use statement | Complete | This page and [Methods Appendix](docs/methodology/methods-appendix.md) |
| Final validation/render gate | Required per PR | `npm run status`, `npm run validate`, `npm run pipeline`, `quarto render` |

## Follow-Up Work

Non-blocking follow-up work is tracked outside this milestone:

- [#24 Extend external benchmarks and comparison corpora](https://github.com/ashitaka-emishi/lincoln-metaphor-analysis/issues/24)
- [#25 Add reception and audience evidence layer](https://github.com/ashitaka-emishi/lincoln-metaphor-analysis/issues/25)
- [#26 Evaluate Reconstruction-era continuation beyond Lincoln corpus boundary](https://github.com/ashitaka-emishi/lincoln-metaphor-analysis/issues/26)
