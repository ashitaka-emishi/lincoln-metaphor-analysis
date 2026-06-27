# Stage 4H Sampling Strategy

## Decision

The Stage 4H blind two-human reliability study uses the **same five-document sample as Stage 4B**. No change from Stage 4B is required or warranted.

Preserving the Stage 4B sample allows human results to be compared directly against the existing AI-assisted pass without redefining the evidence universe or introducing selection decisions made after seeing prior reliability results.

## Sample

| Document | ID | Date | Period | Register |
| --- | --- | --- | --- | --- |
| Lyceum Address | `doc_001` | 1838-01-27 | `phase_1_baseline` | `formal_public_address` |
| L-D Debate 7 Alton | `doc_006g` | 1858-10-15 | `phase_2_argument` | `campaign_speech` |
| July 4 Message 1861 | `doc_010` | 1861-07-04 | `phase_3_obligation` | `congressional_message` |
| Gettysburg Address | `doc_017` | 1863-11-19 | `phase_4_transformation` | `formal_public_address` |
| Second Inaugural | `doc_021` | 1865-03-04 | `phase_5_theodicy` | `formal_public_address` |

**5 documents / 28 total — 17.86% document coverage (within the 10–20% target range)**

## Coding Units

| Unit type | Count | Source |
| --- | --- | --- |
| Sentence identification units | 55 | `data/reliability/reliability-sample.json` |
| Field agreement units | 51 | `data/reliability/reliability-sample.json` |

Sentence identification units include positive anchors from Stage 4A and deterministic negative sentence controls. Coders should add rows when they identify additional metaphor-related lexical units not already represented.

## Selection Method

Purposive stratified sample: one document from each of the five diachronic periods, selected to maximize analytical priority, evidence density, and coverage of reliability test types. The five documents collectively satisfy all seven acceptance criteria below.

### Diachronic Coverage

Each of the five corpus periods is represented by exactly one document. This tests whether coder agreement is stable across the arc of Lincoln's career, not just within one register or time period.

### Positive Metaphor Cases

All six canonical clusters appear across the sample:

| Cluster | Primary document(s) |
| --- | --- |
| `cluster_01_body_organism` | `doc_006g`, `doc_017`, `doc_021` |
| `cluster_02_covenant_oath` | `doc_010`, `doc_017`, `doc_021` |
| `cluster_03_experiment_proposition` | `doc_001`, `doc_010`, `doc_017` |
| `cluster_04_birth_creation` | `doc_017` |
| `cluster_05_fathers_inheritance` | `doc_001`, `doc_006g`, `doc_010` |
| `cluster_06_providence_theodicy` | `doc_010`, `doc_017`, `doc_021` |

All primary fantasy types appear: `ancestral_debt`, `birth_and_creation`, `experiment_and_proof`, `oath_and_obligation`, `punishment_and_theodicy`, `sacrifice_and_redemption`, `wound_and_healing`.

### Negative Controls

`doc_010` (July 4 Message) is a congressional message in a lower-confidence official register with nine `disease_purification_absent` flags, providing systematic negative-check coverage for the purification cluster. The `doc_001` Lyceum Address similarly produces eight `disease_purification_absent` annotations, testing whether coders correctly withhold the purification label when it is structurally absent.

### High-Impact Synthesis Passages

`doc_017` (Gettysburg Address) and `doc_021` (Second Inaugural) are the two highest-density, highest-analytical-priority documents in the corpus. Gettysburg deploys all six clusters in 272 words; the Second Inaugural concentrates `wound_and_healing` and `punishment_and_theodicy` across a short ceremonial address. Both are claim-audit anchors and must be covered in any reliability sample that is intended to support publication claims about the corpus.

### Ambiguous Cases

`doc_006g` (Alton Debate) carries `transcription_variants` as a risk flag, introducing genuine span-boundary ambiguity where variant transcriptions affect lexical unit boundaries. `doc_017` carries `manuscript_variants`. Both documents test whether coders reach the same boundary decisions under provenance uncertainty — a systematic source of disagreement that the identification task must expose.

### Agency and Absence Passages

`doc_017` and `doc_021` together provide the densest absence-coding test in the corpus:

| Absence flag | Count in sample |
| --- | --- |
| `enslaved_people_non_agent` | 16 (doc_006g: 4, doc_017: 9, doc_021: 7) |
| `death_abstracted` | 8 (doc_017: 7, doc_021: 1) |
| `black_soldiers_erased` | 7 (doc_017: 5, doc_021: 2) |
| `lincoln_non_agent` | 10 (doc_017: 4, doc_021: 6) |
| `confederates_depersonalized` | 4 (doc_017: 2, doc_021: 2) |

These flags require coders to identify structural absences rather than explicit content — a methodologically demanding task that the reliability study must evaluate.

### Disease and Purification Negative Checks

No document in the sample assigns `disease_and_purification` as a fantasy type. The sample contains 21 `disease_purification_absent` flags across `doc_001` (8), `doc_006g` (4), and `doc_010` (9). This tests whether coders correctly recognize that Lincoln's rhetoric invites but refuses the purification pattern — one of the project's analytically significant findings.

## Why the Sample Is Unchanged from Stage 4B

The Stage 4B sample was designed with the same criteria and has already been used to generate the AI-assisted reliability pass. Changing the sample would:

1. Break comparability between Stage 4H human results and Stage 4B AI-assisted results.
2. Require a new justification made with knowledge of existing reliability results, introducing selection bias.
3. Reduce the denominator of cross-method comparison.

No argument for changing the sample has been identified. If a future reliability study extends coverage, it should add documents rather than replace these five.

## Contamination Rules

**Calibration examples must not overlap with these five documents.** Training and calibration material in `data/reliability/human-training/` is drawn exclusively from non-sample documents (doc_002, doc_003, doc_004, doc_008, doc_009, doc_012, doc_015, doc_016, doc_022).

Coders must not see Stage 4A annotation values, Stage 4B reliability results, Stage 4M model outputs, synthesis pages, or claim-audit material for any of the five sample documents before or during blind coding.

## Limitations

- The sample covers all five diachronic periods but cannot cover every register within the 20% document cap.
- Three of five documents are `formal_public_address`. The sample includes one `campaign_speech` (`doc_006g`) and one `congressional_message` (`doc_010`) to diversify register coverage.
- `cluster_04_birth_creation` appears primarily in `doc_017`. Coder agreement on this cluster depends heavily on a single document.
