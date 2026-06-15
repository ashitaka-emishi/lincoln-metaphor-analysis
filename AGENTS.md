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

---

## GitHub Issue Tracking

Use the GitHub label `tracking` for issues that coordinate a set of dependent issues.

Before closing any issue that belongs to a milestone, check for an open issue in the same milestone labeled `tracking`. If the closing issue appears in that tracking issue's checklist, dependency list, or status notes, update the tracker in the same pass.

Tracking issues should contain the issue order, dependency notes, and milestone-level completion definition. If work is completed out of order or the dependency sequence changes, leave a short note on the tracking issue explaining the change.

Current tracker: https://github.com/ashitaka-emishi/lincoln-metaphor-analysis/issues/11

---

## SDLC Workflow

Use the repo skill `.agents/skills/sdlc-workflow` for branch, pull request, review, merge, and issue-tracking workflows.

Default branch naming:

- `fix/<issue-number>-<short-slug>` for bug fixes and validation repairs
- `feature/<issue-number>-<short-slug>` for new behavior or new outputs
- `docs/<issue-number>-<short-slug>` for documentation-only work
- `chore/<issue-number>-<short-slug>` for maintenance, cleanup, or repository mechanics

Prefer one issue per branch and one branch per pull request. Keep pull requests draft until validation has run and the description includes issue context, scope, tests, and any known limitations.

Always use squash merge for pull requests in this repository. Do not use merge commits or rebase merge unless the user explicitly overrides this rule for a specific PR.

Before opening or marking a PR ready for review, run the smallest validation set that matches the change. For pipeline or publication work, the expected full gate is:

1. `npm run status`
2. `npm run validate`
3. `npm run pipeline`
4. `quarto render`

When addressing review feedback, keep changes scoped to the requested fix unless the reviewer explicitly asks for broader cleanup. When merge or closure work finishes an issue in a milestone, update any open issue in the same milestone labeled `tracking`.
