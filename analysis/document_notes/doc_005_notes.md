---
doc_id: doc_005
title: "\"A House Divided\": Speech at Springfield, Illinois"
date: 1858-06-16
annotated: 2026-04-29
instances: inst_00065–inst_00067 (3 total)
extension_groups: ext_012
---

# doc_005 — House Divided Speech: Key Findings

## Instance Summary

| Instance | Sentence | Cluster | Linguistic Form | Notable |
|----------|----------|---------|-----------------|---------|
| inst_00065 | p07_s01 | cluster_01_body_organism | "A house divided against itself cannot stand" | biblical architectural frame; ext_012; conf 0.88 |
| inst_00066 | p08_s01 | cluster_01_body_organism | "this government cannot endure, permanently half slave and half free" | application of house frame to government; ext_012; conf 0.85 |
| inst_00067 | p09_s01 | cluster_01_body_organism | "the house to fall" | resolution predicted; ext_012; conf 0.83 |

## Primary Finding: Phase 1 Baseline — Only cluster_01 Active

The House Divided Speech is the most cluster-restricted major address in the Lincoln corpus. Only cluster_01 is present. Clusters 02–06 are entirely absent. This is the Phase 1 baseline — the document that establishes Lincoln's metaphor system before it has developed into the full six-cluster apparatus that will appear at the Gettysburg Address five years later.

The developmental arc is the corpus's most dramatic:
- House Divided (June 1858, Phase 1): 1 cluster, 3 instances, all cluster_01
- Cooper Union (February 1860, Phase 1b): to be annotated
- First Inaugural (March 1861, Phase 1c): to be annotated
- Gettysburg Address (November 1863, Phase 3): all 6 clusters, 13 instances, 10 sentences

The gap between House Divided (1 cluster) and Gettysburg (6 clusters) is the sharpest metaphor activation arc in the corpus — 55 months, 5 new clusters activated.

## Extension Group ext_012: The House-Divided Arc

The three instances form a three-sentence logical arc:
1. **inst_00065** (p07_s01): Premise — a biblical statement. "A house divided against itself cannot stand." The architectural frame is established via scripture (Mark 3:25). The source domain is structural: a house requires internal unity to stand.
2. **inst_00066** (p08_s01): Application — Lincoln maps the biblical premise to the political situation. "This government cannot endure, permanently half slave and half free." The word "endure" carries both structural (bear stress) and temporal (persist through time) senses simultaneously.
3. **inst_00067** (p09_s01): Resolution — the expected outcome. "I do not expect the house to fall." Lincoln predicts not dissolution but unification: the house will cease to be divided, become all one thing. The predicted resolution is structural, not martial — in 1858 Lincoln has not yet committed to war as the mechanism.

Together: biblical observation → political application → structural prediction. The three sentences compress the speech's entire argument.

## Architectural vs. Organic: cluster_01's Early Form

The House Divided instances are the architectural variant of cluster_01 (structure/building) rather than the organic variant (body/wound/health) that dominates later documents. Key distinctions:

- **Architectural** (doc_005): a house stands or falls; division produces collapse; the nation is a built structure requiring internal coherence
- **Organic** (doc_008, doc_017, doc_021): the nation has a life, can be wounded, has blood, can be reborn

The architectural variant treats failure as stress collapse; the organic variant treats failure as disease, injury, or death. Both belong to cluster_01 but carry different entailments:
- Architectural: the remedy is structural repair (restoring unity)
- Organic: the remedy can be purification, healing, or sacrifice

The House Divided Speech contains no healing language, no wound language, no blood language, no disease language. The nation is a building, not a body. `disease_and_purification` is not only absent but is incompatible with the architectural source domain used here.

## What the Absent Clusters Mean (1858)

The absence of clusters 02–06 in 1858 is not rhetorical poverty — the speech is rhetorically sophisticated. It is developmental evidence:

- **cluster_02 (covenant/oath) absent**: Lincoln argues constitutionally (Kansas-Nebraska, Dred Scott) but does not invoke the Constitution as a sacred bond or sworn oath. The constitutional frame is legal, not covenantal. The covenant register will emerge in the Inaugural addresses.
- **cluster_03 (experiment/proposition) absent**: The speech does not frame the republic as a logical proposition being tested. Lincoln argues empirically (here is the machinery; here is the evidence of design) but not within the experiment frame. Cooper Union (doc_007) will deploy cluster_03.
- **cluster_04 (birth/creation) absent**: No nativity language, no generative act. The crisis of 1858 has not yet been reframed as birth labor. Gettysburg's "new birth of freedom" is still 5 years away.
- **cluster_05 (fathers/inheritance) absent**: The founding fathers are not invoked as the authorizing lineage. Lincoln is arguing to a state Republican convention about the immediate political crisis (Kansas-Nebraska, Dred Scott), not to the nation about its foundational promise. The patrimony frame is not needed here.
- **cluster_06 (Providence/theodicy) absent**: No divine sanction, no God's judgment, no providential frame. The war has not started; the theodicy that will frame it has not yet been constructed.

## The Conspiracy Argument (Unannotated)

The extended timber-frame passage (p53_s02–p54_s01): "framed timbers...tenons and mortices exactly fitting...frame of a house or a mill." This is a distinct architectural metaphor from the house-divided frame: the slave-power conspiracy (Douglas, Pierce, Taney, Buchanan) is mapped to carpenters building from a common plan. The target is the conspiracy, not the nation. Evaluated for cluster_01 (confidence 0.58) — the national body is not the target here, the political actors are. Not annotated.

The p14 "piece of machinery" (confidence 0.55 for cluster_03): the Nebraska–Dred Scott apparatus as a mechanism. The machinery frame targets the slave-power apparatus, not the republic itself. The cluster_03 experiment frame maps the republic to a proposition; the machinery frame maps the conspiracy to a mechanism. Different source domains, different targets. Not annotated.

## `enslaved_people_non_agent` Assessment

The House Divided Speech discusses enslaved people primarily as the object of the slavery question — the thing being spread, restricted, or nationalized — not as agents. Lincoln's argument is entirely about white political actors (Douglas, Pierce, Taney, Buchanan, the Republicans). Enslaved people are structurally absent from the speech as agents. However, the document's focus is on the political crisis (the machinery, the conspiracy) rather than on the human reality of slavery, so the absence is register-appropriate for a political address to a Republican convention. Flag applies but is not as stark as in the Emancipation Proclamations.

## Absence Flags

- `enslaved_people_non_agent`: **FLAGGED** — enslaved people discussed as the object of political contestation, not as agents
- `black_soldiers_absent`: not applicable — pre-war document
- `disease_and_purification`: **ABSENT** — confirmed; architectural source domain makes this frame incompatible
- `lincoln_non_agent`: not flagged — Lincoln argues explicitly and commits to positions throughout
