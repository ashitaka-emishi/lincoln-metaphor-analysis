# Findings

*Populate after Stage 6 analysis. Use the structure below for each finding.*
*Pre-stated findings (1 and 2) require confirmation against annotation data.*

---

## Finding 1: Systematic Absence of Enslaved People as Agents

**Claim** (pre-stated; confirm against corpus):

Enslaved people are structurally present in Lincoln's metaphor universe — as cause of the wound, object of the proposition, subject of divine punishment — but are systematically absent from the roles the metaphors' entailments make available: healer, prover, inheritor, agent. This absence is structural, not incidental: it is produced by the metaphor system's own logic.

**Evidence**:
- `enslaved_people_non_agent` count: — (populate)
- Rate per annotated instance: —
- Rate in formal_public_address: —
- Key instances: Gettysburg Address sacrificial economy (doc_017), Cooper Union proposition frame (doc_007), Second Inaugural theodicy (doc_021)

**Sharpest test case — Black soldiers**:
~180,000 Black Union soldiers served after January 1863. They are the most literal embodiment of all three war-period clusters:
- cluster_03: their performance was cited as proof of the democratic proposition
- cluster_04: their deaths contributed literally to the "new birth of freedom"
- cluster_06: their suffering fits the theodicy's shared punishment framework

`black_soldiers_erased` count in post-1863 documents: — (populate)

The Gettysburg Address (November 1863, two months after the 54th Massachusetts's assault on Fort Wagner) does not mention Black soldiers. Populate analysis: does any formal_public_address after January 1863 include Black soldiers in the sacrificial economy?

**Significance**:

The systematic absence reveals the limits of Lincoln's civic framework. The metaphor system was built on categories (citizen, heir, prover, healer) whose de facto membership excluded Black Americans even when the de jure logic of the Declaration required their inclusion. The metaphors could not accommodate agents the political system had not yet recognized.

**Limitations**:
- Lincoln's rhetoric evolved; later documents (Conkling Letter, doc_016) partially acknowledge Black soldiers
- The corpus is public rhetoric; Lincoln's private statements and actions (supporting the 13th Amendment) may show different patterns
- Absence in rhetoric does not imply absence in Lincoln's private understanding

---

## Finding 2: Absence of Disease-and-Purification Logic

**Claim** (pre-stated; confirm against corpus):

Lincoln's corpus contains zero instances of `disease_and_purification` fantasy type. No group is constructed as a pathogen that the national body must expel. This absence is the decisive structural difference from Hitler's rhetoric.

**Evidence**:
- Total `disease_and_purification` instances: expected 0 (populate)
- Candidate instances examined and excluded: — (document in annotation_notes)
- Temperance Address (doc_002): uses disease language for alcohol but does not construct a social group as pathogen; Lincoln explicitly refuses the reformer-as-judge position
- Any other candidate instances: —

**Why the absence is structural, not accidental**:

The wound/healing logic (Lincoln's primary frame) requires the wound to be reparable. Wounds come from outside — they are injuries, not infections. Healing is possible. This structural feature gives Lincoln's violence an exit condition: when the wound heals, the violence can stop.

Disease/purification logic (absent from Lincoln) requires the pathogen to be expelled. Pathogens come from inside — they are infections, not injuries. Healing requires elimination. This structural feature gives Hitler's violence no exit condition: as long as a carrier of the pathogen exists, purification is incomplete.

**Significance**:

"Malice toward none, charity for all" (Second Inaugural) is not merely a moral aspiration — it is a structural consequence of Lincoln's metaphor system. A rhetoric that has no disease/purification logic has no mechanism for constructing permanent enemies. The wound can heal; the oath can be fulfilled; the proposition can be proven; the debt can be paid; God's punishment can run its course. None of these has an infinitely extendable logic.

**Limitations**:
- The absence from Lincoln's rhetoric does not mean the absence from his era's broader political culture
- Some Lincoln contemporaries (radical abolitionists) did use purification language about slavery and slaveholders
- The finding requires negative confirmation: exhaustive search for candidate instances, explicit tracking in `disease_purification_absent` flag

---

## Finding 3: [Placeholder — populate after Stage 6]

**Claim**: [To be determined from analysis data]

Candidates:
- The guilt_distribution diachronic arc as structural precondition for Reconstruction
- The obligatory frame rate differential between formal_public_address and other registers
- Co-activation patterns between clusters at key moments (Second Inaugural, Gettysburg)

**Evidence**: —

**Significance**: —

**Limitations**: —

---

## Finding 4: [Placeholder — populate after Stage 6]

**Claim**: [To be determined from analysis data]

Candidates:
- The experiment/proof cluster as Lincoln-specific construct with no Hitler parallel
- The register differential in metaphor density (formal vs. legal)
- The diachronic shift from external to cosmic guilt distribution

**Evidence**: —

**Significance**: —

**Limitations**: —
