---
title: "Human Coder Training Guide"
description: "Training instructions for Stage 4H blind inter-annotator reliability coders."
draft: false
---

## Purpose

This guide prepares you to code a set of Lincoln passages for the Stage 4H human inter-annotator reliability study. It explains the annotation scheme, the coding task, the blindness rules you must follow, and how to handle uncertainty. Read it completely before you open your coding worksheet.

You do not need to be a Lincoln scholar or a linguist to complete this task. You need to read carefully, apply the rules in this guide, and record your own independent judgment.

## What Coders Are Testing

This study tests whether two independent trained readers, working from the same written guide and applying the same rules, assign the same metaphor-related units and the same interpretive fields to the same Lincoln passages.

That question — do two human coders agree? — is the central reliability question. Your job is to answer it honestly by coding what you see, not by trying to agree with anyone else.

## What Coders Are Not Testing

**You are not being asked to validate the project's existing findings.** The project has its own annotation layer (Stage 4A). You will not see it. Your coding is entirely independent of it. Whether you agree with the project's prior judgments is irrelevant to your task and to the reliability result.

**You are not being asked to be an authority on Lincoln's rhetoric.** Historical interpretation is the project's job. Your job is to apply the rules in this guide to the supplied passages.

**You are not being asked to produce perfect annotations.** When you are uncertain, this guide provides explicit instructions for recording that uncertainty. Uncertainty recorded correctly is a valid and valuable result.

## Blindness Rules

These rules are mandatory. Violating them invalidates the reliability study.

**Before and during coding, you must not consult:**

- Stage 4A annotation files, evidence chains, or any project annotation outputs.
- Stage 4B or Stage 4M reliability results, comparison outputs, or adjudication records.
- Synthesis pages, claim-audit materials, or any document that states what the project concluded about Lincoln's rhetoric.
- The other coder's worksheet, at any point before both of you have submitted your completed sheets.
- Any draft or published version of the project's final conclusions or publication materials.

**You may consult:**

- This training guide.
- The codebook vocabulary tables included in this guide.
- A standard dictionary for basic word meanings.
- Historical reference materials for nineteenth-century word meanings, when noted.

If you are uncertain whether something you want to consult is allowed, do not consult it. Record the uncertainty in your coder notes and move on.

## Coding Units

Your worksheet contains two task types. Your packet will label each row clearly.

### Sentence Identification (`sentence_identification`)

You are given a sentence. Decide:

1. Does this sentence contain at least one metaphor-related lexical unit?
2. If yes, identify the narrowest span of text that activates the mapping and record its character boundaries.
3. If no, mark `mipvu_decision` as `not_metaphor_related` and leave all other fields blank.

One sentence may contain more than one lexical unit. Add one row per candidate unit.

### Field Agreement (`field_agreement`)

You are given a sentence with a span already identified. Apply the interpretive fields to that span: CMT mapping, Koenigsberg function, absence flags, confidence, and ambiguity. Do this even if you personally think the span is borderline. If you believe the span is not metaphor-related, mark `mipvu_decision` as `not_metaphor_related`, leave downstream fields blank, and explain in `coder_notes`.

## Metaphor Identification

Metaphor identification follows the MIPVU procedure. For each candidate word or phrase:

1. **Determine the contextual meaning** — what does the word or phrase mean in this Lincoln sentence?
2. **Determine the basic meaning** — what is a more concrete or literal meaning of the same word or phrase in another context? Basic meanings are often bodily, spatial, familial, legal, agricultural, or material.
3. **Ask whether the contextual meaning contrasts with the basic meaning.** If the word is being used literally, there is no contrast.
4. **Ask whether the contextual meaning can be understood by comparison with the basic meaning.** If yes, the unit is metaphor-related.

**Mark as metaphor-related** when a concrete or literal source domain is being applied to a political, historical, legal, theological, or national target domain and the entailments of that source domain are active in context.

**Do not mark as metaphor-related:**

- Literal biological, familial, legal, or theological language without a political target mapping.
- Dead idioms whose entailments cannot be stated in the passage.
- Pure topic references to slavery, war, or the Union with no cross-domain mapping.
- Quotations or speech by non-Lincoln speakers in debate documents.

### Historical Semantics Note

Some nineteenth-century words carry meanings that differ from modern usage. Legal terms such as *compact*, *bond*, and *obligation*; theological terms such as *judgment*, *Providence*, and *atonement*; and republican terms such as *proposition*, *experiment*, and *inheritance* all have specific historical meanings relevant to the mapping. When historical meaning matters, note it in `coder_notes`. When in doubt about a historical meaning, record your uncertainty and score confidence at 0.70 or below.

