---
title: "Publication Package"
draft: false
---

This page is the reviewer landing path for the upgraded pipeline and publication package. It explains what the project claims, how the evidence can be inspected, what is reproducible from committed files, where AI assistance enters the workflow, and which limits remain outside the milestone.

## Reader Path

1. Start with [Executive Summary](executive_summary.md) for the argument in brief.
2. Read [Research Design](docs/methodology/research-design.md) for scope, research questions, and method sequence.
3. Inspect [Corpus Register](docs/methodology/corpus-register.qmd) for document provenance, register, authorship confidence, and risk flags.
4. Read [Corpus Expansion Rationale](docs/corpus/corpus-expansion-rationale.md), [Corpus Tier Definitions](docs/corpus/corpus-tier-definitions.md), and [Corpus Selection Criteria](docs/corpus/corpus-selection-criteria.md) for the v4 corpus design.
5. Use the [V4 Core Corpus Inventory](docs/corpus/corpus-v4-core-inventory.md), [V4 Coverage Report](docs/corpus/corpus-v4-coverage-report.md), [V4 Expansion Impact and Limitations](docs/corpus/corpus-v4-expansion-impact-report.md), and [V4 Reliability Sampling Update](docs/corpus/corpus-v4-reliability-sampling-update.md) for expanded-corpus scope and limits.
6. Check [Textual Variant Apparatus](docs/methodology/textual-variant-apparatus.md) for source-risk caveats attached to risk-flagged documents.
7. Read [Annotation Codebook](docs/methodology/annotation-codebook.md) for MIPVU, CMT, Koenigsberg, absence, confidence, and ambiguity rules.
8. Check [External Benchmarks](docs/methodology/external-benchmarks.md) for Stage 7 benchmark choices, candidate comparison corpora, and redistribution limits.
9. Check [Reception Evidence](docs/methodology/reception-evidence.md) for the boundary between Lincoln rhetoric-in-text claims and audience reception claims.
10. Review [Stage 4M Methodology](docs/methodology/multi-model-reliability.md), [Stage 4M Results](docs/methodology/multi-model-reliability-results.md), and [Stage 4M Codebook Revision Notes](docs/methodology/stage4m-codebook-revision-notes.md) for the multi-model reliability stress-test boundary.
11. Review [Stage 4H Human Inter-Annotator Reliability Study](docs/methodology/human-interannotator-reliability.md), [Stage 4H Results](docs/methodology/human-reliability-results.md), [Stage 4J Human Adjudication Guide](docs/methodology/human-adjudication-guide.md), [Stage 4J Results](docs/methodology/stage4j-adjudication-results.md), and [Stage 4H/4J Codebook Revision Notes](docs/methodology/stage4h-codebook-revision-notes.md) for the human reliability design, current execution status, and adjudication boundary.
12. Use [Controlled Outputs](analysis/controlled_outputs.md) before relying on any aggregate count.
13. Use [Claim-To-Source Audit](synthesis/claim_audit.md) to trace major claims back to instance IDs, sentence IDs, document metadata, and source URLs.
14. End with [Findings](synthesis/findings.md) and [Final Conclusions](synthesis/final_conclusions.md).

## Corpus Scope

The v4 project corpus consists of a 48-document core interpretive corpus selected by period, genre, audience, and rhetorical function. An extended 75-100 document validation corpus is used to test recurrence, absence, and negative findings. A larger search-only reference corpus supports phrase search and contextual checks but is not treated as fully annotated evidence.

The current publication claims still rest on the fully annotated 28-document v1/Stage 4A corpus until the 20 v4 core additions receive full Stage 4-style annotation and downstream re-analysis. V4 preserves the v1 documents, sentence IDs, Stage 4A annotations, evidence chains, claim audit, and reliability artifacts while making future corpus expansion auditable through tiered inventories, provenance records, coverage reports, and reliability sampling plans.

## Reproducibility Commands

Run the full publication gate with:

