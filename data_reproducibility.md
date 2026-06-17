---
title: "Data / Reproducibility"
---

The project is designed so the interpretive claims can be traced back to structured data.

The corpus begins in `corpus/raw/`, moves through Markdown files with YAML metadata in `corpus/text/`, then becomes segmented JSON in `corpus/segmented/`. Annotated documents live in `corpus/annotated/`, where metaphor instances are embedded directly into the sentence structure that produced them.

## Runtime Boundary

The reproducibility runtime is intentionally small and pinned at the repository boundary:

| Runtime | Expected version | Pin / lock file | Used for |
| --- | --- | --- | --- |
| Node.js | 20 LTS | `.nvmrc`, `package.json`, `package-lock.json` | JSON validation, corpus pipeline, regression tests |
| Python | 3.11 | `.python-version`, `requirements.txt` | Stage 1-3 text utilities and Stage 7 LCC scripts |
| Quarto | 1.9.37 | GitHub Pages workflow | Static site rendering |

Node packages are installed with `npm ci`, which uses `package-lock.json`. Python scripts use only the Python 3.11 standard library; `requirements.txt` is intentionally empty except for that note, so reviewers can still run `python3 -m pip install -r requirements.txt` as a reproducibility check. Quarto is installed locally from <https://quarto.org/docs/get-started/> and is pinned to `1.9.37` in the Pages workflow.

Verify the local runtime before regenerating outputs:

```bash
node --version
npm --version
npm ci
python3 --version
python3 -m pip install -r requirements.txt
quarto --version
```

Expected major versions are Node `v20.x`, Python `3.11.x`, and Quarto `1.9.37`.

The main scripts are:

```bash
node scripts/pipeline_status.js
node scripts/validate_schema.js
node scripts/build_evidence_chains.js
node scripts/build_reliability_sample.js
node scripts/build_reliability_results.js
node scripts/build_textual_variant_apparatus.js
python3 scripts/build_external_benchmark_registry.py
python3 scripts/build_reception_evidence_registry.py
node scripts/build_controlled_analysis.js
node scripts/build_claim_audit.js
node scripts/build_concordance.js
node scripts/run_analysis.js
```

The npm shortcut is:

```bash
npm run pipeline
```

That command validates JSON, builds `data/concordance.json`, computes `analysis/analysis.json`, writes the Stage 4A evidence-chain file at `data/evidence/annotation-evidence.json`, regenerates the Stage 4B reliability sample and results artifacts, writes the Stage 4C textual variant apparatus, writes the Stage 6A controlled-analysis outputs, and regenerates the claim-to-source audit.

## Stage 1 Source Provenance Checksums

Stage 1 provenance is validated by `data/metadata/source-provenance-checksums.json`. The registry records SHA-256 checksums for every canonical `corpus/text/{doc_id}.md` source file and for each available `corpus/raw/{doc_id}.txt` Stage 1 acquisition file. Some early or manually supplied documents do not have a committed raw `.txt`; those records are explicit as `raw_text.exists: false` while their canonical Stage 2 source text remains checksummed.

Validate source provenance without rewriting files:

```bash
npm run validate:source-provenance
```

Refresh the checksum registry only when a source file or its manifest provenance is intentionally corrected:

```bash
npm run source:provenance
npm run validate
```

Intentional corrections should commit the source change, the refreshed registry, and a short rationale in the same issue or commit. Validation reports checksum mismatches without rewriting corpus files, so accidental source drift fails before aggregate outputs are regenerated.

## Stage 4A: Evidence Chains

Stage 4A is a generated derivative layer. It preserves the validated Stage 4 annotation files and normalizes each metaphor instance into a reviewer-facing audit record with document metadata, source provenance, sentence ID, span text, MIPVU-facing lexical-unit fields, CMT mapping, Koenigsberg interpretation, absence/agency fields, confidence metadata, and claim anchors.

```bash
npm run evidence:chains
```

See [Evidence Chain Schema](docs/methodology/evidence-chain-schema.md) for the full record shape and migration rule.

## Stage 4B: Reliability Sample

Stage 4B is a generated reliability layer. It defines a 5-document sample from the 28-document corpus, creates a blank double-coding template, records a completed Stage 4A-reference versus Codex-second-pass coding sheet, writes the adjudication log, and computes reliability metrics.

```bash
npm run reliability:sample
npm run reliability:results
```

Outputs:

