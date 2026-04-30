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

That command validates JSON, builds `concordance/concordance.json`, and computes `analysis/analysis.json`.

Current status: Stage 4 annotation is incomplete. Twenty of 28 documents have annotated JSON files. The remaining documents are `doc_004` and the seven Lincoln-Douglas debates, `doc_006a` through `doc_006g`. Because Stage 4 is not finished, Stage 5 concordance and Stage 6 analysis should be treated as stub or pending outputs.

The site itself is rendered with Quarto:

```bash
quarto render
```

Draft pages are intentionally visible. They allow readers to inspect the shape of the final argument while making clear which pages should not yet be cited as completed findings.
