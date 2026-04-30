# Diachronic Tracking — Metaphor Shift Over Time

## Why Diachronic Analysis Matters

Lincoln's corpus spans 27 years (1838–1865). Treating it synchronically would miss the most analytically significant facts: certain clusters emerge only in specific phases, the guilt_distribution arc is a diachronic series, and the Second Inaugural's theological synthesis is incomprehensible without tracking how Lincoln got there from the Lyceum Address.

The diachronic argument is also the project's defense against cherry-picking: by tracking all 29 documents across time, we can show that the patterns are structural and not artifacts of document selection.

**Critical methodological requirement**: All diachronic claims must be register-controlled. A claim that "cluster_06 increases after 1862" could be an artifact of Lincoln giving more formal_public_addresses in that period. Always run the diachronic analysis twice: full corpus and register-controlled (formal_public_address only, or fragment_private only, depending on the claim).

---

## Five-Phase Structure

### Phase 1: Baseline (1838–1853)
Documents: doc_001, doc_002, doc_003

Key characteristics:
- Pre-political metaphor deployment. Lincoln does not yet have electoral stakes in his framework.
- Cluster_01 (body/organism) appears in proto-form in Lyceum Address — law as the nation's "political religion," the constitution as the "sober" structure protecting against passion.
- Cluster_02 (covenant) nascent in Temperance Address (oath of sobriety as political metaphor) and Clay Eulogy.
- Cluster_06 (Providence) absent or minimal.
- Experiment/proof frame absent.
- **Baseline significance**: these documents show the metaphor structures before they are weaponized in electoral combat. Any cluster present here is structurally deep, not rhetorically strategic.

### Phase 2: Argument (1854–1860)
Documents: doc_004, doc_005, doc_006a–g, doc_007

Key characteristics:
- Kansas-Nebraska Act forces Lincoln to fully articulate his theoretical framework on slavery and the Union.
- Cluster_03 (experiment/proposition) reaches full development at Peoria (doc_004) — the Declaration of Independence's equality claim as an unproven logical proposition that must be demonstrated.
- Cluster_02 (covenant) becomes adversarial — Lincoln argues the Kansas-Nebraska Act *violates* the founding covenant.
- Cluster_05 (fathers/inheritance) central at Cooper Union — Lincoln claims the founders' intent, citing them by name.
- Guilt distribution: primarily `external` — the slave power is constructing the problem.
- Disease_and_purification: watch especially for Peoria and the debates. Lincoln explicitly refuses this logic even when pressed.

### Phase 3: Obligation (1861)
Documents: doc_008, doc_009, doc_010, doc_011

Key characteristics:
- War transforms the metaphor system. Obligation becomes concrete.
- Cluster_02 (covenant) reaches its most explicit legal form — the Constitution as a sworn oath whose violation justifies military enforcement.
- Cluster_01 (body) intensifies — the House Divided metaphor becomes policy: the house cannot stand divided.
- First Inaugural (doc_009): all clusters present at once for the first time, with Seward's contribution in the closing.
- Constitution Fragment (doc_011): Lincoln theorizing his own metaphors privately. Highest epistemic value document in this phase.
- July 4 Message (doc_010): experiment/proof frame in administrative register — a test case for register comparison.

### Phase 4: Transformation (1862–1863)
Documents: doc_012, doc_013, doc_014, doc_015, doc_016, doc_017

Key characteristics:
- The Emancipation pivot: from Union-as-covenant to emancipation-as-birth.
- Greeley Letter (doc_012) is a suppression event: covenant cluster deployed to argue *against* emancipation. Track this as a crucial data point in the covenant cluster's political flexibility.
- Gettysburg (doc_017): the pivotal document. Birth cluster reaches full development. Sacrificial economy fully operational. Guilt distribution shifts toward `distributed` (both sides in the war). Black soldiers erased at exactly the moment the sacrifice/proof framework would most naturally include them.
- Guilt distribution arc: `external` (pre-1862) → beginning of `distributed` and `internal` signals (1862 Annual Message, doc_014).

### Phase 5: Theodicy (1864–1865)
Documents: doc_018, doc_019, doc_020, doc_021, doc_022

Key characteristics:
- Cluster_06 (Providence/theodicy) reaches full theological development.
- Second Inaugural (doc_021): all six clusters simultaneously active. Guilt distribution `distributed` and `cosmic`. Lincoln himself positioned as `lincoln_non_agent` at maximum — "the Almighty has His own purposes." Wound-and-healing closes the address as programmatic Reconstruction policy.
- Hodges Letter (doc_019): explicit first-person `lincoln_non_agent` statement. Proto-Second-Inaugural theodicy.
- Blind Memorandum (doc_018): private equivalence of public providence rhetoric — key epistemic test.

---

## Primary Analytical Series: Guilt Distribution Arc

This is the single most important diachronic series to track. Compute guilt_distribution value for every annotated instance and plot by document date.

Expected arc: `external` (Phase 1–2) → `external` with emerging `distributed` (Phase 3) → `distributed` + first `internal` instances (Phase 4) → `distributed` + `cosmic` (Phase 5).

The arc from `external` to `cosmic` is Lincoln's theological development: from "they caused this" to "God willed this and we are all instruments." This arc is the structural precondition for "malice toward none."

**Register-controlled version required**: does the guilt_distribution arc hold when looking at formal_public_address only? At semi_public_letter only? Divergence between registers would be a significant finding.

---

## Shift Events

A shift event is a document (or cluster of documents within 6 months) where a cluster's presence, intensity, or structural role changes significantly. Identify and document shift events in `diachronic_map.md`.

Format:
```
| Date       | Document    | Cluster           | Shift type        | Evidence |
|------------|-------------|-------------------|-------------------|---------|
| 1854-10-16 | Peoria      | cluster_03        | First full deploy | "...proposition..." |
| 1862-08-22 | Greeley Ltr | cluster_02        | Suppression event | Covenant cluster absent in letter defending Union |
| 1863-11-19 | Gettysburg  | cluster_04        | Synthesis event   | Birth cluster fuses with sacrifice and proof |
```

---

## Register-Controlled Analysis Requirement

Before claiming any diachronic trend, answer:
1. Does this trend hold within formal_public_address alone?
2. Does it hold within fragment_private alone?
3. If the trend appears only in certain registers, is it a diachronic trend or a register-composition artifact?

In practice: Phase 4 and 5 contain more formal_public_addresses than Phase 1-2. An apparent increase in any cluster in Phase 4-5 might simply reflect that Lincoln gave more formal speeches. Control for this before making a diachronic claim.

The analysis script (Stage 6) will compute `by_year` distributions. When writing narrative analysis, always cite both the raw diachronic figures and the register-controlled figures.
