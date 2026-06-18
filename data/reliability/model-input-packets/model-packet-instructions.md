# Stage 4M Blind Model Review Instructions

Packet ID: `stage4m_b5372081183f7265`

This is an AI-assisted reliability stress test, not an invitation to revise the reference corpus. Work only from these instructions and the supplied packet files. Do not inspect repository annotations, evidence chains, reliability results, adjudication records, synthesis claims, or prior model submissions.

## Return Format

Return **only one completed structured template**: either `model-output-template.json` or `model-output-template.csv`. Do not add prose before or after the structured data. Preserve `packet_id`, `packet_unit_id`, `response_id`, `packet_type`, `document_id`, and `sentence_id` exactly.

Set `reviewer_id` to a stable identifier for this review run. In JSON, set both `reviewer.reviewer_id` and each response's `reviewer_id`; in CSV, set `reviewer_id` on every row. In CSV, encode `entailments` and `absence_flags` as JSON arrays. In JSON, keep them as arrays.

Character offsets are zero-based and end-exclusive relative to `sentence_text`.

## Sentence-Identification Tasks (55)

For every row in `model-packet-sentences.jsonl`, independently identify metaphor-related lexical units using MIPVU:

1. Compare the lexical unit's contextual meaning with a more basic meaning.
2. Decide whether the contextual meaning can be understood by comparison with that basic meaning.
3. Use the narrowest span that activates the mapping.
4. If the sentence has multiple metaphor-related units, duplicate the template response, retain the same `packet_unit_id`, and increment the suffix of `response_id` (`_r02`, `_r03`, and so on).
5. If no unit qualifies, retain one response with `mipvu_decision` set to `not_metaphor_related` and leave mapping fields blank.

Do not infer whether a sentence was selected as a positive example or control. That information is intentionally absent.

## Field-Agreement Tasks (51)

For every row in `model-packet-field-agreement.jsonl`, code the supplied `provided_span_text` independently. Copy it unchanged into `candidate_lexical_unit`, then complete the MIPVU, CMT, Koenigsberg, absence, confidence, and ambiguity fields. Do not add a second span unless the supplied span itself contains separable lexical units that require distinct judgments; explain that split in `reviewer_notes`.

## Controlled Values

`mipvu_decision`:
  - `metaphor_related`
  - `not_metaphor_related`
  - `uncertain`

`cluster_id` (leave blank when not metaphor-related):
  - `cluster_01_body_organism`
  - `cluster_02_covenant_oath`
  - `cluster_03_experiment_proposition`
  - `cluster_04_birth_creation`
  - `cluster_05_fathers_inheritance`
  - `cluster_06_providence_theodicy`

`fantasy_type` (leave blank when not metaphor-related):
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

`absence_flags`:
  - `enslaved_people_non_agent`
  - `black_soldiers_erased`
  - `lincoln_non_agent`
  - `confederates_depersonalized`
  - `death_abstracted`
  - `women_absent`
  - `disease_purification_absent`

`obligatory_frame` and `ambiguity_flag` must be `true` or `false` when applicable. `confidence_score` must be a number from 0 to 1. Describe passage-specific source and target domains rather than copying cluster labels. Record concise entailments as an array.

## Blindness and Independence

- Do not search for the sentence or span in project outputs.
- Do not guess the reference answer or optimize for agreement with another reviewer.
- Do not treat model consensus as authority.
- Use `historical_semantics_note` and `reviewer_notes` for genuine uncertainty rather than forcing a confident label.
