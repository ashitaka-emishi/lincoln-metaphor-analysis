---
title: "Reception Evidence"
draft: false
---

# Reception Evidence

This page defines the boundary between Lincoln rhetoric-in-text claims and audience reception claims. It does not add reception evidence to the Lincoln corpus. It records the rules a later reception appendix or comparison module must satisfy before making claims about how audiences received, repeated, resisted, or transformed Lincoln rhetoric.

Generated: 2026-06-15

## Placement Decision

Decision: `synthesis_appendix_or_comparison_module_not_core_corpus_stage`

Reception evidence answers a different question from the Lincoln-only metaphor corpus. It may test how readers, listeners, editors, and political actors received or transformed Lincoln rhetoric, but it must not change the Stage 1-8 Lincoln annotation universe.

Implementation status: `protocol_defined_no_reception_claims_added`

## Claim Boundary

- Rhetoric-in-text: Claims about metaphor structure inside Lincoln-authored or Lincoln-primary documents may use the existing corpus, concordance, controlled outputs, and claim audit.
- Audience reception: Claims about how audiences received, repeated, resisted, misunderstood, or transformed Lincoln rhetoric require separate reception records with source URLs or archival citations.
- Prohibited inference: Do not infer audience belief, public opinion, political causality, or reader uptake from Lincoln-only metaphor counts.

## Evidence Rules

- A reception record must identify a Lincoln text anchor before it can support a reception claim.
- A reception source can show circulation, uptake, resistance, or reframing; it cannot by itself establish public opinion magnitude.
- Reception evidence must be analyzed separately from Lincoln-authored metaphor instances.
- Every quoted or summarized reception example must include a source URL or archival citation.
- Candidate collections do not count as evidence until individual items are selected, cited, and rights-checked.

## Source Types

| Source Type | Name | Evidence Use |
| --- | --- | --- |
| newspaper_reception | Newspaper reception | Track public circulation, partisan reframing, quotation, ridicule, endorsement, or omission. |
| private_letter_or_diary | Private letters and diaries | Track individual uptake while preserving class, region, race, gender, and access limits. |
| meeting_report | Meeting reports and resolutions | Track organized public response without treating resolutions as mass public opinion. |
| political_commentary | Political commentary and compiled wartime narratives | Track elite, editorial, or compiled interpretations as reception artifacts, not as direct audience evidence. |

## Metadata Fields

| Field | Required | Rule |
| --- | --- | --- |
| reception_id | yes | Stable identifier assigned before analysis. |
| source_type | yes | Controlled type such as newspaper, diary, letter, meeting_report, or political_commentary. |
| source_title | yes | Publication, collection, correspondent, diary holder, or meeting title. |
| date | yes | ISO date when known; otherwise a documented date range. |
| place | yes | Publication place, meeting location, or author location when available. |
| audience_position | yes | Union, Confederate, abolitionist, Democratic, Republican, soldier, civilian, foreign, unknown, or other documented position. |
| lincoln_text_anchor | yes | Specific Lincoln document, speech, phrase, or event being received; use corpus doc_id when possible. |
| reception_action | yes | repeat, quote, paraphrase, endorse, resist, ridicule, reframe, omit, or transform. |
| evidence_quote_or_summary | yes | Short quotation when rights permit, otherwise a concise summary with page or item anchor. |
| source_url_or_archival_citation | yes | Resolvable URL, persistent identifier, or full archival citation. |
| rights_note | yes | Public domain, collection terms, fair-use excerpt, or access restriction. |
| claim_allowed | yes | Exactly what the source supports; must distinguish reception evidence from Lincoln textual evidence. |

## Candidate Source Collections

These are candidate collection-level sources only. They are not reception examples until individual items are selected and cited.

