# Lincoln Metaphor Analysis

A structured research project applying Richard Koenigsberg's ideological fantasy analysis to Abraham Lincoln's corpus (1838–1865), using Conceptual Metaphor Theory (Lakoff & Johnson) as the linguistic foundation.

**[View the research site →](https://ashitaka-emishi.github.io/lincoln-metaphor-analysis/)** — a browsable HTML version of the full project, including the annotated corpus status, all methodology documentation, per-document annotation notes, cluster profiles, the Lincoln/Hitler structural comparison, and synthesis findings. The site is rebuilt automatically on every commit.

## Authorship and AI-Assisted Method

This project is the work of **Andrew Hammer**, a human engineer/researcher designing and directing an agentic AI-assisted scholarly analysis system. AI tools are used as instruments for corpus preparation, structured annotation, validation, synthesis support, and website generation. Interpretive responsibility, research design, and scholarly framing remain human-authored.

The project should therefore be read as a human-directed scholarly and engineering work that uses AI agents as research infrastructure, not as autonomous authors. The agentic system helps make the workflow more systematic, reproducible, and inspectable; final responsibility for method, scope, interpretation, and presentation remains with the human researcher.

## Quick Start

```bash
node scripts/pipeline_status.js   # see S1-S4 completion per document
node scripts/validate_schema.js   # validate all JSON files
node scripts/validate_annotation_output.js doc_001 # validate a Stage 4 file immediately after creation
node scripts/build_concordance.js # Stage 5: build concordance from annotated docs
node scripts/run_analysis.js      # Stage 6: compute cluster statistics
quarto render                     # rebuild the static research site
```

Or via npm:

```bash
npm run status
npm run validate
npm run validate:annotation -- doc_001
npm run pipeline    # validate → concordance → analysis
npm run site        # quarto render
```

## What This Project Does

Applies two theoretical frameworks simultaneously to Lincoln's 28-document corpus:

1. **Conceptual Metaphor Theory**: maps source→target domain, entailments, and linguistic forms
2. **Koenigsberg's ideological fantasy analysis**: identifies the psychological constructs (fantasy type, violence logic, obligatory frame, sacrificial economy, systematic absence) that made the Civil War feel obligatory

Output is structured JSON at every stage, enabling programmatic analysis and visualization.

**Central research questions**:

- What conceptual metaphors structured Lincoln's understanding of the Civil War?
- How did his metaphor system make the war feel necessary rather than chosen?
- What entities does his metaphor system systematically erase (enslaved people, Black soldiers)?
- What is the structural difference between Lincoln's rhetoric and Hitler's that explains why Lincoln could say "malice toward none" and Hitler could not?

## Directory Structure

```text
lincoln-analysis/
├── index.qmd                    # website overview
├── executive_summary.md          # public-facing argument summary
├── how_to_read.md                # guide to site structure and draft status
├── methods_summary.md            # public-facing method summary
├── analysis_overview.md          # analysis section landing page
├── data_reproducibility.md       # data, scripts, and reproducibility notes
├── annotation_schema_repair.md   # 2026-04-30 schema drift incident and repair record
├── corpus/
│   ├── corpus_manifest.json      # all 28 documents with full metadata
│   ├── raw/                      # Stage 1: source files
│   ├── text/                     # Stage 2: markdown + YAML frontmatter
│   ├── segmented/                # Stage 3: structural JSON
│   └── annotated/                # Stage 4: annotated JSON
├── concordance/
│   └── concordance.json          # Stage 5: corpus-wide index
├── analysis/
│   ├── analysis.json             # Stage 6: cluster statistics
│   ├── diachronic_map.md
│   ├── systematic_absence.md
│   ├── document_notes/           # Stage 4 human-readable findings per document
│   └── cluster_profiles/         # cluster_01.md through cluster_06.md
├── comparison/
│   ├── theoretical_framework.md  # methodology: CMT + Koenigsberg integration
│   └── koenigsberg_comparison.md # synthesis: Lincoln vs. Hitler structural comparison
├── synthesis/
│   ├── findings.md
│   ├── final_conclusions.md
│   └── open_questions.md
├── skills/                       # methodology reference files
├── subagents/                    # TOML configs for annotation agents
├── scripts/                      # pipeline scripts (Python + Node.js)
├── PROMPT.md                     # master entry point for Claude Code
└── DECISIONS.md                  # resolved and open design decisions
```

## Quarto Research Site

The repository builds a Quarto static website from the Markdown and QMD files. The top navigation exposes the major reader paths: **Home**, **Corpus**, **Methodology**, **Analysis**, and **Synthesis**. The sidebar preserves the full project structure, with Design Decisions placed under Methodology alongside the theoretical framework, reproducibility notes, protocols, and schema documentation.

Draft pages are intentionally visible. The site uses `draft-mode: visible`, so unfinished analysis and synthesis pages remain browsable with a prominent Draft banner and draft-page styling. Draft pages show the current analytical scaffold, but they should not be cited as final findings until Stage 4 annotation and the Stage 5–6 aggregate analysis are complete.

Key public-facing guide pages:

- `executive_summary.md` — concise statement of argument, method, and attribution
- `how_to_read.md` — reader guide to the site and draft status
- `methods_summary.md` — accessible summary of the methodology
- `analysis_overview.md` — landing page for the Analysis section
- `data_reproducibility.md` — data pipeline and reproducibility notes
- `annotation_schema_repair.md` — record of the Stage 4 schema drift event, repair, and new validation safeguards
- `synthesis/final_conclusions.md` — final synthesis endpoint, currently draft

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
| 5 | Concordance (corpus-wide index) | `concordance/` |
| 6 | Analysis (cluster statistics) | `analysis/` |

## Current Status

**Stages 1–3 complete** across all 28 documents.

| Stage | Status | Notes |
| ----- | ------ | ----- |
| 1 | ✓ Complete | 28 raw `.txt` files in `corpus/raw/` |
| 2 | ✓ Complete | 28 `.md` files with YAML frontmatter in `corpus/text/` |
| 3 | ✓ Complete | 28 `.json` files in `corpus/segmented/` — 7,644 sentences, 5,198 Lincoln-authored |
| 4 | In progress | `corpus/annotated/` — 20/28 complete (doc_001, doc_002, doc_003, doc_005, doc_007, doc_008, doc_009, doc_010, doc_011, doc_012, doc_013, doc_014, doc_015, doc_016, doc_017, doc_018, doc_019, doc_020, doc_021, doc_022); all current Stage 4 files were normalized to the canonical schema on 2026-04-30; `analysis/document_notes/` — findings written for each annotated doc |
| 5–6 | Pending | Depends on Stage 4 completion |

**Next step**: Continue Stage 4 annotation — 8 documents remain (doc_004, doc_006a–g). For each document: annotate into `corpus/annotated/{id}_annotated.json`, run `npm run validate:annotation -- {id}` immediately after creation, then write key findings to `analysis/document_notes/{id}_notes.md`. When all 28 are done, run `npm run pipeline`.

## How Stages 1–3 Were Built

**Stage 1** — Source acquisition  
Texts fetched from the University of Michigan Collected Works digital edition (quod.lib.umich.edu). A Chrome DevTools snippet (`corpus/raw/snippet.js`) runs authenticated fetch calls against the DLXS TOC or known section URLs, downloads each document as a `.txt` file, and strips DLXS navigation chrome inline. A Python cleanup script (`scripts/strip_umich_nav.py`) handles any residual page-break artifacts. Five documents (doc_001, doc_002, doc_008, doc_009, doc_012, doc_016, doc_017, doc_019, doc_021, doc_022) were provided from other sources and written manually; their raw files were created directly.

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
- Koenigsberg, R. (2009). *Nations Have the Right to Kill*. Library of Social Science.
- Koenigsberg, R. (2014). *Psychological Sources of War and Genocide*. Library of Social Science.