## Lexical Unit Boundaries

Use the **narrowest span** that activates the mapping. Include only the words that carry the metaphorical entailment.

- *"the infant nation"* → span is `infant nation`, not the full sentence.
- *"bind up the nation's wounds"* → span is `the nation's wounds` or the full verb phrase, depending on which words carry the bodily entailment.
- *"a house divided against itself"* → span is `a house divided against itself`; the full idiom activates the mapping.

For identification rows, record the start and end character positions within the supplied sentence text. Count from character 0 at the beginning of the sentence.

## CMT Source and Target Domains

Once you have identified a metaphor-related unit, describe the mapping.

**Source domain** — the concrete domain being drawn on. Write a brief phrase: *"bodily organism"*, *"legal inheritance"*, *"scientific experiment"*.

**Target domain** — the political or historical thing being described. Write a brief phrase: *"the Union"*, *"founding obligation"*, *"democratic self-government"*.

**Entailments** — inferences the mapping licenses in this passage. What does the source domain imply about the target? List at least one. Example: if the nation is an organism with wounds, then healing is possible and obligatory.

## Cluster Assignment

Assign the span to one of the six canonical clusters. The cluster captures which family of source-domain logic is active.

| Cluster ID | Name | When to use |
| --- | --- | --- |
| `cluster_01_body_organism` | Nation as organism/body | Bodily, medical, wound, healing, or disease language applied to the Union or civic body |
| `cluster_02_covenant_oath` | Union as covenant/oath | Oath, contract, bond, compact, or pledge language applied to the Constitution or Union |
| `cluster_03_experiment_proposition` | Republic as experiment/proposition | Proof, test, experiment, proposition, or demonstration language applied to democratic self-government |
| `cluster_04_birth_creation` | War as birth/new creation | Birth, generation, labor, creation, or renewal language applied to political transformation or freedom |
| `cluster_05_fathers_inheritance` | Founders as inheritance | Fathers, heirs, inheritance, patrimony, or debt language applied to founding obligation |
| `cluster_06_providence_theodicy` | Providence/divine will | Judgment, punishment, Providence, sin, or divine will language applied to war meaning or historical causation |

When more than one cluster seems active, choose the primary cluster and note the secondary cluster in `coder_notes`.

## Koenigsberg Interpretive Function

The Koenigsberg layer asks: what political-psychological work does the metaphor perform?

### Fantasy Type

Choose one value. Use it strictly.

| Value | Use when |
| --- | --- |
| `wound_and_healing` | The political body is damaged and must be restored |
| `birth_and_creation` | Violence or sacrifice generates a new political order |
| `sacrifice_and_redemption` | Death or suffering becomes productive, redemptive, or debt-paying |
| `oath_and_obligation` | A compact, promise, or covenant makes action mandatory |
| `punishment_and_theodicy` | War or suffering is divine or historical judgment |
| `ancestral_debt` | The founding generation imposes inherited obligation |
| `experiment_and_proof` | War or crisis tests whether democratic self-government can survive |
| `disease_and_purification` | A social group is cast as pathogen requiring expulsion — **rarely if ever applies to Lincoln; do not assign unless the passage explicitly constructs a group as contamination** |

If no fantasy type fits, leave the field blank and explain in `coder_notes`.

## Violence Logic

Record the logic by which force or harm is made meaningful in the passage. Use one or more of these canonical values:

| Value | Meaning |
| --- | --- |
| `restorative` | Violence heals or restores a damaged body |
| `generative` | Violence creates something new |
| `punitive` | Violence is deserved punishment |
| `purifying` | Violence cleanses contamination — use only when passage explicitly casts a group as contaminant |
| `evidentiary` | Violence or death serves as proof |
| `obligatory` | Violence is demanded by oath, covenant, or inherited duty |

If more than one applies, record both and explain in `coder_notes`.

## Obligatory Frame

`obligatory_frame` is a yes/no field.

Mark **yes** when the metaphor makes action feel necessary rather than chosen: wounds demand treatment, oaths demand fulfillment, experiments demand completion, debts demand payment, Providence demands submission.

Always explain the source of necessity in `obligatory_frame_notes`. What exactly creates the sense of obligation?

## Absence and Agency Coding

Absence flags are positive findings, not omissions. Set a flag when the metaphor's entailments create an expected role — healer, heir, covenant partner, agent — and the rhetoric withholds that role from a specific group or entity.

