---
draft: false
---

# Findings

*Based on 136 annotated instances across 28 documents (1838–1865), six metaphor clusters, and 144 absence flags. Findings 2 and 4 are additionally supported by Stage 7 external validation against the LCC Metaphor Dataset (8,724 general English annotations). See [LCC Benchmark Validation](../analysis/lcc_validation.md).*

---

## Finding 1: Systematic Absence of Enslaved People as Agents

**Claim** (confirmed against corpus):

Enslaved people are structurally present in Lincoln's metaphor universe — as cause of the wound, object of the proposition, subject of divine punishment, beneficiaries of the new birth — but are systematically absent from the roles the metaphors' entailments make available: healer, prover, inheritor, covenant party, agent. This absence is structural, not incidental: it is produced by the metaphor system's own logic.

**Evidence**:
- `enslaved_people_non_agent` count: **47** (32.6% of all 144 absence flags)
- Present in all six clusters; all phases 1854–1865
- Highest in cluster_05 (founding fathers, 16) and cluster_02 (covenant, 10)
- Increases after emancipation: 23 of 47 flags are post-1863

**The sharpest test case — Black soldiers**:

~180,000 Black Union soldiers served after January 1863. They are the most literal embodiment of all three war-period clusters:
- cluster_03: their performance was cited as proof of the democratic proposition
- cluster_04: their deaths contributed literally to the "new birth of freedom"
- cluster_06: their suffering fits the theodicy's shared punishment framework

