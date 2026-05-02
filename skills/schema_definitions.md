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

**cluster_id**: `cluster_01_body_organism` | `cluster_02_covenant_oath` | `cluster_03_experiment_proposition` | `cluster_04_birth_creation` | `cluster_05_fathers_inheritance` | `cluster_06_providence_theodicy`

**linguistic_form**: `verbal_phrase` | `nominal_phrase` | `adjectival` | `clause` | `sentence` | `multi_sentence`

**fantasy_type**: `wound_and_healing` | `birth_and_creation` | `sacrifice_and_redemption` | `oath_and_obligation` | `punishment_and_theodicy` | `ancestral_debt` | `experiment_and_proof` | `disease_and_purification`

**violence_logic**: `restorative` | `generative` | `punitive` | `purifying` | `evidentiary` | `obligatory`

**projected_entity**: `national_body` | `founding_proposition` | `covenant_bond` | `ancestral_lineage` | `divine_instrument`

**guilt_distribution**: `external` | `internal` | `distributed` | `cosmic` | `absent`

**psychic_defense**: `splitting` | `projection` | `manic_defense` | `reparation` | `idealization` | `displacement` | `null`

**absence_flags** (array): `enslaved_people_non_agent` | `black_soldiers_erased` | `lincoln_non_agent` | `confederates_depersonalized` | `death_abstracted` | `women_absent` | `disease_purification_absent`

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
