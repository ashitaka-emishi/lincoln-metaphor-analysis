#!/usr/bin/env python3
"""Build the reception evidence registry and rendered methodology page."""

import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / 'data' / 'metadata' / 'reception-evidence-registry.json'
PAGE_PATH = ROOT / 'docs' / 'methodology' / 'reception-evidence.md'


PLACEMENT_DECISION = {
    'decision': 'synthesis_appendix_or_comparison_module_not_core_corpus_stage',
    'rationale': (
        'Reception evidence answers a different question from the Lincoln-only '
        'metaphor corpus. It may test how readers, listeners, editors, and '
        'political actors received or transformed Lincoln rhetoric, but it must '
        'not change the Stage 1-8 Lincoln annotation universe.'
    ),
    'implementation_status': 'protocol_defined_no_reception_claims_added',
}


CLAIM_BOUNDARY = {
    'rhetoric_in_text': (
        'Claims about metaphor structure inside Lincoln-authored or '
        'Lincoln-primary documents may use the existing corpus, concordance, '
        'controlled outputs, and claim audit.'
    ),
    'audience_reception': (
        'Claims about how audiences received, repeated, resisted, misunderstood, '
        'or transformed Lincoln rhetoric require separate reception records with '
        'source URLs or archival citations.'
    ),
    'prohibited_inference': (
        'Do not infer audience belief, public opinion, political causality, or '
        'reader uptake from Lincoln-only metaphor counts.'
    ),
}


METADATA_FIELDS = [
    {
        'field': 'reception_id',
        'required': True,
        'rule': 'Stable identifier assigned before analysis.',
    },
    {
        'field': 'source_type',
        'required': True,
        'rule': 'Controlled type such as newspaper, diary, letter, meeting_report, or political_commentary.',
    },
    {
        'field': 'source_title',
        'required': True,
        'rule': 'Publication, collection, correspondent, diary holder, or meeting title.',
    },
    {
        'field': 'date',
        'required': True,
        'rule': 'ISO date when known; otherwise a documented date range.',
    },
    {
        'field': 'place',
        'required': True,
        'rule': 'Publication place, meeting location, or author location when available.',
    },
    {
        'field': 'audience_position',
        'required': True,
        'rule': 'Union, Confederate, abolitionist, Democratic, Republican, soldier, civilian, foreign, unknown, or other documented position.',
    },
    {
        'field': 'lincoln_text_anchor',
        'required': True,
        'rule': 'Specific Lincoln document, speech, phrase, or event being received; use corpus doc_id when possible.',
    },
    {
        'field': 'reception_action',
        'required': True,
        'rule': 'repeat, quote, paraphrase, endorse, resist, ridicule, reframe, omit, or transform.',
    },
    {
        'field': 'evidence_quote_or_summary',
        'required': True,
        'rule': 'Short quotation when rights permit, otherwise a concise summary with page or item anchor.',
    },
    {
        'field': 'source_url_or_archival_citation',
        'required': True,
        'rule': 'Resolvable URL, persistent identifier, or full archival citation.',
    },
    {
        'field': 'rights_note',
        'required': True,
        'rule': 'Public domain, collection terms, fair-use excerpt, or access restriction.',
    },
    {
        'field': 'claim_allowed',
        'required': True,
        'rule': 'Exactly what the source supports; must distinguish reception evidence from Lincoln textual evidence.',
    },
]


SOURCE_TYPES = [
    {
        'source_type_id': 'newspaper_reception',
        'name': 'Newspaper reception',
        'included_if': 'Article, editorial, reprint, or report explicitly refers to a Lincoln text, phrase, speech, policy, or public event.',
        'excluded_if': 'Item merely reports Civil War events without an identifiable Lincoln rhetoric anchor.',
        'evidence_use': 'Track public circulation, partisan reframing, quotation, ridicule, endorsement, or omission.',
    },
    {
        'source_type_id': 'private_letter_or_diary',
        'name': 'Private letters and diaries',
        'included_if': 'Writer explicitly responds to Lincoln, a Lincoln speech/document, or a Lincoln-linked policy event.',
        'excluded_if': 'Private war commentary has no recoverable connection to Lincoln rhetoric.',
        'evidence_use': 'Track individual uptake while preserving class, region, race, gender, and access limits.',
    },
    {
        'source_type_id': 'meeting_report',
        'name': 'Meeting reports and resolutions',
        'included_if': 'Meeting record quotes, paraphrases, endorses, resists, or transforms Lincoln rhetoric.',
        'excluded_if': 'Meeting record offers generic partisan position with no Lincoln text anchor.',
        'evidence_use': 'Track organized public response without treating resolutions as mass public opinion.',
    },
    {
        'source_type_id': 'political_commentary',
        'name': 'Political commentary and compiled wartime narratives',
        'included_if': 'Commentary identifies a Lincoln speech, proclamation, letter, or phrase as an object of interpretation.',
        'excluded_if': 'Retrospective synthesis lacks a near-contemporary reception context.',
        'evidence_use': 'Track elite, editorial, or compiled interpretations as reception artifacts, not as direct audience evidence.',
    },
]


