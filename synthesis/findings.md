---
draft: false
---

# Findings

*Based on 136 annotated instances across 28 documents (1838–1865), six metaphor clusters, and 144 absence flags. Findings 2 and 4 are additionally supported by Stage 7 external validation against the LCC Metaphor Dataset: `en_small` (8,724 valid annotations) and optional `en_large` (52,118 valid annotations). See [LCC Benchmark Validation](../analysis/lcc_validation.md) and [Claim-To-Source Audit](claim_audit.md).*

**Publication status**: Evidence-backed synthesis page. Claims are stated at publication strength only when they have a Stage 4A evidence chain, Stage 6A controlled-output context, and a claim-audit handle. Remaining interpretive uncertainties are named in the limitations and open-questions sections.

---

## Finding 1: Systematic Absence of Enslaved People as Agents

**Claim** (confirmed against corpus):

Enslaved people are structurally present in Lincoln's metaphor universe — as cause of the wound, object of the proposition, subject of divine punishment, beneficiaries of the new birth — but are systematically absent from the roles the metaphors' entailments make available: healer, prover, inheritor, covenant party, agent. This absence is structural, not incidental: it is produced by the metaphor system's own logic.

**Audit**: [CLAIM-001](claim_audit.md#claim-001)

**Evidence**:
- `enslaved_people_non_agent` count: **47** (32.6% of all 144 absence flags)
- Present in all six clusters; all phases 1854–1865
- Highest in cluster_05 (founding fathers, 16) and cluster_02 (covenant, 10)
- Increases after emancipation: 23 of 47 flags are post-1863

**The sharpest test case — Black soldiers**:

Approximately 180,000 Black soldiers served in the Union army by the end of the war [@locBlackSoldiers]. Within this project's interpretive framework, they are especially direct potential agents in three war-period clusters:
- cluster_03: their performance was cited as proof of the democratic proposition
- cluster_04: their deaths contributed literally to the "new birth of freedom"
- cluster_06: their suffering fits the theodicy's shared punishment framework

`black_soldiers_erased` in post-1863 formal public-address instances: **7**. The Gettysburg Address does not mention Black soldiers; it followed the 54th Massachusetts's July 1863 assault on Fort Wagner [@nara54th]. These flags count annotated metaphor instances, not seven distinct speeches.

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

Lincoln's corpus contains **zero instances** of `disease_and_purification` fantasy type. No group is constructed as a pathogen that the national body must expel. This absence is the decisive structural difference from purification-based political rhetoric.

**Audit**: [CLAIM-002](claim_audit.md#claim-002)

**Evidence**:
- Total `disease_and_purification` instances: **0**
- `disease_purification_absent` flags (marking coded opportunities where it was available but not deployed): **56** — the largest absence category in the corpus
- Flags span all 6 clusters but are concentrated in four phases, three registers, and texts dated 1838–1862; the full-corpus zero count extends through 1865
- Highest rate in cluster_03 (experiment, 0.600 flags/instances) and cluster_01 (body, 0.441)
- The positive flags occur in formal addresses, campaign/debate speeches, and congressional messages; the corpus-wide zero count also covers the other included registers
- **LCC baselines (Stage 7)**: DISEASE is the 4th most common source concept in `en_small` (100 of 4,417 metaphorical instances) and ranks 10th in `en_large` (538 of 27,956 metaphorical instances) [@mohler2016]. Lincoln uses disease language in cluster_01, but never maps a social group as a pathogen requiring expulsion. The zero count is therefore notable relative to these modern general-English/news baselines, though they are not nineteenth-century political controls.

**Candidate instances examined and excluded**:
- doc_004 Peoria (1854): cancer/surgery language for slavery-as-institution (inst_00108) — disease targets the institution, not any social group
- doc_006g Alton (1858): "wen or a cancer… engraft it and spread it over your whole body" (inst_00132) — explicitly refuses the purifying-spread logic; spreading cancer is not a cure
- doc_002 Temperance (1842): disease language for alcohol — Lincoln explicitly refuses the reformer-as-judge position ("if they believe this story themselves, they should also believe in the cure")

**Why the absence is structural, not accidental**:

The wound/healing logic (Lincoln's primary frame) requires the wound to be reparable. Wounds come from outside — they are injuries, not infections. Healing is possible. This gives Lincoln's violence an exit condition: when the wound heals, the violence can stop.

Disease/purification logic (absent from Lincoln) requires the pathogen to be expelled. Pathogens can come from inside — they are infections, not injuries. Healing requires elimination. This gives purifying violence no exit condition: as long as any carrier of the pathogen exists, purification is incomplete.

**Significance**:

The coded architecture helps make "malice toward none, charity for all" rhetorically available. In this corpus, the wound can heal; the oath can be fulfilled; the proposition can be proven; the debt can be paid; and divine punishment can run its course. None of these mappings requires a permanent enemy. This supports a structural account of reconciliation without excluding political prudence, theology, genre, or historical circumstance.

**Limitations**:
- The absence from Lincoln's rhetoric does not mean its absence from his era's broader political culture; no implemented contemporary Union, Confederate, abolitionist, or presidential-register benchmark currently tests that broader historical question
- Some Lincoln contemporaries (radical abolitionists) did use purification language about slavery and slaveholders
- The finding requires negative confirmation, which is methodologically weaker than a positive finding. The 56 opportunity flags strengthen the zero count but are concentrated in 1838–1862; the LCC baselines establish only that DISEASE is prominent in modern general-news English, not in Lincoln's political context

---

## Finding 3: Diachronic Cluster Shift — Founding Fathers to Providence

**Claim** (emerging from analysis data):

Lincoln's metaphor system shows a marked late-war shift. Cluster_05 (founding fathers as inheritance) — the largest cluster in the corpus (35 instances) — disappears after the Gettysburg Address (last attestation: 1863-11-19). Cluster_06 (Providence/theodicy) falls from 6 instances in 1861 to 1 in 1862, then rises to 4 in 1863, 4 in 1864, and 5 in 1865. The data support a late-war movement from founding inheritance toward providential interpretation, not monotonic growth.

**Audit**: [CLAIM-003](claim_audit.md#claim-003)

**Evidence**:
- cluster_05 by year: 1838:4, 1854:5, 1858:17 (peak), 1860:4, 1861:4, 1863:1 (terminal), then 0 through 1865
- cluster_06 by year: 1852:2, 1861:6, 1862:1, 1863:4, 1864:4, 1865:5 (a 1862 trough followed by late-war growth)
- Gettysburg (1863) is the hinge: cluster_05 appears ("our fathers brought forth") and then passes the torch to cluster_03 ("testing whether that nation can long endure") and cluster_04 ("new birth of freedom") — founding generation acknowledged and superseded in the same address
- Second Inaugural (1865): cluster_05 entirely absent; cluster_06 at 4 instances; cluster_01 at 8 instances (Reconstruction form)

**Why the transition happened**:

The founding-fathers frame was politically powerful for the anti-extension argument (1854–1860): Lincoln could oppose slavery extension as a conservative defending the founders' intent. But after emancipation (January 1863), defending the founders' legacy became a liability — the founders tolerated slavery. Invoking them to justify emancipation required acknowledging their ambivalence.

Theodicy (cluster_06) offered a different warrant: it grounded the war's meaning in God's will rather than solely in the founders' intention. In the coded late-war texts, that frame can accommodate emancipation as divine punishment for slavery in a way the idealized inheritance frame does not.

**Significance**:

The cluster shift is theological as well as political: the late corpus places greater weight on God's inscrutable purposes, punishment for sin, and providential instrumentality. The Second Inaugural is the clearest concentration of that pattern. The corpus supports this rhetorical description; it does not establish how audiences received or contested it.

---

## Finding 4: Obligatory Frame as Near-Universal Feature

**Claim** (confirmed from analysis data):

The obligatory frame — the structural feature that makes violence feel mandatory rather than chosen — is nearly universal across Lincoln's metaphor system. Four of six clusters achieve obligatory_frame_rate of 1.000; the remaining two exceed 0.750. No cluster in the corpus has an obligatory_frame_rate below 0.750.

**Audit**: [CLAIM-004](claim_audit.md#claim-004)

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

The prevalence of the obligatory frame is a major structural feature of Lincoln's violence-authorizing rhetoric. Across annotated instances, Lincoln repeatedly presents prosecuting the war as fulfilling obligations imposed by oaths, founding commitments, experiments, inheritances, wounds, or divine purposes. This framing can background the contingency of political decisions without proving that Lincoln or his audiences experienced no choice.

**LCC benchmark context (Stage 7)**: cluster_02 (covenant/oath) and cluster_05 (founding fathers/inheritance) have no direct category match in the LCC taxonomy. This makes them analytically distinctive relative to that dataset, but it does not establish that they were rare in nineteenth-century political rhetoric or unique to Lincoln. A contemporary comparison corpus is required for that stronger claim.

**Limitations**:
- The obligatory frame does not prove that Lincoln cynically manufactured justifications — it may reflect his genuine psychological experience of the war as obligatory
- The Greeley Letter (1862) shows the obligatory frame being deployed to resist emancipation, which reveals its political ambiguity: the same structure that makes the war obligatory can make emancipation contingent

---

## Finding 5: Cluster_01 and Cluster_06 Persist While Others Terminate

**Claim** (emerging from diachronic data):

Of the six clusters, only two are active from first to last attestation in the corpus and are present in the Second Inaugural (1865): cluster_01 (body/organism, 1838–1865) and cluster_06 (Providence/theodicy, 1852–1865). Three clusters terminate before the Second Inaugural: cluster_03 (last attestation 1864), cluster_04 (present in Last Address but absent from Second Inaugural), cluster_05 (last attestation 1863). Cluster_02 (covenant) persists with diminishing density through 1865.

**Audit**: [CLAIM-005](claim_audit.md#claim-005)

**Evidence**:
- cluster_01 in Second Inaugural: 8 instances — the single-document peak for this cluster in the entire corpus
- cluster_06 in Second Inaugural: 4 instances
- cluster_05 in Second Inaugural: 0 instances (absent)
- cluster_03 in Second Inaugural: 0 instances (absent)
- Second Inaugural total: 13 instances — the most metaphorically dense formal address in the corpus (matching or exceeding the debate-era density)

**Significance**:

The Second Inaugural is not a continuation of Lincoln's pre-war rhetoric — it is a transformation. The two foundational clusters (body, Providence) persist and are present in full force. The three argument-era clusters (founding fathers, experiment, covenant) are absent or diminished. The Second Inaugural deploys the metaphor system stripped to its war-meaning essentials: the nation's body must be healed; God's punishment must be endured. Everything else — the founders' intent, the democratic proposition, the constitutional oath — has been consumed by the war's enormity.
