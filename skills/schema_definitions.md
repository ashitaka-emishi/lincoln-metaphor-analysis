# Schema Definitions — All 6 Pipeline Stages

## ID Conventions

### Sentence ID
Format: `{doc_id}_s{NN}_p{NN}_s{NN}`

All ordinals zero-padded to 2 digits. Example: `doc_021_s03_p02_s04`
- `doc_021` — document ID
- `s03` — section 3
- `p02` — paragraph 2 within that section
- `s04` — sentence 4 within that paragraph

**IDs are permanent after Stage 3 is complete.** If a sentence is later split or merged during annotation, create a new ID and deprecate the old one with a note. Never renumber.

### Instance ID
Format: `inst_{NNNNN}` — five-digit zero-padded integer, sequential across the **entire corpus** (not per-document).

Maintained in a corpus-level counter. The first instance annotated in any document gets the next available number. This enables corpus-wide deduplication and cross-reference.

### Extension Group ID
Format: `ext_{NNN}` — three-digit zero-padded integer, corpus-wide sequential.

Assigned when an annotator identifies an extended metaphor spanning multiple sentences. All instances in the same extended deployment share the same `extension_group_id`. Example: the sustained birth/death/rebirth metaphor in Gettysburg (doc_017) would be one extension group across all relevant sentences.

---

## Stage 1: Raw Source

Directory: `corpus/raw/`
Filename: `{doc_id}_raw.txt` (or `.md`, `.html` depending on source)
No schema. Verbatim source text as found. Do not modify.

---

## Corpus Manifest

File: `corpus/corpus_manifest.json`

The corpus manifest is the canonical provenance source for the publication-facing corpus register.

Each document must include:

```json
{
  "id": "doc_021",
  "title": "Second Inaugural Address",
  "short_title": "Second Inaugural",
  "date": "1865-03-04",
  "date_precision": "exact",
  "period": "phase_5_theodicy",
  "genre": "inaugural_address",
  "register": "formal_public_address",
  "authorship": "lincoln_sole",
  "authorship_confidence": 0.99,
  "authorship_notes": null,
  "source_text": "Collected Works vol.8 pp.332-333",
  "source_edition": "Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.8 pp.332-333",
  "source_url": "https://quod.lib.umich.edu/l/lincoln/lincoln8/1:211",
  "editorial_status": "standard_collected_works_text",
  "inclusion_rationale": "All clusters present. Providence/theodicy at full development...",
  "known_limitations": ["No special provenance caution recorded."],
  "risk_flags": [],
  "analytical_priority": "critical",
  "word_count_approx": 700,
  "pipeline_stage_completed": 4,
  "notes": "All clusters present..."
}
```

Required controlled fields:

- `period`: one of `phase_1_baseline`, `phase_2_argument`, `phase_3_obligation`, `phase_4_transformation`, `phase_5_theodicy`
- `genre`: one of the values in `genre_enum`
- `register`: one of the values in `register_enum`
- `authorship`: one of the values in `authorship_enum`
- `known_limitations`: array of reviewer-facing cautions
- `risk_flags`: array of machine-readable caution flags

The generated publication register is written by `npm run corpus:register` to `data/metadata/corpus-register.csv`.

---

## Stage 2: Text with Frontmatter

Directory: `corpus/text/`
Filename: `{doc_id}.md`

```yaml
---
id: "doc_021"
title: "Second Inaugural Address"
short_title: "Second Inaugural"
date: "1865-03-04"
date_precision: "exact"           # exact | month | year | circa
register: "formal_public_address"
authorship: "lincoln_sole"        # lincoln_sole | lincoln_primary | collaborative
authorship_confidence: 0.99
authorship_notes: null
source_text: "Collected Works vol.8 p.332"
source_url: "https://quod.lib.umich.edu/l/lincoln/"
risk_flags: []
analytical_priority: "critical"
pipeline_log: [{stage: 2, agent: "agent_name", date: "2026-04-28"}]
---
[document text follows, verbatim from source]
```

---

## Stage 3: Segmented JSON

Directory: `corpus/segmented/`
Filename: `{doc_id}_segmented.json`

