# Lincoln Metaphor Analysis

A structured study of metaphor, obligation, agency, and reconciliation across a selected corpus of Abraham Lincoln's rhetoric (1838–1865). Conceptual Metaphor Theory provides the linguistic foundation; Richard Koenigsberg's ideological-fantasy analysis supplies a bounded interpretive contrast.

**[View the research site →](https://ashitaka-emishi.github.io/lincoln-metaphor-analysis/)** — a browsable HTML version of the full project, including the annotated corpus status, all methodology documentation, per-document annotation notes, cluster profiles, the purification-rhetoric contrast, and synthesis findings. The site is rebuilt automatically on every commit.

## Authorship and AI-Assisted Method

This project is the work of **Andrew Hammer**, a human engineer/researcher designing and directing an agentic AI-assisted scholarly analysis system. AI tools are used as instruments for corpus preparation, structured annotation, validation, synthesis support, and website generation. Interpretive responsibility, research design, and scholarly framing remain human-authored.

The project should therefore be read as a human-directed scholarly and engineering work that uses AI agents as research infrastructure, not as autonomous authors. The agentic system helps make the workflow more systematic, reproducible, and inspectable; final responsibility for method, scope, interpretation, and presentation remains with the human researcher.

## Quick Start

Prerequisites:

- Node.js 20, using `.nvmrc` where supported, with packages installed by `npm ci`.
- Python 3.11, using `.python-version` where supported. The Python scripts use only the standard library; `requirements.txt` documents that no pip dependencies are required.
- Quarto 1.9.37 for site rendering. The Pages workflow installs this exact version.

Verify the runtime:

```bash
node --version
npm ci
python3 --version
python3 -m pip install -r requirements.txt
quarto --version
```

Expected major versions are Node `v20.x`, Python `3.11.x`, and Quarto `1.9.37`.

```bash
node scripts/pipeline_status.js   # see S1-S4 completion per document
node scripts/validate_schema.js   # validate all JSON files
node scripts/validate_annotation_output.js doc_001 # validate a Stage 4 file immediately after creation
node scripts/build_concordance.js # Stage 5: build concordance from annotated docs
node scripts/run_analysis.js      # Stage 6: compute cluster statistics
node scripts/build_evidence_chains.js    # Stage 4A: evidence-chain records
node scripts/build_reliability_sample.js # Stage 4B: reliability artifacts
node scripts/build_reliability_results.js # Stage 4B: completed coding and metrics
node scripts/build_textual_variant_apparatus.js # Stage 4C: source-risk apparatus
python3 scripts/build_external_benchmark_registry.py # Stage 7: benchmark registry
python3 scripts/build_reception_evidence_registry.py # Reception evidence protocol
node scripts/build_controlled_analysis.js # Stage 6A: register/authorship controls
node scripts/build_claim_audit.js         # Stage 8: claim-to-source audit
quarto render                     # rebuild the static research site
```

Or via npm:

```bash
npm run status
npm run validate
npm run validate:annotation -- doc_001
npm run validate:source-provenance # verify source checksums without rewriting files
npm run pipeline    # validate, concordance, analysis, evidence, reliability, controls, audit
npm run variants:apparatus # rebuild the textual variant apparatus
npm run benchmarks:registry # rebuild the external benchmark registry
npm run reception:registry # rebuild the reception evidence registry
npm run site        # quarto render
```

## What This Project Does

Applies two theoretical frameworks simultaneously to Lincoln's 28-document corpus:

1. **Conceptual Metaphor Theory**: maps source→target domain, entailments, and linguistic forms
2. **Koenigsberg's ideological fantasy analysis**: identifies the psychological constructs (fantasy type, violence logic, obligatory frame, sacrificial economy, systematic absence) that made the Civil War feel obligatory

Output is structured JSON at every stage, enabling programmatic analysis and visualization.

**Primary Research Question**:

How does Lincoln's metaphor system authorize mass violence while preserving structural exit conditions that make reconciliation possible rather than annihilation?

**Secondary Research Questions**:

- Which metaphor clusters structure Lincoln's Civil War rhetoric?
- How does the metaphor system make war feel obligatory rather than chosen?
- Which agents or groups are systematically absent from the roles the metaphors make available?
- What structural difference separates Lincoln's rhetoric from purification-based political rhetoric?

## Directory Structure

```text
lincoln-analysis/
├── index.qmd                    # website overview
├── executive_summary.md         # public-facing argument summary
├── how_to_read.md               # guide to site structure and reviewer path
├── publication_package.md        # reviewer landing path and publication checklist
├── methods_summary.md           # public-facing method summary
├── analysis_overview.md         # analysis section landing page
├── data_reproducibility.md      # data, scripts, and reproducibility notes
├── annotation_schema_repair.md  # 2026-04-30 schema drift incident and repair record
├── changelog.md                 # project change log
├── corpus/
│   ├── corpus_manifest.json     # all 28 documents with full metadata
│   ├── raw/                     # Stage 1: source files
│   ├── text/                    # Stage 2: markdown + YAML frontmatter
│   ├── segmented/               # Stage 3: structural JSON
│   └── annotated/               # Stage 4: annotated JSON
├── data/
│   ├── concordance.json         # Stage 5: corpus-wide index
│   ├── evidence/                 # Stage 4A: generated evidence-chain records
│   ├── reliability/              # Stage 4B: reliability sample and adjudication artifacts
│   ├── metadata/                 # corpus register, textual variants, external/reception registries
│   ├── audit/                    # Stage 8: claim-to-source audit
│   ├── lcc/                     # LCC XML dataset (gitignored, downloaded on demand)
│   └── lcc_subset/              # parsed LCC CSV (gitignored)
├── analysis/
│   ├── analysis.json            # Stage 6: cluster statistics
│   ├── controlled-analysis.json  # Stage 6A: register/authorship controls
│   ├── diachronic_map.md
│   ├── systematic_absence.md
│   ├── lcc_validation.md        # Stage 7: LCC benchmark validation (site page)
│   ├── document_notes/          # Stage 4 human-readable findings per document
│   └── cluster_profiles/        # cluster_01.md through cluster_06.md
├── comparison/
│   ├── theoretical_framework.md # methodology: CMT + Koenigsberg integration
│   └── koenigsberg_comparison.md # synthesis: purification-rhetoric contrast
├── synthesis/
│   ├── claim_audit.md           # public claim-to-source audit page
│   ├── findings.md
│   ├── final_conclusions.md
│   └── open_questions.md
├── skills/                      # methodology reference files
├── subagents/                   # TOML configs for annotation agents
├── scripts/                     # pipeline scripts (Python + Node.js)
│   └── snippet.js               # browser DevTools snippet for corpus download
├── scaffolds/                   # scaffold prompts and LCC documentation
├── docs/                        # developer/process docs (not rendered to site)
│   ├── PROMPT.md                # master entry point for Claude Code
│   ├── methodology/external-benchmarks.md # Stage 7 benchmark registry
│   ├── methodology/reception-evidence.md # reception evidence boundary and candidates
│   ├── methodology/textual-variant-apparatus.md # source-risk apparatus
│   ├── DECISIONS.md             # resolved and open design decisions
│   ├── QUARTO.md                # Quarto site configuration notes
│   └── agents.md                # agent role and discipline guide
└── reports/                     # generated reports (gitignored)
    └── stage7/LCC_report.md
```

## Quarto Research Site

The repository builds a Quarto static website from the Markdown and QMD files. The top navigation exposes the major reader paths: **Home**, **Corpus**, **Methodology**, **Analysis**, and **Synthesis**. The sidebar preserves the full project structure, with Design Decisions placed under Methodology alongside the theoretical framework, reproducibility notes, protocols, and schema documentation.

The site uses `draft-mode: visible` so future draft pages remain inspectable during development. The current publication-facing methodology, analysis, synthesis, and reviewer-package pages are marked final; [Publication Package](publication_package.md) is the canonical reviewer path.

Key public-facing guide pages:

- `executive_summary.md` — concise statement of argument, method, and attribution
- `how_to_read.md` — reader guide to the site and reviewer path
- `publication_package.md` — reviewer landing path, data availability, limitations, AI-use statement, and publication checklist
- `methods_summary.md` — accessible summary of the methodology
- `analysis_overview.md` — landing page for the Analysis section
- `data_reproducibility.md` — data pipeline and reproducibility notes
- `docs/methodology/external-benchmarks.md` — implemented and candidate external benchmark corpora
- `docs/methodology/reception-evidence.md` — reception-source scope, candidate collections, and evidence rules
- `docs/methodology/textual-variant-apparatus.md` — source-risk apparatus for risk-flagged documents
- `annotation_schema_repair.md` — record of the Stage 4 schema drift event, repair, and new validation safeguards
- `synthesis/final_conclusions.md` — final synthesis endpoint

## The Six Metaphor Clusters

| ID | Cluster | Source domain |
| -- | ------- | ------------ |
| cluster_01 | Nation as organism / body | wound, healing, birth, severance |
| cluster_02 | Union as covenant / oath | sworn oath, contract, sacred bond |
| cluster_03 | Republic as experiment / proposition | logical proof, scientific test |
| cluster_04 | War as birth / new creation | labor, nativity, generative act |
| cluster_05 | Founding fathers as inheritance | patrimony, lineage, ancestral debt |
| cluster_06 | Providence / divine will | God's judgment, punishment, theodicy |

## Pipeline Stages

| Stage | Description | Directory |
| ----- | ----------- | --------- |
| 1 | Source text (raw) | `corpus/raw/` |
| 2 | Markdown + YAML frontmatter | `corpus/text/` |
| 3 | Segmented JSON (sections/paragraphs/sentences) | `corpus/segmented/` |
| 4 | Annotated JSON (metaphor instances embedded) | `corpus/annotated/` |
| 4A | Evidence chains | `data/evidence/annotation-evidence.json` |
| 4B | Reliability sample and adjudication workflow | `data/reliability/` |
| 4C | Textual variant apparatus | `data/metadata/textual-variant-apparatus.json`, `docs/methodology/textual-variant-apparatus.md` |
| 5 | Concordance (corpus-wide index) | `data/concordance.json` |
| 6 | Analysis (cluster statistics) | `analysis/` |
| 6A | Controlled analysis outputs | `analysis/controlled-analysis.json`, `analysis/controlled_outputs.md` |
| 7 | External benchmark registry and LCC domain coverage | `data/metadata/external-benchmark-corpora.json`, `docs/methodology/external-benchmarks.md`, `reports/stage7/` |
| 7A | Reception evidence protocol | `data/metadata/reception-evidence-registry.json`, `docs/methodology/reception-evidence.md` |
| 8 | Claim-to-source audit | `data/audit/claim-audit.json`, `synthesis/claim_audit.md` |

## Current Status

**Publication package scaffolded and validated** across all 28 documents.

| Stage | Status | Notes |
| ----- | ------ | ----- |
| 1 | ✓ Complete | 28 raw `.txt` files in `corpus/raw/` |
| 2 | ✓ Complete | 28 `.md` files with YAML frontmatter in `corpus/text/` |
| 3 | ✓ Complete | 28 `.json` files in `corpus/segmented/` — 7,644 sentences, 5,198 Lincoln-authored |
| 4 | ✓ Complete | `corpus/annotated/` — 28/28 complete; 136 instances (inst_00001–inst_00136) across 24 extension groups; all files pass canonical schema validation; `analysis/document_notes/` — findings written for all 28 docs; completed 2026-04-30 |
| 4A | ✓ Complete | `data/evidence/annotation-evidence.json` — 136 claim-audit-ready evidence records |
| 4B | ✓ Complete with AI-assisted limitation | `data/reliability/` — 5-document reliability sample, completed Stage 4A-reference vs. Codex second-pass coding, adjudication log, and reliability metrics |
| 4C | ✓ Complete | `data/metadata/textual-variant-apparatus.json` and `docs/methodology/textual-variant-apparatus.md` — 13 risk-flagged documents indexed with source traditions, anchors, annotation decisions, and publication caveats |
| 5 | ✓ Complete | `data/concordance.json` — 136 instances indexed; 51 high-confidence (≥0.90); 7 suppression instances; completed 2026-04-30 |
| 6 | ✓ Complete | `analysis/analysis.json` — cluster_01: 34, cluster_02: 17, cluster_03: 20, cluster_04: 8, cluster_05: 35, cluster_06: 22; 144 absence flag instances; completed 2026-04-30 |
| 6A | ✓ Complete | `analysis/controlled-analysis.json` and `analysis/controlled_outputs.md` — full corpus plus `authorship_confidence >= 0.95` views |
| 7 | ⚙ Implemented/scaffolded | LCC `en_small` baseline supported; LCC `en_large` optional path supported; external benchmark registry documents candidate Union, Confederate, abolitionist, and presidential comparison corpora. Lincoln-only summary always available via `npm run stage7:eval`. |
| 7A | ✓ Protocol complete | `data/metadata/reception-evidence-registry.json` and `docs/methodology/reception-evidence.md` define candidate reception sources, metadata rules, and the boundary between Lincoln textual evidence and audience reception claims. |
| 8 | ✓ Complete | `data/audit/claim-audit.json` and `synthesis/claim_audit.md` — six major claim audit entries |

The research site rebuilds automatically on every push via GitHub Actions (`quarto render`).

## Stage 7: LCC Metaphor Dataset Verification

Stage 7 benchmarks Lincoln's annotation system against the [LCC Metaphor Dataset](https://github.com/lcc-api/metaphor) and documents candidate contemporary comparison corpora. The LCC path supports the English small subset and an optional English large subset; raw XML and parsed CSV files are downloaded or generated locally and are not committed.

The comparison is at the **conceptual domain level**: which LCC source-concept categories (BODY, WAR, RELIGION, CONTRACT, etc.) appear in Lincoln's six clusters, and which are systematically absent. This is analytically significant: Lincoln's narrow domain selection is itself a finding.

```bash
# Lincoln-only cluster summary (no external data needed):
npm run stage7:eval

# Small LCC comparison (downloads en_small.xml on demand):
npm run stage7

# Large LCC comparison (downloads en_large.xml on demand):
npm run stage7:large

# Benchmark registry:
npm run benchmarks:registry
```

Reports are written to `reports/stage7/LCC_report.md`. Benchmark choices and candidate comparison corpora are documented in `docs/methodology/external-benchmarks.md`.

## How Stages 1–3 Were Built

**Stage 1** — Source acquisition  
Texts fetched from the University of Michigan Collected Works digital edition (quod.lib.umich.edu). A Chrome DevTools snippet (`scripts/snippet.js`) runs authenticated fetch calls against the DLXS TOC or known section URLs, downloads each document as a `.txt` file, and strips DLXS navigation chrome inline. A Python cleanup script (`scripts/strip_umich_nav.py`) handles any residual page-break artifacts. Five documents (doc_001, doc_002, doc_008, doc_009, doc_012, doc_016, doc_017, doc_019, doc_021, doc_022) were provided from other sources and written manually; their raw files were created directly.

**Stage 2** — Frontmatter attachment  
`scripts/build_stage2.py` reads each raw `.txt` file, prepends a YAML frontmatter block from a hardcoded catalogue (title, date, register, authorship, confidence, risk_flags, analytical_priority), and writes `corpus/text/{doc_id}.md`. Three documents (doc_011, doc_013, doc_018) were written manually with corrected text before the script ran. Run with `--force` to overwrite.

**Stage 3** — Segmentation  
`scripts/build_stage3.py` reads each Stage 2 markdown file, splits the body into sections, paragraphs, and sentences, assigns permanent hierarchical IDs (`{doc_id}_s{NN}_p{NN}_s{NN}`), tracks cumulative word offsets, and writes `corpus/segmented/{doc_id}.json` with empty `metaphor_instances: []` at every sentence.

Section detection: standalone lines matching debate speaker-turn patterns (`MR. LINCOLN'S REPLY.`, `MR. DOUGLAS' REPLY.`, `SENATOR DOUGLAS' REPLY.`, rejoinder variants) start new sections; `Annotation` starts the editorial apparatus section. Debates where Lincoln opens (Freeport, Charleston, Quincy — doc_006b/d/f) default the initial section to `lincoln_speech`; all others default to `douglas_speech`. Sentences in Lincoln sections get `authorship_note: null`; Douglas and annotation sections get `authorship_note: "douglas_speech"` or `"editorial_apparatus"`.

Sentence splitting uses regex with abbreviation protection (Mr., Mrs., Dr., Gov., U.S., etc.) and handles typographic variants in the UMich transcriptions (missing spaces in `MR.LINCOLN`, `M R.` typo in Freeport). Run with `--force` to overwrite.

## Key Constraints

- Sentence IDs are permanent after Stage 3 — never renumber
- All frequency claims must have register-controlled versions
- Run all analyses twice: full corpus and authorship_confidence ≥ 0.95 subset
- `disease_and_purification` must be tracked; its absence is the key structural finding
- Legal document metaphor absence is a finding, not a null result

## Theoretical References

- Lakoff, G. & Johnson, M. (1980). *Metaphors We Live By*. University of Chicago Press.
- Steen, G. J., Dorst, A. G., Herrmann, J. B., Kaal, A. A., Krennmayr, T., & Pasma, T. (2010). *A Method for Linguistic Metaphor Identification: From MIP to MIPVU*. John Benjamins.
- Koenigsberg, R. A. (2009). *Nations Have the Right to Kill: Hitler, the Holocaust and War*. Library of Social Science.

## Changelog

See [changelog.md](changelog.md) for a record of project changes.