`black_soldiers_erased` in post-1863 formal public addresses: **7** — Black soldiers are absent from the agent roles of every formal address after January 1863. The Gettysburg Address (November 1863, two months after the 54th Massachusetts's assault on Fort Wagner) does not mention Black soldiers.

The partial exception: Conkling Letter (doc_016, semi-public letter) — inst_00059 acknowledges Black soldiers as proof-evidence for the democratic proposition. This acknowledgment appears in a letter, not in a formal public address.

**Significance**:

The systematic absence reveals the limits of Lincoln's civic framework. The metaphor system was built on categories (citizen, heir, prover, healer, covenant party) whose de facto membership excluded Black Americans even when the de jure logic of the Declaration required their inclusion. The metaphors could not accommodate agents the political system had not yet recognized.

**Limitations**:
- Lincoln's rhetoric evolved; the Conkling Letter (1863) partially acknowledges Black soldiers
- The corpus is public rhetoric; Lincoln's private statements and actions (supporting the 13th Amendment) may show different patterns
- Absence in rhetoric does not imply absence in Lincoln's private understanding

---

## Finding 2: Absence of Disease-and-Purification Logic

**Claim** (confirmed against corpus):

Lincoln's corpus contains **zero instances** of `disease_and_purification` fantasy type. No group is constructed as a pathogen that the national body must expel. This absence is the decisive structural difference from Hitler's rhetoric.

**Evidence**:
- Total `disease_and_purification` instances: **0**
- `disease_purification_absent` flags (marking every opportunity where it was available but not deployed): **56** — the largest absence category in the corpus
- Flags span all 6 clusters, all phases 1838–1865, all registers
- Highest rate in cluster_03 (experiment, 0.600 flags/instances) and cluster_01 (body, 0.441)
- Register-independent: absent from formal addresses, debates, congressional messages, letters alike
- **LCC baseline (Stage 7)**: DISEASE is the 4th most common source concept in general English metaphor (100 of 4,417 metaphorical instances in the LCC en_small corpus). Lincoln uses disease language in cluster_01, but exclusively as wound/injury — never as pathogen requiring expulsion. The zero count for `disease_and_purification` is therefore anomalous against a measurable general-language baseline, not merely against an assumed norm.

**Candidate instances examined and excluded**:
- doc_004 Peoria (1854): cancer/surgery language for slavery-as-institution (inst_00108) — disease targets the institution, not any social group
- doc_006g Alton (1858): "wen or a cancer… engraft it and spread it over your whole body" (inst_00132) — explicitly refuses the purifying-spread logic; spreading cancer is not a cure
- doc_002 Temperance (1842): disease language for alcohol — Lincoln explicitly refuses the reformer-as-judge position ("if they believe this story themselves, they should also believe in the cure")

**Why the absence is structural, not accidental**:

The wound/healing logic (Lincoln's primary frame) requires the wound to be reparable. Wounds come from outside — they are injuries, not infections. Healing is possible. This gives Lincoln's violence an exit condition: when the wound heals, the violence can stop.

Disease/purification logic (absent from Lincoln) requires the pathogen to be expelled. Pathogens can come from inside — they are infections, not injuries. Healing requires elimination. This gives purifying violence no exit condition: as long as any carrier of the pathogen exists, purification is incomplete.

**Significance**:

"Malice toward none, charity for all" is not merely a moral aspiration — it is a structural consequence of Lincoln's metaphor system. A rhetoric that has no disease/purification logic has no mechanism for constructing permanent enemies. The wound can heal; the oath can be fulfilled; the proposition can be proven; the debt can be paid; God's punishment can run its course. None of these has an infinitely extendable logic. This is the structural reason Lincoln's rhetoric could move toward reconciliation while Hitler's could only move toward annihilation.

**Limitations**:
- The absence from Lincoln's rhetoric does not mean its absence from his era's broader political culture
- Some Lincoln contemporaries (radical abolitionists) did use purification language about slavery and slaveholders
- The finding requires negative confirmation, which is methodologically weaker than positive finding — the 56 absence flags are the evidence that this negative result is structural rather than coincidental; the LCC baseline partially addresses this weakness by establishing that the absent domain is not rare in English but actively common

---

## Finding 3: Diachronic Cluster Shift — Founding Fathers to Providence

**Claim** (emerging from analysis data):

Lincoln's metaphor system undergoes a fundamental phase transition between 1863 and 1865. Cluster_05 (founding fathers as inheritance) — the largest cluster in the corpus (35 instances) — disappears entirely after the Gettysburg Address (last attestation: 1863-11-19). Cluster_06 (Providence/theodicy) grows monotonically through the war and dominates the Second Inaugural (1865). The founding-fathers frame is replaced by divine-will theodicy as the primary ground of the war's legitimacy.

**Evidence**:
- cluster_05 by year: 1838:4, 1854:5, 1858:17 (peak), 1860:4, 1861:4, 1863:1 (terminal), then 0 through 1865
- cluster_06 by year: 1852:2, 1861:6, 1862:1, 1863:4, 1864:4, 1865:5 (growing through war)
- Gettysburg (1863) is the hinge: cluster_05 appears ("our fathers brought forth") and then passes the torch to cluster_03 ("testing whether that nation can long endure") and cluster_04 ("new birth of freedom") — founding generation acknowledged and superseded in the same address
- Second Inaugural (1865): cluster_05 entirely absent; cluster_06 at 4 instances; cluster_01 at 8 instances (Reconstruction form)

**Why the transition happened**:

The founding-fathers frame was politically powerful for the anti-extension argument (1854–1860): Lincoln could oppose slavery extension as a conservative defending the founders' intent. But after emancipation (January 1863), defending the founders' legacy became a liability — the founders tolerated slavery. Invoking them to justify emancipation required acknowledging their ambivalence.

Theodicy (cluster_06) solved this problem: it grounded the war's meaning not in the founders' intention but in God's will. God's purposes exceed the founders' — and God's theodicy can accommodate emancipation as divine punishment for slavery in a way the founders' legacy cannot.

**Significance**:

The cluster shift is not merely rhetorical; it is theological and political. Lincoln's deepest public persuasion resource shifts from civic-rational (the founders, the proposition, the experiment) to theological (God's inscrutable purposes, punishment for sin, providential instrument). The Second Inaugural is the result. It is unanswerable as rhetoric precisely because it grounds the war's meaning in God's will — which cannot be contested by human argument.

---

## Finding 4: Obligatory Frame as Universal Feature

**Claim** (confirmed from analysis data):

The obligatory frame — the structural feature that makes violence feel mandatory rather than chosen — is nearly universal across Lincoln's metaphor system. Four of six clusters achieve obligatory_frame_rate of 1.000; the remaining two exceed 0.750. No cluster in the corpus has an obligatory_frame_rate below 0.750.

**Evidence**:
- cluster_02 covenant: 1.000
- cluster_03 experiment: 1.000
- cluster_05 fathers: 1.000
- cluster_01 body: 0.882
- cluster_06 providence: 0.909
- cluster_04 birth: 0.750

**Mechanisms by cluster**:
- cluster_01: If the nation is wounded, the physician must act — wounds demand treatment
- cluster_02: If an oath is sworn and broken, it must be enforced — oaths bind
- cluster_03: If an experiment is running, it must be completed — proof requires conclusion
- cluster_04: If a birth is in progress, labor cannot be stopped — generative acts complete themselves
- cluster_05: If an inheritance is received, it must be maintained — heirs have duties
- cluster_06: If God has purposes, they must be accomplished — Providence cannot be resisted

**Significance**:

The universality of the obligatory frame is the most important single structural feature of Lincoln's rhetoric as an authorization of mass violence. Lincoln is never *choosing* to prosecute the war — he is *fulfilling obligations* imposed by prior commitments (the oath, the founding, the experiment, the inheritance, God's purposes). The war is not a policy choice; it is a logical necessity. This effaces the political nature of the decision to continue fighting at each critical juncture where negotiated peace was possible.

