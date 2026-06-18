---
title: "Annotation Codebook"
draft: false
---

This codebook is the reviewer-readable guide for Stage 4 metaphor annotation. It separates three operations that must not be collapsed:

1. **MIPVU identification**: decide whether a lexical unit is metaphor-related in context [@steen2010].
2. **CMT mapping**: describe the source-target mapping and entailments.
3. **Koenigsbergian interpretation**: interpret the political-psychological function of the mapping.

The codebook records the canonical vocabularies used by the project and the decision rules another annotator should follow without relying on private project memory.

## Annotation Unit

The main citable unit is the Stage 3 sentence ID. A Stage 4 metaphor instance is anchored to a sentence and records the span text, CMT layer, Koenigsberg layer, and confidence metadata.

Use the narrowest span that activates the mapping. For extended metaphors, annotate each sentence-level instance separately and connect them with `extension_group_id`.

## Annotation Sequence

Annotate in this order:

1. Read the full document and its corpus-register metadata: date, period, genre, register, authorship, editorial status, risk flags, and inclusion rationale.
2. Read the full paragraph and section before annotating a sentence.
3. Identify candidate lexical units using MIPVU.
4. Decide whether each lexical unit is metaphor-related.
5. Assign the CMT layer: cluster, source domain, target domain, linguistic form, entailments, extension status, co-activated clusters, and notes.
6. Assign the Koenigsberg layer: fantasy type, violence logic, obligatory frame, projected entity, guilt distribution, sacrificial economy, agency, psychic defense, and absence flags.
7. Score confidence and record ambiguity, rival readings, irony, or suppression.
8. Validate the document immediately after writing a Stage 4 file.

Do not use Koenigsbergian interpretation to justify MIPVU identification. A passage must first be metaphor-related before it can become evidence for ideological fantasy analysis.

## MIPVU Decision Rules

For each candidate lexical unit:

1. Determine its contextual meaning in the Lincoln passage.
2. Determine whether it has a more basic meaning in another context, preferably a concrete, bodily, spatial, legal, familial, religious, or material meaning.
3. Decide whether the contextual meaning contrasts with the basic meaning.
4. Decide whether the contextual meaning can be understood by comparison with the basic meaning.
5. If yes, mark it metaphor-related and proceed to CMT mapping.
6. If no, do not annotate it as a metaphor instance.
7. If uncertain, annotate only when the mapping can be stated explicitly; set `ambiguity_flag: true` and score confidence no higher than 0.70.

### Include

- Concrete source domains applied to political, historical, legal, theological, or national targets.
- Conventional metaphors whose entailments remain active, such as body politic, founding fathers, covenant, birth, wound, proof, and Providence.
- Extended metaphor continuations that develop an already active mapping.
- Suppression instances when a cluster expected from nearby context is conspicuously absent.

### Exclude

- Literal biological, familial, legal, or theological language with no political target mapping.
- Quotations or turns by non-Lincoln speakers in debate documents.
- Dead idioms whose entailments cannot be stated in the passage.
- Pure topic references to slavery, war, Union, or law without a cross-domain mapping.

## CMT Layer

The CMT layer answers: what is being understood in terms of what?

Required fields:

| Field | Rule |
| --- | --- |
| `cluster_id` | Use one of the six canonical cluster IDs. |
| `source_domain` | Record the specific concrete source domain; also align it with one source-domain family below. |
| `target_domain` | Record the specific political/historical target; also align it with one target-domain family below. |
| `linguistic_form` | Use the closest form value. |
| `entailments` | List passage-specific inferences licensed by the mapping. |
| `is_novel_metaphor` | `true` only when the passage self-consciously creates or theorizes the metaphor. |
| `is_extended_metaphor` | `true` when the instance belongs to a sustained mapping across sentences or paragraphs. |
| `extension_group_id` | Required when `is_extended_metaphor` is `true`. |
| `co_activated_clusters` | List additional clusters activated by the same span or sentence. |
| `annotation_notes` | Record rival readings, historical semantics, variants, and migration notes. |

### Cluster IDs

| Value | Name | Basic source family | Basic target family |
| --- | --- | --- | --- |
| `cluster_01_body_organism` | Nation as organism/body | body, wound, healing, organism, disease | Union, nation, civic body |
| `cluster_02_covenant_oath` | Union as covenant/oath | oath, contract, bond, compact | Constitution, Union, law |
| `cluster_03_experiment_proposition` | Republic as experiment/proposition | proof, test, experiment, demonstration | democratic self-government |
| `cluster_04_birth_creation` | War as birth/new creation | birth, labor, generation, creation | political renewal, freedom |
| `cluster_05_fathers_inheritance` | Founders as inheritance | fathers, inheritance, patrimony, debt | founding obligation |
| `cluster_06_providence_theodicy` | Providence/divine will | judgment, punishment, Providence, sin | war meaning, historical causation |

### Source-Domain Families

Use these families to discipline `source_domain` wording. The current schema stores the specific `source_domain` as descriptive text, so the family should appear in the phrasing or notes when the exact wording is more specific.

