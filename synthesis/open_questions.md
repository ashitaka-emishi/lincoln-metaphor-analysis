---
draft: false
---

# Open Questions

*Interpretive problems requiring further investigation. Populate with findings from annotation.*

---

## 1. The Greeley Letter Reversal

**Problem**: The Greeley Letter (doc_012, August 1862) deploys the covenant cluster to argue *against* immediate emancipation. "If I could save the Union without freeing any slave I would do it." This is written two months before the Preliminary Emancipation Proclamation.

**Questions**:
- Is the Greeley Letter a sincere statement of Lincoln's priorities at that moment, or a rhetorical performance for a public audience?
- How does the covenant cluster's political function change between August 1862 (Union over freedom) and 1863-1865 (Union through freedom)?
- Does Lincoln ever explicitly revise his Greeley Letter position, or does he simply stop making that argument?
- What does this event tell us about the political flexibility of the covenant cluster — can the same metaphor support contradictory policies at different moments?

**Analytical approach**: Compare `cluster_02_covenant_oath` instances in doc_012 vs. doc_016 (Conkling Letter, one year later) vs. doc_021 (Second Inaugural). Track whether the obligatory_frame of the covenant shifts from "preserve Union" to "extend freedom."

---

## 2. The Seward Problem

**Problem**: The closing paragraphs of the First Inaugural (doc_009) were substantially drafted by Seward. The "mystic chords of memory" passage is Seward's most notable contribution. Lincoln's revisions are on record.

**Questions**:
- Does the metaphor profile of the Seward-revised passages differ from Lincoln's own passages in the same document?
- Does the "mystic chords" cluster_02 instance fit Lincoln's pattern or Seward's?
- If Lincoln's revisions preserved Seward's metaphors, does that constitute Lincoln's endorsement of them?
- Can we use the First Inaugural to make claims about Lincoln's metaphor system, or must all Seward-origin sentences be excluded?

**Analytical approach**: Run cluster_distribution twice for doc_009: full document and lincoln_sole_only. If the distributions differ significantly, the Seward contribution is analytically material.

---

## 3. The Audience Problem

**Problem**: The Lincoln-Douglas debates show clear audience-dependent metaphor suppression. At the Jonesboro debate (doc_006c, southern Illinois) and the Charleston debate (doc_006d), Lincoln suppresses or modifies clusters he deploys freely at northern venues.

**Questions**:
- Is Lincoln's metaphor system his genuine cognitive framework, or a toolkit he deploys strategically by audience?
- Does the suppression at hostile venues reflect *constraint* (what he could not say) or *calculation* (what he chose not to say)?
- If the equality-proposition cluster is suppressed at Charleston, does Lincoln privately hold the cluster's full implications?
- How does the private-fragment register (doc_011, doc_018) resolve this question?

**Analytical approach**: Compare cluster_distribution across all seven debates, controlling for venue. Compare to fragment_private documents. If Lincoln deploys the same clusters privately that he suppresses publicly at hostile venues, this supports the "constraint" interpretation.

---

## 4. The Black Soldiers Gap

**Problem**: ~180,000 Black Union soldiers served after January 1863. They are the most literal embodiment of Lincoln's war-period clusters (experiment/proof, sacrifice/redemption, new birth). They are largely absent from Lincoln's public rhetoric of sacrifice and rebirth.

**Questions**:
- Is Black soldiers' absence from the sacrificial economy complete, or do any documents partially include them?
- The Conkling Letter (doc_016) is the most promising candidate for partial acknowledgment — does it position Black soldiers as agents or as instruments?
- Does Lincoln's private rhetoric (fragments) differ from his public rhetoric on Black soldiers?
- What would it have required rhetorically for Lincoln to include Black soldiers in the "new birth of freedom" narrative?

**Analytical approach**: Focus analysis on all post-1863 documents. Track `black_soldiers_erased` instances. Compare to the one document that most directly addresses Black military service (doc_016). Note whether the Gettysburg Address — written while Black regiments were actively dying — contains any acknowledgment.

---

## 5. Corpus Limits vs. the Hitler Comparison