```json
{
  "document_id": "doc_021",
  "meta": {
    "id": "doc_021",
    "title": "Second Inaugural Address",
    "short_title": "Second Inaugural",
    "date": "1865-03-04",
    "date_precision": "exact",
    "register": "formal_public_address",
    "authorship": "lincoln_sole",
    "authorship_confidence": 0.99,
    "authorship_notes": null,
    "source_text": "Collected Works vol.8 p.332",
    "source_url": "https://quod.lib.umich.edu/l/lincoln/",
    "risk_flags": [],
    "analytical_priority": "critical"
  },
  "sections": [
    {
      "section_id": "doc_021_s01",
      "section_label": "opening",
      "section_ordinal": 1,
      "paragraphs": [
        {
          "paragraph_id": "doc_021_s01_p01",
          "paragraph_ordinal": 1,
          "sentences": [
            {
              "sentence_id": "doc_021_s01_p01_s01",
              "sentence_ordinal": 1,
              "text": "At this second appearing to take the oath of the presidential office, there is less occasion for an extended address than there was at the first.",
              "word_offset_start": 0,
              "word_offset_end": 31,
              "authorship_note": null,
              "metaphor_instances": []
            }
          ]
        }
      ]
    }
  ],
  "pipeline_log": [
    {"stage": 3, "agent": "lincoln_corpus_reader", "date": "2026-04-28", "notes": null}
  ]
}
```

### Field specifications — Stage 3

- `section_label`: Free text. Common values: `opening`, `argument`, `refutation`, `peroration`, `closing`. Use document structure.
- `word_offset_start/end`: Approximate word positions within the section (not the full document). Used for text retrieval; does not need to be exact.
- `authorship_note`: For doc_009 (Seward passages), set to `"seward_revised"`. For debate documents, set `"lincoln_turn"` or `"douglas_turn"` on each sentence.
- `metaphor_instances`: Empty array at Stage 3. Populated at Stage 4.

---

## Stage 4: Annotated JSON

Directory: `corpus/annotated/`
Filename: `{doc_id}_annotated.json`

Same structure as Stage 3, with `metaphor_instances` arrays populated. Each element of `metaphor_instances` is a full instance object:

```json
{
  "instance_id": "inst_00847",
  "sentence_id": "doc_021_s03_p02_s04",
  "document_id": "doc_021",
  "document_date": "1865-03-04",
  "document_register": "formal_public_address",
  "authorship_confidence": 0.99,
  "span_text": "binding up the nation's wounds",
  "span_char_start": 14,
  "span_char_end": 44,
  "cmt": {
    "cluster_id": "cluster_01_body_organism",
    "source_domain": "wound_healing",
    "target_domain": "national_reunification",
    "linguistic_form": "verbal_phrase",
    "entailments": [
      "the_nation_has_a_body",
      "division_caused_physical_damage",
      "reunification_is_medical_care",
      "the_speaker_is_physician",
      "damage_is_reparable"
    ],
    "is_novel_metaphor": false,
    "is_extended_metaphor": true,
    "extension_group_id": "ext_012",
    "co_activated_clusters": [],
    "annotation_notes": "Physician role matters for Reconstruction policy framing."
  },
  "koenigsberg": {
    "fantasy_type": "wound_and_healing",
    "violence_logic": "restorative",
    "obligatory_frame": true,
    "obligatory_frame_notes": "Wound exists independently of Lincoln's choice — healing is medical necessity.",
    "agent_of_violence": "the_wound",
    "agent_is_abstract": true,
    "object_of_violence": "the_national_body",
    "projected_entity": "national_body",
    "guilt_distribution": "distributed",
    "guilt_distribution_notes": "Second Inaugural distributes guilt across both sides.",
    "sacrificial_economy": false,
    "sacrificial_yield": null,
    "psychic_defense": "reparation",
    "psychic_defense_notes": "Guilt converted into restorative action.",
    "absence_flags": ["enslaved_people_non_agent", "death_abstracted"],
    "absence_notes": "Formerly enslaved people are absent as agents of the healing they most needed."
  },
  "meta": {
    "annotator": "lincoln_corpus_reader",
    "confidence": 0.92,
    "ambiguity_flag": false,
    "ambiguity_notes": null,
    "irony_flag": false,
    "suppression_flag": false,
    "suppression_notes": null
  }
}
```

### Field enums — Stage 4

Canonical script-level source: `scripts/schema_constants.js`. This section is the human-readable schema mirror. Any change to `cluster_id`, `fantasy_type`, or `absence_flags` values must update `scripts/schema_constants.js` first, then propagate through validators, migration logic, downstream generated-output scripts, and this document in the same change. The `disease_purification_absent` absence flag must remain canonical so the central negative finding is validated and indexed.

**cluster_id**: `cluster_01_body_organism` | `cluster_02_covenant_oath` | `cluster_03_experiment_proposition` | `cluster_04_birth_creation` | `cluster_05_fathers_inheritance` | `cluster_06_providence_theodicy`

