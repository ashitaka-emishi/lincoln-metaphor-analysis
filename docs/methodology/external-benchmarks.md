---
title: "External Benchmarks"
draft: false
---

# External Benchmarks

This page records Stage 7 benchmark choices and candidate comparison corpora. It distinguishes implemented, reproducible baselines from candidate corpora that require source-list and rights review before collection.

Generated: 2026-06-17

## Rule

External data is not committed unless licensing, size, and redistribution terms make that appropriate. Current Stage 7 external data remains downloaded or generated on demand, with raw XML and parsed CSV files ignored by git.

## Future Comparison-Corpus Milestone Gate

Create a new comparison-corpus milestone only after these prerequisites are met:

- Approve a source-list manifest that names candidate documents, stable URLs or archival citations, speaker/body, date, genre, register, and comparison role.
- Complete item-level rights review before collecting text; underlying public-domain status does not waive repository redistribution and site-term checks.
- Define a balanced pilot size for each subcorpus and an annotation budget before creating ingestion or annotation issues.
- Keep comparison manifests separate from the Lincoln corpus manifest; no new documents enter the 28-document Lincoln corpus.
- State the research question before collection, especially whether the pilot tests purification rhetoric, Lincoln-specific clusters, register effects, or broader nineteenth-century political metaphor.
- Treat uncollected corpora as hypotheses only; no synthesis claim may cite a candidate comparison corpus until its data is collected, validated, and audited.

## Benchmark Registry

| Benchmark | Status | Comparison Role | Redistribution Policy |
| --- | --- | --- | --- |
| lcc_en_small | implemented | general_english_metaphor_baseline | do_not_commit_raw_or_parsed_data |
| lcc_en_large | implemented_optional | larger_general_english_metaphor_baseline | do_not_commit_raw_or_parsed_data |
| union_war_rhetoric | candidate_not_implemented | contemporary_union_political_control | do_not_collect_until_source_list_and_rights_are_documented |
| confederate_war_rhetoric | candidate_not_implemented | contemporary_confederate_contrast | do_not_collect_until_source_list_and_rights_are_documented |
| abolitionist_rhetoric | candidate_not_implemented | contemporary_moral_reform_comparison | do_not_collect_until_source_list_and_rights_are_documented |
| presidential_rhetoric | candidate_not_implemented | presidential_register_control | do_not_collect_until_source_list_and_rights_are_documented |

## Records

## lcc_en_small: LCC Metaphor Dataset, English small subset

Status: `implemented`

Role: `general_english_metaphor_baseline`

Source: https://github.com/lcc-api/metaphor

License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0

Redistribution policy: `do_not_commit_raw_or_parsed_data`

Reproducibility commands:

```bash
npm run stage7:download
npm run stage7:parse
npm run stage7
```

Size and scope:

- Compressed archive: 4.6 MB
- Source/target pairs: 16,265
- Metaphoricity annotations: 17,336
- Conceptual mapping annotations: 7,941
- Affect annotations: 3,932


Evaluation summary:

- Evaluated locally: 2026-06-17
- Valid annotations parsed: 8,724
- Metaphorical annotations: 4,417
- DISEASE source-concept rank/count: 4 / 100

Decision: Use as the committed Stage 7 baseline because it is small enough to download on demand and already supported by the parser.

Limits:

- General news-text baseline, not a contemporary nineteenth-century political corpus.
- License is non-commercial and share-alike; raw and parsed data stay out of the repository.

## lcc_en_large: LCC Metaphor Dataset, English large subset

Status: `implemented_optional`

Role: `larger_general_english_metaphor_baseline`

Source: https://github.com/lcc-api/metaphor

License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0

Redistribution policy: `do_not_commit_raw_or_parsed_data`

Reproducibility commands:

```bash
npm run stage7:download:large
npm run stage7:parse:large
npm run stage7:large
```

Size and scope:

- Compressed archive: 83.6 MB
- Source/target pairs: 167,479
- Metaphoricity annotations: 86,860
- Conceptual mapping annotations: 51,324
- Affect annotations: 25,277


Evaluation summary:

- Evaluated locally: 2026-06-17
- Valid annotations parsed: 52,118
- Metaphorical annotations: 27,956
- DISEASE source-concept rank/count: 10 / 538

Decision: Support as an optional reproducible benchmark through public commands; keep outputs local because the archive is larger and redistribution is unnecessary.

Limits:

