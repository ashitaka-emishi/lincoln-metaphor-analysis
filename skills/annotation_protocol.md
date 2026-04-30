# Annotation Protocol — Stage 3 and Stage 4 Workflow

## Core Rule: Segment First, Annotate Second

Never combine Stage 3 (segmentation) and Stage 4 (annotation) in a single pass. Complete and validate all segmented JSONs for a document before beginning annotation. This preserves ID stability — sentence IDs assigned in Stage 3 are permanent.

---

## What Counts as a Metaphor Instance

### Include
- Any sentence where a concrete source domain is mapped onto an abstract political/historical target domain
- Conventional metaphors whose entailments remain politically active (e.g., "body politic," "founding fathers")
- Extended metaphor continuations — even sentences that do not themselves introduce the mapping but develop it
- Implicit mappings where the metaphor is activated by a single word (e.g., "wound" with clear political referent)

### Exclude
- Purely literal uses of biological, familial, or contractual language (e.g., Lincoln describing his physical health)
- Dead metaphors with no traceable entailment activity in context (e.g., "the leg of the argument" as pure idiom)
- Rhetorical questions and counterfactuals that negate rather than activate a mapping
- Quotations of other speakers within debate transcripts (tag as `douglas_turn` and exclude from metaphor annotation)

### When in doubt: include, set `ambiguity_flag: true`, score confidence ≤ 0.70

---

## Confidence Scoring Procedure

1. Start from the base table in `cmt_analysis.md`
2. Apply register adjustment from `corpus_register.md`:
   - `formal_public_address`: +0.05
   - `fragment_private`: +0.05
   - `campaign_speech`: −0.05
   - `congressional_message`: −0.05
   - `legal_document`: −0.10
3. Apply authorship adjustment:
   - `authorship_confidence` ≥ 0.95: no adjustment
   - 0.85–0.94: −0.05
   - < 0.85: −0.10
4. Apply transcription adjustment if `transcription_variants` or `transcription_noise` is in risk_flags: −0.05
5. Floor: 0.50. Anything below 0.50 should be excluded.

---

## Special Document Protocols

### doc_009 — First Inaugural (Seward passages)
The closing paragraphs ("mystic chords of memory") were drafted by Seward and substantially revised by Lincoln. Protocol:
1. Identify Seward-origin sentences using editorial apparatus from Collected Works vol.4.
2. Set `authorship_note: "seward_revised"` on those sentences in the segmented JSON.
3. Annotate the full document normally.
4. In the document-level summary, run statistics twice: full document and Lincoln-sole sentences only.
5. Flag any metaphor in a Seward passage with `annotator: "lincoln_corpus_reader"` and note in annotation_notes that authorship is uncertain.

### doc_006a through doc_006g — Lincoln-Douglas Debates
Transcriptions from two newspaper sources (Chicago Press & Tribune for Lincoln; Chicago Times for Douglas) with known discrepancies.
1. Segment Lincoln's speaking turns only. Set `authorship_note: "lincoln_turn"` on all Lincoln sentences.
2. Mark Douglas turns with `authorship_note: "douglas_turn"` and set `metaphor_instances: []` — no annotation.
3. For each Lincoln turn, add `responsive_to_douglas: true/false` in annotation_notes if the metaphor is a direct response to a Douglas argument.
4. Apply −0.05 transcription adjustment to all Lincoln turns.
5. Where two newspaper versions differ significantly, note the variant in `annotation_notes` and score the lower confidence.

### doc_013, doc_015 — Legal Documents (Emancipation Proclamations)
Legal register produces deliberately flat language. Protocol:
1. Annotate normally — do not artificially inflate or deflate findings.
2. The *absence* of metaphor is the primary finding. Record in the document-level summary: `metaphor_density: low`, `primary_finding: "flatness"`.
3. Any metaphor present in legal register is analytically significant precisely because it survived the drafting process. Flag with annotation_notes explaining its presence.
4. Do not apply the −0.10 register adjustment as a reason to exclude borderline instances — apply it to confidence scoring only.

### doc_017 — Gettysburg Address
Use the Bliss copy as the authoritative text. If you have access to other copies (Bancroft, Everett, etc.), note variants in annotation_notes for significant metaphor spans.

The entire address is an extended metaphor. Assign a single `extension_group_id` to the primary birth/death/rebirth arc. There are subsidiary extensions within (the oath/dedication sequence, the proposition/proof sequence). Assign separate extension_group_ids to subsidiary arcs.

### doc_018 — Blind Memorandum
Extremely short (one paragraph). The entire document is analytically significant as a test of whether public providence rhetoric reflects private cognition. Annotate every sentence. High confidence adjustment applies (fragment_private, high authorship_confidence).

---

## Document-Level Summary Object

Each annotated JSON should include a `document_summary` field at the top level:

```json
{
  "document_id": "doc_021",
  "document_summary": {
    "total_sentences": 47,
    "annotated_sentences": 42,
    "total_instances": 23,
    "high_confidence_instances": 19,
    "suppression_instances": 0,
    "cluster_distribution": {
      "cluster_01_body_organism": 4,
      "cluster_02_covenant_oath": 3,
      "cluster_03_experiment_proposition": 1,
      "cluster_04_birth_creation": 2,
      "cluster_05_fathers_inheritance": 5,
      "cluster_06_providence_theodicy": 8
    },
    "dominant_fantasy_type": "punishment_and_theodicy",
    "dominant_violence_logic": "obligatory",
    "obligatory_frame_rate": 0.78,
    "sacrificial_economy_rate": 0.35,
    "absence_flag_counts": {
      "enslaved_people_non_agent": 5,
      "black_soldiers_erased": 2,
      "lincoln_non_agent": 6,
      "confederates_depersonalized": 3,
      "death_abstracted": 4,
      "women_absent": 1
    },
    "primary_finding": null,
    "annotator_notes": null,
    "pipeline_log_entry": {"stage": 4, "agent": "lincoln_corpus_reader", "date": "2026-04-28"}
  }
}
```

---

## Quality Checklist Before Submitting Each Document

Run through this checklist before finalizing any annotated JSON:

- [ ] All sentence IDs match Stage 3 segmented JSON exactly
- [ ] All instance_ids are sequential continuations of the corpus counter (no gaps, no repeats)
- [ ] Every instance has all three sub-objects: `cmt`, `koenigsberg`, `meta`
- [ ] `sacrificial_economy: false` → `sacrificial_yield: null` (validate script checks this)
- [ ] All `absence_flags` are arrays (even if empty: `[]`)
- [ ] `is_extended_metaphor: true` → `extension_group_id` is set (not null)
- [ ] All confidence scores in range [0.50, 1.00]
- [ ] Special document protocols applied (Seward tagging, Lincoln-only debate turns, legal flatness noted)
- [ ] Document-level summary computed and included
- [ ] pipeline_log entry appended with stage, agent, date
- [ ] Immediately after writing `corpus/annotated/{doc_id}_annotated.json`, run `node scripts/validate_annotation_output.js {doc_id}`
- [ ] If validation fails, stop and ask the user whether to fix the schema errors now, show the errors only, or leave the file as-is and stop
- [ ] Confirm zero validation errors before submitting

---

## Instance ID Tracking

The corpus-wide instance counter must be maintained in a tracking file. After each annotation session, record the highest `inst_NNNNN` used. The next session begins from `inst_{N+1}`.

Tracking file: `corpus/annotated/instance_counter.json`
```json
{ "last_instance_id": "inst_00000", "last_updated": "2026-04-28" }
```

This file is authoritative. Do not assign instance IDs without consulting it first.
