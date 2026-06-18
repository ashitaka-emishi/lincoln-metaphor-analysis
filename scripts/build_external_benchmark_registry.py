#!/usr/bin/env python3
"""Build the Stage 7 external benchmark registry and rendered methodology page."""

import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / 'data' / 'metadata' / 'external-benchmark-corpora.json'
PAGE_PATH = ROOT / 'docs' / 'methodology' / 'external-benchmarks.md'

COMPARISON_CORPUS_MILESTONE_GATE = [
    'Approve a source-list manifest that names candidate documents, stable URLs or archival citations, speaker/body, date, genre, register, and comparison role.',
    'Complete item-level rights review before collecting text; underlying public-domain status does not waive repository redistribution and site-term checks.',
    'Define a balanced pilot size for each subcorpus and an annotation budget before creating ingestion or annotation issues.',
    'Keep comparison manifests separate from the Lincoln corpus manifest; no new documents enter the 28-document Lincoln corpus.',
    'State the research question before collection, especially whether the pilot tests purification rhetoric, Lincoln-specific clusters, register effects, or broader nineteenth-century political metaphor.',
    'Treat uncollected corpora as hypotheses only; no synthesis claim may cite a candidate comparison corpus until its data is collected, validated, and audited.',
]


BENCHMARKS = [
    {
        'benchmark_id': 'lcc_en_small',
        'name': 'LCC Metaphor Dataset, English small subset',
        'status': 'implemented',
        'comparison_role': 'general_english_metaphor_baseline',
        'source_url': 'https://github.com/lcc-api/metaphor',
        'download_command': 'npm run stage7:download',
        'parse_command': 'npm run stage7:parse',
        'evaluate_command': 'npm run stage7',
        'local_raw_path': 'data/lcc/en_small.xml',
        'local_derived_path': 'data/lcc_subset/en_small.csv',
        'redistribution_policy': 'do_not_commit_raw_or_parsed_data',
        'license': 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0',
        'license_url': 'https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode',
        'evaluation_summary': {
            'evaluated': '2026-06-17',
            'valid_annotations': 8724,
            'metaphorical_annotations': 4417,
            'disease_source_rank': 4,
            'disease_source_count': 100,
        },
        'size_and_scope': {
            'archive_compressed_mb': 4.6,
            'source_target_pairs': 16265,
            'metaphoricity_annotations': 17336,
            'conceptual_mapping_annotations': 7941,
            'affect_annotations': 3932,
        },
        'decision': 'Use as the committed Stage 7 baseline because it is small enough to download on demand and already supported by the parser.',
        'limitations': [
            'General news-text baseline, not a contemporary nineteenth-century political corpus.',
            'License is non-commercial and share-alike; raw and parsed data stay out of the repository.',
        ],
    },
    {
        'benchmark_id': 'lcc_en_large',
        'name': 'LCC Metaphor Dataset, English large subset',
        'status': 'implemented_optional',
        'comparison_role': 'larger_general_english_metaphor_baseline',
        'source_url': 'https://github.com/lcc-api/metaphor',
        'download_command': 'npm run stage7:download:large',
        'parse_command': 'npm run stage7:parse:large',
        'evaluate_command': 'npm run stage7:large',
        'local_raw_path': 'data/lcc/en_large.xml',
        'local_derived_path': 'data/lcc_subset/en_large.csv',
        'redistribution_policy': 'do_not_commit_raw_or_parsed_data',
        'license': 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0',
        'license_url': 'https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode',
        'evaluation_summary': {
            'evaluated': '2026-06-17',
            'valid_annotations': 52118,
            'metaphorical_annotations': 27956,
            'disease_source_rank': 10,
            'disease_source_count': 538,
        },
        'size_and_scope': {
            'archive_compressed_mb': 83.6,
            'source_target_pairs': 167479,
            'metaphoricity_annotations': 86860,
            'conceptual_mapping_annotations': 51324,
            'affect_annotations': 25277,
        },
        'decision': 'Support as an optional reproducible benchmark through public commands; keep outputs local because the archive is larger and redistribution is unnecessary.',
        'limitations': [
            'Same genre mismatch as en_small; it improves scale but not historical comparability.',
            'Parsing is expected to use the same LmInstance structure as en_small; if upstream XML differs, parse_lcc.py should fail rather than silently coerce fields.',
        ],
    },
    {
        'benchmark_id': 'union_war_rhetoric',
        'name': 'Union wartime political rhetoric',
        'status': 'candidate_not_implemented',
        'comparison_role': 'contemporary_union_political_control',
        'source_url': None,
        'download_command': None,
        'parse_command': None,
        'evaluate_command': None,
        'local_raw_path': None,
        'local_derived_path': None,
        'redistribution_policy': 'do_not_collect_until_source_list_and_rights_are_documented',
        'license': 'mixed_public_domain_and_site_specific_terms_expected',
        'license_url': None,
        'size_and_scope': None,
        'candidate_source_notes': [
            {
                'candidate_source': 'Congressional Globe, 36th-38th Congresses, Library of Congress / Congress.gov',
                'source_url': 'https://www.loc.gov/collections/century-of-lawmaking/articles-and-essays/debates-of-congress/congressional-globe/',
                'rights_note': 'Pre-1873 federal legislative record is expected to be public domain, but OCR/text redistribution and any downloaded derivatives need item-level source-term review.',
                'size_note': 'Source series contains 46 volumes for the 23rd-42nd Congresses; recommended pilot is 12-20 speeches by Union Republicans and War Democrats, sampled by speaker, chamber, date, and topic.',
                'rationale_note': 'Best first control for Seward, Chase, Sumner, Stevens, Trumbull, Wade, and other Union political rhetoric in the same legislative crisis field as Lincoln.',
            },
            {
                'candidate_source': 'Thaddeus Stevens Papers, Library of Congress',
                'source_url': 'https://www.loc.gov/collections/thaddeus-stevens-papers/about-this-collection/',
                'rights_note': 'Manuscript collection requires item-level rights review before transcription reuse; use as a named-speaker supplement, not the primary Union corpus.',
                'size_note': 'Collection-level source; recommended supplement is 3-6 public speeches or printed items after the Congressional Globe pilot is scoped.',
                'rationale_note': 'Adds a high-salience Radical Republican comparator without letting a single speaker stand in for Union rhetoric as a whole.',
            },
        ],
        'decision': 'Candidate comparison module for testing whether Lincoln-specific clusters appear in other Union rhetoric. Not implemented for the current negative-finding baseline; no contemporary Union control result is available yet.',
        'limitations': [
            'Requires a named source list, stable document IDs, provenance, and inclusion rationale before collection.',
            'Should be a comparison corpus, not an expansion of the Lincoln corpus.',
            'Congressional debate records mix speeches, procedural summaries, reprinted documents, and appendices; selection rules must prevent cherry-picking famous passages.',
        ],
    },
    {
        'benchmark_id': 'confederate_war_rhetoric',
        'name': 'Confederate wartime political rhetoric',
        'status': 'candidate_not_implemented',
        'comparison_role': 'contemporary_confederate_contrast',
        'source_url': None,
        'download_command': None,
        'parse_command': None,
        'evaluate_command': None,
        'local_raw_path': None,
        'local_derived_path': None,
        'redistribution_policy': 'do_not_collect_until_source_list_and_rights_are_documented',
        'license': 'mixed_public_domain_and_site_specific_terms_expected',
        'license_url': None,
        'size_and_scope': None,
        'candidate_source_notes': [
            {
                'candidate_source': 'Confederate States of America Records, Library of Congress',
                'source_url': 'https://www.loc.gov/collections/confederate-states-of-america-records/about-this-collection/',
                'rights_note': 'Library of Congress item pages for this collection identify public-domain reuse for digitized contents; still perform item-level citation and transcription checks.',
                'size_note': 'Collection spans 1854-1889, bulk 1861-1865; recommended pilot is 8-12 Davis messages/proclamations, Confederate congressional acts/resolutions, and secession/government formation documents.',
                'rationale_note': 'Provides official and semiofficial Confederate rhetoric for testing purification, racial hierarchy, constitutional compact, sovereignty, and enemy-construction patterns.',
            },
            {
                'candidate_source': 'Journal of the Congress of the Confederate States of America, Library of Congress',
                'source_url': 'https://www.loc.gov/collections/century-of-lawmaking/articles-and-essays/century-presentations/journal-of-the-congress-of-the-csa/',
                'rights_note': 'Printed 1904-1905 in the U.S. Serial Set; expected public-domain government publication, with source-term and OCR review required before reuse.',
                'size_note': 'Seven-volume printed set; recommended supplement is targeted excerpts only after defining whether institutional proceedings count as rhetoric.',
                'rationale_note': 'Adds institutional Confederate legislative context while preserving separation from presidential messages and state secession documents.',
            },
        ],
        'decision': 'Candidate contrast corpus for testing purification, covenant, providence, and annihilation/reconciliation differences. Not implemented for the current negative-finding baseline; no contemporary Confederate contrast result is available yet.',
        'limitations': [
            'Risk of false symmetry with the purification-rhetoric contrast; research questions must be stated before collection.',
            'Requires speaker, genre, date, and provenance controls.',
            'Official Confederate records cannot be treated as representative of all Southern public rhetoric; state, newspaper, sermon, and military genres would require separate controls.',
        ],
    },
    {
        'benchmark_id': 'abolitionist_rhetoric',
        'name': 'Abolitionist rhetoric',
        'status': 'candidate_not_implemented',
        'comparison_role': 'contemporary_moral_reform_comparison',
        'source_url': None,
        'download_command': None,
        'parse_command': None,
        'evaluate_command': None,
        'local_raw_path': None,
        'local_derived_path': None,
        'redistribution_policy': 'do_not_collect_until_source_list_and_rights_are_documented',
        'license': 'mixed_public_domain_and_site_specific_terms_expected',
        'license_url': None,
        'size_and_scope': None,
        'candidate_source_notes': [
            {
                'candidate_source': 'African American Perspectives: Materials Selected from the Rare Book Collection, Library of Congress',
                'source_url': 'https://www.loc.gov/collections/african-american-perspectives-rare-books/about-this-collection/',
                'rights_note': 'Library of Congress item pages state no known copyright restrictions for this collection; still record item-level rights and citation data.',
                'size_note': 'More than 800 titles, 1822-1909; recommended pilot is 12-20 pamphlets or speeches from 1854-1865, balanced across Black authors, white abolitionists, organizational reports, and congressional anti-slavery speeches.',
                'rationale_note': 'Best first source for testing whether anti-slavery moral rhetoric uses purification, confinement, agency, citizenship, or protection frames that Lincoln avoids or suppresses.',
            },
            {
                'candidate_source': 'National Anti-Slavery Standard, digitized newspaper runs',
                'source_url': 'https://archive.org/details/nationalantis18600609roge',
                'rights_note': 'Underlying newspaper issues are nineteenth-century public-domain candidates, but digitized runs vary by host; source-specific download and OCR reuse terms must be checked.',
                'size_note': 'Weekly newspaper published 1840-1870; recommended supplement is an item-level sample around 1854, 1858, 1861, and 1863 rather than a full newspaper corpus.',
                'rationale_note': 'Adds movement-press reception and advocacy language, but should stay separate from pamphlet/speech evidence and from the reception-evidence module.',
            },
        ],
        'decision': 'Candidate corpus for separating Lincoln rhetorical restraint from broader anti-slavery moral language. Not implemented for the current negative-finding baseline; no contemporary abolitionist result is available yet.',
        'limitations': [
            'Needs genre control across speeches, newspapers, pamphlets, and letters.',
            'Reception and movement rhetoric should remain distinct from Lincoln-only findings.',
            'Abolitionist rhetoric is internally diverse; a pilot must separate Black reform speech, white abolitionist speech, organizational reports, and movement newspapers.',
        ],
    },
    {
        'benchmark_id': 'presidential_rhetoric',
        'name': 'Presidential rhetoric before and after Lincoln',
        'status': 'candidate_not_implemented',
        'comparison_role': 'presidential_register_control',
        'source_url': None,
        'download_command': None,
        'parse_command': None,
        'evaluate_command': None,
        'local_raw_path': None,
        'local_derived_path': None,
        'redistribution_policy': 'do_not_collect_until_source_list_and_rights_are_documented',
        'license': 'source_specific_terms_required',
        'license_url': None,
        'size_and_scope': None,
        'candidate_source_notes': [
            {
                'candidate_source': 'The American Presidency Project, UC Santa Barbara',
                'source_url': 'https://www.presidency.ucsb.edu/',
                'rights_note': 'Underlying historical presidential documents are generally public records, but the APP site asserts copyright and terms of service; reuse of APP text requires site-term review or an alternate public-domain transcription source.',
                'size_note': 'APP reports 187,842 presidential and non-presidential records; recommended pilot is 12-18 annual messages, inaugurals, proclamations, and veto/special messages from Buchanan, Lincoln, Johnson, and Grant.',
                'rationale_note': 'Best first register control for distinguishing Lincoln-specific patterns from generic presidential address conventions across adjacent administrations.',
            },
            {
                'candidate_source': 'Messages and Papers of the Presidents, APP or public-domain book scans',
                'source_url': 'https://www.presidency.ucsb.edu/',
                'rights_note': 'Use public-domain scans or transcriptions where possible; if APP is used for convenience, cite APP and confirm terms before committing text.',
                'size_note': 'Focused source family for nineteenth-century presidential messages; recommended supplement is a register-balanced sample, not a full presidency archive.',
                'rationale_note': 'Supports consistent presidential-register controls for annual messages, veto messages, and inaugurals without pulling in modern presidential-document categories.',
            },
        ],
        'decision': 'Candidate register-control corpus for distinguishing Lincoln from generic presidential address conventions. Not implemented for the current negative-finding baseline; no contemporary presidential-register result is available yet.',
        'limitations': [
            'Must avoid flattening inaugural addresses, annual messages, proclamations, and informal speeches into one register.',
            'Requires a boundary decision before Reconstruction-era documents are added.',
            'APP is a discovery and citation source unless terms review approves text reuse; nineteenth-century presidential texts may need public-domain scan/OCR alternatives.',
        ],
    },
]