- `body_organism`
- `wound_injury`
- `disease_medicine`
- `birth_generation`
- `family_inheritance`
- `law_contract_oath`
- `experiment_proof_logic`
- `religion_providence_theodicy`
- `sacrifice_blood_debt`
- `architecture_structure`
- `agriculture_growth`
- `journey_motion`
- `economy_accounting`
- `light_darkness`
- `music_voice_affect`
- `object_container_frame`

### Target-Domain Families

Use these families to discipline `target_domain` wording. The current schema stores the specific target as descriptive text.

- `nation_union`
- `constitution_law`
- `democracy_self_government`
- `civil_war`
- `slavery_emancipation`
- `freedom_liberty`
- `founding_fathers`
- `citizenship_people`
- `reconciliation_reconstruction`
- `providence_history`
- `enemy_rebellion`
- `soldier_sacrifice`
- `black_agency_absence`

### Linguistic Form

Canonical values:

- `word`
- `nominal_phrase`
- `verbal_phrase`
- `adjectival`
- `clause`
- `sentence`
- `multi_sentence`

Use `multi_sentence` only when the instance cannot be represented by a smaller span and is explicitly part of an extended metaphor.

## Koenigsberg Layer

The Koenigsberg layer answers: what political-psychological work does the mapping perform?

### Fantasy Type

Strict schema vocabulary:

| Value | Use when |
| --- | --- |
| `wound_and_healing` | The political body is damaged and must be restored. |
| `birth_and_creation` | Violence or sacrifice generates a new political order. |
| `sacrifice_and_redemption` | Death or suffering becomes productive, redemptive, or debt-paying. |
| `oath_and_obligation` | A compact, promise, law, or covenant makes action mandatory. |
| `punishment_and_theodicy` | War or suffering is divine/historical judgment. |
| `ancestral_debt` | The founding generation imposes inherited obligation. |
| `experiment_and_proof` | War or crisis tests whether democratic self-government can survive. |
| `disease_and_purification` | A social group is cast as pathogen requiring expulsion. This is absent from Lincoln and must not be assigned unless the passage constructs a group as contamination. |

### Violence Logic

Canonical analytical values:

- `restorative`
- `generative`
- `punitive`
- `purifying`
- `evidentiary`
- `obligatory`

The current corpus contains some legacy descriptive `violence_logic` strings. New annotations should use one or more canonical terms in the field or begin the note with the canonical term, then explain the passage-specific mechanism in `obligatory_frame_notes` or `annotation_notes`. The later schema-upgrade issue should decide whether this becomes a strict array.

### Obligatory Frame

`obligatory_frame` is boolean.

Set `true` when the metaphor makes action feel necessary rather than chosen: wounds demand treatment, oaths demand fulfillment, experiments demand completion, debts demand payment, and Providence demands submission.

Always explain the source of necessity in `obligatory_frame_notes`.

### Projected Entity

Canonical analytical values:

- `national_body`
- `founding_proposition`
- `covenant_bond`
- `ancestral_lineage`
- `divine_instrument`

The current corpus sometimes stores more specific descriptive projected entities. New annotations should preserve specific wording only when needed, while explicitly aligning the instance to one of the canonical values in notes.

### Guilt Distribution

Canonical analytical values:

- `external`
- `internal`
- `distributed`
- `cosmic`
- `absent`

The current corpus sometimes stores explanatory guilt prose. New annotations should use the canonical value where possible and place detailed explanation in `guilt_distribution_notes`.

### Sacrificial Economy

`sacrificial_economy` is boolean.

Set `true` when death, suffering, blood, labor, or loss is made productive. Common `sacrificial_yield` values:

- `national_identity`
- `propositional_proof`
- `sin_redemption`
- `ancestral_debt_payment`
- `new_birth`
- `reconciliation`

If `sacrificial_economy` is `false`, `sacrificial_yield` must be `null`.

### Psychic Defense

Canonical values:

- `splitting`
- `projection`
- `manic_defense`
- `reparation`
- `idealization`
- `displacement`
- `null`

Use this layer only when the psychic mechanism is analytically visible. Do not force a value.

## Absence Flags

Absence flags are positive annotations, not afterthoughts. Set a flag when the metaphor's entailments create an expected role and the rhetoric withholds that role from an entity.

Strict schema vocabulary:

| Value | Use when |
| --- | --- |
| `enslaved_people_non_agent` | Enslaved people are structurally present as cause, object, or beneficiary but absent as agents, healers, provers, inheritors, or covenant parties. |
| `black_soldiers_erased` | Post-1863 sacrifice, proof, or birth logic omits Black Union soldiers from the agentive or sacrificial role. |
| `lincoln_non_agent` | Lincoln positions himself as instrument of law, Providence, events, or obligation rather than choosing agent. |
| `confederates_depersonalized` | Confederate people disappear into abstractions such as rebellion, secession, wound, or hostile force. |
| `death_abstracted` | Individual deaths become proof, redemption, debt payment, or national capital rather than human losses. |
| `women_absent` | Birth, care, labor, mourning, or healing roles appear while women are absent from them. |
| `disease_purification_absent` | A passage could invite pathogen/purification logic but refuses to cast any social group as contaminant. |

