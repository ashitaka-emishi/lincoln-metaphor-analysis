# Cluster 01: Nation as Organism / Body

**Cluster ID**: `cluster_01_body_organism`
**Source domain**: wound, healing, birth, severance, disease
**Target domain**: the American Union

---

## CMT Profile

### Source → Target Mapping

| Source domain element | Target domain element |
|-----------------------|-----------------------|
| body / organism | the Union / nation |
| wound | division, secession, slavery's damage |
| healing | reunification, Reconstruction |
| physician | president, government |
| patient | the citizenry, the nation as a whole |
| severance / amputation | secession as bodily cutting |
| birth / new growth | refounding (overlaps cluster_04) |
| disease | *(structurally available but never activated against a group — see Hitler comparison)* |

### Instance Table
*Populate after Stage 4 annotation. Columns: instance_id | document | date | span_text | confidence*

| instance_id | document | date | span_text | confidence |
|-------------|----------|------|-----------|------------|
| — | — | — | — | — |

### Dominant Linguistic Forms
*Populate from analysis.json after Stage 6*

### Top 5 Entailments by Frequency
*Populate from analysis.json after Stage 6*

### Novel Instances
*Flag any novel (non-conventional) deployments*

### Extended Metaphor Groups
*List extension_group_ids that belong to this cluster*

---

## Diachronic Distribution

### By Year (with register)
*Populate from analysis.json. Include register column to enable controlled comparison.*

| Year | Document | Register | Instance count |
|------|----------|----------|----------------|
| 1838 | doc_001 Lyceum | formal_public_address | — |
| 1858 | doc_005 House Divided | formal_public_address | — |
| 1861 | doc_009 First Inaugural | formal_public_address | — |
| 1865 | doc_021 Second Inaugural | formal_public_address | — |
| 1865 | doc_022 Last Address | formal_public_address | — |

**Expected trajectory**: The body/organism cluster should appear in proto-form at the Lyceum Address (1838), reach first full deployment at House Divided (1858), and achieve programmatic Reconstruction application in the Last Address (1865). Track whether the cluster intensifies after 1861 and whether it persists or yields to cluster_06 in the final phase.

### Shift Events
*Document any phase transitions: first_attested, intensification points, relationship shifts*

| Date | Document | Shift type | Evidence |
|------|----------|------------|---------|
| — | — | — | — |

---

## Koenigsberg Profile

### All 8 Constructs

**Fantasy type** (expected dominant): `wound_and_healing`
*Rate: populate from analysis.json*

**Violence logic** (expected dominant): `restorative`
*Rate: populate from analysis.json*
*Note: restorative violence has an exit condition (wounds heal) — the structural difference from purifying violence.*

**Obligatory frame rate**: *populate*
*Note: the wound metaphor generates obligatory frame automatically — if the nation is wounded, a physician must act. This is not a choice.*

**Projected entity** (expected dominant): `national_body`

**Guilt distribution** (expected arc): `external` → `distributed`
*Track the guilt_distribution arc within this cluster. Does the shift from external (someone caused the wound) to distributed (both sides wounded the nation) track the corpus-level arc?*

**Sacrificial economy rate**: *populate*
*Note: cluster_01 overlaps cluster_04 where bodies produce new bodies. When does wound-healing become birth-creation?*

**Dominant psychic defense**: expected `reparation`
*Guilt converted into restorative action — the wound must be bound up.*

**Absence flags distribution**: *populate*
- `enslaved_people_non_agent`: expected high — enslaved people appear as cause of the wound, not as healers
- `confederates_depersonalized`: expected moderate — the wound has no human author in most instances
- `death_abstracted`: expected moderate — deaths become part of the healing narrative

---

## Political and Moral Work

*Populate after annotation. Template questions:*

What does the NATION IS A BODY metaphor make rhetorically possible that other framings would not?
- It makes restoration the natural telos — not punishment, not transformation, but return to health
- It makes the president's action obligatory rather than chosen — physicians do not decline to treat wounds
- It makes secession feel viscerally wrong — not politically objectionable but physically violent

How does the wound/healing frame shape Reconstruction policy?
- "Binding up the nation's wounds" (Second Inaugural) is not merely metaphorical — it is programmatic. It positions Reconstruction as medical care, not as punishment or justice.

---

## What the Metaphor Conceals

*Populate after annotation. Template questions:*

- Who caused the wound? The metaphor tends to abstract the cause — but the wound of slavery has human agents. When agents are specified, they are abstract (the slave power, the rebellion) rather than persons.
- Who does the healing? The physician role is filled by the president/government. The formerly enslaved people who most need healing are absent from the medical scenario.
- Can the wound fully heal? The medical metaphor implies yes — but the political reality of Reconstruction was otherwise. The metaphor may have concealed the depth of damage.

---

## Hitler Comparison

**Hitler parallel cluster**: Volksgemeinschaft as racial body
**Shared elements**: Both use body-politic projection; both make wound logic obligatory; both construct political violence as biological necessity

**Key structural divergence**: Lincoln's body metaphor lacks disease_and_purification logic. The wound can heal because no pathogen is present — damage is reparable. Hitler's racial body contains an internal pathogen (Jews, Marxists) that must be expelled; healing is impossible while the pathogen remains. This gives Lincoln's body metaphor an exit condition that Hitler's racial-body logic does not have.

**disease_and_purification in Lincoln**: The Temperance Address (doc_002) uses disease language for alcohol, but Lincoln explicitly refuses the reformer-as-judge position. No document in the corpus constructs any social group as a pathogen to be expelled. This absence is the key structural finding. Track every candidate instance.

---

## Key Quoted Instances

*Populate after annotation. Include span_text, document, date, annotation_notes*

### "House divided against itself cannot stand" (doc_005, 1858)
*Analysis placeholder: house = body (architectural/domestic), division = structural failure, can't stand = collapse. Dual activation: house as body AND house as household covenant. Both cluster_01 and cluster_02.*

### "Binding up the nation's wounds" (doc_021, 1865)
*Analysis placeholder: canonical wound/healing instance. Physician role for president. Restorative logic. Both-sides healing. enslaved_people_non_agent — they are absent from the healing role.*

### "Picture of silver" / "apple of gold" (doc_011, 1861)
*Analysis placeholder: Lincoln explicitly theorizes his own metaphors. Not cluster_01 primary — but note how the nation-as-object logic relates to the body cluster.*
