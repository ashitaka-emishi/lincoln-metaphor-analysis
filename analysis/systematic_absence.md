---
draft: true
---

# Systematic Absence Analysis

*Required deliverable. See skills/absence_analysis.md for methodology.*

---

## Theoretical Basis

Systematic absences in metaphor systems are not gaps — they are findings. When a metaphor's entailment structure logically requires a certain entity to be present in a given role, and that entity is consistently absent, the absence is structured by the metaphor's logic, not by accident.

This document analyzes the **structured absences** in Lincoln's metaphor system: who is logically required to be present by the metaphor's entailments, and who is not.

---

## Primary Absent Entity: Enslaved People as Agents

**Core finding** (to be confirmed against corpus):
Enslaved people appear in Lincoln's metaphor universe in three structural positions:
1. As the *cause* of the wound (slavery damaged the national body)
2. As the *object* of the proposition (whether they are equal is the claim being tested)
3. As the *subject* of divine punishment (the nation is punished for the sin of slavery)

They do not appear as:
- Healers of the national body
- Provers of the democratic proposition
- Inheritors of the founding covenant
- Agents in the sacrificial economy
- Recipients of the "new birth of freedom" as active participants

---

## Quantitative Summary

*Populate after Stage 6 analysis. All figures require register-controlled versions.*

| Absence flag | Raw count | % of annotated instances | Register-controlled (formal only) |
|-------------|-----------|--------------------------|-----------------------------------|
| `enslaved_people_non_agent` | — | — | — |
| `black_soldiers_erased` | — | — | — |
| `lincoln_non_agent` | — | — | — |
| `confederates_depersonalized` | — | — | — |
| `death_abstracted` | — | — | — |
| `women_absent` | — | — | — |
| **Total** | — | — | — |

---

## Diachronic Pattern

*Populate after Stage 6. Key question: does enslaved_people_non_agent increase or decrease as the war progresses? Does black_soldiers_erased appear distinctly post-1863?*

| Phase | enslaved_people_non_agent | black_soldiers_erased | lincoln_non_agent | Total absence flags |
|-------|--------------------------|----------------------|-------------------|---------------------|
| 1 Baseline (1838–53) | — | — | — | — |
| 2 Argument (1854–60) | — | — | — | — |
| 3 Obligation (1861) | — | — | — | — |
| 4 Transformation (1862–63) | — | — | — | — |
| 5 Theodicy (1864–65) | — | — | — | — |

**Key question**: Does `black_soldiers_erased` appear *only* in Phase 4-5 (after Black soldiers began fighting in 1863)? It should, because the structural erasure only becomes analytically visible once the soldiers exist.

---

## Register Differential

*Populate after Stage 6. Which registers produce the most absence flags?*

| Register | enslaved_people_non_agent | black_soldiers_erased | lincoln_non_agent | Total |
|----------|--------------------------|----------------------|-------------------|-------|
| formal_public_address | — | — | — | — |
| campaign_speech | — | — | — | — |
| congressional_message | — | — | — | — |
| semi_public_letter | — | — | — | — |
| legal_document | — | — | — | — |
| fragment_private | — | — | — | — |

**Expectation**: formal_public_address may show the highest absence rates because it is the register with the most fully elaborated metaphor systems — more entailments means more structured absences.

**Hypothesis for legal documents**: The emancipation proclamations (doc_013, doc_015) have almost no metaphor — so almost no absence flags. But the *content* of these documents (freeing enslaved people) makes their metaphor absence doubly significant.

---

## Cluster Differential

*Populate after Stage 6. Which clusters produce the most absence flags per instance?*

| Cluster | enslaved_people_non_agent | black_soldiers_erased | death_abstracted | Total per instance |
|---------|--------------------------|----------------------|------------------|--------------------|
| cluster_01 body/organism | — | — | — | — |
| cluster_02 covenant/oath | — | — | — | — |
| cluster_03 experiment | — | — | — | — |
| cluster_04 birth/creation | — | — | — | — |
| cluster_05 fathers | — | — | — | — |
| cluster_06 providence | — | — | — | — |