```bash
npm run corpus:v4
npm run status
npm run validate
npm run pipeline
quarto render
```

The `corpus:v4` command regenerates v4 corpus inventories, provenance validation, ingestion, segmentation, sentence-ID validation, coverage, expansion-impact, reliability-sampling, and validation-corpus light-annotation outputs. The `pipeline` command validates existing JSON, rebuilds concordance and analysis, regenerates Stage 4A evidence chains, Stage 4B reliability artifacts, Stage 4C textual variant apparatus, Stage 6A controlled outputs, and the Stage 8 claim audit.

Stage 4M is integrated into the validation gate and can also be regenerated directly:

```bash
npm run stage4m
```

With no external model submissions, Stage 4M reports an explicit no-submissions state rather than agreement, disagreement, stability, or consensus findings.

Stage 4H and Stage 4J are integrated into `npm run validate` and can also be regenerated directly:

```bash
npm run stage4h
npm run stage4j
```

With no human coder submissions, Stage 4H reports `designed_but_not_executed`, `no_submissions`, and no human-human agreement metric. With no completed adjudication decision packets, Stage 4J reports `no_decisions`, no Stage 4A correction candidates, and pending adjudication results.

The reception evidence protocol can be regenerated independently with:

```bash
npm run reception:registry
```

## Public Data Package And Data Availability

Committed and reviewable:

- `corpus/corpus_manifest.json`
- `corpus/raw/`, `corpus/text/`, `corpus/segmented/`, `corpus/annotated/`
- `corpus/raw/v4-core/`
- `corpus/normalized/v4-core/`
- `corpus/segmented/v4-core/`
- `corpus/provenance/corpus-v4-provenance.json`
- `data/corpus/corpus-v4-core-inventory.json`
- `data/corpus/corpus-v4-validation-inventory.json`
- `data/corpus/corpus-v4-reference-inventory.json`
- `data/corpus/corpus-v4-coverage-summary.json`
- `data/corpus/corpus-v4-expansion-impact-report.json`
- `data/corpus/corpus-v4-reliability-sample-frame.json`
- `data/corpus/v4-validation-light-annotation-template.csv`
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
- `data/reliability/human-input-packets/`
- `data/reliability/human-output-submissions/` (currently contains no human-filled submission packets)
- `data/reliability/human-comparison/`
- `data/reliability/human-adjudication/`
- `data/metadata/textual-variant-apparatus.json`
- `data/metadata/external-benchmark-corpora.json`
- `data/metadata/reception-evidence-registry.json`
- `analysis/controlled-analysis.json`
- `data/audit/claim-audit.json`
- methodology, analysis, synthesis, release-checklist, and publication pages rendered by Quarto
- v4 corpus rationale, tier-definition, inventory, coverage, expansion-impact, and reliability-sampling pages under `docs/corpus/`

Generated or local-only:

- `_site/` and `.quarto/` are build outputs and are gitignored.
- `corpus/raw/v4-validation/` is intentionally empty in the current repository state; validation-corpus raw files become required only in v4 release mode.
- `data/lcc/*.xml`, `data/lcc/*.tar.gz`, `data/lcc_subset/*.csv`, and `reports/stage7/*` are downloaded or generated on demand and are gitignored.
- The LCC benchmark site page is committed as `analysis/lcc_validation.md`; the raw LCC data is not redistributed by this repository.

## AI-Use Statement

This project is human-directed, AI-assisted research infrastructure. Andrew Hammer is responsible for research design, source selection, method, interpretation, and final claims. AI tools assist with corpus preparation, schema design, validation scripting, annotation support, generated data products, prose revision, and Stage 4M diagnostic model-review scaffolding. AI output is not treated as evidence.

Stage 4B and Stage 4M are AI-assisted reliability layers. Stage 4H is the separate blind two-human inter-annotator reliability layer. Stage 4H reports a two-human blind inter-annotator reliability study when completed. This study is methodologically distinct from Stage 4B AI-assisted reliability review and Stage 4M multi-model AI stress testing. Human-human agreement is reported separately by annotation layer and is not averaged with AI-assisted agreement results.