**linguistic_form**: `verbal_phrase` | `nominal_phrase` | `adjectival` | `clause` | `sentence` | `multi_sentence`

**fantasy_type**: `wound_and_healing` | `birth_and_creation` | `sacrifice_and_redemption` | `oath_and_obligation` | `punishment_and_theodicy` | `ancestral_debt` | `experiment_and_proof` | `disease_and_purification`

**violence_logic**: `restorative` | `generative` | `punitive` | `purifying` | `evidentiary` | `obligatory`

**projected_entity**: `national_body` | `founding_proposition` | `covenant_bond` | `ancestral_lineage` | `divine_instrument`

**guilt_distribution**: `external` | `internal` | `distributed` | `cosmic` | `absent`

**psychic_defense**: `splitting` | `projection` | `manic_defense` | `reparation` | `idealization` | `displacement` | `null`

**absence_flags** (array): `enslaved_people_non_agent` | `black_soldiers_erased` | `lincoln_non_agent` | `confederates_depersonalized` | `death_abstracted` | `women_absent` | `disease_purification_absent`

---

## Stage 4A: Evidence Chain JSON

File: `data/evidence/annotation-evidence.json`

Stage 4A is a generated derivative layer. It preserves Stage 4 annotated JSON as the source of record and normalizes each metaphor instance into a claim-to-source audit record.

Generate with:

```bash
npm run evidence:chains
```

Top-level shape:

```json
{
  "version": "1.0",
  "generated": "ISO date string",
  "status": "complete",
  "source_stage": "stage4_legacy_annotations",
  "migration_policy": "preserve_stage4_generate_derivative",
  "total_records": 136,
  "records": [],
  "indexes": {
    "by_document": {},
    "by_sentence": {},
    "by_cluster": {},
    "by_fantasy_type": {},
    "by_absence_flag": {},
    "high_confidence": [],
    "ambiguous": [],
    "suppression": []
  },
  "pipeline_log": []
}
```

Record shape:

```json
{
  "audit_id": "inst_00078",
  "migration_status": "derived_from_stage4_legacy_annotation",
  "source_stage": "stage4_annotated_json",
  "source_file": "corpus/annotated/doc_001_annotated.json",
  "document": {
    "id": "doc_001",
    "title": "Address Before the Young Men's Lyceum of Springfield, Illinois",
    "short_title": "Lyceum Address",
    "date": "1838-01-27",
    "period": "phase_1_baseline",
    "genre": "lyceum_address",
    "register": "formal_public_address",
    "authorship": "lincoln_sole",
    "authorship_confidence": 0.98,
    "source_edition": "Collected Works of Abraham Lincoln, University of Michigan digital edition; Collected Works vol.1 pp.108-115",
    "source_url": "https://quod.lib.umich.edu/l/lincoln/lincoln1/1:144",
    "editorial_status": "standard_collected_works_text",
    "risk_flags": []
  },
  "location": {
    "section_id": "doc_001_s01",
    "paragraph_id": "doc_001_s01_p02",
    "sentence_id": "doc_001_s01_p02_s03",
    "sentence_text": "We, when mounting the stage of existence...",
    "span_text": "the legal inheritors of these fundamental blessings",
    "span_char_start": 58,
    "span_char_end": 108
  },
  "lexical_unit": {
    "text": "the legal inheritors of these fundamental blessings",
    "mipvu_decision": "metaphor_related",
    "mipvu_decision_source": "inferred_from_existing_stage4_metaphor_instance",
    "contextual_meaning": "political institutions as inherited possession",
    "basic_meaning": "legal inheritance of property or rights",
    "contrast": true,
    "comparison": true,
    "historical_semantics_note": null,
    "migration_note": "Existing Stage 4 annotations did not separate MIPVU lexical-unit fields..."
  },
  "cmt": {},
  "koenigsberg": {},
  "agency_absence": {},
  "confidence": {},
  "claim_anchor": {
    "document_id": "doc_001",
    "sentence_id": "doc_001_s01_p02_s03",
    "instance_id": "inst_00078",
    "cluster_id": "cluster_05_fathers_inheritance",
    "span_text": "the legal inheritors of these fundamental blessings",
    "source_url": "https://quod.lib.umich.edu/l/lincoln/lincoln1/1:144"
  }
}
```

Migration rule:

- `audit_id` equals the original Stage 4 `instance_id`.
- `lexical_unit.text` derives from `span_text`.
- `mipvu_decision` is `metaphor_related` for every existing Stage 4 instance.
- `contextual_meaning` derives from `cmt.target_domain`.
- `basic_meaning` derives from `cmt.source_domain`.
- `contrast` and `comparison` are `true` because Stage 4 only contains accepted metaphor instances.
- Original Stage 4 files are not overwritten.

---

## Stage 4B: Reliability Sample and Adjudication Artifacts

Stage 4B is a generated reliability layer. It does not overwrite Stage 4 or Stage 4A.

Generate with:

```bash
npm run reliability:sample
```

Files:

- `data/reliability/reliability-sample.json`
- `data/reliability/double-coding-template.csv`
- `data/reliability/adjudication-log.csv`

Top-level JSON shape:

```json
{
  "version": "1.0",
  "generated": "ISO date string",
  "status": "sample_defined_adjudication_pending",
  "source_stage": "stage4a_annotation_evidence",
  "sample_policy": {
    "unit": "document_stratified_reliability_sample",
    "corpus_documents_total": 28,
    "sample_documents_total": 5,
    "sample_percentage": 17.86,
    "allowed_percentage_range": [10, 20],
    "selection_method": "purposive stratified sample..."
  },
  "double_coding_policy": {},
  "agreement_measures": {},
  "disagreement_categories": [],
  "documents": [],
  "identification_units": [],
  "field_agreement_units": [],
  "totals": {},
  "pipeline_log": []
}
```

Required reliability rules:

- The sample must stay within 10-20 percent of corpus documents unless the research design is revised.
- `identification_units` test MIPVU lexical-unit identification and boundary decisions.
- `field_agreement_units` test agreement on CMT, Koenigsberg, absence, ambiguity, and confidence fields for known spans.
- `double-coding-template.csv` must not expose reference values to coders.
- `adjudication-log.csv` records disagreements with field name, coder values, category, adjudicated value, rationale, adjudicator, date, and follow-up issue when needed.
- Identification reliability and interpretive agreement must be reported separately.

---

## Stage 5: Concordance JSON

File: `data/concordance.json`

See `concordance.json` for the full stub. Key shape:

```json
{
  "version": "1.0",
  "generated": "ISO date string",
  "corpus_version": "1.0",
  "status": "stub | complete",
  "total_documents": 0,
  "total_sentences": 0,
  "total_instances": 0,
  "instances": [],
  "indexes": {
    "by_cluster": { "cluster_01_body_organism": [], ... },
    "by_document": {},
    "by_register": {},
    "by_fantasy_type": {},
    "by_violence_logic": {},
      "by_absence_flag": {
        "enslaved_people_non_agent": [],
        "black_soldiers_erased": [],
        "lincoln_non_agent": [],
        "death_abstracted": [],
        "confederates_depersonalized": [],
        "women_absent": [],
        "disease_purification_absent": []
      },
    "high_confidence_only": [],
    "suppression_instances": []
  },
  "pipeline_log": []
}
```

---

## Stage 6: Analysis JSON

File: `analysis/analysis.json`

See `analysis.json` for the full stub. Key shape: six `cluster_analyses` entries, `systematic_absence` block, `cross_cluster` block, `koenigsberg_master_comparison` block. All computed fields null at stub stage; manually-written fields (analyst_notes, political_moral_work, what_metaphor_conceals, hitler_comparison fields) preserved through updates.

---

## Stage 6A: Controlled Analysis JSON

File: `analysis/controlled-analysis.json`

Stage 6A is a generated publication-control layer. Generate with:

```bash
npm run analysis:controlled
```

Top-level shape:

```json
{
  "version": "1.0",
  "generated": "ISO date string",
  "status": "complete",
  "source": "data/evidence/annotation-evidence.json",
  "confidence_threshold": {
    "field": "document.authorship_confidence",
    "operator": ">=",
    "value": 0.95
  },
  "subsets": [
    {
      "name": "full_corpus",
      "total_instances": 136,
      "total_documents": 27,
      "cluster_totals": {},
      "absence_totals": {},
      "cluster_by_register": [],
      "cluster_by_period": [],
      "cluster_by_document": [],
      "absence_by_register": [],
      "absence_by_period": [],
      "absence_by_document": []
    },
    {
      "name": "high_authorship_confidence_0_95"
    }
  ],
  "interpretation_rule": "Raw counts are descriptive; publication claims must be checked against register distribution and the high-authorship-confidence subset."
}
```

The paired public page is generated at `analysis/controlled_outputs.md`.

Required rules:

- The high-confidence subset is based on document authorship confidence, not annotation confidence.
- Register, period, and authorship-confidence controls must use the canonical manifest values carried through Stage 4A evidence records.
- Raw frequency claims should not be treated as publication-stable unless the controlled outputs preserve the pattern or the prose names the limitation.

---

## Stage 8: Claim Audit JSON

File: `data/audit/claim-audit.json`

Generate with:

```bash
npm run audit:claims
```

Top-level shape:

```json
{
  "version": "1.0",
  "generated": "ISO date string",
  "status": "complete",
  "source": "data/evidence/annotation-evidence.json",
  "controlled_source": "analysis/controlled-analysis.json",
  "total_claims": 6,
  "claims": [
    {
      "claim_id": "CLAIM-001",
      "title": "Short claim title",
      "statement": "Publication-level claim",
      "audit_chain_format": "claim -> cluster -> CMT mapping -> lexical unit -> MIPVU decision -> instance ID -> sentence ID -> document metadata -> source text",
      "evidence_universe": {
        "matching_record_count": 0,
        "matching_audit_ids": [],
        "by_cluster": {},
        "by_document": {},
        "by_register": {},
        "by_period": {},
        "absence_flags": {}
      },
      "selected_records": [],
      "controlled_reference": {}
    }
  ]
}
```

The public page is generated at `synthesis/claim_audit.md`.

Required rules:

- Every `selected_records[].audit_id` must exist in Stage 4A.
- Every selected record must include cluster, CMT mapping, lexical unit, sentence ID, document metadata, source URL, Koenigsberg fields, absence flags, and confidence.
- Public synthesis pages should cite `claim_id` handles for major claims.

---

## Stage 4M: Model Reliability Output

File: `schemas/stage4m-model-output.schema.json`

Stage 4M submissions use one canonical JSON contract for a single model run. Required run-level provenance includes `run_id`, model/provider identifiers, `run_date`, `operator`, the input packet ID and SHA-256 hash, the prompt SHA-256 hash, nullable `temperature`, and `notes`. The required `items` array contains sentence-identification or field-agreement judgments.

Controlled item labels are canonical and closed:

- `task_type`: `sentence_identification` or `field_agreement`
- `metaphor_present`: `yes`, `no`, or `uncertain`
- `cluster_id`: one of the six canonical cluster IDs or `null`
- `koenigsberg_function`: one of the eight canonical fantasy types or `null`
- `violence_logic`: a canonical violence-logic label or `null`
- `agency_or_absence_flag`: one canonical absence flag or `null`
- `confidence`: `high`, `medium`, or `low`
- `ambiguity_flag`: `yes` or `no`

Nullable analytical fields preserve uncertainty without inventing a label. `rival_reading` records a plausible alternative, while non-empty `justification` records the reason for the submitted judgment.

CSV uses the schema's `x-stage4m-csv` mapping. Run metadata is repeated identically on every row; each row becomes one JSON `items` entry; empty nullable cells become JSON `null`; numeric fields are parsed before schema validation. CSV and JSON therefore normalize to the same canonical object rather than creating separate analytical contracts.

Ingestion writes `data/reliability/model-comparison/normalized-model-runs.json` and paired JSON/Markdown validation reports. A normalized run preserves source filename, source format, source SHA-256, all run metadata, and every accepted item; each item also receives its mapped `packet_unit_id`. Invalid runs contribute no normalized items, but every source record remains counted in the validation report. With no submissions, all three artifacts use `no_submissions` status and validation emits a warning rather than failing.

Layered agreement writes `model-agreement-results.json`, `model-agreement-summary.csv`, and `model-agreement-results.md` under `data/reliability/model-comparison/`. The JSON preserves explicit denominators for model-vs-Stage 4A and model-vs-model comparisons, identification confusion and negative-control performance, lexical-boundary outcomes, focal Koenigsberg and agency/absence categories, agreement-pattern counts, and stable/unstable/insufficient-evidence classifications. Stage 4A coder-A values remain the primary reference; Stage 4B adjudications are context only. With no validated runs, rates are `null`, never fabricated zeros.

Disagreement classification writes `model-disagreement-log.json`, `model-disagreement-log.csv`, and `model-instability-report.md`. Every packet item receives an agreement pattern, and every divergent field receives one canonical disagreement category. The log separately records all-model reference challenges, CMT agreement paired with Koenigsberg disagreement, sacrifice/providence/purification over-reads, aggregate unstable-category flags, and mandatory human review. Agency/absence disagreements always require human review. `historical_context_error` and `schema_noncompliance` remain reserved manual categories because validated normalized runs do not contain enough evidence to infer them safely.
