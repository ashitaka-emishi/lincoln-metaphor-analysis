---
title: "Running External Stage 4M Model Reviews"
---

# Running External Stage 4M Model Reviews

This guide explains how to run a blind Stage 4M review manually in a hosted AI chat, local model interface, or other external system. No vendor API, API key, or paid automation is required.

Stage 4M is an **AI-assisted reliability stress test**. It asks multiple model systems to code the same blind packet so the project can identify stable fields, disagreements, and passages requiring human attention. It is not human inter-annotator reliability, and model agreement is not authority. A returned model judgment cannot revise Stage 4A annotations or Stage 4B reliability records.

## Before You Begin

Work from a clean checkout of the repository and generate the current packet:

```bash
npm run stage4m:packets
```

The generated materials are under `data/reliability/model-input-packets/`. Use a separate copy of the output template for each model run. Do not edit the committed template in place.

The current packet contains 55 sentence-identification tasks and 51 field-agreement tasks. A real run should answer all 106 seeded packet units. The short JSON and CSV examples later in this guide are valid format examples only; they are not complete submissions.

## Files to Send

Send the external AI system these four files:

1. `data/reliability/model-input-packets/model-packet-instructions.md`
2. `data/reliability/model-input-packets/model-packet-sentences.jsonl`
3. `data/reliability/model-input-packets/model-packet-field-agreement.jsonl`
4. Exactly one output template:
   - `data/reliability/model-input-packets/model-output-template.json`, or
   - `data/reliability/model-input-packets/model-output-template.csv`

Ask the system to follow `model-packet-instructions.md` and return only the completed template in its original format. Do not add substantive coding instructions, examples, hints, or expected answers. If the interface cannot accept all four attachments, paste the instruction file first, then the two packet files, then the selected template without adding interpretive guidance between them.

The JSON and CSV routes represent the same contract. JSON is usually safer for chat systems that reliably preserve structured data. CSV can be more convenient for spreadsheet-oriented or local workflows, but quoted commas and repeated metadata must remain intact.

## Files Never to Send

Do not send the repository, a broad folder export, or any file that exposes reference judgments or downstream findings. In particular, never send:

- `corpus/annotated/`
- `data/evidence/annotation-evidence.json`
- Stage 4B files directly under `data/reliability/`, including completed coding, adjudication, or reliability results
- `data/reliability/model-comparison/`
- `data/reliability/model-adjudication/`
- another model's submission
- analysis, synthesis, claim-audit, or rendered results pages

Do not let a browsing-enabled model search the project repository or quoted Lincoln passage on the web. Disable browsing, retrieval, repository access, and cross-run memory when the interface permits it. Start a fresh conversation for every run.

These restrictions preserve blindness. The external system should see the task text and coding protocol, not Stage 4A answers, Stage 4B decisions, prior model judgments, or hints about which packet items are controls.

## Run One Review

1. Generate the packet with `npm run stage4m:packets`.
2. Choose JSON or CSV and make a working copy of that template outside the generated packet directory.
3. Start a fresh model session with browsing, tools, and repository access disabled where possible.
4. Upload the four allowed files and request only the completed structured template.
5. Save the returned content as a plain `.json` or `.csv` file. Remove Markdown fences if the interface added them, but do not rewrite the model's substantive answers.
6. Confirm that every seeded `task_type`, `doc_id`, `sentence_id`, and `span_id` is still present. Sentence-identification items may add `_r01`, `_r02`, and similar suffixes when one sentence contains multiple metaphorical spans.
7. Complete or verify the run metadata described below. Preserve the packet identity and hashes already present in the template.
8. Place the file in `data/reliability/model-output-submissions/`.
9. Run `npm run stage4m:ingest`. Fix format or metadata errors reported by the validator without changing the model's coding judgments.
10. After all intended submissions validate, run `npm run stage4m` to regenerate comparisons, disagreements, the human queue, and the consensus report.

The ingestion command accepts `.json` and `.csv` files only. Invalid submissions remain excluded from normalized comparison data. Incomplete packet coverage is reported as a warning; for a planned full review, investigate that warning rather than treating a partial run as complete.

