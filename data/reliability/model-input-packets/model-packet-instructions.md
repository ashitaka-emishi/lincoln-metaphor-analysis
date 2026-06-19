# Stage 4M Blind Model Review Instructions

Packet ID: `stage4m_f7ed246824bbe524`

This is an AI-assisted reliability stress test, not an invitation to revise the reference corpus. Work only from these instructions and the supplied packet files. Do not inspect repository annotations, evidence chains, reliability results, adjudication records, synthesis claims, or prior model submissions.

## Return Format

Return **only one completed structured template**: either `model-output-template.json` or `model-output-template.csv`. Do not add prose before or after the structured data. Preserve `input_packet_id`, `task_type`, `doc_id`, `sentence_id`, and seeded `span_id` values exactly.

Complete every run-level provenance field. In CSV, repeat the same provenance values on every row; empty nullable cells normalize to JSON `null`. The canonical contract is `schemas/stage4m-model-output.schema.json`.

Character offsets are zero-based and end-exclusive relative to `sentence_text`.

## Sentence-Identification Tasks (55)

For every row in `model-packet-sentences.jsonl`, independently identify metaphor-related lexical units using MIPVU:

1. Compare the lexical unit's contextual meaning with a more basic meaning.
2. Decide whether the contextual meaning can be understood by comparison with that basic meaning.
3. Use the narrowest span that activates the mapping.
4. If the sentence has multiple metaphor-related units, duplicate the item and give each identified span a unique `span_id` derived from the seeded value (for example, suffixes `_r01`, `_r02`).
5. If no unit qualifies, retain one item with `metaphor_present` set to `no` and leave nullable mapping fields null or blank.

Do not infer whether a sentence was selected as a positive example or control. That information is intentionally absent.

## Field-Agreement Tasks (51)

For every row in `model-packet-field-agreement.jsonl`, code the supplied `provided_span_text` independently. Keep it unchanged in `lexical_unit`, then complete the MIPVU, CMT, Koenigsberg, agency/absence, confidence, ambiguity, rival-reading, and justification fields.

## Controlled Values

`metaphor_present`:
  - `yes`
  - `no`
  - `uncertain`

`cluster_id` (leave blank when not metaphor-related):
  - `cluster_01_body_organism`
  - `cluster_02_covenant_oath`
  - `cluster_03_experiment_proposition`
  - `cluster_04_birth_creation`
  - `cluster_05_fathers_inheritance`
  - `cluster_06_providence_theodicy`

`koenigsberg_function` (leave null or blank when not metaphor-related):
  - `wound_and_healing`
  - `birth_and_creation`
  - `sacrifice_and_redemption`
  - `oath_and_obligation`
  - `punishment_and_theodicy`
  - `ancestral_debt`
  - `experiment_and_proof`
  - `disease_and_purification`

`violence_logic`:
  - `restorative`
  - `generative`
  - `punitive`
  - `purifying`
  - `evidentiary`
  - `obligatory`

`agency_or_absence_flag`:
  - `enslaved_people_non_agent`
  - `black_soldiers_erased`
  - `lincoln_non_agent`
  - `confederates_depersonalized`
  - `death_abstracted`
  - `women_absent`
  - `disease_purification_absent`

`confidence` must be `high`, `medium`, or `low`. `ambiguity_flag` must be `yes` or `no`. Describe passage-specific source and target domains rather than copying cluster labels. Use `rival_reading` and `justification` to preserve genuine uncertainty rather than forcing false precision.

## Blindness and Independence

- Do not search for the sentence or span in project outputs.
- Do not guess the reference answer or optimize for agreement with another reviewer.
- Do not treat model consensus as authority.
- Use `historical_semantics_note` and `reviewer_notes` for genuine uncertainty rather than forcing a confident label.