**Problem**: The Lincoln/Hitler comparison is structural — it compares metaphor architectures. But the comparison has an asymmetry: Lincoln's corpus is 29 documents over 27 years; the Hitler comparison is based on Koenigsberg's analysis of a larger and different corpus.

**Questions**:
- Does Koenigsberg's Hitler analysis use comparable methodology to this project's Lincoln analysis? If not, how do we control for methodological differences?
- Are there Lincoln documents not in this corpus that might contain disease_and_purification language?
- Are there periods in Lincoln's career (before 1838 or in private correspondence outside this corpus) where his rhetoric differs?
- Is the comparison valid at the level of ideology (which is what Koenigsberg claims) or does it risk collapsing into a moral comparison?

**Analytical approach**: The comparison must be clearly framed as structural, not moral. The project does not claim Lincoln and Hitler are morally equivalent. It claims their rhetoric shares certain structural features and differs in one decisive way. All Hitler-comparison claims should specify that they are about rhetorical structure, not about the men's moral status.

---

## Directions for Further Research

1. **Reception and audience**: How did Lincoln's audiences understand and respond to his metaphors? Contemporary newspaper accounts, diary entries, and letters provide partial evidence.

2. **Contemporaries**: How do Lincoln's clusters compare to other Union political figures (Seward, Chase, Sumner)? Does the experiment/proof cluster appear in other Republicans, or is it Lincoln-specific?

3. **Reconstruction failure**: If Lincoln's wound/healing logic provided an exit from the war, why did Reconstruction fail? Does the metaphor system itself contain the seeds of failure — does wound-healing logic underestimate the depth of structural damage?

4. **Confederate rhetoric**: Do Confederate leaders use the same six clusters? Different clusters? Notably, does Confederate rhetoric use disease_and_purification logic about Black freedom?

5. **20th-century political rhetoric**: Does the experiment/proof cluster persist in American political rhetoric after Lincoln? Does the disease_and_purification cluster appear in 20th-century American politics in ways it does not appear in Lincoln?

---

## Stage 7 LCC Validation: What Was Resolved and What Remains Open

*The Stage 7 benchmark comparison ([LCC Validation](../analysis/lcc_validation.md), completed 2026-05-02) resolved several open questions and opened new ones.*

**Resolved:**

- The absence of `disease_and_purification` logic is now confirmed as statistically anomalous against a general English baseline. DISEASE is the 4th most common source concept in the LCC corpus (100 instances); Lincoln routes it exclusively through wound/healing, never through pathogen/expulsion. This is not a general feature of political restraint — it is a structural choice specific to Lincoln's system.
- Cluster_02 (covenant/oath) and cluster_05 (founding fathers/inheritance) have no significant parallel in general English metaphor. These are Lincoln-specific political constructions, not default figurative vocabulary. The obligatory frame they carry is therefore not simply inherited from common English usage — it was built by Lincoln's particular source-domain selection.
- The absent domains now have quantified baselines: MOVEMENT (132 in LCC), BUILDING (91), MACHINE (74), GAME (57), ANIMAL (55). Lincoln's avoidance of these common domains is measurable, not merely asserted.

**Newly open:**

- **Why does Lincoln avoid CONFINEMENT?** CONFINEMENT appears 70 times in the LCC baseline and is entirely absent from Lincoln's political rhetoric — despite slavery being the central subject. Lincoln frames slavery's harm as wound (cluster_01) and as a violation of the founding covenant (cluster_02), never as imprisonment or confinement of persons. Does this avoidance reflect the limits of his legal/constitutional framework, which addressed slavery as a political institution rather than as a system of literal confinement?
- **Is the LCC en_large dataset a better baseline?** The en_small subset (~17k annotations, 8,724 valid) covers general news text. The en_large subset (~87k annotations) may reveal different concept frequencies. Key question: does COVENANT or INHERITANCE appear more prominently in the larger dataset, which would change the interpretation of cluster_02 and cluster_05 as Lincoln-specific?
- **Contemporaries against LCC**: If Seward, Chase, or Sumner were annotated using the same protocol and compared against LCC, would they show the same narrow cluster selection as Lincoln, or would their rhetoric use a broader range of English figurative domains?
