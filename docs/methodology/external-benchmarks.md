---
title: "External Benchmarks"
draft: false
---

# External Benchmarks

This page records Stage 7 benchmark choices and candidate comparison corpora. It distinguishes implemented, reproducible baselines from candidate corpora that require source-list and rights review before collection.

Generated: 2026-06-17

## Rule

External data is not committed unless licensing, size, and redistribution terms make that appropriate. Current Stage 7 external data remains downloaded or generated on demand, with raw XML and parsed CSV files ignored by git.

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

Source: Not selected yet

License: mixed_public_domain_and_site_specific_terms_expected

Redistribution policy: `do_not_collect_until_source_list_and_rights_are_documented`

Reproducibility commands:

No command yet; source list and rights review required first.

Size and scope:

- Not defined yet.

Evaluation summary:

No implemented evaluation yet.

Decision: Candidate comparison module for testing whether Lincoln-specific clusters appear in other Union rhetoric. Not implemented for the current negative-finding baseline; no contemporary Union control result is available yet.

Limits:

- Requires a named source list, stable document IDs, provenance, and inclusion rationale before collection.
- Should be a comparison corpus, not an expansion of the Lincoln corpus.

## confederate_war_rhetoric: Confederate wartime political rhetoric

Status: `candidate_not_implemented`

Role: `contemporary_confederate_contrast`

Source: Not selected yet

License: mixed_public_domain_and_site_specific_terms_expected

Redistribution policy: `do_not_collect_until_source_list_and_rights_are_documented`

Reproducibility commands:

No command yet; source list and rights review required first.

Size and scope:

- Not defined yet.

Evaluation summary:

No implemented evaluation yet.

Decision: Candidate contrast corpus for testing purification, covenant, providence, and annihilation/reconciliation differences. Not implemented for the current negative-finding baseline; no contemporary Confederate contrast result is available yet.

Limits:

- Risk of false symmetry with the purification-rhetoric contrast; research questions must be stated before collection.
- Requires speaker, genre, date, and provenance controls.

## abolitionist_rhetoric: Abolitionist rhetoric

Status: `candidate_not_implemented`

Role: `contemporary_moral_reform_comparison`

Source: Not selected yet

License: mixed_public_domain_and_site_specific_terms_expected

Redistribution policy: `do_not_collect_until_source_list_and_rights_are_documented`

Reproducibility commands:

No command yet; source list and rights review required first.

Size and scope:

- Not defined yet.

Evaluation summary:

No implemented evaluation yet.

Decision: Candidate corpus for separating Lincoln rhetorical restraint from broader anti-slavery moral language. Not implemented for the current negative-finding baseline; no contemporary abolitionist result is available yet.

Limits:

- Needs genre control across speeches, newspapers, pamphlets, and letters.
- Reception and movement rhetoric should remain distinct from Lincoln-only findings.

## presidential_rhetoric: Presidential rhetoric before and after Lincoln

Status: `candidate_not_implemented`

Role: `presidential_register_control`

Source: Not selected yet

License: source_specific_terms_required

Redistribution policy: `do_not_collect_until_source_list_and_rights_are_documented`

Reproducibility commands:

No command yet; source list and rights review required first.

Size and scope:

- Not defined yet.

Evaluation summary:

No implemented evaluation yet.

Decision: Candidate register-control corpus for distinguishing Lincoln from generic presidential address conventions. Not implemented for the current negative-finding baseline; no contemporary presidential-register result is available yet.

Limits:

- Must avoid flattening inaugural addresses, annual messages, proclamations, and informal speeches into one register.
- Requires a boundary decision before Reconstruction-era documents are added.
