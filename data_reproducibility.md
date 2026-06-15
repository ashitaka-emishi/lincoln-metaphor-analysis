---
title: "Data / Reproducibility"
---

The project is designed so the interpretive claims can be traced back to structured data.

The corpus begins in `corpus/raw/`, moves through Markdown files with YAML metadata in `corpus/text/`, then becomes segmented JSON in `corpus/segmented/`. Annotated documents live in `corpus/annotated/`, where metaphor instances are embedded directly into the sentence structure that produced them.

The main scripts are:

```bash
node scripts/pipeline_status.js
node scripts/validate_schema.js
node scripts/build_evidence_chains.js
node scripts/build_reliability_sample.js
node scripts/build_controlled_analysis.js
node scripts/build_claim_audit.js
node scripts/build_concordance.js
node scripts/run_analysis.js
```

The npm shortcut is:

```bash
npm run pipeline
```

That command validates JSON, builds `data/concordance.json`, computes `analysis/analysis.json`, writes the Stage 4A evidence-chain file at `data/evidence/annotation-evidence.json`, regenerates the Stage 4B reliability sample artifacts, writes the Stage 6A controlled-analysis outputs, and regenerates the claim-to-source audit.

## Stage 4A: Evidence Chains

Stage 4A is a generated derivative layer. It preserves the validated Stage 4 annotation files and normalizes each metaphor instance into a reviewer-facing audit record with document metadata, source provenance, sentence ID, span text, MIPVU-facing lexical-unit fields, CMT mapping, Koenigsberg interpretation, absence/agency fields, confidence metadata, and claim anchors.

```bash
npm run evidence:chains
```

See [Evidence Chain Schema](docs/methodology/evidence-chain-schema.md) for the full record shape and migration rule.

## Stage 4B: Reliability Sample

Stage 4B is a generated reliability layer. It defines a 5-document sample from the 28-document corpus, creates a blank double-coding template, and initializes an adjudication log.

```bash
npm run reliability:sample
```

Outputs:

- `data/reliability/reliability-sample.json`
- `data/reliability/double-coding-template.csv`
- `data/reliability/adjudication-log.csv`

See [Reliability Workflow](docs/methodology/reliability-report.md) for the sample rationale, coding workflow, disagreement categories, and agreement measures.

## Stage 6A: Controlled Analysis

Stage 6A is the publication-control layer for aggregate claims. It reads the Stage 4A evidence-chain file and writes full-corpus plus `authorship_confidence >= 0.95` views by register, period, document, cluster, and absence flag.

```bash
npm run analysis:controlled
```

Outputs:

- `analysis/controlled-analysis.json`
- `analysis/controlled_outputs.md`

See [Controlled Outputs](analysis/controlled_outputs.md) for the rendered tables.

## Stage 8: Claim Audit

Stage 8 organizes major interpretive claims into reviewer-facing audit chains.

```bash
npm run audit:claims
```

Outputs:

- `data/audit/claim-audit.json`
- `synthesis/claim_audit.md`

See [Claim Audit Method](docs/methodology/claim-audit.md) for the audit-chain format and [Claim-To-Source Audit](synthesis/claim_audit.md) for the public tables.

Current status: Stages 1–8 are implemented across all 28 documents. Stage 7 (LCC benchmark validation) is scaffolded and runnable; the LCC dataset is not committed to the repository but is downloaded on demand. The [Publication Package](publication_package.md) records the public data package, generated/local-only boundary, limitations, AI-use statement, and non-blocking follow-up issues.

## Stage 7: LCC Validation

Stage 7 compares Lincoln's annotated clusters against the [LCC Metaphor Dataset](https://github.com/lcc-api/metaphor) — a 8,724-annotation general English metaphor corpus — to establish which of Lincoln's source-concept domains are common in English metaphor and which are Lincoln-specific constructions.

```bash
# Download LCC data (~4.6 MB) and run full Stage 7 comparison:
npm run stage7

# Lincoln-only cluster summary (no external data required):
npm run stage7:eval
```

The LCC XML (`data/lcc/en_small.xml`) and parsed CSV (`data/lcc_subset/en_small.csv`) are gitignored; the download is triggered interactively. The evaluation report is written to `reports/stage7/LCC_report.md` (also gitignored). The persistent site page with the Stage 7 findings is `analysis/lcc_validation.md`.

Scripts:

- `scripts/download_lcc.py` — download and extract `en_small.xml`
- `scripts/parse_lcc.py` — parse LCC XML → CSV
- `scripts/evaluate_lcc.py` — compute domain coverage, write Markdown report
- `scripts/run_stage7.py` — orchestrator; prompts before downloading

The site itself is rendered with Quarto:

```bash
quarto render
```

Publication-facing pages are marked final. The Quarto configuration keeps draft pages visible so future work-in-progress pages remain inspectable during development, but the current reviewer path is the [Publication Package](publication_package.md).
