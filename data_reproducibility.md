---
title: "Data / Reproducibility"
---

The project is designed so the interpretive claims can be traced back to structured data.

The corpus begins in `corpus/raw/`, moves through Markdown files with YAML metadata in `corpus/text/`, then becomes segmented JSON in `corpus/segmented/`. Annotated documents live in `corpus/annotated/`, where metaphor instances are embedded directly into the sentence structure that produced them.

The main scripts are:

```bash
node scripts/pipeline_status.js
node scripts/validate_schema.js
node scripts/build_concordance.js
node scripts/run_analysis.js
```

The npm shortcut is:

```bash
npm run pipeline
```

That command validates JSON, builds `data/concordance.json`, and computes `analysis/analysis.json`.

Current status: Stages 1–6 are complete across all 28 documents. Stage 7 (LCC benchmark validation) is scaffolded and runnable; the LCC dataset is not committed to the repository but is downloaded on demand.

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

Draft pages are intentionally visible. They allow readers to inspect the shape of the final argument while making clear which pages should not yet be cited as completed findings.