- Same genre mismatch as en_small; it improves scale but not historical comparability.
- Parsing is expected to use the same LmInstance structure as en_small; if upstream XML differs, parse_lcc.py should fail rather than silently coerce fields.

## union_war_rhetoric: Union wartime political rhetoric

Status: `candidate_not_implemented`

Role: `contemporary_union_political_control`

Source: See candidate source notes below.

License: mixed_public_domain_and_site_specific_terms_expected

Redistribution policy: `do_not_collect_until_source_list_and_rights_are_documented`

Reproducibility commands:

No command yet; source list and rights review required first.

Size and scope:

- Not defined yet.

Candidate source notes:

| Candidate source | Rights note | Size note | Rationale |
| --- | --- | --- | --- |
| [Congressional Globe, 36th-38th Congresses, Library of Congress / Congress.gov](https://www.loc.gov/collections/century-of-lawmaking/articles-and-essays/debates-of-congress/congressional-globe/) | Pre-1873 federal legislative record is expected to be public domain, but OCR/text redistribution and any downloaded derivatives need item-level source-term review. | Source series contains 46 volumes for the 23rd-42nd Congresses; recommended pilot is 12-20 speeches by Union Republicans and War Democrats, sampled by speaker, chamber, date, and topic. | Best first control for Seward, Chase, Sumner, Stevens, Trumbull, Wade, and other Union political rhetoric in the same legislative crisis field as Lincoln. |
| [Thaddeus Stevens Papers, Library of Congress](https://www.loc.gov/collections/thaddeus-stevens-papers/about-this-collection/) | Manuscript collection requires item-level rights review before transcription reuse; use as a named-speaker supplement, not the primary Union corpus. | Collection-level source; recommended supplement is 3-6 public speeches or printed items after the Congressional Globe pilot is scoped. | Adds a high-salience Radical Republican comparator without letting a single speaker stand in for Union rhetoric as a whole. |

Evaluation summary:

No implemented evaluation yet.

Decision: Candidate comparison module for testing whether Lincoln-specific clusters appear in other Union rhetoric. Not implemented for the current negative-finding baseline; no contemporary Union control result is available yet.

Limits:

- Requires a named source list, stable document IDs, provenance, and inclusion rationale before collection.
- Should be a comparison corpus, not an expansion of the Lincoln corpus.
- Congressional debate records mix speeches, procedural summaries, reprinted documents, and appendices; selection rules must prevent cherry-picking famous passages.

## confederate_war_rhetoric: Confederate wartime political rhetoric

Status: `candidate_not_implemented`

Role: `contemporary_confederate_contrast`

Source: See candidate source notes below.

License: mixed_public_domain_and_site_specific_terms_expected

Redistribution policy: `do_not_collect_until_source_list_and_rights_are_documented`

Reproducibility commands:

No command yet; source list and rights review required first.

Size and scope:

- Not defined yet.

Candidate source notes:

| Candidate source | Rights note | Size note | Rationale |
| --- | --- | --- | --- |
| [Confederate States of America Records, Library of Congress](https://www.loc.gov/collections/confederate-states-of-america-records/about-this-collection/) | Library of Congress item pages for this collection identify public-domain reuse for digitized contents; still perform item-level citation and transcription checks. | Collection spans 1854-1889, bulk 1861-1865; recommended pilot is 8-12 Davis messages/proclamations, Confederate congressional acts/resolutions, and secession/government formation documents. | Provides official and semiofficial Confederate rhetoric for testing purification, racial hierarchy, constitutional compact, sovereignty, and enemy-construction patterns. |
| [Journal of the Congress of the Confederate States of America, Library of Congress](https://www.loc.gov/collections/century-of-lawmaking/articles-and-essays/century-presentations/journal-of-the-congress-of-the-csa/) | Printed 1904-1905 in the U.S. Serial Set; expected public-domain government publication, with source-term and OCR review required before reuse. | Seven-volume printed set; recommended supplement is targeted excerpts only after defining whether institutional proceedings count as rhetoric. | Adds institutional Confederate legislative context while preserving separation from presidential messages and state secession documents. |

Evaluation summary:

No implemented evaluation yet.

Decision: Candidate contrast corpus for testing purification, covenant, providence, and annihilation/reconciliation differences. Not implemented for the current negative-finding baseline; no contemporary Confederate contrast result is available yet.

Limits:

- Risk of false symmetry with the purification-rhetoric contrast; research questions must be stated before collection.
- Requires speaker, genre, date, and provenance controls.
- Official Confederate records cannot be treated as representative of all Southern public rhetoric; state, newspaper, sermon, and military genres would require separate controls.

## abolitionist_rhetoric: Abolitionist rhetoric

Status: `candidate_not_implemented`

Role: `contemporary_moral_reform_comparison`

Source: See candidate source notes below.

License: mixed_public_domain_and_site_specific_terms_expected

Redistribution policy: `do_not_collect_until_source_list_and_rights_are_documented`

Reproducibility commands:

No command yet; source list and rights review required first.

Size and scope:

- Not defined yet.

Candidate source notes:

| Candidate source | Rights note | Size note | Rationale |
| --- | --- | --- | --- |
| [African American Perspectives: Materials Selected from the Rare Book Collection, Library of Congress](https://www.loc.gov/collections/african-american-perspectives-rare-books/about-this-collection/) | Library of Congress item pages state no known copyright restrictions for this collection; still record item-level rights and citation data. | More than 800 titles, 1822-1909; recommended pilot is 12-20 pamphlets or speeches from 1854-1865, balanced across Black authors, white abolitionists, organizational reports, and congressional anti-slavery speeches. | Best first source for testing whether anti-slavery moral rhetoric uses purification, confinement, agency, citizenship, or protection frames that Lincoln avoids or suppresses. |
| [National Anti-Slavery Standard, digitized newspaper runs](https://archive.org/details/nationalantis18600609roge) | Underlying newspaper issues are nineteenth-century public-domain candidates, but digitized runs vary by host; source-specific download and OCR reuse terms must be checked. | Weekly newspaper published 1840-1870; recommended supplement is an item-level sample around 1854, 1858, 1861, and 1863 rather than a full newspaper corpus. | Adds movement-press reception and advocacy language, but should stay separate from pamphlet/speech evidence and from the reception-evidence module. |

Evaluation summary:

No implemented evaluation yet.

Decision: Candidate corpus for separating Lincoln rhetorical restraint from broader anti-slavery moral language. Not implemented for the current negative-finding baseline; no contemporary abolitionist result is available yet.

Limits:

- Needs genre control across speeches, newspapers, pamphlets, and letters.
- Reception and movement rhetoric should remain distinct from Lincoln-only findings.
- Abolitionist rhetoric is internally diverse; a pilot must separate Black reform speech, white abolitionist speech, organizational reports, and movement newspapers.

## presidential_rhetoric: Presidential rhetoric before and after Lincoln

Status: `candidate_not_implemented`

Role: `presidential_register_control`

Source: See candidate source notes below.

License: source_specific_terms_required

Redistribution policy: `do_not_collect_until_source_list_and_rights_are_documented`

Reproducibility commands:

No command yet; source list and rights review required first.

Size and scope:

- Not defined yet.

Candidate source notes:

| Candidate source | Rights note | Size note | Rationale |
| --- | --- | --- | --- |
| [The American Presidency Project, UC Santa Barbara](https://www.presidency.ucsb.edu/) | Underlying historical presidential documents are generally public records, but the APP site asserts copyright and terms of service; reuse of APP text requires site-term review or an alternate public-domain transcription source. | APP reports 187,842 presidential and non-presidential records; recommended pilot is 12-18 annual messages, inaugurals, proclamations, and veto/special messages from Buchanan, Lincoln, Johnson, and Grant. | Best first register control for distinguishing Lincoln-specific patterns from generic presidential address conventions across adjacent administrations. |
| [Messages and Papers of the Presidents, APP or public-domain book scans](https://www.presidency.ucsb.edu/) | Use public-domain scans or transcriptions where possible; if APP is used for convenience, cite APP and confirm terms before committing text. | Focused source family for nineteenth-century presidential messages; recommended supplement is a register-balanced sample, not a full presidency archive. | Supports consistent presidential-register controls for annual messages, veto messages, and inaugurals without pulling in modern presidential-document categories. |

Evaluation summary:

No implemented evaluation yet.

Decision: Candidate register-control corpus for distinguishing Lincoln from generic presidential address conventions. Not implemented for the current negative-finding baseline; no contemporary presidential-register result is available yet.

Limits:

- Must avoid flattening inaugural addresses, annual messages, proclamations, and informal speeches into one register.
- Requires a boundary decision before Reconstruction-era documents are added.
- APP is a discovery and citation source unless terms review approves text reuse; nineteenth-century presidential texts may need public-domain scan/OCR alternatives.
