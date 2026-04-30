---
doc_id: doc_013
title: "Preliminary Emancipation Proclamation"
date: 1862-09-22
annotated: 2026-04-29
instances: inst_00052–inst_00053 (2 total)
extension_groups: none
---

# doc_013 — Preliminary Emancipation Proclamation: Key Findings

## Instance Summary

| Instance | Sentence | Cluster | Linguistic Form | Notable |
|----------|----------|---------|-----------------|---------|
| inst_00052 | p06_s01 | cluster_02_covenant_oath | "restoring the constitutional relation" | conf 0.62; suppression_flag; war aim statement |
| inst_00053 | p18_s01 | cluster_02_covenant_oath | "restoration of the constitutional relation" | conf 0.62; suppression_flag; compensation clause |

## Primary Finding: The Most Metaphorically Stripped Document

The Preliminary Emancipation Proclamation is the most metaphorically stripped document in the corpus. Two instances annotated — both below the 0.65 confidence borderline, both the same legal formula repeated — and five of six clusters entirely absent. The document that is the most significant political act of Lincoln's presidency contains no metaphor system.

This is not a rhetorical failure. It is deliberate register choice: emancipation framed as a military-legal measure, not an ideological commitment. The legal_document register performs its constitutive function — it enacts, it does not persuade.

**What is absent:**
- cluster_01 (body/organism): no wound, no health, no severance
- cluster_03 (experiment/proposition): no proposition to test, no demonstration
- cluster_04 (birth/creation): no nativity language, no new creation
- cluster_05 (fathers/inheritance): no founding lineage, no patrimony
- cluster_06 (providence/theodicy): no divine justification, no God

**What survives:** cluster_02 at its legal minimum — the bare formula "restoring the constitutional relation," which carries faint covenant resonance (the relation as a compact that can be suspended and restored) but strips all elaboration: no oath language, no sacred bond, no covenant violation narrative.

## The Formula as Lincoln's Chosen Language

inst_00052 (p06_s01) and inst_00053 (p18_s01) use variants of the same phrase: "restoring the constitutional relation" / "restoration of the constitutional relation." The repetition is significant: this is not boilerplate inherited from a clerk or precedent document. It is Lincoln's chosen legal formula for the war aim.

Compare to the Greeley Letter (doc_012, August 22, one month earlier), which frames the war aim as "save the Union" with zero metaphorical elaboration. Both documents — one public, one legal — arrive at the same ideological suppression: the stripped formula. The Constitution Fragment (doc_011) had theorized that the Union/Constitution (picture of silver) exists to preserve the Liberty proposition (apple of gold). Neither the Greeley Letter nor this Proclamation mentions Liberty. The apple has been set aside.

## The Compensation Clause and Enslaved People as Property

p18_s01 (inst_00053) is the compensation clause. Loyal slaveholders are to be compensated "for all losses by acts of the United States, including the loss of slaves."

Enslaved people appear in this document exclusively as objects of property loss — a category of compensable damage to be reimbursed to their owners. This is the most explicit property-framing of enslaved people in the Lincoln corpus. It is not annotated as a CMT metaphor (it is literal legal language), but it is the starkest instance of `enslaved_people_non_agent` in the corpus:

- The Greeley Letter suppresses enslaved people by not mentioning them in a political argument
- The Second Inaugural suppresses them by abstraction (the war is about "the bondsman's two hundred and fifty years of unrequited toil")
- This Proclamation makes them present only as property — visible as objects, invisible as agents

The document that frees (some of) them frames them, in the same text, as compensable loss.

## Diachronic Position

Document is Phase 2 (early wartime, September 1862) — one month after the Greeley Letter (doc_012), five months before the Hodges Letter (doc_019).

The cluster_02 suppression here is continuous with the Greeley Letter: both are legal-register or legal-adjacent documents in which Lincoln strips the metaphor system to make a narrow, defensible legal claim. But the timing matters: the Proclamation was issued five days after Antietam. The decision to frame emancipation as pure military-legal measure rather than moral transformation is not accidental — it follows directly from the military necessity argument Lincoln had been making all year.

The Hodges Letter (April 1864) will provide the moral and metaphorical justification that this document withholds: the amputation analogy (ext_006) and the early theodicy arc (ext_007) retroactively supply what the Proclamation refused to say at the moment of enactment.

## Absence Flags

- `enslaved_people_non_agent`: **FLAGGED** — enslaved people present only as compensable property objects; the proclamation freeing them treats them exclusively as loss items for their owners
- `disease_and_purification`: **ABSENT** — confirmed
- `black_soldiers_absent`: not applicable — this document predates the USCT authorization

## Annotator Notes

- p10–p16: Congressional act quotations pasted from official printings (confirmed by editorial apparatus). Not Lincoln's language; not annotated.
- p07_s01: Contains colonization language ("colonize persons of African descent, with their consent") — this is ideologically significant but not a CMT metaphor instance for the corpus clusters.
- The two instances (inst_00052, inst_00053) are retained at 0.62 confidence despite falling below the 0.70 standard threshold. The rationale: (1) retaining documents the minimum residual of legal-register language is better than excluding it, so future analysts can recalibrate; (2) if excluded, this document becomes a zero-instance blank, which is also a defensible analytical finding but loses the formula evidence.
