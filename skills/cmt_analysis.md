# Conceptual Metaphor Theory — Methodology and Annotation Protocol

## Core Claim

Metaphors are cognitive structures, not rhetorical ornaments. When Lincoln writes "binding up the nation's wounds," he is not choosing a pretty image — he is *thinking through* the NATION IS A BODY metaphor. The entailments of the source domain (wound → healing, patient, physician, urgency, damage) transfer automatically to the target domain (national division → reunification, passive citizenry, executive as healer, time pressure, reparable harm). The entailments are the ideological payload.

Lakoff and Johnson (1980): "Our ordinary conceptual system, in terms of which we both think and act, is fundamentally metaphorical in nature."

---

## Key Constructs

### Source Domain
The concrete domain that provides the conceptual structure. In Lincoln's corpus:
- **Biological/organic**: wound, healing, birth, growth, disease, severance
- **Architectural**: house, foundation, cornerstone, ruin
- **Familial**: father, inheritance, family bond, patrimony
- **Legal/contractual**: oath, covenant, compact, bond, obligation
- **Logical/mathematical**: proposition, demonstration, proof, axiom, equation
- **Agricultural**: harvest, seed, soil, cultivation
- **Theological**: Providence, divine will, judgment, sin, redemption

### Target Domain
The abstract political domain being structured by the source. In Lincoln's corpus:
- The American Union
- Democratic self-government
- The Constitutional compact
- The Civil War and its causes
- The relationship between generations

### Mapping
The systematic set of correspondences between source and target. Example:

NATION IS A BODY:
- nation ↔ body
- division ↔ wound
- reunification ↔ healing
- secession ↔ amputation/severance
- president ↔ physician
- time ↔ urgency of treatment
- cause of division ↔ agent of injury

### Entailments
Inferences that follow automatically from the mapping. These are the ideological work:
- If the nation has a wound, something caused it (→ guilt attribution)
- If there is a wound, a physician must act (→ obligatory frame)
- If healing is delayed, damage worsens (→ urgency)
- If the patient is passive, the physician decides (→ agency distribution)
- Wounds are reparable (→ restorative logic, exit condition)

Always list specific entailments. These become the cmt.entailments array.

---

## The Six Pre-Identified Clusters

These are the organizing categories for this project. Annotate every instance into one or more clusters.

| Cluster ID | Name | Source Domain | Target Domain |
|------------|------|--------------|---------------|
| `cluster_01_body_organism` | Nation as organism / body | wound, healing, birth, severance, disease | the American Union |
| `cluster_02_covenant_oath` | Union as covenant / oath | sworn oath, contract, sacred bond | the constitutional compact |
| `cluster_03_experiment_proposition` | Republic as experiment / proposition | logical proof, scientific test | democratic self-government |
| `cluster_04_birth_creation` | War as birth / new creation | labor, nativity, generative act | the refounding of the nation |
| `cluster_05_fathers_inheritance` | Founding fathers as inheritance | patrimony, lineage, ancestral debt | obligation to the founders |
| `cluster_06_providence_theodicy` | Providence / divine will | God's judgment, punishment, theodicy | the war's cause and meaning |

Note: cluster_01 and cluster_04 are related but distinct. cluster_01 uses the body metaphor for the *existing* nation; cluster_04 uses birth/labor for the *new* nation being created through war. They can co-activate.

---

## Conventional vs. Novel Metaphors

**Conventional metaphors** are established, often unconscious, and still carry entailments. "The body politic," "the birth of a nation," "the Union as covenant" — these are conventional. They are still worth annotating because their entailments remain active even when the metaphor is not felt as figurative.

**Novel metaphors** are conscious, original deployments. Lincoln's "apple of gold" / "picture of silver" (doc_011) is explicitly novel — Lincoln is theorizing his own metaphor. Flag these with `is_novel_metaphor: true`.

**Extended metaphors** develop a single mapping across multiple sentences or paragraphs. Assign an `extension_group_id` (e.g., `ext_012`) to all instances in the same extended metaphor. The Gettysburg Address is one sustained extended metaphor across birth, death, and rebirth.

---

## Metaphor Suppression

**Suppression** occurs when a metaphor that Lincoln has deployed elsewhere in similar contexts is conspicuously absent. This is analytically significant — absence can be as structured as presence.

Flag suppression with `suppression_flag: true` and explain in `suppression_notes` what cluster is absent and what context would lead you to expect it.

Key suppression events:
- **Greeley Letter (doc_012)**: Covenant/body clusters almost entirely suppressed; the letter is deliberately flat to position Union-preservation as pragmatic, not ideological
- **Legal documents (doc_013, doc_015)**: All clusters suppressed; flatness is data about register norms and the political work of legal language
- **Charleston debate (doc_006d)**: Equality-proposition cluster suppressed; audience management in hostile southern Illinois territory

---

## 8-Step Annotation Protocol

1. **Read the full document** before annotating any sentence. Understand register, date, occasion, and analytical priority notes from corpus_manifest.json.

2. **Mark section boundaries**: Identify natural structural divisions (opening, argument, peroration, etc.). These become `section_label` values.

3. **Identify candidate instances**: Any sentence with figurative language mapping a concrete source domain onto a political/historical target domain. When in doubt, include and flag `ambiguity_flag: true`.

4. **Confirm the mapping**: For each candidate, state explicitly: source domain → target domain → key mapping elements → entailments. If you cannot state the mapping, do not annotate.

5. **Assign cluster**: Assign to one or more of the six clusters. Note co-activation.

6. **Apply Koenigsberg layer**: For each confirmed instance, work through all 8 Koenigsberg constructs. Do not skip constructs — assign `null` only when truly not applicable.

7. **Flag absences**: For every instance, consider which absence flags apply. Absence flags are positive annotations; flag every applicable one.

8. **Score confidence**: Apply the confidence scoring table below.

---

## Confidence Scoring

| Score | Meaning | Criteria |
|-------|---------|---------|
| 0.95–1.00 | Very high | Explicit metaphor with clear mapping, unambiguous entailments, high-authorship-confidence document |
| 0.85–0.94 | High | Clear metaphor, mapping traceable, minor ambiguity about one entailment or boundary |
| 0.70–0.84 | Moderate | Conventional metaphor where figurative status is debatable; or high-confidence mapping in low-authorship-confidence document |
| 0.50–0.69 | Low | Possible metaphor, competing readings, transcription noise, or very conventional usage with uncertain entailments |
| < 0.50 | Do not annotate | Cannot establish a mapping with confidence. Exclude. |

Apply register adjustments from `corpus_register.md` before finalizing confidence.

---

## Common Annotation Errors to Avoid

**Over-annotation**: Not every use of "body" or "father" is a conceptual metaphor. "The president's body was in good health" is not a political metaphor. Confirm a political target domain before annotating.

**Under-annotation**: Do not skip conventional metaphors because they feel dead. "The body politic" is still doing ideological work through its entailments even if unremarkable as a figure of speech.

**Flat entailment lists**: Entailments must be specific to the passage, not generic to the cluster. "Division caused physical damage" is better than "nation is body." The most analytically valuable entailments are the surprising ones — the inferences Lincoln doesn't draw explicitly but that follow necessarily from the mapping.

**Missing absence flags**: Absence flags require active attention. Ask after every annotation: who is logically required to be present by this metaphor's entailments but is not? Enslaved people, Black soldiers, and Lincoln himself are the primary candidates.