- `data/reliability/reliability-sample.json`
- `data/reliability/double-coding-template.csv`
- `data/reliability/double-coding-completed.csv`
- `data/reliability/adjudication-log.csv`
- `data/reliability/reliability-results.json`
- `docs/methodology/reliability-results.md`

See [Reliability Workflow](docs/methodology/reliability-report.md) for the sample rationale, coding workflow, disagreement categories, and agreement measures, and [Reliability Results](docs/methodology/reliability-results.md) for the current metrics and limits.

## Stage 4C: Textual Variant Apparatus

Stage 4C records source-risk limitations for documents with manifest `risk_flags`. It does not rewrite Stage 4 annotations. Instead, it preserves the annotation layer and creates a derivative apparatus that links risk-flagged documents to source traditions, sentence and instance anchors where available, annotation decisions, and publication caveats.

```bash
npm run variants:apparatus
```

Outputs:

- `data/metadata/textual-variant-apparatus.json`
- `docs/methodology/textual-variant-apparatus.md`

See [Textual Variant Apparatus](docs/methodology/textual-variant-apparatus.md) for the rendered records and interpretation rule.

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

Current status: Stages 1–8 are implemented across all 28 documents. Stage 7 (external benchmark validation) is scaffolded and runnable; Stage 7A defines the reception evidence protocol without adding reception claims to the Lincoln corpus. LCC datasets are not committed to the repository but are downloaded on demand. The [Publication Package](publication_package.md) records the public data package, generated/local-only boundary, limitations, AI-use statement, and non-blocking follow-up issues.

## Stage 7: LCC Validation

Stage 7 compares Lincoln's annotated clusters against the [LCC Metaphor Dataset](https://github.com/lcc-api/metaphor). The committed baseline page uses the English small subset; the scripts also support the larger English dataset as an optional local benchmark. The comparison establishes which of Lincoln's source-concept domains are common in English metaphor and which are Lincoln-specific constructions.

```bash
# Download LCC data (~4.6 MB) and run full Stage 7 comparison:
npm run stage7

# Download and evaluate the larger English LCC dataset:
npm run stage7:large

# Lincoln-only cluster summary (no external data required):
npm run stage7:eval

# Rebuild the benchmark/candidate-corpus registry:
npm run benchmarks:registry
```

The LCC XML files (`data/lcc/en_small.xml`, `data/lcc/en_large.xml`) and parsed CSV files (`data/lcc_subset/*.csv`) are gitignored; downloads are triggered interactively unless `--yes` is supplied to `scripts/run_stage7.py`. The evaluation report is written to `reports/stage7/LCC_report.md` (also gitignored). The persistent site page with the Stage 7 findings is `analysis/lcc_validation.md`.

Scripts:

- `scripts/download_lcc.py` — download and extract `en_small.xml` or `en_large.xml`
- `scripts/parse_lcc.py` — parse LCC XML → CSV
- `scripts/evaluate_lcc.py` — compute domain coverage, write Markdown report
- `scripts/run_stage7.py` — orchestrator; prompts before downloading
- `scripts/build_external_benchmark_registry.py` — writes `data/metadata/external-benchmark-corpora.json` and [External Benchmarks](docs/methodology/external-benchmarks.md)

The external benchmark registry documents implemented LCC baselines, candidate Union, Confederate, abolitionist, and presidential comparison corpora, plus licensing, size, redistribution, and reproducibility decisions.

## Stage 7A: Reception Evidence Protocol

The reception evidence layer documents how future work may add audience reception without contaminating the Lincoln-only metaphor corpus. It defines candidate source types, required metadata, claim boundaries, and collection-level candidate sources. No reception examples are treated as evidence until individual items are selected, cited, and rights-checked.

```bash
npm run reception:registry
```

Outputs:

- `data/metadata/reception-evidence-registry.json`
- `docs/methodology/reception-evidence.md`

The protocol separates rhetoric-in-text claims from claims about how audiences received, repeated, resisted, or transformed Lincoln rhetoric. Candidate collections currently include newspaper, correspondence, community archive, public-meeting, and compiled wartime-commentary sources, each with a source URL or archival citation.

The site itself is rendered with Quarto:

```bash
quarto render
```

Publication-facing pages are marked final. The Quarto configuration keeps draft pages visible so future work-in-progress pages remain inspectable during development, but the current reviewer path is the [Publication Package](publication_package.md).
