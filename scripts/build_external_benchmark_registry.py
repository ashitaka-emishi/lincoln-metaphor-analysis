#!/usr/bin/env python3
"""Build the Stage 7 external benchmark registry and rendered methodology page."""

import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / 'data' / 'metadata' / 'external-benchmark-corpora.json'
PAGE_PATH = ROOT / 'docs' / 'methodology' / 'external-benchmarks.md'


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
        'decision': 'Candidate comparison module for testing whether Lincoln-specific clusters appear in other Union rhetoric.',
        'limitations': [
            'Requires a named source list, stable document IDs, provenance, and inclusion rationale before collection.',
            'Should be a comparison corpus, not an expansion of the Lincoln corpus.',
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
        'decision': 'Candidate contrast corpus for testing purification, covenant, providence, and annihilation/reconciliation differences.',
        'limitations': [
            'Risk of false symmetry with the purification-rhetoric contrast; research questions must be stated before collection.',
            'Requires speaker, genre, date, and provenance controls.',
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
        'decision': 'Candidate corpus for separating Lincoln rhetorical restraint from broader anti-slavery moral language.',
        'limitations': [
            'Needs genre control across speeches, newspapers, pamphlets, and letters.',
            'Reception and movement rhetoric should remain distinct from Lincoln-only findings.',
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
        'decision': 'Candidate register-control corpus for distinguishing Lincoln from generic presidential address conventions.',
        'limitations': [
            'Must avoid flattening inaugural addresses, annual messages, proclamations, and informal speeches into one register.',
            'Requires a boundary decision before Reconstruction-era documents are added.',
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
        source = item['source_url'] or 'Not selected yet'
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
        '# External Benchmarks',
        '',
        'This page records Stage 7 benchmark choices and candidate comparison corpora. It distinguishes implemented, reproducible baselines from candidate corpora that require source-list and rights review before collection.',
        '',
        f"Generated: {registry['generated']}",
        '',
        '## Rule',
        '',
        'External data is not committed unless licensing, size, and redistribution terms make that appropriate. Current Stage 7 external data remains downloaded or generated on demand, with raw XML and parsed CSV files ignored by git.',
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


def main() -> None:
    registry = {
        'version': '1.0',
        'generated': date.today().isoformat(),
        'status': 'complete',
        'source': 'scripts/build_external_benchmark_registry.py',
        'total_benchmarks': len(BENCHMARKS),
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
