# PROMPT.md — Master Entry Point for Claude Code / Codex

## Project Goal

Apply Richard Koenigsberg's ideological fantasy analysis to Abraham Lincoln's corpus (1838–1865). Map the conceptual metaphors that structured Lincoln's understanding of the Civil War and the Union. Produce structured JSON at every pipeline stage. Compare Lincoln's metaphor architecture to Hitler's to identify the structural difference that made Lincoln's rhetoric capable of "malice toward none."

---

## Corpus

28 documents spanning 1838–1865. Full list in `corpus/corpus_manifest.json`.

Wide corpus by design — register field carries the methodological weight that corpus restriction would otherwise carry. All frequency claims must be register-controlled. Run all analyses twice: full corpus and authorship_confidence ≥ 0.95 subset.

---

## Six Metaphor Clusters

| ID | Name |
|----|------|
| `cluster_01_body_organism` | Nation as organism / body |
| `cluster_02_covenant_oath` | Union as covenant / oath |
| `cluster_03_experiment_proposition` | Republic as experiment / proposition |
| `cluster_04_birth_creation` | War as birth / new creation |
| `cluster_05_fathers_inheritance` | Founding fathers as inheritance |
| `cluster_06_providence_theodicy` | Providence / divine will |

Quick reference: `player_aids/metaphor_reference_cards.md`

---

## Subagents

### `lincoln_corpus_reader` (Stage 3 + 4)
- Role: close-reading and annotation specialist
- Responsibilities: segmentation (Stage 3), metaphor annotation (Stage 4)
- Configuration: `subagents/lincoln_corpus_reader.toml`
- Read first: all 8 skill files + corpus_manifest.json

### `koenigsberg_comparativist` (Stage 5 + 6 + written deliverables)
- Role: theoretical analyst and synthesis specialist
- Responsibilities: concordance (Stage 5), analysis (Stage 6), all written analytical documents
- Configuration: `subagents/koenigsberg_comparativist.toml`
- Prerequisite: all Stage 4 annotated files must exist

---

## Pipeline Stages

| Stage | Input | Output | Tool |
|-------|-------|--------|------|
| 1 | Source text | `corpus/raw/{id}_raw.txt` | Manual fetch |
| 2 | Raw text | `corpus/text/{id}.md` (with YAML frontmatter) | Manual or agent |
| 3 | Stage 2 text | `corpus/segmented/{id}_segmented.json` | lincoln_corpus_reader |
| 4 | Stage 3 JSON | `corpus/annotated/{id}_annotated.json` | lincoln_corpus_reader |
| 5 | All Stage 4 | `concordance/concordance.json` | `npm run concordance` |
| 6 | Concordance | `analysis/analysis.json` | `npm run analysis` |

Check status: `npm run status`
Validate all JSON: `npm run validate`
Full pipeline: `npm run pipeline`

---

## Skills (read before annotating)

| File | Purpose |
|------|---------|
| `skills/koenigsberg_method.md` | All 8 psychological constructs with enums and Lincoln notes |
| `skills/cmt_analysis.md` | CMT methodology and 8-step annotation protocol |
| `skills/schema_definitions.md` | Complete schemas for all 6 pipeline stages; ID conventions |
| `skills/annotation_protocol.md` | Workflow; special document protocols; quality checklist |
| `skills/absence_analysis.md` | Systematic silence methodology; absence flag definitions |
| `skills/diachronic_tracking.md` | Five-phase structure; guilt_distribution arc; register control |
| `skills/close_reading.md` | Sentence-level workflow; instance ID generation |
| `skills/corpus_register.md` | Register definitions; confidence adjustments by register |

---

## Deliverables Checklist

### Corpus (per document)
- [ ] Stage 1: raw text in `corpus/raw/`
- [ ] Stage 2: `corpus/text/{id}.md` with YAML frontmatter
- [ ] Stage 3: `corpus/segmented/{id}_segmented.json` — validates clean
- [ ] Stage 4: `corpus/annotated/{id}_annotated.json` — validates clean; document_summary included
- [ ] Stage 4 notes: `analysis/document_notes/{id}_notes.md` — key findings, novel instances, absence flags, diachronic position

### Concordance + Analysis
- [ ] `concordance/concordance.json` — status: complete; all indexes populated
- [ ] `analysis/analysis.json` — status: complete; all 6 cluster_analyses computed

### Written Deliverables (koenigsberg_comparativist)
- [ ] `analysis/cluster_profiles/cluster_01.md` through `cluster_06.md` — fully populated
- [ ] `analysis/diachronic_map.md` — tables filled; narrative summary written
- [ ] `analysis/systematic_absence.md` — all tables filled; key findings stated
- [ ] `comparison/theoretical_framework.md` — fully written
- [ ] `comparison/koenigsberg_comparison.md` — master comparison table with evidence
- [ ] `synthesis/findings.md` — all 4 findings with evidence
- [ ] `synthesis/open_questions.md` — refined with annotation findings

---

## Execution Order

**ALWAYS**:
1. Read all skill files before beginning any Stage 3 or Stage 4 work
2. Read corpus_manifest.json before starting any document
3. Complete all Stage 3 (segmented) files before beginning Stage 4 (annotated) files
4. Validate (`npm run validate`) after each stage
5. Run analysis twice: full corpus and authorship_confidence ≥ 0.95 subset
6. Never modify a completed Stage N file when working on Stage N+1

**For each document (lincoln_corpus_reader)**:
1. Read skill files → read corpus_manifest.json entry → read source text
2. Segment → validate → annotate → validate
3. Compute document_summary → update instance_counter.json
4. Write `analysis/document_notes/{id}_notes.md` — key findings, novel instances, absence flags, diachronic position

**For synthesis (koenigsberg_comparativist)**:
1. Confirm all 28 documents at Stage 4 (`npm run status`)
2. Run concordance (`npm run concordance`)
3. Run analysis (`npm run analysis`)
4. Write cluster profiles (draw from analysis.json data)
5. Write diachronic map, systematic absence, comparison docs, synthesis

---

## Key Constraints

- Sentence IDs are permanent after Stage 3 — never renumber
- Absence thread (systematic_absence.md) is a required deliverable
- All frequency claims require register-controlled versions
- Legal document metaphor absence is a finding, not a null result
- `disease_and_purification` must be tracked; its absence is the key finding
- Run all analyses twice: full corpus and confidence ≥ 0.95 subset
