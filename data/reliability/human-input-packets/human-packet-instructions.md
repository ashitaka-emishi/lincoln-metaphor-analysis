# Stage 4H Blind Human Coding Packet

Packet ID: `stage4h_dac4a065fdfff159`

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

Return your completed `human-coder-template.csv`. Fill in the submission metadata columns on every row using the identifier your coordinator assigned you (`human_coder_a` or `human_coder_b`). Preserve `packet_unit_id`, `task_type`, `doc_id`, `sentence_id`, `input_packet_id`, `input_packet_hash`, and pre-filled field-agreement span values exactly.

Character offsets (`lexical_unit_start`, `lexical_unit_end`) are zero-based and end-exclusive relative to the sentence text in the JSONL packet.

## Sentence-Identification Tasks (55)

For each row in `human-sentence-identification-packet.jsonl`:

1. Read the sentence and its paragraph context.
2. Decide whether the sentence contains a metaphor-related lexical unit using the MIPVU procedure in the training guide.
3. If yes: record `metaphor_present` as `yes`, enter the span in `lexical_unit`, and record character start/end positions. Add one row per additional unit if the sentence contains more than one.
4. If no: record `metaphor_present` as `no`, set `semantic_contrast` to `no`, and use `null` or empty values for fields that do not apply.
5. If uncertain: record `metaphor_present` as `uncertain`, set `ambiguity_flag` to `yes`, and explain in `coder_comment`.

## Field-Agreement Tasks (51)

For each row in `human-field-agreement-packet.jsonl`, the span has been identified for you in `lexical_unit`. Code it across all fields. If you believe the span is not metaphor-related, record `metaphor_present` as `no`, use `null` or empty values for downstream fields that do not apply, and explain in `coder_comment`.

## Controlled Values

`metaphor_present`:
  - `yes`
  - `no`
  - `uncertain`

`cluster_id`:
  - `cluster_01_body_organism`
  - `cluster_02_covenant_oath`
  - `cluster_03_experiment_proposition`
  - `cluster_04_birth_creation`
  - `cluster_05_fathers_inheritance`
  - `cluster_06_providence_theodicy`

`koenigsberg_function`:
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

`absence_flag` (one flag per row):
  - `enslaved_people_non_agent`
  - `black_soldiers_erased`
  - `lincoln_non_agent`
  - `confederates_depersonalized`
  - `death_abstracted`
  - `women_absent`
  - `disease_purification_absent`

`obligatory_frame`: free text or `null` when not applicable

`semantic_contrast`: `yes`, `no`, or `uncertain`

`ambiguity_flag`: `yes` or `no`

`confidence`: `high`, `medium`, or `low`

Use `rival_reading` to describe an alternative you considered but rejected. Use `coder_comment` for any other observations. Pipe-separate multiple values in `violence_logic` when needed.
