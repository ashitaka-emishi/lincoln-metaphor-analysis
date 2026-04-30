# Koenigsberg Method — Field Definitions and Lincoln Application

## Overview

Richard Koenigsberg's framework holds that mass political violence is driven by **ideological fantasy** — unconscious psychic structures that make violence feel obligatory, redemptive, or generative rather than chosen. The nation functions as a "magical object": an extension of the collective self that demands violent defense. Koenigsberg developed this framework analyzing Hitler's speeches and later extended it to the logic of World War I. This project applies it to Lincoln's corpus (1838–1865) to ask: what made the Civil War feel necessary rather than contingent?

The eight analytical constructs below are the core annotation vocabulary for Stage 4.

---

## Construct 1: Fantasy Type

The deep structure of the ideological scenario. Each fantasy type corresponds to a different logic of what violence does and why it is felt to be required.

### Enum values

| Value | Definition | Lincoln prevalence |
|-------|------------|-------------------|
| `wound_and_healing` | The political body has been damaged; violence is the act of restoration or protection of healing. The wound exists prior to and independently of the agent's choice. | **Primary** — dominant from 1858 onward |
| `birth_and_creation` | Violence is generative: it produces something new, brings a new order into being. Death becomes birth-labor. | **High** — especially Gettysburg |
| `sacrifice_and_redemption` | Soldiers' deaths are not waste but yield: national identity, proof of a proposition, atonement for collective sin. | **High** — Gettysburg, Second Inaugural |
| `oath_and_obligation` | The covenant (Constitution, Declaration, founding promise) makes certain actions mandatory. Violence is a legal-moral obligation, not a choice. | **High** — all registers |
| `punishment_and_theodicy` | Violence is God's judgment — the war is what the nation deserves. The agent becomes the instrument of divine punishment. | **High** — Second Inaugural, private fragments |
| `ancestral_debt` | The founders' sacrifice creates an intergenerational obligation. The living owe the dead continued fidelity to the founding project. | **High** — Cooper Union, Gettysburg |
| `experiment_and_proof` | Democratic self-government is an unproven proposition; war is the empirical test. Victory is evidence; defeat would be disproof. | **Lincoln-specific** — Peoria, July 4 Message, Gettysburg |
| `disease_and_purification` | The political body contains a pathogen that must be expelled; violence purifies rather than restores. The target group is constructed as contamination rather than opponent. | **ABSENT in Lincoln** — this absence is the key structural finding. Track every potential instance and mark as `disease_purification_absent`. |

### Lincoln-specific note on disease_and_purification

Lincoln's rhetoric has NO instances of disease_and_purification logic. The Temperance Address (doc_002) uses disease metaphors but applies them to alcohol, not to any social group — and Lincoln explicitly refuses the reformer-as-judge position. Slavery is constructed as a wound (cluster_01) or a violated oath (cluster_02), never as a contagion. Enslaved people appear as the cause of the wound or the object of God's test; they are never constructed as pathogen. This structural difference from Hitler is the project's central comparative finding: restorative and generative violence have exits (wounds heal, children grow up); purifying violence has none, which is why Lincoln's rhetoric could accommodate "malice toward none" and Hitler's could not.

---

## Construct 2: Violence Logic

How the fantasy type constructs the *function* of violence — what it accomplishes within the ideological scenario.

| Value | Definition |
|-------|------------|
| `restorative` | Violence restores a prior wholeness. The wound framework — return to a state that existed before damage. Implies an endpoint. |
| `generative` | Violence produces something new that could not exist without it. Death is birth-labor. Implies transformation. |
| `punitive` | Violence is deserved punishment. The agent is instrument of justice (divine or historical). |
| `purifying` | Violence removes contamination. No endpoint until the pathogen is gone. **Absent in Lincoln.** |
| `evidentiary` | Violence proves a proposition. The war's outcome is evidence that democracy can survive. |
| `obligatory` | Violence is demanded by a prior commitment (oath, covenant, ancestral debt). The framing elides choice entirely. |

Multiple values may co-occur. Tag all that apply.

---

## Construct 3: Obligatory Frame

Boolean. Does the metaphor or passage make violence feel **mandatory rather than chosen**?