def render_page(registry: dict) -> str:
    rows = []
    for item in registry['benchmarks']:
        rows.append(
            '| {benchmark_id} | {status} | {comparison_role} | {redistribution_policy} |'.format(**item)
        )

    sections = []
    for item in registry['benchmarks']:
        source = item['source_url'] or (
            'See candidate source notes below.'
            if item.get('candidate_source_notes') else 'Not selected yet'
        )
        commands = [
            item.get('download_command'),
            item.get('parse_command'),
            item.get('evaluate_command'),
        ]
        command_lines = [cmd for cmd in commands if cmd]
        if command_lines:
            command_block = ['```bash', *command_lines, '```']
        else:
            command_block = ['No command yet; source list and rights review required first.']

        scope = item.get('size_and_scope') or {}
        if scope:
            scope_lines = [
                f"- Compressed archive: {scope['archive_compressed_mb']:.1f} MB",
                f"- Source/target pairs: {scope['source_target_pairs']:,}",
                f"- Metaphoricity annotations: {scope['metaphoricity_annotations']:,}",
                f"- Conceptual mapping annotations: {scope['conceptual_mapping_annotations']:,}",
                f"- Affect annotations: {scope['affect_annotations']:,}",
            ]
        else:
            scope_lines = ['- Not defined yet.']

        sections.append('\n'.join([
            f"## {item['benchmark_id']}: {item['name']}",
            '',
            f"Status: `{item['status']}`",
            '',
            f"Role: `{item['comparison_role']}`",
            '',
            f"Source: {source}",
            '',
            f"License: {item['license']}",
            '',
            f"Redistribution policy: `{item['redistribution_policy']}`",
            '',
            'Reproducibility commands:',
            '',
            *command_block,
            '',
            'Size and scope:',
            '',
            *scope_lines,
            '',
            *render_candidate_source_notes(item),
            '',
            *render_evaluation_summary(item),
            '',
            f"Decision: {item['decision']}",
            '',
            'Limits:',
            '',
            *(f"- {limit}" for limit in item['limitations']),
            '',
        ]))

    return '\n'.join([
        '---',
        'title: "External Benchmarks"',
        'draft: false',
        '---',
        '',
        'This page records Stage 7 benchmark choices and candidate comparison corpora. It distinguishes implemented, reproducible baselines from candidate corpora that require source-list and rights review before collection.',
        '',
        f"Generated: {registry['generated']}",
        '',
        '## Rule',
        '',
        'External data is not committed unless licensing, size, and redistribution terms make that appropriate. Current Stage 7 external data remains downloaded or generated on demand, with raw XML and parsed CSV files ignored by git.',
        '',
        '## Future Comparison-Corpus Milestone Gate',
        '',
        'Create a new comparison-corpus milestone only after these prerequisites are met:',
        '',
        *(f"- {item}" for item in registry['comparison_corpus_milestone_gate']),
        '',
        '## Benchmark Registry',
        '',
        '| Benchmark | Status | Comparison Role | Redistribution Policy |',
        '| --- | --- | --- | --- |',
        *rows,
        '',
        '## Records',
        '',
        *sections,
    ])