If any absence flag is set, `absence_notes` must explain the expected role and the missing entity.

## Rhetorical Functions

Use these categories in notes or future structured fields to describe what the passage does rhetorically:

- `warning`
- `exhortation`
- `justification`
- `consolation`
- `mourning`
- `consecration`
- `reconciliation`
- `accusation`
- `instruction`
- `memorialization`
- `self_exculpation`
- `national_self_definition`
- `policy_legitimation`

## Ideological Functions

Use these categories in notes or future structured fields to describe what the metaphor naturalizes or authorizes:

- `sacralization`
- `obligation`
- `sacrifice`
- `guilt_distribution`
- `redemption`
- `purification`
- `enemy_construction`
- `agency_suppression`
- `reconciliation`
- `historical_destiny`
- `providential_judgment`
- `collective_immortality`
- `moral_accounting`
- `black_agency_erasure`

## Confidence and Ambiguity

| Score | Meaning | Rule |
| --- | --- | --- |
| 0.95-1.00 | Very high | Explicit mapping, clear entailments, stable text, high authorship confidence. |
| 0.85-0.94 | High | Clear mapping with minor boundary or entailment uncertainty. |
| 0.70-0.84 | Moderate | Conventional metaphor, transcription uncertainty, or competing but manageable reading. |
| 0.50-0.69 | Low | Possible metaphor with substantial ambiguity; include only if mapping can still be stated. |
| Below 0.50 | Exclude | Do not annotate. |

Apply register, authorship, and transcription adjustments from the annotation protocol.

Set `ambiguity_flag: true` when:

- Basic meaning or contextual meaning is uncertain.
- The source domain could belong to more than one cluster.
- The span may be literal but has active metaphor entailments.
- Textual variants affect the span.

Record the rival reading in `ambiguity_notes` or `annotation_notes`.

## Historical Semantics

Historical semantics matters when a lexical unit's nineteenth-century basic meaning differs from modern assumptions.

Use notes for:

- legal terms: compact, bond, oath, obligation, title, relation
- theological terms: judgment, offense, Providence, atonement, charity, malice
- republican terms: proposition, experiment, proof, fathers, inheritance
- medical terms: wound, disease, cancer, surgery, healing, amputation

If a historical reference is needed but not yet available, mark the confidence down and record the missing reference in `annotation_notes`.

## Negative Cases

Negative cases should be documented when they prevent over-annotation.

| Case | Decision |
| --- | --- |
| A legal proclamation has almost no metaphor. | Do not invent metaphor. Record flatness as a register finding. |
| Disease language names slavery as an institution, not a social group. | Do not assign `disease_and_purification`; consider `disease_purification_absent`. |
| A debate passage belongs to Douglas. | Do not annotate as Lincoln evidence. |
| A conventional phrase has no active entailment in context. | Exclude or mark low confidence only if a mapping can be stated. |
| A Providence phrase is formulaic blessing only. | Annotate only if it structures causation, obligation, judgment, or historical meaning. |

## Examples

### Positive Case: Wound and Healing

Phrase: "bind up the nation's wounds"

- MIPVU: metaphor-related; bodily wound language applied to national reconciliation.
- CMT: `cluster_01_body_organism`; source family `wound_injury`; target family `nation_union`.
- Entailments: the nation has a body; division damages it; healing is obligatory; repair is possible.
- Koenigsberg: `wound_and_healing`; `restorative`; obligatory frame likely true.
- Absence check: who heals, who is healed, and whose actual wounds disappear?

### Positive Case: Experiment and Proof

Phrase: "testing whether that nation, or any nation so conceived... can long endure"

- MIPVU: metaphor-related; political survival framed as empirical test.
- CMT: `cluster_03_experiment_proposition`.
- Koenigsberg: `experiment_and_proof`; `evidentiary`; soldier death may become proof.
- Absence check: Black soldiers may be erased from the proof despite serving as literal evidence.

### Negative Case: Legal Flatness

Phrase: routine operative language in the Emancipation Proclamation.

- MIPVU: do not annotate without contrastive basic/contextual meaning.
- CMT: no mapping if the passage only performs legal designation.
- Koenigsberg: absence of metaphor is the finding.
- Notes: legal register suppresses body, birth, Providence, and covenant language.

## Validation Checklist

Before finalizing a Stage 4 document:

- Every instance has `instance_id`, `sentence_id`, `document_id`, and `span_text`.
- `cmt.cluster_id` is one of the six validated cluster IDs.
- `cmt.entailments` is an array and contains passage-specific inferences.
- Extended metaphors have `extension_group_id`.
- `koenigsberg.fantasy_type` is one of the validated fantasy types.
- `koenigsberg.absence_flags` uses only validated absence flags.
- `absence_notes` is populated when absence flags are present.
- `sacrificial_economy: false` has `sacrificial_yield: null`.
- `meta.confidence` is between 0.50 and 1.00.
- `meta.ambiguity_flag` is boolean and ambiguity notes are present when needed.
- The document passes `npm run validate:annotation -- <doc_id>`.