**LCC validation (Stage 7)**: The two clusters with 100% obligatory frame rates — cluster_02 (covenant/oath) and cluster_05 (founding fathers/inheritance) — have no significant parallel in the LCC general English metaphor baseline. CONTRACT/OATH and INHERITANCE/PATRIMONY do not appear as prominent source-concept categories in the LCC taxonomy. This confirms that the obligatory force of these clusters was not inherited from common English figurative usage; it was architecturally constructed by Lincoln's specific choice of source domains. The war felt obligatory in part because Lincoln's rhetoric selected the two source domains in the English language most saturated with binding duty — and both are domains ordinary English speakers rarely use for political metaphor.

**Limitations**:
- The obligatory frame does not prove that Lincoln cynically manufactured justifications — it may reflect his genuine psychological experience of the war as obligatory
- The Greeley Letter (1862) shows the obligatory frame being deployed to resist emancipation, which reveals its political ambiguity: the same structure that makes the war obligatory can make emancipation contingent

---

## Finding 5: Cluster_01 and Cluster_06 Persist While Others Terminate

**Claim** (emerging from diachronic data):

Of the six clusters, only two are active from first to last attestation in the corpus and are present in the Second Inaugural (1865): cluster_01 (body/organism, 1838–1865) and cluster_06 (Providence/theodicy, 1852–1865). Three clusters terminate before the Second Inaugural: cluster_03 (last attestation 1864), cluster_04 (present in Last Address but absent from Second Inaugural), cluster_05 (last attestation 1863). Cluster_02 (covenant) persists with diminishing density through 1865.

**Evidence**:
- cluster_01 in Second Inaugural: 8 instances — the single-document peak for this cluster in the entire corpus
- cluster_06 in Second Inaugural: 4 instances
- cluster_05 in Second Inaugural: 0 instances (absent)
- cluster_03 in Second Inaugural: 0 instances (absent)
- Second Inaugural total: 13 instances — the most metaphorically dense formal address in the corpus (matching or exceeding the debate-era density)

**Significance**:

The Second Inaugural is not a continuation of Lincoln's pre-war rhetoric — it is a transformation. The two foundational clusters (body, Providence) persist and are present in full force. The three argument-era clusters (founding fathers, experiment, covenant) are absent or diminished. The Second Inaugural deploys the metaphor system stripped to its war-meaning essentials: the nation's body must be healed; God's punishment must be endured. Everything else — the founders' intent, the democratic proposition, the constitutional oath — has been consumed by the war's enormity.
