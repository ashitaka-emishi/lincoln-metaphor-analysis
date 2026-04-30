---
draft: false
---

# Cluster 03: Republic as Experiment / Proposition

**Cluster ID**: `cluster_03_experiment_proposition`
**Source domain**: logical proof, scientific test
**Target domain**: democratic self-government
**Instance count**: 20 (first attested 1838-01-27; last attested 1864-11-10)

---

## CMT Profile

### Source → Target Mapping

| Source domain element | Target domain element |
|-----------------------|-----------------------|
| proposition to be proven | the claim that self-government is viable |
| experiment / test | the American republic as a historical trial |
| proof / demonstration | the republic's survival and success |
| failure of proof | collapse of democratic government globally |
| the founders | scientists who designed and ran the experiment |
| the present generation | those who must maintain and complete the proof |
| the war | the decisive test of the experiment |
| the outcome | evidence for or against self-government worldwide |

### Representative Instance Table

| instance_id | document | date | span_text | confidence |
|-------------|----------|------|-----------|------------|
| inst_00003–004 | doc_001 Lyceum | 1838-01-27 | democratic experiment, undecided at founding | 0.90 |
| inst_00011 | doc_002 Temperance | 1842-02-22 | moral revolution as proof | 0.83 |
| inst_00047–049 | doc_003 Clay Eulogy | 1852-07-06 | experiment-as-completed-proof arc | 0.88–0.85 |
| inst_00038 | doc_005 House Divided | 1858-06-16 | novel experiment deployment | 0.90 |
| inst_00082–084 | doc_007 Cooper Union | 1860-02-27 | founders-as-scientists arc | 0.92–0.88 |
| inst_00087–093 | doc_010 Annual Message 1861 | 1861-12-03 | war as decisive test (ext_014, ext_016) | 0.95–0.88 |
| inst_00095–096 | doc_014 Annual Message 1862 | 1862-12-01 | proof obligation across generations | 0.88–0.85 |
| inst_00059 | doc_016 Conkling Letter | 1863-08-26 | proof-with-Black-soldier evidence | 0.88 |
| inst_00098 | doc_017 Gettysburg | 1863-11-19 | "testing whether that nation… can long endure" | 0.98 |
| inst_00103 | doc_020 | 1864 | experiment arc near end of war | 0.85 |

### Dominant Linguistic Forms

1. **Clause** — the source-domain test is fully predicated ("testing whether that nation can long endure," "whether this experiment has proven successful")

### Top Entailments by Frequency

1. The founding generation ran the experiment — they were the scientists who designed and executed the test
2. The "undecided" status was genuine uncertainty — the outcome was not predetermined
3. The experiment is now complete at certain moments ("successful" in past tense) — the proof has been made
4. If the proof is made, the subsequent problem is motivating the next generation to maintain what was already proven
5. The founding generation demonstrated rather than argued — they proved self-governance's viability through action

### Novel Instances

- `inst_00038` — House Divided 1858: novel deployment connecting the experiment frame to the slavery crisis as a potential disproof

### Extended Metaphor Groups in This Cluster

| ext_id | document | arc description |
|--------|----------|-----------------|
| ext_003 | doc_001 | Lyceum experiment arc |
| ext_008 | doc_009/010 | war-period co-activation with covenant |
| ext_010 | doc_003 | Clay Eulogy proof-as-completed arc |
| ext_014 | doc_010 | Annual Message 1861 decisive-test arc |
| ext_016 | doc_010 | supplementary proof arc |

---

## Diachronic Distribution

### By Year (with register)

| Year | Instance count | Register(s) | Key document(s) |
|------|----------------|-------------|-----------------|
| 1838 | 3 | formal_public_address | doc_001 Lyceum |
| 1842 | 1 | formal_public_address | doc_002 Temperance |
| 1852 | 1 | formal_public_address | doc_003 Clay Eulogy |
| 1861 | 6 | congressional_message | doc_010 Annual Message 1861 |
| 1862 | 2 | congressional_message | doc_014 Annual Message 1862 |
| 1863 | 4 | formal + semi-public | doc_017 Gettysburg + doc_016 |
| 1864 | 3 | formal | doc_020 |

**Trajectory**: The most structurally distinctive diachronic pattern in the corpus — **dormant for 22 years** (1838 → no attestation 1854–1860 → reactivated 1861). The experiment/proof frame is Lincoln's 1838 framing of political obligation, but it plays almost no role in his debate-era anti-slavery argument (Phase 2). It re-emerges as the dominant congressional frame when the war begins. The last attestation is 1864-11-10 — the cluster does not appear in the Second Inaugural (1865), where cluster_06 (theodicy) fully dominates.

**Key observation**: Cluster_03 has zero instances in the debate corpus (1854–1860) despite cluster_05 (founders) having 17 instances in that period. Lincoln makes the ancestral inheritance argument in debates but not the experiment/proof argument. The proof frame returns for legislative audiences (congressional messages) and the formal war-justification addresses.

### Shift Events

| Date | Document | Shift type | Evidence |
|------|----------|------------|---------|
| 1838-01-27 | Lyceum | First attestation | Experiment framing of democratic republic — undecided at founding |
| 1852-07-06 | Clay Eulogy | Proof-as-completed | "The experiment has proven successful" — past tense, completion |
| 1861-12-03 | Annual Message | Reactivation | War as decisive test — proof frame returns with full force for congressional audience |
| 1863-11-19 | Gettysburg | War-period peak | "testing whether that nation… can long endure" — canonical formulation |
| 1864-11-10 | Last attestation | Terminus | Experiment frame disappears before the war ends; theodicy supplants proof |

---

## Koenigsberg Profile

**Fantasy type (dominant)**: `experiment_and_proof` — this is the only cluster in the corpus where this fantasy type is dominant

