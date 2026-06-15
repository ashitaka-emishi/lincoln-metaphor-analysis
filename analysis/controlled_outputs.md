---
title: "Controlled Analysis Outputs"
draft: false
---

# Controlled Analysis Outputs

These tables are generated from the Stage 4A evidence-chain file by `npm run analysis:controlled`. They are the publication-control layer for aggregate claims: raw counts remain useful, but register and authorship-confidence controls determine how strong a claim can be.

The high-confidence subset is defined as documents with `authorship_confidence >= 0.95`. This is an authorship-confidence filter, not the Stage 4 annotation-confidence filter.

## Subset Summary

| Subset | Documents | Instances | C01 body/organism | C02 covenant/oath | C03 experiment/proposition | C04 birth/creation | C05 fathers/inheritance | C06 providence/theodicy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| full_corpus | 27 | 136 | 34 | 17 | 20 | 8 | 35 | 22 |
| high_authorship_confidence_0_95 | 13 | 73 | 22 | 8 | 9 | 8 | 10 | 16 |

## Cluster Distribution By Register

### Full Corpus

| Group | Docs | Total | C01 body/organism | C02 covenant/oath | C03 experiment/proposition | C04 birth/creation | C05 fathers/inheritance | C06 providence/theodicy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| campaign_speech | 8 | 36 | 10 | 0 | 3 | 0 | 22 | 1 |
| congressional_message | 2 | 12 | 0 | 1 | 7 | 0 | 2 | 2 |
| formal_public_address | 10 | 63 | 16 | 7 | 8 | 8 | 10 | 14 |
| fragment_private | 2 | 7 | 1 | 4 | 1 | 0 | 1 | 0 |
| legal_document | 2 | 3 | 0 | 2 | 0 | 0 | 0 | 1 |
| semi_public_letter | 3 | 15 | 7 | 3 | 1 | 0 | 0 | 4 |

### High-Authorship-Confidence Subset

| Group | Docs | Total | C01 body/organism | C02 covenant/oath | C03 experiment/proposition | C04 birth/creation | C05 fathers/inheritance | C06 providence/theodicy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| formal_public_address | 9 | 57 | 15 | 4 | 8 | 8 | 10 | 12 |
| fragment_private | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| semi_public_letter | 3 | 15 | 7 | 3 | 1 | 0 | 0 | 4 |

## Cluster Distribution By Period

### Full Corpus

| Group | Docs | Total | C01 body/organism | C02 covenant/oath | C03 experiment/proposition | C04 birth/creation | C05 fathers/inheritance | C06 providence/theodicy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| phase_1_baseline | 3 | 16 | 2 | 0 | 5 | 3 | 4 | 2 |
| phase_2_argument | 9 | 38 | 12 | 0 | 0 | 0 | 26 | 0 |
| phase_3_obligation | 4 | 25 | 2 | 7 | 6 | 0 | 4 | 6 |
| phase_4_transformation | 6 | 27 | 5 | 7 | 6 | 3 | 1 | 5 |
| phase_5_theodicy | 5 | 30 | 13 | 3 | 3 | 2 | 0 | 9 |

### High-Authorship-Confidence Subset

| Group | Docs | Total | C01 body/organism | C02 covenant/oath | C03 experiment/proposition | C04 birth/creation | C05 fathers/inheritance | C06 providence/theodicy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| phase_1_baseline | 3 | 16 | 2 | 0 | 5 | 3 | 4 | 2 |
| phase_2_argument | 2 | 7 | 3 | 0 | 0 | 0 | 4 | 0 |
| phase_3_obligation | 1 | 4 | 0 | 0 | 0 | 0 | 1 | 3 |
| phase_4_transformation | 3 | 21 | 5 | 5 | 4 | 3 | 1 | 3 |
| phase_5_theodicy | 4 | 25 | 12 | 3 | 0 | 2 | 0 | 8 |

## Cluster Distribution By Document

