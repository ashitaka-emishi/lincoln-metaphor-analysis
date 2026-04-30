# Cluster 02: Union as Covenant / Oath

**Cluster ID**: `cluster_02_covenant_oath`
**Source domain**: sworn oath, contract, sacred bond
**Target domain**: the constitutional compact

---

## CMT Profile

### Source → Target Mapping

| Source domain element | Target domain element |
|-----------------------|-----------------------|
| oath / sworn promise | the Constitution / Declaration |
| parties to the contract | the founding generation + all subsequent citizens |
| breach of contract | secession / violation of constitutional order |
| enforcement / legal remedy | war as enforcement of the compact |
| sacred bond | moral-religious dimension of the constitutional relationship |
| covenant breaking | betrayal of the founding promise |
| ratification | the act of joining the compact |

### Instance Table
*Populate after Stage 4 annotation.*

| instance_id | document | date | span_text | confidence |
|-------------|----------|------|-----------|------------|
| — | — | — | — | — |

### Dominant Linguistic Forms
*Populate from analysis.json after Stage 6*

### Top 5 Entailments by Frequency
*Populate from analysis.json after Stage 6*

**Expected key entailments**:
- The Constitution is a binding agreement, not merely a political arrangement
- Parties who swore an oath cannot unilaterally withdraw
- The oath-maker (Lincoln) is obligated to enforce the compact
- Breaking the oath is a moral failure, not merely a political act
- The founding generation's promise binds their descendants

---

## Diachronic Distribution

| Year | Document | Register | Instance count |
|------|----------|----------|----------------|
| 1838 | doc_001 Lyceum | formal_public_address | — |
| 1852 | doc_003 Clay Eulogy | formal_public_address | — |
| 1858 | doc_005 House Divided | formal_public_address | — |
| 1860 | doc_007 Cooper Union | formal_public_address | — |
| 1861 | doc_009 First Inaugural | formal_public_address | — |
| 1862 | doc_012 Greeley Letter | semi_public_letter | — |

**Expected trajectory**: The covenant cluster should appear early (Lyceum Address) and persist throughout. The critical analytical moment is the Greeley Letter (1862): Lincoln deploys covenant logic to argue that preserving the Union takes precedence over emancipation. This is the cluster's most politically flexible — and ethically fraught — application. Track whether the covenant cluster's obligatory frame strengthens or weakens after emancipation.

### Key Suppression Event: Greeley Letter (doc_012, August 1862)

The Greeley Letter is a suppression event within the broader metaphor system AND a deployment event within the covenant cluster. Lincoln explicitly subordinates freedom to Union via covenant logic: "If I could save the Union without freeing any slave I would do it."

Track: Does Lincoln deploy the covenant cluster in contexts that explicitly exclude enslaved people from its protections? This is the `enslaved_people_non_agent` flag in covenant context.

---

## Koenigsberg Profile

**Fantasy type** (expected dominant): `oath_and_obligation`

**Violence logic** (expected dominant): `obligatory`
*Note: the oath frame makes war feel like legal enforcement, not political choice. Lincoln's position as oath-bound president generates the obligatory frame.*

**Obligatory frame rate**: *populate*
*Expected high — the covenant cluster is the primary generator of the obligatory frame across the corpus.*

**Projected entity** (expected dominant): `covenant_bond`

**Guilt distribution**: expected `external` → shifting
*Covenant violation is initially external (secessionists broke the oath). Does Lincoln ever internalize covenant guilt — the Union's own violation of the Declaration's promise re: slavery?*

**Sacrificial economy rate**: *populate*
*Lower than cluster_04 — covenant logic generates obligation rather than productive sacrifice.*

**Dominant psychic defense**: expected `idealization`
*The founders and the founding documents are idealized; their actual ambivalences on slavery are erased.*

**Absence flags distribution**: *populate*
- `enslaved_people_non_agent`: critical — the covenant's parties are implicitly white citizens; enslaved people are the object of the covenant's terms, not parties to it
- `lincoln_non_agent`: expected high — Lincoln is oath-bound, not choosing

---

## Political and Moral Work

*Populate after annotation. Template:*

The covenant cluster does two pieces of political work simultaneously:
1. Makes war obligatory — Lincoln is bound by his inaugural oath to defend the Constitution. He has no choice.
2. Makes secession illegitimate — you cannot unilaterally exit a sworn compact.

The cluster's political flexibility: at the Greeley Letter moment, covenant logic is used to argue for Union over emancipation. Later, Lincoln argues that the Declaration's equality clause is part of the covenant — and therefore that the covenant actually requires emancipation. Track this interpretive shift.

---

## What the Metaphor Conceals

- The contract's parties: the covenant is between "we the people," but in 1787 and for much of Lincoln's career, that meant white male property owners. The covenant cluster naturalizes a polity that systematically excluded enslaved people.
- The Declaration vs. the Constitution: Lincoln uses both as the covenant's source documents, but they are in tension. The Declaration's equality claim was an aspiration; the Constitution's three-fifths clause was a compromise with slavery. The covenant metaphor papers over this tension.
- Breach by the Union itself: if the covenant includes the Declaration's equality promise, the Union was in breach before secession.

---

## Hitler Comparison

**Hitler parallel cluster**: Blutgemeinschaft (blood community)
**Key structural difference**: Hitler's binding bond is racial-biological, not contractual-rational. You are born into Blutgemeinschaft; you cannot join it. Lincoln's covenant is civic — immigrants can join, the oath can be taken, the compact can be widened. This is the structural basis for why Lincoln's framework can eventually accommodate emancipation while Hitler's cannot accommodate any ethnic inclusion.

**Shared elements**: Both use obligatory logic; both construct defectors from the bond as traitors rather than political opponents.

---

## Key Quoted Instances

### "I take the official oath to-day with no mental reservations" (doc_009, 1861)
*Analysis placeholder: Lincoln's personal oath-taking as instantiation of the covenant cluster. The oath generates the obligatory frame for all subsequent action.*

### "If I could save the Union without freeing any slave" (doc_012, 1862)
*Analysis placeholder: Suppression event AND covenant deployment. Covenant cluster explicitly deployed to subordinate freedom to union. enslaved_people_non_agent at maximum.*

### "Our fathers brought forth on this continent" (doc_017, 1863)
*Analysis placeholder: Co-activation with cluster_05 (fathers) and cluster_04 (birth). The covenant is the founding act.*