**Expected finding**: cluster_04 (birth) and cluster_03 (experiment) should show the highest rates of `black_soldiers_erased` and `enslaved_people_non_agent` — these are the clusters where enslaved people and Black soldiers are most logically required to be present.

---

## Black Soldiers Finding (Post-1863 Focus)

The ~180,000 Black Union soldiers who served from 1863 onward are the sharpest test case for systematic absence analysis.

They are the most literal embodiment of:
- **cluster_03** (experiment): their military performance was cited as *evidence* that Black men were capable citizens
- **cluster_04** (birth): their deaths contributed literally to the "new birth of freedom"
- **cluster_05** (fathers): their service made them the most literal heirs of the founding promise they were fighting for
- All sacrifice/redemption logic: they sacrificed more, proportionally, and received less

**Documents to focus on post-1863**:

| Document | Date | Expected black_soldiers_erased instances |
|----------|------|------------------------------------------|
| doc_016 Conkling Letter | 1863-08-26 | Partial — Lincoln acknowledges Black soldiers but as instruments |
| doc_017 Gettysburg | 1863-11-19 | High — sacrificial economy excludes Black soldiers entirely |
| doc_018 Blind Memorandum | 1864-08-23 | Low density (short doc) |
| doc_019 Hodges Letter | 1864-04-04 | Moderate — Lincoln on events controlling him |
| doc_020 Re-election Serenade | 1864-11-10 | Low — brief document |
| doc_021 Second Inaugural | 1865-03-04 | Expected — theodicy frame erases Black soldiers as agents |
| doc_022 Last Address | 1865-04-11 | Reconstruction focus — check for healing frame erasure |

*Populate counts after annotation.*

---

## Comparative Significance vs. Hitler

**Hitler's primary absent entity**: Jewish people, constructed as pathogen

**Lincoln's primary absent entity**: Enslaved people and Black soldiers, constructed as passive

**Structural difference**:
- Hitler's absence is **purificatory**: Jewish people are absented by being constructed as disease to be expelled. Their erasure is the goal.
- Lincoln's absence is **structural**: enslaved people are absented by the metaphor's logic, not by intentional construction as enemy. The wound metaphor requires a healer, a physician, a patient — and fills those roles with white agents. Black actors are not constructed as threats; they are simply not positioned in the available roles.

**Why this matters**: Lincoln's structural absence has different political implications than Hitler's purificatory absence. Lincoln's framework can, in principle, be corrected by filling in the absent agents — which Reconstruction briefly attempted. Hitler's framework cannot be corrected because the absence is itself the political goal.

---

## Secondary Absence Threads

### lincoln_non_agent

Expected to be the second-highest absence flag after `enslaved_people_non_agent`. Lincoln systematically positions himself as instrument (of Providence, covenant, logic, events) rather than as choosing agent.

Diachronic question: does `lincoln_non_agent` increase as the war intensifies and the theodicy frame develops?

### confederates_depersonalized

Expected moderate. The wound, covenant, and experiment metaphors all tend to abstract the Confederate cause — it is "the rebellion," "the slave power," "those who violated the oath" — rather than specific persons. Does this depersonalization increase or decrease as distributed guilt develops?

### death_abstracted

Expected to co-vary with sacrificial_economy. When deaths are converted into proof/birth/redemption, they are abstracted. Track whether `death_abstracted` correlates with the cluster_04 and cluster_03 sacrificial economy instances.

---

## Key Findings

*Populate after Stage 6 analysis. Template: 3-5 bullet points, each with a quantitative claim and an interpretive claim.*

1. **[To populate]**: enslaved_people_non_agent rate across corpus — confirm/disconfirm the central hypothesis

2. **[To populate]**: black_soldiers_erased in post-1863 formal_public_addresses — the Gettysburg finding

3. **[To populate]**: lincoln_non_agent rate in cluster_06 — the theodicy frame's depersonalization of Lincoln

4. **[To populate]**: absence flag rate differential by register — do formal addresses show higher absence rates than fragments?

5. **Structural finding pre-stated**: disease_and_purification is absent from the corpus. No group is constructed as pathogen. This is a positive absence — the most important structured silence in the project. It is why Lincoln's framework has an exit condition and Hitler's does not.
