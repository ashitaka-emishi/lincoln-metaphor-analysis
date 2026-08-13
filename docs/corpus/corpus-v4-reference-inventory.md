---
title: "V4 Reference Corpus Inventory"
description: "18-document Tier 3 v4 search-only reference corpus inventory."
draft: false
---

# V4 Reference Corpus Inventory

This page is generated from `data/corpus/corpus-v4-reference-inventory.json`. It records the Tier 3 v4 reference inventory: a search-only layer for lexical recurrence, phrase searches, negative checks, source-context review, and candidate discovery. Reference-corpus records are not fully annotated Stage 4 evidence and must not be counted with core or validation-corpus findings unless a later issue promotes them into one of those tiers.

## Count Summary

| Measure | Count |
| --- | ---: |
| Total reference inventory records | 18 |
| Included v4-core records | 0 |
| Included validation records | 0 |
| Records marked search-only reference | 18 |

## Reference Role

The reference corpus is intentionally open-ended and incremental. It may contain secure texts, fragments, reported speeches, source-context companions, and boundary cases whose immediate role is discovery rather than interpretation.

Reference-corpus evidence may be used for:

- lexical recurrence and phrase-search discovery;
- negative checks for whether a phrase or metaphor family appears in likely neighboring contexts;
- source-context review around a core or validation text;
- identifying candidates for future validation or core promotion.

Reference-corpus evidence may not be used as:

- fully annotated interpretive evidence;
- a denominator for Stage 4 metaphor counts;
- proof that the project analyzes all Lincoln writings;
- a substitute for item-level provenance, segmentation, and validation.

## Promotion Rule

A reference item can be promoted only through a later tracked issue. The promotion issue must identify the target tier, check source authority and text status, add or confirm raw text provenance, update the relevant inventory, and rerun the validation gate for the affected corpus files. Until that happens, searches over the reference corpus can motivate follow-up work but cannot establish publication claims.

## Inventory

| Doc ID | Short Title | Date | Status | Period | Genre | Audience | Source Authority | Reference Use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| doc_073 | Slavery Protest | 1837-03-03 | search-only | early | legal_message | other | collected_works_michigan | Provides an early boundary text for search checks around slavery language before the Lyceum Address without expanding the fully annotated denominator. |
| doc_074 | Subtreasury Speech | 1839-12-26 | search-only | early | speech | public | collected_works_michigan | Adds early political-register context for lexical searches across speeches that are outside the v4 core selection. |
| doc_075 | Whig Circular | 1840-03-04 | search-only | early | public_letter | political_allies | collected_works_michigan | Supports searches for organizational and party vocabulary that may contextualize public-speech patterns. |
| doc_076 | Durley Letter | 1845-10-03 | search-only | early | private_letter | private_correspondent | collected_works_michigan | Adds a private-letter search target around political judgment and slavery before the main antebellum core texts. |
| doc_077 | Spot Resolutions | 1847-12-22 | search-only | early | legal_message | congress | collected_works_michigan | Provides a pre-Civil War war-powers comparison point without requiring full Stage 4 annotation. |
| doc_078 | Mexican War Speech | 1848-01-12 | search-only | early | speech | congress | collected_works_michigan | Supports phrase and negative checks against Lincoln's earlier congressional war rhetoric. |
| doc_079 | Law Lecture Notes | 1850 | search-only | early | fragment | general_unspecified | collected_works_michigan | Adds professional/legal vocabulary for boundary searches outside public political texts. |
| doc_080 | Government Fragment | 1854 | search-only | antebellum | fragment | general_unspecified | collected_works_michigan | Supports searches around government, labor, and political-theory vocabulary adjacent to the Peoria-era core. |
| doc_081 | Bloomington Speech | 1856-05-29 | search-only | antebellum | speech | public | collected_works_michigan | Keeps the famous but textually risky Bloomington material available for discovery without treating it as secure core evidence. |
| doc_082 | Sectional Controversy Fragment | 1856 | search-only | antebellum | fragment | general_unspecified | collected_works_michigan | Adds antebellum sectional-language context between Peoria, Dred Scott, and the 1858 campaign materials. |
| doc_083 | Canisius Letter | 1859-05-17 | search-only | antebellum | public_letter | political_allies | collected_works_michigan | Adds a distinct antebellum public-letter search target that is not already selected for the core or validation tiers. |
| doc_084 | Fell Autobiography | 1859-12-20 | search-only | antebellum | public_letter | political_allies | collected_works_michigan | Supports searches for self-fashioning and campaign biography language near the 1860 threshold. |
| doc_085 | Scripps Autobiography | 1860-06 | search-only | antebellum | public_letter | political_allies | collected_works_michigan | Adds a second campaign-biographical reference point for search-only comparison with public political argument. |
| doc_086 | Stephens Letter | 1860-12-22 | search-only | secession_crisis | private_letter | private_correspondent | collected_works_michigan | Supports searches for secession-crisis constitutional reassurance outside public inaugural rhetoric. |
| doc_087 | Bullitt Letter | 1862-07-28 | search-only | emancipation | public_letter | political_allies | collected_works_michigan | Adds a distinct Louisiana-policy search target without duplicating a validation inventory record. |
| doc_088 | Seymour Letter | 1863-08-07 | search-only | emancipation | public_letter | political_allies | collected_works_michigan | Adds a distinct wartime public-letter search target for civil-liberties vocabulary and negative checks. |
| doc_089 | Retaliation Order | 1863-07-30 | search-only | emancipation | legal_message | military | collected_works_michigan | Adds search-only context for military policy vocabulary that may inform later validation selection. |
| doc_090 | Serenade Response | 1863-07-07 | search-only | emancipation | speech | public | collected_works_michigan | Supports searches for informal public rhetoric and reception language without treating reported remarks as fully annotated evidence. |

## Method Notes

- Reference records use deterministic IDs after the validation inventory range so future additions can append without changing existing IDs.
- `source_url` is intentionally nullable at this stage; source authority and citation are recorded, while item-level URLs and checksums remain later provenance work.
- Records with fragmentary, reconstructed, or reported text retain explicit provenance cautions.
- Promotion into validation or core tiers must update the JSON inventory, this documentation page, provenance records, and validation outputs in the same tracked workflow.
