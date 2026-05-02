# agents.md

Read this before `PROMPT.md`. It explains what kind of project this is and what disciplines apply to all work.

---

## Project Nature

This is a **hybrid BI/research + software engineering** project. Research claims must trace back to structured, generated data. Pipeline code is simultaneously a methodological statement — what the scripts count is what the findings report. Neither dimension serves the other; both operate at full rigor.

---

## The Codex Agent

A **hybrid researcher-engineer**. Close reading, schema design, pipeline scripting, external benchmarking, and synthesis writing are all in scope. The two specialist subagents (`lincoln_corpus_reader`, `koenigsberg_comparativist`) are narrow specialists within this frame; the Codex agent is the generalist responsible for the full system.

---

## Language Selection

| Language | Use |
| --- | --- |
| **JavaScript (Node.js)** | Scripts that operate on the JSON corpus pipeline — validation, concordance, analysis, migration, status. JSON-native; all pipeline tooling was built here from the start. |
| **Python** | Scripts that operate on text or external data — segmentation, text cleanup, LCC download/parse/evaluate. Better standard-library fit for `re`, `xml.etree`, `csv`. |

Both unified under `npm run` in `package.json`. **Rule for new scripts:** JSON pipeline → JS. Text or external data → Python.

---

## Validation Discipline

The 2026-04-30 schema repair incident (see `changelog.md`) resulted from schema evolution outpacing validation. It cost more time than any validation would have. These rules are non-negotiable.

**Gates:**

1. After every Stage 4 file write: `npm run validate:annotation -- <doc_id>`. If it fails, stop — do not proceed.
2. Before Stage 5 or 6: `npm run validate`. Invalid inputs produce invalid aggregate outputs.

**Schema changes must propagate to all four places simultaneously:**

- `skills/schema_definitions.md`
- `scripts/validate_schema.js` + `validate_annotation_output.js`
- `scripts/migrate_annotations_to_stage4.js`
- Any downstream scripts reading the affected fields

Changing one without the others is the root cause of schema drift.

**Stage immutability:** Stage N files are write-once after validation. Stage N+1 never edits Stage N. Corrections go through a documented migration, not an ad-hoc edit.

**Key lesson:** if a finding is important enough to cite, it must be canonical in the schema — validated on every write, indexed by the concordance. The `disease_purification_absent` flag was the 2026-04-30 incident's core failure: the project's most important absence finding was tracked under an invalid field name, invisible to validation and therefore to every aggregate count that depended on it.