CANDIDATE_SOURCES = [
    {
        'source_id': 'chronicling_america_newspapers',
        'name': 'Chronicling America: Historic American Newspapers',
        'source_type': 'newspaper_reception',
        'status': 'candidate_not_collected',
        'source_url': 'https://www.loc.gov/collections/chronicling-america/about-this-collection/',
        'archival_citation': 'Library of Congress, Chronicling America: Historic American Newspapers.',
        'rights_note': 'Collection-level terms and individual newspaper rights must be checked before redistribution.',
        'inclusion_rationale': 'Candidate source for newspaper reprints, editorials, reports, and partisan responses to Lincoln speeches and proclamations.',
        'evidence_limits': [
            'OCR quality and title coverage vary by state and year.',
            'Newspaper partisanship must be recorded before interpreting reception stance.',
        ],
    },
    {
        'source_id': 'loc_abraham_lincoln_papers_correspondence',
        'name': 'Abraham Lincoln Papers at the Library of Congress',
        'source_type': 'private_letter_or_diary',
        'status': 'candidate_not_collected',
        'source_url': 'https://www.loc.gov/collections/abraham-lincoln-papers/about-this-collection/',
        'archival_citation': 'Library of Congress, Abraham Lincoln Papers, Series 1: General Correspondence and Related Documents.',
        'rights_note': 'Collection-level rights and item-level restrictions must be checked before quotation or redistribution.',
        'inclusion_rationale': 'Candidate source for letters to Lincoln and related documents that show direct response to Lincoln rhetoric or policy language.',
        'evidence_limits': [
            'Incoming correspondence is not representative public opinion.',
            'Letters may reflect access to Lincoln rather than broad audience reception.',
        ],
    },
    {
        'source_id': 'valley_of_the_shadow',
        'name': 'The Valley of the Shadow',
        'source_type': 'private_letter_or_diary',
        'status': 'candidate_not_collected',
        'source_url': 'https://valley.newamericanhistory.org/',
        'archival_citation': 'Valley of the Shadow digital archive, Augusta County, Virginia, and Franklin County, Pennsylvania.',
        'rights_note': 'Project and item terms must be checked before quotation or redistribution.',
        'inclusion_rationale': 'Candidate source for community-level diaries, letters, and newspapers from one Northern and one Southern county.',
        'evidence_limits': [
            'Two-county design is comparative but not nationally representative.',
            'Reception claims must remain tied to the specific community and source type.',
        ],
    },
    {
        'source_id': 'beecher_public_meetings_britain',
        'name': 'American Rebellion: Henry Ward Beecher Public Meeting Reports',
        'source_type': 'meeting_report',
        'status': 'candidate_not_collected',
        'source_url': 'https://archive.org/details/americanrebellio00beec',
        'archival_citation': 'American Rebellion: Report of the Speeches of the Rev. Henry Ward Beecher, Delivered at Public Meetings in Manchester, Glasgow, Edinburgh, Liverpool, and London.',
        'rights_note': 'Nineteenth-century publication; digitized copy and platform terms must still be checked before reuse.',
        'inclusion_rationale': 'Candidate source for organized public-meeting response to Union war rhetoric in a foreign audience context.',
        'evidence_limits': [
            'Beecher meeting reports are not Lincoln reception unless an item explicitly anchors to Lincoln rhetoric or policy.',
            'Foreign public meetings should be analyzed separately from domestic U.S. audience response.',
        ],
    },
    {
        'source_id': 'rebellion_record',
        'name': 'The Rebellion Record: A Diary of American Events',
        'source_type': 'political_commentary',
        'status': 'candidate_not_collected',
        'source_url': 'https://onlinebooks.library.upenn.edu/webbin/serial?id=rebellionrecord',
        'archival_citation': 'Frank Moore, ed., The Rebellion Record: A Diary of American Events with Documents, Narratives, Illustrative Incidents, Poetry, etc.',
        'rights_note': 'Nineteenth-century publication; digitized copy and platform terms must still be checked before reuse.',
        'inclusion_rationale': 'Candidate source for compiled wartime documents, reports, narratives, and public commentary that may preserve near-contemporary responses.',
        'evidence_limits': [
            'Compiled and edited source, not unmediated audience response.',
            'Publication timing and editorial selection must be recorded for every item used.',
        ],
    },
]


