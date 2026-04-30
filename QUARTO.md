# Quarto Site — How to Generate

The Quarto site renders all research documentation into a shareable static website. Configuration lives in `_quarto.yml` at the project root.

## Prerequisites

Install Quarto (version 1.4 or later):

```bash
brew install quarto      # macOS via Homebrew
```

Or download the installer from <https://quarto.org/docs/get-started/>.

Verify: `quarto --version`

## Preview locally

```bash
quarto preview
# or
npm run site:preview
```

Opens a live-reloading browser at `http://localhost:4444`. Edit any `.md` or `.qmd` file and the browser updates automatically.

## Render to static HTML

```bash
quarto render
# or
npm run site
```

Outputs the complete site to `_site/`. All HTML, CSS, and data assets are self-contained in that directory.

## Share the rendered site

**Option 1 — Zip and send**

Zip the `_site/` directory. The recipient opens `_site/index.html` locally in any browser. No server required.

**Option 2 — Quarto Pub (free, public URL)**

```bash
quarto publish quarto-pub
```

Creates a URL at `username.quarto.pub/lincoln-analysis`. Free; no login required for visitors.

**Option 3 — GitHub Pages**

```bash
quarto publish gh-pages
```

Requires the project to be in a GitHub repository. Publishes to `username.github.io/repo-name`.

## What is and is not included

**Included**: All `.md` and `.qmd` files except the four listed below. Source texts (`corpus/text/*.md`) are rendered and accessible via links from the Corpus page.

**Excluded from rendering**:

| File | Reason |
|------|--------|
| `SCAFFOLD.md` | Agent build instructions, not research content |
| `PROMPT.md` | Agent entry point, not research content |
| `README.md` | Superseded by `index.qmd` |
| `QUARTO.md` | This file |

Exclusions are defined in the `project.render` field of `_quarto.yml`.

## Regenerating after new annotations

Re-run `quarto render` after completing Stage 4 annotation on any document. The pipeline status table on the home page reads `corpus/corpus_manifest.json` at render time and automatically reflects updated `pipeline_stage_completed` values.

After Stages 5–6 complete (`npm run pipeline`), re-render to include populated cluster statistics and absence counts in the Analysis section.