## Filename and Run Identity

Use:

```text
provider-modelname-YYYY-MM-DD-runNN.json
provider-modelname-YYYY-MM-DD-runNN.csv
```

For example:

```text
openai-modelname-2026-06-19-run01.json
anthropic-modelname-2026-06-19-run01.json
google-modelname-2026-06-19-run01.json
local-modelname-2026-06-19-run01.json
```

Use lowercase ASCII letters, numbers, and hyphens in filenames. Give every attempted run a unique filename and `run_id`, even when two runs use the same model and settings. Do not overwrite an accepted submission; preserve reruns as separate provenance records.

## Required Metadata

Complete the same metadata in JSON or on every CSV row:

| Field | What to record |
| --- | --- |
| `run_id` | Unique stable identifier, such as `openai-modelname-2026-06-19-run01` |
| `model_id` | Stable project-facing model identifier; keep it consistent across comparable runs |
| `provider` | Organization or runtime providing the model |
| `model_name` | Model name displayed by the interface |
| `model_version` | Exact version or dated alias when available; otherwise use `unknown` and explain in `notes` |
| `run_date` | Calendar date in `YYYY-MM-DD` format |
| `operator` | Person or project role that conducted and saved the run |
| `input_packet_id` | Preserve the value seeded in the template |
| `input_packet_hash` | Preserve the value seeded in the template |
| `prompt_hash` | Preserve the value seeded in the template |
| `temperature` | Numeric temperature when known; otherwise JSON `null` or an empty CSV cell |
| `notes` | Other settings and circumstances needed to interpret or reproduce the run |

In `notes`, record any available reasoning-effort setting, sampling controls, seed, maximum-output setting, interface name, tool availability, and unavoidable platform-added instructions. If the provider does not expose a setting, say so rather than guessing.

The `prompt_hash` identifies the committed Stage 4M instruction file. Do not change it to represent hidden provider prompts or interface text. Avoid adding your own instructions; if an interface imposes unavoidable text, preserve the seeded hash and disclose the difference in `notes`.

For CSV, every metadata field must have exactly the same value on every row. Empty nullable CSV cells become JSON `null` during ingestion.

## Minimal Valid JSON Example

This is a schema-valid one-item example for the current packet. It intentionally covers only one packet unit and would produce an incomplete-coverage warning. A real full review should use and complete the generated 106-item template.

```json
{
  "run_id": "example-json-2026-06-19-run01",
  "model_id": "example-json-model",
  "provider": "Example Provider",
  "model_name": "Example Model",
  "model_version": "1.0",
  "run_date": "2026-06-19",
  "operator": "example-operator",
  "input_packet_id": "stage4m_0b71d40df438058f",
  "input_packet_hash": "eeee9ecdc2f9ff04b8e07fcea415f25d56926f35c34a4f7365ba6e12813a3c04",
  "prompt_hash": "d82b8b530f18ee6be7a980fd2f514fdcbfeec306fd17970e4bd7acfa5adefa3d",
  "temperature": null,
  "notes": "Format example only; provider settings unavailable.",
  "items": [
    {
      "task_type": "sentence_identification",
      "doc_id": "doc_001",
      "sentence_id": "doc_001_s01_p01_s01",
      "span_id": "stage4m_unit_00001",
      "metaphor_present": "no",
      "lexical_unit": null,
      "lexical_unit_start": null,
      "lexical_unit_end": null,
      "source_domain": null,
      "target_domain": null,
      "cluster_id": null,
      "koenigsberg_function": null,
      "violence_logic": null,
      "obligatory_frame": null,
      "agency_or_absence_flag": null,
      "confidence": "medium",
      "ambiguity_flag": "no",
      "rival_reading": null,
      "justification": "No metaphor-related lexical unit was identified."
    }
  ]
}
```

## Minimal Valid CSV Example

This one-row CSV expresses the same example. Keep the header unchanged. A real submission should retain all rows from the generated CSV template and repeat identical run metadata on every row.

