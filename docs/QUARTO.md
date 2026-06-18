# Quarto Site — Architecture and Generation

The Quarto site presents the research as a concise scholarly publication with a discoverable evidence archive behind it. Configuration lives in `_quarto.yml` at the project root.

## Reader Architecture

The top navigation contains five destinations:

| Destination | Purpose |
|---|---|
| Overview | Central argument, evidence snapshot, and reading paths |
| Findings | Evidence-backed findings and final conclusions |
| Analysis | Corpus-level analysis and cluster-profile hub |
| Method | Public method, research design, and reproducibility |
| Corpus | Primary texts, metadata controls, and document notes |

The global sidebar intentionally contains only the principal reader-facing pages. Detailed protocols, audit pages, schemas, publication records, and project history remain rendered and searchable through `research_appendix.md`.

Detail pages use hubs rather than global navigation:

- `analysis_overview.md` links the six cluster profiles and major analysis layers.
- `corpus_index.qmd` links each source text and its document-level close-reading notes.
- `research_appendix.md` links protocols, audits, benchmark details, publication records, and project history.

Adding a rendered page does not automatically justify adding it to the sidebar. Prefer linking new detail pages from the relevant hub; reserve primary navigation for destinations that orient a general scholarly reader.

## Prerequisites

Install Quarto 1.9.37, matching the version pinned in the GitHub Pages workflow. On macOS, Homebrew may install a newer stable release over time, so verify the version after install:

```bash
brew install quarto
quarto --version
```

Expected version: `1.9.37`. If Homebrew does not provide it, use the pinned release from the [Quarto CLI releases](https://github.com/quarto-dev/quarto-cli/releases/tag/v1.9.37).

## Preview and Render

Preview with live reload:

```bash
quarto preview
# or
npm run site:preview
```

The preview runs at `http://localhost:4444`.

Render the static site:

```bash
quarto render
# or
npm run site
```

Output is written to `_site/`.

## Render Boundary

Quarto renders the project's `.md` and `.qmd` research pages, including the source texts in `corpus/text/`. The following repository-facing files and directories are excluded in `_quarto.yml`:

- `SCAFFOLD.md`
- `docs/PROMPT.md`
- `docs/QUARTO.md`
- `docs/agents.md`
- `README.md`
- `reports/**`
- `data/**`
- `scaffolds/**`

Exclusion from the sidebar is different from exclusion from rendering. Appendix and detail pages remain rendered even when they do not appear in primary navigation.

## Publication Validation

For changes to navigation, content architecture, or publication pages, run:

```bash
npm run status
npm run validate
npm run pipeline
quarto render
```

Then inspect at least the Overview, Findings, Analysis, Method, Corpus, and Research Appendix pages at desktop and mobile widths. Confirm that source-text and document-note links work, wide tables scroll, and the collapsed mobile navigation remains usable.

## Sharing

The rendered `_site/` directory can be archived and shared, published through the configured GitHub Pages workflow, or deployed with Quarto Pub. Regenerate the site after changes to annotations, aggregate outputs, analysis prose, or navigation.