| Value | Set when |
| --- | --- |
| `enslaved_people_non_agent` | Enslaved people are structurally present as cause, object, or beneficiary but absent as agents, healers, provers, inheritors, or covenant parties |
| `black_soldiers_erased` | Post-1863 sacrifice, proof, or birth logic omits Black Union soldiers from the agentive or sacrificial role |
| `lincoln_non_agent` | Lincoln positions himself as instrument of law, Providence, events, or obligation rather than choosing agent |
| `confederates_depersonalized` | Confederate people disappear into abstractions such as rebellion, secession, wound, or hostile force |
| `death_abstracted` | Individual deaths become proof, redemption, debt payment, or national capital rather than human losses |
| `women_absent` | Birth, care, labor, mourning, or healing roles appear while women are absent from them |
| `disease_purification_absent` | A passage could invite pathogen/purification logic but refuses to cast any social group as contaminant |

When you set an absence flag, explain in `absence_notes` what role was implied and who was excluded from it.

## Confidence Bands

Score your confidence in the annotation on a scale from 0 to 1. Do not annotate spans below 0.50.

| Score | Meaning |
| --- | --- |
| 0.95–1.00 | Explicit mapping, clear entailments, stable text |
| 0.85–0.94 | Clear mapping with minor boundary or entailment uncertainty |
| 0.70–0.84 | Conventional metaphor with some ambiguity, or competing but manageable reading |
| 0.50–0.69 | Possible metaphor with substantial ambiguity; include only if the mapping can still be stated |
| Below 0.50 | Do not annotate; leave the row blank or mark not metaphor-related |

Lower your score when:
- The text is a transcription with known variant readings.
- A word's nineteenth-century meaning is uncertain.
- You cannot state the entailments clearly.
- You are uncertain which cluster applies.

## Ambiguity Flags

Set `ambiguity_flag` to true when:

- The basic or contextual meaning of the word is genuinely uncertain.
- The source domain could belong to more than one cluster.
- The span might be literal but has active metaphor entailments.
- Textual variants affect the span.

When you set the flag, record the rival reading in `ambiguity_notes`. What else could the span mean? Why might a reasonable reader disagree?

## Rival Readings

Record a rival reading when you believe a reasonable alternative interpretation exists, even if you are confident in your own coding. A rival reading is not an admission of error — it is useful evidence about where the scheme is stable and where it requires judgment.

Write the rival reading as one or two sentences: *"A reader might interpret this as literal legal language with no political target domain. The basic and contextual meanings of 'bond' in this period overlap significantly."*

## When to Mark Uncertain

Mark uncertainty explicitly rather than forcing a decision you are not confident in.

- If you cannot determine whether a unit is metaphor-related, mark `mipvu_decision` as `uncertain` and score confidence at 0.70 or below.
- If you cannot assign a cluster with confidence, leave the field blank and explain in `coder_notes`.
- If you cannot determine the fantasy type, leave it blank and explain.
- If you are uncertain about an absence flag, do not set it; record the question in `absence_notes`.

Uncertain results coded honestly are more valuable than confident results that mask a real ambiguity.

## When to Mark Out of Scope

Mark a row as out of scope when:

- The sentence is spoken by a non-Lincoln speaker in a debate document.
- The sentence is a stage direction, editorial heading, or non-Lincoln text.
- The span is a direct biblical quotation without Lincoln's own framing.

Record the reason in `coder_notes`.

## Examples

**All examples below are drawn from documents outside the final reliability test sample. You will not see these sentences in your worksheet.**

---

### Example 1 — Metaphor Identification: Positive (Cluster 3)

*Temperance Address, 1842 (doc_002)*

> In it the world has found **a solution of the long mooted problem**, as to the capability of man to govern himself.

- **Contextual meaning:** democratic temperance reform as the answer to a long-standing question about human self-governance.
- **Basic meaning:** solution as resolution of a logical or scientific problem; mooted as debated in a formal proceeding.
- **Contrast and comparison:** yes — political reform is being understood through the language of inquiry and proof.
- **Cluster:** `cluster_03_experiment_proposition`
- **Entailments:** self-governance is a proposition to be proved; temperance reform constitutes evidence; the question has now been answered.
- **Fantasy type:** `experiment_and_proof`
- **Confidence:** 0.88

---

### Example 2 — Metaphor Identification: Positive (Cluster 1)

*Clay Eulogy, 1852 (doc_003)*

> **The infant nation**, and the infant child began the race of life together.