Stage 4M model agreement or disagreement, once submissions exist, can identify coding sensitivity and human-review priorities; it cannot prove a historical claim, establish human-human reliability, or revise Stage 4A. Stage 4H human agreement, once completed, can report coding reliability under the blind protocol; it cannot prove that an interpretation is historically correct and cannot automatically revise Stage 4A. Claims become evidence-backed only when they are represented in validated structured data and traceable through the audit chain.

## Limitations

- The corpus is Lincoln-only and does not claim to analyze all Lincoln writings.
- The expanded v4 corpus reduces selection-bias risk but does not eliminate interpretive judgment. Claims based on the fully annotated core corpus should not be automatically generalized to the search-only reference corpus. The validation corpus supports recurrence and negative checks but is not equivalent to full Stage 4A annotation.
- Current interpretive counts remain tied to the fully annotated 28-document v1/Stage 4A corpus. The v4 48-document core is selected and segmented, but the 20 v4 additions do not support final coded metaphor claims until full annotation and re-analysis are complete.
- The 1863 and 1864 Annual Messages are present in the v4 core expansion, but existing congressional-message claims remain bounded to currently annotated documents and register-controlled outputs until v4 re-analysis is complete.
- Debate, manuscript, date, version, and collaborative-revision traditions carry source risk; those risks are recorded in the corpus register and textual variant apparatus.
- The Stage 4B reliability workflow reports an AI-assisted second-pass result, not a two-human blind inter-annotator study.
- Stage 4M reports multi-model AI reliability stress testing. It is a methodological triangulation layer, not a two-human blind inter-annotator reliability result. In the current repository state, Stage 4M is designed and operational but not executed because no validated external model submissions are present; it therefore supports no model-convergence, model-disagreement, or field-stability claim yet.
- Stage 4H is designed and operational but not executed because no validated human coder submissions are present. It therefore supports no human-human agreement, human-vs-reference comparison, or human disagreement claim yet.
- Stage 4J adjudication is pending because no completed human adjudication decision packets are present. It exports no Stage 4A correction candidates, codebook change candidates, or claim-audit review candidates in the current repository state.
- Human agreement, once available, measures coding reliability under the documented protocol. It does not prove that the interpretation is correct, and disagreement does not automatically correct Stage 4A.
- The purification-rhetoric contrast is structural, not moral equivalence; Koenigsberg's Hitler analysis is used as bounded theoretical background, not as the project's headline comparative object.
- The project studies public rhetoric and selected fragments; it does not establish audience reception, private belief, or full political causality.
- Reception evidence is protocolized separately; candidate collections are not evidence until item-level records are cited and rights-checked.
- Negative findings, especially `disease_and_purification` absence, depend on a validated v1/Stage 4A corpus-wide zero count plus 56 positive opportunity-structure flags concentrated in texts dated 1838–1862. V4 validation and reference tiers can support future recurrence and negative checks, but they are not yet full interpretive evidence.