def render_candidate_source_notes(item: dict) -> list[str]:
    candidates = item.get('candidate_source_notes') or []
    if not candidates:
        return []

    lines = [
        'Candidate source notes:',
        '',
        '| Candidate source | Rights note | Size note | Rationale |',
        '| --- | --- | --- | --- |',
    ]
    for candidate in candidates:
        source = f"[{candidate['candidate_source']}]({candidate['source_url']})"
        lines.append(
            f"| {source} | {candidate['rights_note']} | {candidate['size_note']} | {candidate['rationale_note']} |"
        )
    return lines


def render_evaluation_summary(item: dict) -> list[str]:
    summary = item.get('evaluation_summary')
    if not summary:
        return [
            'Evaluation summary:',
            '',
            'No implemented evaluation yet.',
        ]

    return [
        'Evaluation summary:',
        '',
        f"- Evaluated locally: {summary['evaluated']}",
        f"- Valid annotations parsed: {summary['valid_annotations']:,}",
        f"- Metaphorical annotations: {summary['metaphorical_annotations']:,}",
        f"- DISEASE source-concept rank/count: {summary['disease_source_rank']} / {summary['disease_source_count']}",
    ]


def main() -> None:
    registry = {
        'version': '1.0',
        'generated': date.today().isoformat(),
        'status': 'complete',
        'source': 'scripts/build_external_benchmark_registry.py',
        'total_benchmarks': len(BENCHMARKS),
        'comparison_corpus_milestone_gate': COMPARISON_CORPUS_MILESTONE_GATE,
        'benchmarks': BENCHMARKS,
    }

    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.write_text(json.dumps(registry, indent=2) + '\n', encoding='utf-8')

    PAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PAGE_PATH.write_text(render_page(registry).rstrip() + '\n', encoding='utf-8')

    print(f"External benchmark registry written to {JSON_PATH.relative_to(ROOT)}")
    print(f"External benchmark page written to {PAGE_PATH.relative_to(ROOT)}")
    print(f"Benchmarks exported: {len(BENCHMARKS)}")


if __name__ == '__main__':
    main()
