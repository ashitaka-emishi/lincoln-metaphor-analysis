---
title: "V4 Reference Corpus Inventory"
description: "18-document Tier 3 v4 search-only reference corpus inventory."
draft: false
---

# V4 Reference Corpus Inventory

This page is kept in sync with `data/corpus/corpus-v4-reference-inventory.json`. It records the Tier 3 v4 reference inventory: a search-only layer for lexical recurrence, phrase searches, negative checks, source-context review, and candidate discovery. Reference-corpus records are not fully annotated Stage 4 evidence and must not be counted with core or validation-corpus findings unless a later issue promotes them into one of those tiers.

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
| doc_073 | Slavery Protest | 1837-03-03 | search-only | early | legal_message | other | collected_works_michigan | Early slavery-language and legislative-framing searches before the Lyceum baseline. |
| doc_074 | Subtreasury Speech | 1839-12-26 | search-only | early | speech | public | collected_works_michigan | Early party-political speech searches outside the core denominator. |
| doc_075 | Whig Circular | 1840-03-04 | search-only | early | public_letter | political_allies | collected_works_michigan | Party organization and political-network vocabulary checks, with committee-authorship caution. |
| doc_076 | Durley Letter | 1845-10-03 | search-only | early | private_letter | private_correspondent | collected_works_michigan | Private antebellum search context around slavery and political judgment. |
| doc_077 | Spot Resolutions | 1847-12-22 | search-only | early | legal_message | congress | collected_works_michigan | Pre-Civil War congressional war-powers vocabulary checks. |
| doc_078 | Mexican War Speech | 1848-01-12 | search-only | early | speech | congress | collected_works_michigan | Congressional war-rhetoric comparison for recurrence and negative checks. |
| doc_079 | Law Lecture Notes | 1850 | search-only | early | fragment | general_unspecified | collected_works_michigan | Professional and legal vocabulary boundary searches in a fragmentary text. |
| doc_080 | Government Fragment | 1854 | search-only | antebellum | fragment | general_unspecified | collected_works_michigan | Political-theory language searches adjacent to Peoria-era materials. |
| doc_081 | Bloomington Speech | 1856-05-29 | search-only | antebellum | speech | public | collected_works_michigan | Textually risky campaign-speech discovery only; not secure evidence without review. |
| doc_082 | Sectional Controversy Fragment | 1856 | search-only | antebellum | fragment | general_unspecified | collected_works_michigan | Sectional-language and slavery-vocabulary searches in fragmentary material. |
| doc_083 | Canisius Letter | 1859-05-17 | search-only | antebellum | public_letter | political_allies | collected_works_michigan | Immigration, party, and political-rights vocabulary searches outside selected tiers. |
| doc_084 | Fell Autobiography | 1859-12-20 | search-only | antebellum | public_letter | political_allies | collected_works_michigan | Self-presentation and campaign-biography searches near the 1860 threshold. |
| doc_085 | Scripps Autobiography | 1860-06 | search-only | antebellum | public_letter | political_allies | collected_works_michigan | Campaign-biographical search context with month-level date precision. |
| doc_086 | Stephens Letter | 1860-12-22 | search-only | secession_crisis | private_letter | private_correspondent | collected_works_michigan | Secession-crisis constitutional-reassurance searches outside public inaugural rhetoric. |
| doc_087 | Bullitt Letter | 1862-07-28 | search-only | emancipation | public_letter | political_allies | collected_works_michigan | Louisiana-policy, emancipation, and reconstruction search context outside the validation inventory. |
| doc_088 | Seymour Letter | 1863-08-07 | search-only | emancipation | public_letter | political_allies | collected_works_michigan | Civil-liberties and wartime dissent vocabulary checks in public-letter context. |
| doc_089 | Retaliation Order | 1863-07-30 | search-only | emancipation | legal_message | military | collected_works_michigan | Military policy, Black soldier, and wartime-retaliation vocabulary checks. |
| doc_090 | Serenade Response | 1863-07-07 | search-only | emancipation | speech | public | collected_works_michigan | Informal public-rhetoric and reception-language searches with reported-speech caution. |

## Method Notes

- Reference records use deterministic IDs after the validation inventory range so future additions can append without changing existing IDs.
- `source_url` is intentionally nullable at this stage; source authority and citation are recorded, while item-level URLs and checksums remain later provenance work.
- Records with fragmentary, reconstructed, or reported text retain explicit provenance cautions.
- Promotion into validation or core tiers must update the JSON inventory, this documentation page, provenance records, and validation outputs in the same tracked workflow.