- **Span:** `infant nation`
- **Contextual meaning:** the early American republic as a young, developing political entity.
- **Basic meaning:** infant as a newborn human child.
- **Cluster:** `cluster_01_body_organism`
- **Entailments:** the nation has a developmental life course; it was vulnerable and young; its growth parallels human growth.
- **Fantasy type:** `wound_and_healing` (Clay's eulogy frames the nation's early vulnerability as part of a story of growth and restoration)
- **Confidence:** 0.87

---

### Example 3 — Metaphor Identification: Positive (Cluster 2)

*First Inaugural Address, 1861 (doc_009)*

> You have no **oath registered in heaven** to destroy the government, while I shall have the most solemn one to preserve, protect, and defend it.

- **Span:** `oath registered in heaven`
- **Contextual meaning:** a binding obligation under divine witness.
- **Basic meaning:** registering a legal document in a formal registry; heaven as a place or institution with record-keeping authority.
- **Cluster:** `cluster_02_covenant_oath`
- **Entailments:** the presidential oath has a transcendent, binding character; heaven enforces it; the covenant is unbreakable.
- **Fantasy type:** `oath_and_obligation`
- **Obligatory frame:** yes — the oath demands action regardless of choice.
- **Confidence:** 0.90

---

### Example 4 — Metaphor Identification: Positive (Cluster 6)

*Springfield Farewell Address, 1861 (doc_008)*

> Without the assistance of **the Divine Being who ever attended him**, I cannot succeed.

- **Span:** `the Divine Being who ever attended him`
- **Contextual meaning:** Providence as a personal, active presence that guided Washington and is expected to guide Lincoln.
- **Cluster:** `cluster_06_providence_theodicy`
- **Fantasy type:** `punishment_and_theodicy`
- **Absence flag:** `lincoln_non_agent` — Lincoln positions himself as dependent instrument rather than independent agent.
- **Confidence:** 0.87

---

### Example 5 — Metaphor Identification: Positive (Cluster 4)

*Last Public Address, 1865 (doc_022)*

> Concede that the new government of Louisiana is only to what it should be **as the egg is to the fowl**, we shall sooner have the fowl by hatching the egg than by smashing it.

- **Span:** `as the egg is to the fowl... hatching the egg`
- **Contextual meaning:** the Louisiana Reconstruction government as an early developmental stage of a mature political body.
- **Cluster:** `cluster_04_birth_creation`
- **Fantasy type:** `birth_and_creation`
- **Entailments:** political reconstruction is a generative biological process; smashing the egg is destructive; patience allows growth.
- **Confidence:** 0.92

---

### Example 6 — Negative Case: Not Metaphor-Related

> *"I do order and declare that all persons held as slaves... are, and henceforward shall be free."*

- **Decision:** not metaphor-related.
- **Reason:** this is operative legal language performing a declaration. The words do not draw on a concrete source domain applied to a political target through contrast and comparison. Legal register here suppresses body, covenant, and birth language.
- Mark `mipvu_decision` as `not_metaphor_related`. Leave all other fields blank.

---

### Example 7 — Ambiguous Case

*Greeley Letter, 1862*

> My paramount object in this struggle is **to save the Union**, and is not either to save or to destroy slavery.

- **Candidate span:** `to save the Union`
- **Potential cluster:** `cluster_01_body_organism` — "save" implies a body at risk of destruction.
- **Why ambiguous:** "save" is a very conventional verb here; the body-organism entailments (wound, healing, illness) are not explicitly activated. A reasonable reader could treat this as idiomatic language with no active mapping.
- **Decision:** if you read active entailments, annotate with confidence 0.70 and set `ambiguity_flag`. If you cannot state the entailments, mark not metaphor-related.

---

## Common Coding Errors

**Annotating non-Lincoln speech.** Debate documents include Douglas and others. Code only Lincoln's own words.

**Marking literal language as metaphorical.** Providence references are sometimes literal theology with no figurative target mapping. Disease language sometimes names an institution (slavery), not a social group. Apply the MIPVU contrast-and-comparison test before marking metaphor-related.

**Collapsing the tasks.** Cluster assignment and fantasy type are separate decisions. Assign the cluster based on source domain; assign fantasy type based on political-psychological function. They often align but are not the same question.

**Forcing a confident score when uncertain.** If you find yourself picking a cluster because you have to pick something, score confidence at 0.70 or below and set `ambiguity_flag`. Do not present a forced decision as a confident one.

**Setting absence flags as defaults.** Absence flags mark specific structural withholdings, not general observations that a group is underrepresented. Set a flag only when the metaphor's own entailments create an expected role that is then withheld from a named or identifiable group.

**Consulting project outputs.** If you catch yourself wanting to check what the project concluded, stop. Record your own judgment and move on. The reliability study depends on your independence.