| Document | Title | Register | Period | Authorship conf. | Total | C01 body/organism | C02 covenant/oath | C03 experiment/proposition | C04 birth/creation | C05 fathers/inheritance | C06 providence/theodicy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| doc_001 | Lyceum Address | formal_public_address | phase_1_baseline | 0.98 | 8 | 1 | 0 | 3 | 0 | 4 | 0 |
| doc_002 | Temperance Address | formal_public_address | phase_1_baseline | 0.97 | 4 | 0 | 0 | 1 | 3 | 0 | 0 |
| doc_003 | Clay Eulogy | formal_public_address | phase_1_baseline | 0.96 | 4 | 1 | 0 | 1 | 0 | 0 | 2 |
| doc_004 | Peoria Speech | campaign_speech | phase_2_argument | 0.91 | 7 | 2 | 0 | 0 | 0 | 5 | 0 |
| doc_005 | House Divided | formal_public_address | phase_2_argument | 0.99 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| doc_006a | L-D Debate 1 Ottawa | campaign_speech | phase_2_argument | 0.83 | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| doc_006b | L-D Debate 2 Freeport | campaign_speech | phase_2_argument | 0.83 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| doc_006c | L-D Debate 3 Jonesboro | campaign_speech | phase_2_argument | 0.82 | 6 | 2 | 0 | 0 | 0 | 4 | 0 |
| doc_006e | L-D Debate 5 Galesburg | campaign_speech | phase_2_argument | 0.83 | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| doc_006f | L-D Debate 6 Quincy | campaign_speech | phase_2_argument | 0.83 | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| doc_006g | L-D Debate 7 Alton | campaign_speech | phase_2_argument | 0.83 | 8 | 4 | 0 | 0 | 0 | 4 | 0 |
| doc_007 | Cooper Union | formal_public_address | phase_2_argument | 0.99 | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| doc_008 | Springfield Farewell | formal_public_address | phase_3_obligation | 0.95 | 4 | 0 | 0 | 0 | 0 | 1 | 3 |
| doc_009 | First Inaugural | formal_public_address | phase_3_obligation | 0.93 | 6 | 1 | 3 | 0 | 0 | 0 | 2 |
| doc_010 | July 4 Message 1861 | congressional_message | phase_3_obligation | 0.88 | 9 | 0 | 1 | 5 | 0 | 2 | 1 |
| doc_011 | Constitution Fragment | fragment_private | phase_3_obligation | 0.85 | 6 | 1 | 3 | 1 | 0 | 1 | 0 |
| doc_012 | Greeley Letter | semi_public_letter | phase_4_transformation | 0.99 | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| doc_013 | Prelim Emancipation | legal_document | phase_4_transformation | 0.9 | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| doc_014 | Annual Message 1862 | congressional_message | phase_4_transformation | 0.87 | 3 | 0 | 0 | 2 | 0 | 0 | 1 |
| doc_015 | Final Emancipation | legal_document | phase_4_transformation | 0.9 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| doc_016 | Conkling Letter | semi_public_letter | phase_4_transformation | 0.99 | 6 | 3 | 1 | 1 | 0 | 0 | 1 |
| doc_017 | Gettysburg | formal_public_address | phase_4_transformation | 0.99 | 13 | 2 | 2 | 3 | 3 | 1 | 2 |
| doc_018 | Blind Memorandum | fragment_private | phase_5_theodicy | 0.99 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| doc_019 | Hodges Letter | semi_public_letter | phase_5_theodicy | 0.99 | 7 | 4 | 0 | 0 | 0 | 0 | 3 |
| doc_020 | Re-election Serenade | campaign_speech | phase_5_theodicy | 0.88 | 5 | 1 | 0 | 3 | 0 | 0 | 1 |
| doc_021 | Second Inaugural | formal_public_address | phase_5_theodicy | 0.99 | 13 | 8 | 1 | 0 | 0 | 0 | 4 |
| doc_022 | Last Address | formal_public_address | phase_5_theodicy | 0.99 | 4 | 0 | 1 | 0 | 2 | 0 | 1 |

## Absence Flags By Register

### Full Corpus

| Group | Docs | Instances | Absence flags | disease_purification_absent | enslaved_people_non_agent | lincoln_non_agent | black_soldiers_erased | death_abstracted | confederates_depersonalized | women_absent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| campaign_speech | 8 | 36 | 30 | 15 | 14 | 1 | 0 | 0 | 0 | 0 |
| congressional_message | 2 | 12 | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| formal_public_address | 10 | 63 | 78 | 29 | 16 | 13 | 7 | 8 | 4 | 1 |
| fragment_private | 2 | 7 | 8 | 0 | 7 | 1 | 0 | 0 | 0 | 0 |
| legal_document | 2 | 3 | 4 | 0 | 3 | 0 | 1 | 0 | 0 | 0 |
| semi_public_letter | 3 | 15 | 12 | 0 | 7 | 4 | 0 | 0 | 1 | 0 |

### High-Authorship-Confidence Subset

| Group | Docs | Instances | Absence flags | disease_purification_absent | enslaved_people_non_agent | lincoln_non_agent | black_soldiers_erased | death_abstracted | confederates_depersonalized | women_absent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| formal_public_address | 9 | 57 | 72 | 23 | 16 | 13 | 7 | 8 | 4 | 1 |
| fragment_private | 1 | 1 | 2 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| semi_public_letter | 3 | 15 | 12 | 0 | 7 | 4 | 0 | 0 | 1 | 0 |

## Absence Flags By Period

### Full Corpus

| Group | Docs | Instances | Absence flags | disease_purification_absent | enslaved_people_non_agent | lincoln_non_agent | black_soldiers_erased | death_abstracted | confederates_depersonalized | women_absent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| phase_1_baseline | 3 | 16 | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 0 |
| phase_2_argument | 9 | 38 | 36 | 22 | 14 | 0 | 0 | 0 | 0 | 0 |
| phase_3_obligation | 4 | 25 | 23 | 15 | 6 | 2 | 0 | 0 | 0 | 0 |
| phase_4_transformation | 6 | 27 | 39 | 3 | 14 | 6 | 6 | 7 | 2 | 1 |
| phase_5_theodicy | 5 | 30 | 30 | 0 | 13 | 11 | 2 | 1 | 3 | 0 |

### High-Authorship-Confidence Subset

| Group | Docs | Instances | Absence flags | disease_purification_absent | enslaved_people_non_agent | lincoln_non_agent | black_soldiers_erased | death_abstracted | confederates_depersonalized | women_absent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| phase_1_baseline | 3 | 16 | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 0 |
| phase_2_argument | 2 | 7 | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| phase_3_obligation | 1 | 4 | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| phase_4_transformation | 3 | 21 | 32 | 0 | 11 | 6 | 5 | 7 | 2 | 1 |
| phase_5_theodicy | 4 | 25 | 29 | 0 | 13 | 10 | 2 | 1 | 3 | 0 |

## Interpretation Rule

Use the full-corpus count to describe what is present in the annotated corpus. Use register and high-authorship-confidence tables to decide whether a claim is stable enough for publication. If a pattern disappears under the high-confidence subset or is concentrated in one register, the prose should name that limitation.