**Violence logic (dominant)**: `evidentiary` — the war's outcome is evidence for or against the proposition; violence is the test that generates proof

**Obligatory frame rate**: **1.000** — tied with cluster_02 for highest in corpus. If the proposition must be proven, the generation that inherits the experiment must complete the proof. There is no opting out of the evidentiary obligation.

**Projected entity (dominant)**: `founding_proposition` — the Declaration's claim that all men are created equal, externalized as an object requiring proof

**Guilt distribution (dominant)**: `external`

**Sacrificial economy rate**: **0.550** — the highest in the corpus. More than half of cluster_03 instances activate sacrificial yield logic: soldier deaths *prove* the proposition. This is the theological logic of Gettysburg — they died so that government of the people, by the people, for the people shall not perish. The death is the evidence.

**Dominant psychic defense**: `displacement` — agency and responsibility displaced onto the abstract requirement of proof

### Absence Flags Distribution

| Flag | Count | Analytical note |
|------|-------|-----------------|
| `disease_purification_absent` | 12 | Proof logic never becomes purity logic — the proposition can be disproved but not contaminated |
| `enslaved_people_non_agent` | 4 | Enslaved people are the object of the proposition being tested, not agents proving it |
| `black_soldiers_erased` | 1 | doc_016 Conkling Letter (inst_00059) is the exception: Black soldiers cited as proof-evidence |
| `confederates_depersonalized` | 1 | The test's opponents are abstract (those who deny the proposition), not named |
| `lincoln_non_agent` | 1 | |
| `death_abstracted` | 1 | |
| `women_absent` | 0 | |

**Critical absence — `enslaved_people_non_agent`**: Enslaved people are the most directly affected by the proposition being tested — the proposition that "all men are created equal" is precisely about whether people like them count as equal. Yet in cluster_03, they appear as the proposition's object, not its prover. The Conkling Letter (inst_00059) is the lone exception where Black soldiers are cited as evidentiary agents.

---

## Political and Moral Work

1. **Epistemic humility embedded in violence**: The experiment can fail. A proposition can be disproved. This acknowledgment of fallibility is structurally absent from Hitler's certainty. Lincoln's violence logic holds open the possibility that the test could go wrong — and therefore requires completing it correctly.

2. **Universal stakes**: The experiment is not just for Americans. If democratic self-government fails here, it fails for humanity. This universalism makes the war's violence justifiable by global stakes — the proof is for the world.

3. **Sacrificial economy at maximum**: With a 0.55 sacrificial_economy_rate, cluster_03 is where soldier deaths most clearly become evidence. Gettysburg is the canonical case: the dead did not die in vain because their deaths completed a proof.

4. **Register selectivity**: Cluster_03 appears primarily in congressional messages and formal addresses — not in debates or letters. The proof-frame is for audiences expected to understand argument-structure: Congress, the educated public at Cooper Union, the crowd at Gettysburg. This is the most intellectually demanding of Lincoln's metaphor clusters.

---

## What the Metaphor Conceals

- **Who is being proven equal?** The proposition that "all men are created equal" is proven by the republic's survival — but the republic's survival was purchased by soldiers, many of whom were enslaved people or their descendants, whose equality was not yet legally recognized. The proof structure conceals this irony.
- **What if the experiment fails?** The experiment/proof frame creates enormous anxiety: if the Confederacy wins, it disproves democratic self-government. This catastrophizing logic makes any compromise feel like it disproves the proposition.
- **The gap between claim and proof**: Lincoln frames the Declaration as a proposition *to be proven* — "all men are created equal" is not a fact but a claim requiring demonstration. This reframes abolition as evidentiary necessity rather than moral imperative.

---

## Hitler Comparison

**Hitler parallel cluster**: None. Lincoln-specific construct.

**Shared violence logic**: `evidentiary` (surface only — Hitler does not construct violence as proof of a proposition; violence is racial destiny, not evidentiary)

**Structural divergence**: Lincoln constructs democratic self-government as an unproven proposition that the war must demonstrate. Violence is evidentiary — its outcome proves or disproves the proposition. Hitler constructs racial struggle as an already-known biological necessity — there is no proposition that could be disproved, no experiment that could fail.

**Lincoln-specific constructs**: `experiment_and_proof`; democratic proposition; war as decisive test; epistemic humility (the experiment can fail)

**Hitler-specific constructs**: (none parallel to this cluster)

**Analytical significance**: Cluster_03 is arguably Lincoln's most distinctive rhetorical achievement — importing scientific/logical epistemology into political violence. The acknowledgment that the experiment could fail is the structural opposite of Hitler's certainty. Uncertainty generates humility; certainty generates totalizing violence.

---

## Key Quoted Instances

### "Testing whether that nation… can long endure" (doc_017 Gettysburg, 1863)
The canonical experiment instance. The war is a test — not a punishment, not a crusade, but an experiment whose outcome will determine whether democratic self-government is viable. The dead soldiers are the evidence. This formulation appears after the 54th Massachusetts's assault on Fort Wagner — but does not mention Black soldiers, who are simultaneously proving the proposition with their bodies while being erased from the proof-frame.

### Annual Message 1861 decisive-test arc (doc_010, ext_014/016)
Six instances in one document — the densest cluster_03 concentration in the corpus. Lincoln writing to Congress deploys the experiment frame for a legislative audience. The congressional message register explains the density: this is argument-to-argument, not oratory.

### Clay Eulogy — proof-as-completed (doc_003, 1852)
"The experiment has proven successful" — past tense. The proof is made. This creates the subsequent problem Lincoln identifies: if the experiment is done, what motivates the next generation to maintain what was already proven? The 1852 formulation establishes the intergenerational obligation that the war-period cluster_03 instances activate.
