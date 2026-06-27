# Stage 4H Blind Human Coding Packet

Packet ID: `stage4h_464cb792dc71a0db`

This is a blind two-human inter-annotator reliability study. You are one of two independent coders applying the project's annotation scheme to Lincoln passages. Your work must be completed independently of the other coder.

Read the [Human Coder Training Guide](../../../docs/methodology/human-coder-training-guide.md) completely before beginning. If you have not completed the calibration packet and reviewed the answer key with your coordinator, stop and do that first.

## Blindness Rules

Before and during coding, do not consult:

- Stage 4A annotation files, evidence chains, or any project annotation outputs.
- Stage 4B or Stage 4M reliability results, comparison outputs, or adjudication records.
- Synthesis pages, claim-audit materials, or any document that states the project's conclusions.
- The other coder's worksheet.
- Any draft or published version of the project's final conclusions.

## Return Format

Return your completed `human-coder-template.csv`. Fill in `coder_id` on every row using the identifier your coordinator assigned you (`human_coder_a` or `human_coder_b`). Preserve `packet_unit_id`, `task_type`, `doc_id`, `sentence_id`, and pre-filled span values exactly.

Character offsets (`span_char_start`, `span_char_end`) are zero-based and end-exclusive relative to `sentence_text`.

## Sentence-Identification Tasks (55)

For each row in `human-sentence-identification-packet.jsonl`:

1. Read the sentence and its paragraph context.
2. Decide whether the sentence contains a metaphor-related lexical unit using the MIPVU procedure in the training guide.
3. If yes: record `mipvu_decision` as `metaphor_related`, enter the span in `span_text`, and record character start/end positions. Add one row per additional unit if the sentence contains more than one.
4. If no: record `mipvu_decision` as `not_metaphor_related` and leave all other fields blank.
5. If uncertain: record `mipvu_decision` as `uncertain`, set `ambiguity_flag` to `true`, and explain in `ambiguity_notes`.

## Field-Agreement Tasks (51)

For each row in `human-field-agreement-packet.jsonl`, the span has been identified for you in `span_text`. Code it across all fields. If you believe the span is not metaphor-related, record `mipvu_decision` as `not_metaphor_related`, leave downstream fields blank, and explain in `coder_notes`.

## Controlled Values

`mipvu_decision`:
  - `metaphor_related`
  - `not_metaphor_related`
  - `uncertain`

`cluster_id`:
  - `cluster_01_body_organism`
  - `cluster_02_covenant_oath`
  - `cluster_03_experiment_proposition`
  - `cluster_04_birth_creation`
  - `cluster_05_fathers_inheritance`
  - `cluster_06_providence_theodicy`

`fantasy_type`:
  - `wound_and_healing`
  - `birth_and_creation`
  - `sacrifice_and_redemption`
  - `oath_and_obligation`
  - `punishment_and_theodicy`
  - `ancestral_debt`
  - `experiment_and_proof`
  - `disease_and_purification`

`violence_logic` (one or more, pipe-separated):
  - `restorative`
  - `generative`
  - `punitive`
  - `purifying`
  - `evidentiary`
  - `obligatory`

`absence_flags` (one or more, pipe-separated):
  - `enslaved_people_non_agent`
  - `black_soldiers_erased`
  - `lincoln_non_agent`
  - `confederates_depersonalized`
  - `death_abstracted`
  - `women_absent`
  - `disease_purification_absent`

`obligatory_frame`: `true` or `false`

`ambiguity_flag`: `true` or `false`

`confidence_score`: decimal between 0.50 and 1.00 (do not annotate below 0.50)

Use `rival_reading` to describe an alternative you considered but rejected. Use `coder_notes` for any other observations. Pipe-separate multiple values in `entailments`, `absence_flags`, and `violence_logic`.