```csv
run_id,model_id,provider,model_name,model_version,run_date,operator,input_packet_id,input_packet_hash,prompt_hash,temperature,notes,task_type,doc_id,sentence_id,span_id,metaphor_present,lexical_unit,lexical_unit_start,lexical_unit_end,source_domain,target_domain,cluster_id,koenigsberg_function,violence_logic,obligatory_frame,agency_or_absence_flag,confidence,ambiguity_flag,rival_reading,justification
example-csv-2026-06-19-run01,example-csv-model,Example Provider,Example Model,1.0,2026-06-19,example-operator,stage4m_0b71d40df438058f,eeee9ecdc2f9ff04b8e07fcea415f25d56926f35c34a4f7365ba6e12813a3c04,d82b8b530f18ee6be7a980fd2f514fdcbfeec306fd17970e4bd7acfa5adefa3d,,"Format example only; provider settings unavailable.",sentence_identification,doc_001,doc_001_s01_p01_s01,stage4m_unit_00001,no,,,,,,,,,,,medium,no,,No metaphor-related lexical unit was identified.
```

## Validate and Ingest

Put each returned file directly under:

```text
data/reliability/model-output-submissions/
```

Then run:

```bash
npm run stage4m:ingest
```

Read both the terminal output and:

```text
data/reliability/model-comparison/model-run-validation-report.md
```

Common failures include malformed JSON or CSV, missing required fields, inconsistent CSV metadata, a stale packet ID or hash, changed sentence or span identifiers, duplicate `run_id` values, and labels outside the controlled vocabulary. Correct transport, formatting, and provenance mistakes only. Do not silently improve, harmonize, or reinterpret the model's returned coding.

Once every intended run is valid, execute:

```bash
npm run stage4m
```

This command rechecks the packet and submissions before generating downstream artifacts. Commit model submissions only when the project has deliberately decided they are reproducible research records and no private or sensitive operator information is present.

## Interpret the Reports

Start with these generated files:

| Report | Use |
| --- | --- |
| `model-run-validation-report.md` | Confirms which files were accepted and identifies errors or coverage warnings |
| `model-agreement-results.md` | Reports model-vs-reference and model-vs-model agreement by coding layer and denominator |
| `model-disagreement-log.json` and `.csv` | Preserve item-level disagreement records and model judgments |
| `model-instability-report.md` | Summarizes disagreement patterns and interpretive risks |
| `model-consensus-report.md` | Summarizes stable, unstable, and insufficient-evidence fields |
| `stage4m-adjudication-queue.csv` | Lists disagreements requiring human review |
| `stage4m-adjudication-guide.md` | Explains the human review process |

Interpret agreement conservatively:

- Model agreement is diagnostic evidence, not a vote.
- Agreement among related model families may not be independent corroboration.
- High agreement can indicate a stable coding rule, but it does not prove the reference answer.
- Disagreement can reflect passage ambiguity, prompt sensitivity, codebook ambiguity, model limitations, or a questionable reference judgment.
- “No submissions” and “insufficient evidence” are valid states, not negative findings.
- Agency/absence and disease/purification disagreements remain explicit human-review priorities.
- No report, queue, or model consensus automatically changes Stage 4A.

Human scholarly review remains responsible for deciding whether a disagreement warrants a codebook clarification, a future reliability study, or a separately authorized correction migration.

## Quick Checklist

- [ ] Generated the current packet immediately before review
- [ ] Started a fresh, tool-disabled session
- [ ] Sent only the four allowed files
- [ ] Sent no reference answers, prior submissions, or downstream reports
- [ ] Requested only one completed JSON or CSV template
- [ ] Preserved packet IDs, hashes, task IDs, sentence IDs, and seeded span IDs
- [ ] Recorded model, provider, operator, date, settings, and limitations
- [ ] Used a unique filename and `run_id`
- [ ] Saved the response under `model-output-submissions/`
- [ ] Ran `npm run stage4m:ingest` and reviewed all findings
- [ ] Ran `npm run stage4m` only after intended submissions validated
- [ ] Treated all agreement and consensus as diagnostic, not authoritative
