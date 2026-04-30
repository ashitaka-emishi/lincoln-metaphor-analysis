---
title: "Annotation Schema Repair"
---

## What happened

On 2026-04-30, repository-wide validation exposed a schema drift problem in Stage 4 annotation data.

The failure was not a single bad document. It was a structural mismatch between three parts of the project that had drifted apart:

- the documented Stage 4 schema in `skills/schema_definitions.md`
- the validator and downstream pipeline scripts
- many existing files in `corpus/annotated/`

The immediate validation run reported hundreds of errors, but those errors reduced to a smaller set of root causes:

- many annotation instances still used an older flat shape instead of the canonical nested `cmt` / `koenigsberg` / `meta` structure
- some Koenigsberg `fantasy_type` values had legacy names that no longer matched the canonical enum
- some absence flags had drifted, especially the project-critical tracking of the absence of purification logic
- Stage 3 validation was checking the wrong filename pattern for segmented JSON files

This meant the project had valid interpretive work embedded in data that no longer matched the schema expected by validation, concordance building, and aggregate analysis.

## Why it mattered

This was a high-integrity issue, not a cosmetic one.

If left unfixed, the project risked three kinds of damage:

- false negatives during validation, making good annotation work appear broken
- partial or incorrect Stage 5 and Stage 6 outputs, because downstream scripts already assumed the stricter schema
- scholarly ambiguity about whether a given difference in counts reflected interpretation, legacy naming, or data-shape mismatch

Because Stage 5 concordance and Stage 6 analysis are generated from Stage 4 JSON, schema drift in annotation files propagates outward into every aggregate claim.

## What was done

The repair strategy was canonical migration rather than schema relaxation.

### 1. Annotated files were migrated into the canonical Stage 4 shape

A reproducible migration script was added:

```bash
npm run migrate:annotations
```

That script rewrites legacy Stage 4 instances into the documented canonical structure while preserving interpretive content.

The migration normalized:

- top-level cluster and confidence fields into `cmt` and `meta`
- legacy span fields into `span_text`, `span_char_start`, and `span_char_end`
- missing instance-level document metadata from document metadata already present in the project
- legacy `fantasy_type` labels into the canonical eight-value taxonomy
- legacy absence flags into the canonical absence-flag vocabulary

It also preserves meaning by moving legacy prose into the proper note fields rather than deleting it.

### 2. The purification-absence finding was made explicit in the schema

The project treats Lincoln's lack of `disease_and_purification` logic as a central comparative finding. Before the repair, some annotations tracked this using an invalid absence-flag name.

The fix promoted that finding into a canonical absence flag:

- `disease_purification_absent`

This value was added to:

- schema documentation
- validation rules
- concordance absence indexes
- analysis absence summaries

This preserved the project's central structural claim while removing ambiguity between a fantasy type and an absence flag.

### 3. Validation and downstream pipeline were aligned

The validator was corrected so Stage 3 segmentation checks now match the actual filenames in `corpus/segmented/`.

Stage 5 and Stage 6 outputs were then regenerated from the repaired Stage 4 data:

```bash
npm run pipeline
```

### 4. Post-creation validation was added to the Stage 4 workflow

To reduce the chance of recurrence, a dedicated post-write validation helper was added:

```bash
npm run validate:annotation -- <doc_id>
```

This is now the required check immediately after creating `corpus/annotated/{doc_id}_annotated.json`.

If validation fails, the workflow now requires stopping and explicitly asking the user whether to:

- fix the schema errors now
- show the errors only
- leave the file as-is and stop

## Scope of the repair

The repair changed:

- all 20 existing annotated Stage 4 JSON files in `corpus/annotated/`
- generated Stage 5 output in `concordance/concordance.json`
- generated Stage 6 output in `analysis/analysis.json`
- documentation and workflow files related to validation and schema discipline

The repair did not change:

- segmented JSON source files
- corpus manifest metadata
- raw or Stage 2 text files
- the instance counter

## Verification

After migration and regeneration:

- all 105 annotated metaphor instances were in strict canonical shape
- no legacy fantasy-type labels remained in active Stage 4 data
- no legacy invalid absence flags remained in active Stage 4 data
- repository validation passed cleanly
- the full pipeline ran successfully

The key verification commands are:

```bash
npm run migrate:annotations
npm run validate
npm run pipeline
```

## Important implications going forward

Stage 4 annotation should now be treated as schema-strict infrastructure, not an informal intermediate artifact.

The practical rule is simple:

1. write or update `corpus/annotated/{doc_id}_annotated.json`
2. run `npm run validate:annotation -- <doc_id>` immediately
3. if validation fails, stop and resolve the next step with the user before proceeding

This event also clarified a broader project lesson: reproducibility in this repository depends as much on naming discipline and workflow enforcement as on the interpretive quality of the annotations themselves.