| Source | Type | Status | URL |
| --- | --- | --- | --- |
| chronicling_america_newspapers | newspaper_reception | candidate_not_collected | https://www.loc.gov/collections/chronicling-america/about-this-collection/ |
| loc_abraham_lincoln_papers_correspondence | private_letter_or_diary | candidate_not_collected | https://www.loc.gov/collections/abraham-lincoln-papers/about-this-collection/ |
| valley_of_the_shadow | private_letter_or_diary | candidate_not_collected | https://valley.newamericanhistory.org/ |
| beecher_public_meetings_britain | meeting_report | candidate_not_collected | https://archive.org/details/americanrebellio00beec |
| rebellion_record | political_commentary | candidate_not_collected | https://onlinebooks.library.upenn.edu/webbin/serial?id=rebellionrecord |

## Candidate Records

## chronicling_america_newspapers: Chronicling America: Historic American Newspapers

Type: `newspaper_reception`

Status: `candidate_not_collected`

Source: https://www.loc.gov/collections/chronicling-america/about-this-collection/

Citation: Library of Congress, Chronicling America: Historic American Newspapers.

Rights note: Collection-level terms and individual newspaper rights must be checked before redistribution.

Inclusion rationale: Candidate source for newspaper reprints, editorials, reports, and partisan responses to Lincoln speeches and proclamations.

Evidence limits:

- OCR quality and title coverage vary by state and year.
- Newspaper partisanship must be recorded before interpreting reception stance.

## loc_abraham_lincoln_papers_correspondence: Abraham Lincoln Papers at the Library of Congress

Type: `private_letter_or_diary`

Status: `candidate_not_collected`

Source: https://www.loc.gov/collections/abraham-lincoln-papers/about-this-collection/

Citation: Library of Congress, Abraham Lincoln Papers, Series 1: General Correspondence and Related Documents.

Rights note: Collection-level rights and item-level restrictions must be checked before quotation or redistribution.

Inclusion rationale: Candidate source for letters to Lincoln and related documents that show direct response to Lincoln rhetoric or policy language.

Evidence limits:

- Incoming correspondence is not representative public opinion.
- Letters may reflect access to Lincoln rather than broad audience reception.

## valley_of_the_shadow: The Valley of the Shadow

Type: `private_letter_or_diary`

Status: `candidate_not_collected`

Source: https://valley.newamericanhistory.org/

Citation: Valley of the Shadow digital archive, Augusta County, Virginia, and Franklin County, Pennsylvania.

Rights note: Project and item terms must be checked before quotation or redistribution.

Inclusion rationale: Candidate source for community-level diaries, letters, and newspapers from one Northern and one Southern county.

Evidence limits:

- Two-county design is comparative but not nationally representative.
- Reception claims must remain tied to the specific community and source type.

## beecher_public_meetings_britain: American Rebellion: Henry Ward Beecher Public Meeting Reports

Type: `meeting_report`

Status: `candidate_not_collected`

Source: https://archive.org/details/americanrebellio00beec

Citation: American Rebellion: Report of the Speeches of the Rev. Henry Ward Beecher, Delivered at Public Meetings in Manchester, Glasgow, Edinburgh, Liverpool, and London.

Rights note: Nineteenth-century publication; digitized copy and platform terms must still be checked before reuse.

Inclusion rationale: Candidate source for organized public-meeting response to Union war rhetoric in a foreign audience context.

Evidence limits:

- Beecher meeting reports are not Lincoln reception unless an item explicitly anchors to Lincoln rhetoric or policy.
- Foreign public meetings should be analyzed separately from domestic U.S. audience response.

## rebellion_record: The Rebellion Record: A Diary of American Events

Type: `political_commentary`

Status: `candidate_not_collected`

Source: https://onlinebooks.library.upenn.edu/webbin/serial?id=rebellionrecord

Citation: Frank Moore, ed., The Rebellion Record: A Diary of American Events with Documents, Narratives, Illustrative Incidents, Poetry, etc.

Rights note: Nineteenth-century publication; digitized copy and platform terms must still be checked before reuse.

Inclusion rationale: Candidate source for compiled wartime documents, reports, narratives, and public commentary that may preserve near-contemporary responses.

Evidence limits:

- Compiled and edited source, not unmediated audience response.
- Publication timing and editorial selection must be recorded for every item used.