- `true`: The framing presents violence as flowing necessarily from some prior condition (wound, oath, debt, God's will, logical necessity). The agent appears to have no choice.
- `false`: Violence appears as one option among others, however strongly preferred.

**obligatory_frame_notes**: Always explain what generates the necessity — wound logic, covenant logic, divine instrument, or syllogistic proof.

Lincoln is unusual in that he frequently positions himself as a *non-agent* — carried by events, instruments of Providence, bound by oath. This personal non-agency and the obligatory frame on violence are structurally linked. See `lincoln_non_agent` absence flag and Hodges Letter (doc_019) for the most explicit instance.

---

## Construct 4: Projected Entity

What is the "magical object" — the entity treated as an extension of the collective self requiring violent defense?

| Value | Definition |
|-------|------------|
| `national_body` | The Union treated as a living organism whose physical integrity is at stake |
| `founding_proposition` | Democratic self-government as an unproven logical/scientific claim whose truth requires demonstration |
| `covenant_bond` | The constitutional compact as a sacred sworn oath whose violation demands enforcement |
| `ancestral_lineage` | The chain of obligation from founders through present generation to posterity |
| `divine_instrument` | The nation as God's chosen instrument, whose survival is providentially required |

Multiple values may co-occur (Gettysburg activates all five).

---

## Construct 5: Guilt Distribution

Who bears responsibility for the violence?

| Value | Definition |
|-------|------------|
| `external` | Guilt lies entirely with the opponent (secessionists, slave power). Used in early Lincoln. |
| `internal` | Guilt lies within the Union or the nation itself (shared complicity in slavery). |
| `distributed` | Guilt spread across both sides or the whole nation. Second Inaugural: "Both parties deprecated war." |
| `cosmic` | God or history bears the causal weight; human agents are instruments. |
| `absent` | The passage constructs violence without moral assignment. Legal documents tend here. |

**The guilt_distribution diachronic series is the primary analytical arc**: Lincoln moves from `external` (early debates, opponents constructed as agents) through `distributed` (late 1862–1863) to `cosmic` (Second Inaugural). This arc maps onto the shift from wound logic (enemy caused the damage) to theodicy (God willed it). Track this arc across every document.

---

## Construct 6: Sacrificial Economy

Does soldier death become **productive** in the passage — generating national identity, proving a proposition, redeeming a collective sin, or paying an ancestral debt?

- `sacrificial_economy: true` — death yields something. Specify what in `sacrificial_yield`.
- `sacrificial_economy: false` — death is mourned but not made to produce.

**sacrificial_yield** values (free text, but common examples):
- `national_identity` — soldiers' deaths constitute the nation
- `propositional_proof` — their deaths prove democracy works
- `sin_redemption` — deaths atone for slavery
- `ancestral_debt_payment` — deaths fulfill obligation to founders
- `new_birth` — deaths enable the nation's rebirth

**Consistency rule**: If `sacrificial_economy: false`, `sacrificial_yield` must be `null`. Validate script enforces this.

Gettysburg is the canonical example: "these honored dead" cannot be "in vain" because the living "dedicate" themselves to completing the unfinished work — soldier death directly funds the logical proof that democracy is viable.

---

## Construct 7: Agent and Object of Violence

- **agent_of_violence**: Who or what is constructed as the source of violence in the passage?
- **object_of_violence**: Who or what receives the violence?
- **agent_is_abstract**: Boolean. Is the agent a concrete human group or an abstraction (wound, history, God)?

Lincoln frequently makes violence agentless or assigns agency to abstractions (the wound, divine will, historical necessity). This is structurally related to the obligatory frame and to the lincoln_non_agent absence flag.

---

## Construct 8: Absence Flags

Entities that the metaphor's logic requires to be **passive, invisible, or structurally erased**. These are positive annotations — flag them whenever the metaphor's entailments erase an entity that logically should be present.

| Flag | Definition |
|------|------------|
| `enslaved_people_non_agent` | Enslaved people appear as cause of the wound, object of the proposition, or subject of divine punishment — not as actors, healers, provers, or inheritors |
| `black_soldiers_erased` | ~180,000 Black Union soldiers are absent from the sacrificial economy and birth-of-freedom narrative despite being its most literal embodiment |
| `lincoln_non_agent` | Lincoln constructs himself as instrument of Providence, covenant, or history — not as a choosing agent |
| `confederates_depersonalized` | Confederate soldiers or leaders are abstracted away; violence is against the Confederacy as system, not against persons |
| `death_abstracted` | Individual deaths are converted into data points (the proposition proven, the wound healing) rather than human losses |
| `women_absent` | Women are erased from the sacrificial economy despite their presence in the war |
| `disease_purification_absent` | A passage could invite purification logic but instead refuses to construct any social group as pathogen; this tracks the project’s central Lincoln/Hitler divergence |

**absence_notes**: Required when any flag is set. Explain what the metaphor's logic does to the absent entity and why the entailment structure requires that erasure.

---

## Optional Extension: Kleinian Psychic Defense Layer

These are Kleinian object-relations constructs available as an optional deeper layer of analysis. Not required for every instance; use when the psychological mechanism is analytically significant.

| Value | Definition |
|-------|------------|
| `splitting` | Nation cleaved into all-good (Union) and all-bad (Confederacy/slave power) objects |
| `projection` | Internal conflict (Union's complicity in slavery) externalized onto opponent |
| `manic_defense` | Triumph over loss through the claim that death produces — sacrificial economy as manic defense against grief |
| `reparation` | Guilt converted into restorative action (wound-and-healing as reparative gesture) |
| `idealization` | Founders idealized; their actual ambivalences on slavery erased |
| `displacement` | The war's cause (slavery) displaced onto abstract principles (Union, democracy) |

**psychic_defense_notes**: Explain the mechanism and what psychic work it performs.

---

## Hitler Comparison: Structural Map

| Construct | Hitler | Lincoln |
|-----------|--------|---------|
| Primary fantasy type | `disease_and_purification` | `wound_and_healing`, `sacrifice_and_redemption` |
| Violence logic | `purifying` (primary) | `restorative`, `generative`, `obligatory` |
| Projected entity | `ethnic_body` (racial Volksgemeinschaft) | `national_body`, `founding_proposition` |
| Guilt distribution | `external` (Jews, Marxists, Versailles enemies) | Shifts from `external` → `distributed` → `cosmic` |
| Obligatory frame | Always `true` | Frequently `true`, but mechanism differs |
| Sacrificial economy | `true` (dying for racial purity) | `true` (dying for democratic proof) |
| Absent entity | All non-Aryan groups constructed as pathogen | Enslaved people as non-agents; Black soldiers erased |
| Structural off-ramp | **None** — purification never complete | **Yes** — wounds heal; children grow up; covenant fulfilled |

The key structural finding: Lincoln's absence of disease_and_purification means his violence logic has an exit condition. The wound heals; the proposition is proven; the debt is paid. Hitler's purification logic has no exit — the pathogen is never fully expelled. This is why Lincoln could say "malice toward none" and mean it structurally, not merely rhetorically.