EVIDENCE_RULES = [
    'A reception record must identify a Lincoln text anchor before it can support a reception claim.',
    'A reception source can show circulation, uptake, resistance, or reframing; it cannot by itself establish public opinion magnitude.',
    'Reception evidence must be analyzed separately from Lincoln-authored metaphor instances.',
    'Every quoted or summarized reception example must include a source URL or archival citation.',
    'Candidate collections do not count as evidence until individual items are selected, cited, and rights-checked.',
]


def render_bool(value: bool) -> str:
    return 'yes' if value else 'no'


def render_page(registry: dict) -> str:
    source_type_rows = [
        '| {source_type_id} | {name} | {evidence_use} |'.format(**item)
        for item in registry['source_types']
    ]
    source_rows = [
        '| {source_id} | {source_type} | {status} | {source_url} |'.format(**item)
        for item in registry['candidate_sources']
    ]
    metadata_rows = [
        '| {field} | {required} | {rule} |'.format(
            field=item['field'],
            required=render_bool(item['required']),
            rule=item['rule'],
        )
        for item in registry['metadata_fields']
    ]

    source_sections = []
    for item in registry['candidate_sources']:
        source_sections.append('\n'.join([
            f"## {item['source_id']}: {item['name']}",
            '',
            f"Type: `{item['source_type']}`",
            '',
            f"Status: `{item['status']}`",
            '',
            f"Source: {item['source_url']}",
            '',
            f"Citation: {item['archival_citation']}",
            '',
            f"Rights note: {item['rights_note']}",
            '',
            f"Inclusion rationale: {item['inclusion_rationale']}",
            '',
            'Evidence limits:',
            '',
            *(f"- {limit}" for limit in item['evidence_limits']),
            '',
        ]))

    return '\n'.join([
        '---',
        'title: "Reception Evidence"',
        'draft: false',
        '---',
        '',
        '# Reception Evidence',
        '',
        'This page defines the boundary between Lincoln rhetoric-in-text claims and audience reception claims. It does not add reception evidence to the Lincoln corpus. It records the rules a later reception appendix or comparison module must satisfy before making claims about how audiences received, repeated, resisted, or transformed Lincoln rhetoric.',
        '',
        f"Generated: {registry['generated']}",
        '',
        '## Placement Decision',
        '',
        f"Decision: `{registry['placement_decision']['decision']}`",
        '',
        registry['placement_decision']['rationale'],
        '',
        f"Implementation status: `{registry['placement_decision']['implementation_status']}`",
        '',
        '## Claim Boundary',
        '',
        f"- Rhetoric-in-text: {registry['claim_boundary']['rhetoric_in_text']}",
        f"- Audience reception: {registry['claim_boundary']['audience_reception']}",
        f"- Prohibited inference: {registry['claim_boundary']['prohibited_inference']}",
        '',
        '## Evidence Rules',
        '',
        *(f"- {rule}" for rule in registry['evidence_rules']),
        '',
        '## Source Types',
        '',
        '| Source Type | Name | Evidence Use |',
        '| --- | --- | --- |',
        *source_type_rows,
        '',
        '## Metadata Fields',
        '',
        '| Field | Required | Rule |',
        '| --- | --- | --- |',
        *metadata_rows,
        '',
        '## Candidate Source Collections',
        '',
        'These are candidate collection-level sources only. They are not reception examples until individual items are selected and cited.',
        '',
        '| Source | Type | Status | URL |',
        '| --- | --- | --- | --- |',
        *source_rows,
        '',
        '## Candidate Records',
        '',
        *source_sections,
    ]).rstrip() + '\n'


def main() -> None:
    registry = {
        'version': '1.0',
        'generated': date.today().isoformat(),
        'status': 'complete',
        'source': 'scripts/build_reception_evidence_registry.py',
        'placement_decision': PLACEMENT_DECISION,
        'claim_boundary': CLAIM_BOUNDARY,
        'metadata_fields': METADATA_FIELDS,
        'source_types': SOURCE_TYPES,
        'candidate_sources': CANDIDATE_SOURCES,
        'evidence_rules': EVIDENCE_RULES,
        'total_candidate_sources': len(CANDIDATE_SOURCES),
    }

    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.write_text(json.dumps(registry, indent=2) + '\n', encoding='utf-8')

    PAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PAGE_PATH.write_text(render_page(registry), encoding='utf-8')

    print(f"Reception evidence registry written to {JSON_PATH.relative_to(ROOT)}")
    print(f"Reception evidence page written to {PAGE_PATH.relative_to(ROOT)}")
    print(f"Candidate sources exported: {len(CANDIDATE_SOURCES)}")


if __name__ == '__main__':
    main()