## Publication Checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Research design in public docs | Complete | [Research Design](docs/methodology/research-design.md) |
| Corpus provenance layer | Complete | [Corpus Register](docs/methodology/corpus-register.qmd) |
| V4 corpus architecture | Complete | [Corpus Expansion Rationale](docs/corpus/corpus-expansion-rationale.md), [Corpus Tier Definitions](docs/corpus/corpus-tier-definitions.md), [Corpus Selection Criteria](docs/corpus/corpus-selection-criteria.md) |
| V4 core inventory | Complete | [V4 Core Corpus Inventory](docs/corpus/corpus-v4-core-inventory.md) |
| V4 validation and reference tiers | Defined; validation raw files remain a future release-mode gate | [V4 Validation Corpus Inventory](docs/corpus/corpus-v4-validation-inventory.md), [V4 Reference Corpus Inventory](docs/corpus/corpus-v4-reference-inventory.md) |
| V4 coverage and expansion limits | Complete | [V4 Coverage Report](docs/corpus/corpus-v4-coverage-report.md), [V4 Expansion Impact and Limitations](docs/corpus/corpus-v4-expansion-impact-report.md) |
| V4 reliability sampling plan | Complete; future human coding required before v4 reliability metrics | [V4 Reliability Sampling Update](docs/corpus/corpus-v4-reliability-sampling-update.md) |
| Textual variant apparatus | Complete | [Textual Variant Apparatus](docs/methodology/textual-variant-apparatus.md) |
| External benchmark registry | Complete | [External Benchmarks](docs/methodology/external-benchmarks.md) |
| Reception evidence protocol | Complete | [Reception Evidence](docs/methodology/reception-evidence.md) |
| Annotation codebook | Complete | [Annotation Codebook](docs/methodology/annotation-codebook.md) |
| Evidence-chain schema | Complete | [Evidence Chain Schema](docs/methodology/evidence-chain-schema.md) |
| Stage 4B reliability workflow | Complete with AI-assisted limitation | [Reliability Workflow](docs/methodology/reliability-report.md), [Reliability Results](docs/methodology/reliability-results.md) |
| Stage 4M model-review workflow | Designed and operational; no submissions yet | [Stage 4M Methodology](docs/methodology/multi-model-reliability.md), [Stage 4M Results](docs/methodology/multi-model-reliability-results.md), [Stage 4M Codebook Revision Notes](docs/methodology/stage4m-codebook-revision-notes.md), [V2 Release Checklist](docs/release/v2-stage4m-release-checklist.md) |
| Stage 4H human reliability workflow | Designed and operational; no human submissions yet | [Stage 4H Methodology](docs/methodology/human-interannotator-reliability.md), [Stage 4H Results](docs/methodology/human-reliability-results.md), `data/reliability/human-input-packets/`, `data/reliability/human-comparison/` |
| Stage 4J human adjudication workflow | Pending; no adjudication decisions yet | [Stage 4J Guide](docs/methodology/human-adjudication-guide.md), [Stage 4J Results](docs/methodology/stage4j-adjudication-results.md), [Stage 4H/4J Codebook Revision Notes](docs/methodology/stage4h-codebook-revision-notes.md), `data/reliability/human-adjudication/` |
| V3 human reliability release gate | Checklist ready; human execution items remain unchecked | [V3 Human Reliability Release Checklist](docs/release/v3-human-reliability-release-checklist.md) |
| Register/authorship controls | Complete | [Controlled Outputs](analysis/controlled_outputs.md) |
| Claim-to-source audit | Complete | [Claim-To-Source Audit](synthesis/claim_audit.md) |
| Synthesis revision | Complete | [Findings](synthesis/findings.md), [Final Conclusions](synthesis/final_conclusions.md) |
| AI-use statement | Complete | This page and [Methods Appendix](docs/methodology/methods-appendix.md) |
| Publication-focused review | Complete for release candidate | [Publication Review](docs/publication-review.md) |
| Final validation/render gate | Required per PR | `npm run corpus:v4`, `npm run status`, `npm run validate`, `npm run stage4h`, `npm run stage4j`, `npm run pipeline`, `quarto render` |

## Follow-Up Work

Future research directions are bounded in [Open Questions](synthesis/open_questions.md), [External Benchmarks](docs/methodology/external-benchmarks.md), and [Reconstruction Extension Scope](docs/methodology/reconstruction-extension-scope.md). They are not prerequisites for the current publication package.

The v2 Stage 4M release-readiness gate is tracked in the [V2 Stage 4M Release Checklist](docs/release/v2-stage4m-release-checklist.md). The v3 human reliability release gate is tracked in the [V3 Human Reliability Release Checklist](docs/release/v3-human-reliability-release-checklist.md).
