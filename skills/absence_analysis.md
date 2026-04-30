# Absence Analysis — Methodology for Systematic Silences

## Theoretical Basis

Systematic absences in metaphor systems are not gaps — they are findings. When a metaphor's entailment structure logically requires a certain entity to be present (as actor, agent, beneficiary, or inheritor) and that entity is consistently absent, the absence is structured by the metaphor's logic, not by accident.

The method derives from Macherey's theory of literary silences and Althusser's concept of "symptomatic reading": what a text cannot say tells us as much as what it says, because what it cannot say reveals the limits of its ideological framework.

In Lincoln's corpus: the NATION IS A BODY metaphor requires a physician. The REPUBLIC AS EXPERIMENT requires provers. The WAR AS BIRTH requires a mother. The SACRIFICE AND REDEMPTION requires agents who sacrifice. When enslaved people and Black soldiers are excluded from these roles despite being the most literal embodiments of them, the exclusion is structural — produced by the metaphor's own logic, not by Lincoln's personal intentions.

---

## Primary Absent Entity: Enslaved People

Enslaved people appear in Lincoln's metaphor universe in exactly three structural positions:

1. **As the cause of the wound** — slavery is what damaged the national body (cluster_01)
2. **As the object of the proposition** — whether they are equal humans is the claim being tested (cluster_03)
3. **As the subject of God's punishment** — the nation is being punished for the sin of slavery (cluster_06)

They do not appear as:
- Healers of the national body
- Provers of the democratic proposition
- Inheritors of the founding covenant
- Agents in the sacrificial economy
- Recipients of the "new birth of freedom"

The sharpest test case is the ~180,000 Black Union soldiers post-1863. They are the most literal embodiment of all three active clusters in the war period (sacrifice and redemption, experiment and proof, birth and creation), and they are nearly absent from Lincoln's public rhetoric of sacrifice and rebirth. The Conkling Letter (doc_016) partially acknowledges them, but even there they are positioned as instruments of Union policy rather than agents of national transformation.

---

## Absence Flags: When and How to Set

Set an absence flag whenever **the metaphor's entailment structure logically requires an entity to be present in a given role, and that entity is absent**.

The flag must be:
1. **Entailment-driven**: derive the expected presence from the specific mapping, not from general political expectation
2. **Role-specific**: identify the specific role the entity is absent from (healer, prover, agent, inheritor)
3. **Documented**: always populate `absence_notes` explaining the entailment that generates the expected presence

### absence_flags enum and when to apply

| Flag | Apply when |
|------|-----------|
| `enslaved_people_non_agent` | Any cluster_01, 03, 04, or 06 instance where the metaphor's entailments place a healer, prover, agent, or inheritor in the scene, and enslaved people are absent from that role |
| `black_soldiers_erased` | Any post-1863 sacrifice, proof, or birth instance where Black Union soldiers are absent from the sacrificial/evidentiary/generative role |
| `lincoln_non_agent` | Any instance where Lincoln positions himself as instrument (of Providence, covenant, logic) rather than choosing agent — obligatory frame from the first-person perspective |
| `confederates_depersonalized` | Any instance where the violence or conflict is framed against an abstraction (the Confederacy, rebel forces, the rebellion) rather than against persons — especially relevant for cluster_01 wound instances where the wound has no human author |
| `death_abstracted` | Any sacrificial economy instance where individual deaths are converted into aggregate proof/redemption/birth without acknowledgment of specific persons |
| `women_absent` | Any birth/creation or healing instance where the labor or care role is present but women are absent from it |

---

## Suppression Instances (Separate Tracking)

**Suppression** is distinct from systematic absence. Suppression is when Lincoln deploys a cluster in one context and withholds it in a structurally similar context. Systematic absence is when the metaphor's logic requires a role that is never filled by a particular entity across the whole corpus.

Track suppression in `meta.suppression_flag: true` and `meta.suppression_notes`.
Track systematic absence in `koenigsberg.absence_flags`.

Do not conflate. The Greeley Letter (doc_012) is a suppression event (Lincoln suppresses body/covenant cluster in a context that would normally activate it). The Black soldiers erasure is systematic absence (an entity is never given a role it is structurally entitled to across the corpus).

---

## Secondary Absence Threads

Beyond enslaved people, three secondary absence threads require tracking:

### lincoln_non_agent
Lincoln consistently represents himself as an instrument rather than an agent — of Providence, of the covenant, of logical necessity, of historical forces. This is not humility rhetoric; it is a structural feature of his obligatory frame. The Hodges Letter (doc_019) is the explicit canonical statement: "I claim not to have controlled events but confess plainly that events have controlled me."

Track `lincoln_non_agent` as both an absence flag (Lincoln's agency is erased by the metaphor's logic) and a construct in its own right. The diachronic question: does lincoln_non_agent increase over time as the obligatory frame intensifies?

### confederates_depersonalized
Confederate soldiers and leaders are rarely present as persons in Lincoln's metaphor system. They appear as "rebel forces," "the rebellion," "those who caused the wound" — abstractions. This depersonalization is structurally required by the wound metaphor (wounds don't have authors who are persons; they have causes that are conditions) and by the covenant metaphor (violating an oath is an act against the compact, not against persons).

Track `confederates_depersonalized` and note whether it increases or decreases as guilt distribution shifts from `external` toward `distributed` and `cosmic`.

### death_abstracted
The sacrificial economy converts individual deaths into national capital. "These honored dead" at Gettysburg are grammatically present but individually absent — they are a collective noun doing aggregate work (proving the proposition). Track `death_abstracted` and note the relationship between sacrificial economy and this abstraction: they should co-vary.

---

## Structure of systematic_absence.md Deliverable

The final deliverable in `analysis/systematic_absence.md` must include:
1. Quantitative summary table: all 6 absence flags with instance counts and percentage of annotated instances
2. Diachronic pattern table: absence flag counts by year/phase
3. Register differential table: which flags appear more in formal addresses vs. legal documents vs. private fragments
4. Cluster differential table: which clusters produce which flags at what rate
5. Black soldiers finding: focused analysis of post-1863 documents
6. Comparative significance: how Lincoln's systematic absence differs from Hitler's (different absent entities, different structural logic)
7. Key findings: 3-5 bullet points

All quantitative claims must have register-controlled versions. A finding that "enslaved people are absent from X% of sacrifice instances" must specify whether this holds across all registers or concentrates in formal_public_address.
