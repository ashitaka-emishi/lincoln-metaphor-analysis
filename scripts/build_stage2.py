#!/usr/bin/env python3
"""Build Stage 2 corpus/text/{doc_id}.md files from stripped raw txt files.

Prepends YAML frontmatter to each raw document text. Skips docs that already
have a Stage 2 file unless --force is passed.

Usage: python3 scripts/build_stage2.py [--force]
"""

import re
import sys
from pathlib import Path

RAW_DIR  = Path(__file__).parent.parent / 'corpus' / 'raw'
TEXT_DIR = Path(__file__).parent.parent / 'corpus' / 'text'
TEXT_DIR.mkdir(parents=True, exist_ok=True)

DATE = '2026-04-28'
FORCE = '--force' in sys.argv

# ---------------------------------------------------------------------------
# Frontmatter catalogue
# Keys: id, title, short_title, date, date_precision, register, authorship,
#       authorship_confidence, authorship_notes, source_text, source_url,
#       risk_flags, analytical_priority
# ---------------------------------------------------------------------------
DOCS = {
    'doc_003': dict(
        title='Eulogy on Henry Clay',
        short_title='Clay Eulogy',
        date='1852-07-06',
        date_precision='exact',
        register='formal_public_address',
        authorship='lincoln_sole',
        authorship_confidence=0.96,
        authorship_notes=None,
        source_text='Collected Works vol.2 pp.121-132',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln2',
        risk_flags=[],
        analytical_priority='medium',
    ),
    'doc_004': dict(
        title='Speech at Peoria, Illinois',
        short_title='Peoria Speech',
        date='1854-10-16',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_sole',
        authorship_confidence=0.91,
        authorship_notes='Text from Peoria Weekly Republican report. Some transcription noise expected.',
        source_text='Collected Works vol.2 pp.247-283',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln2',
        risk_flags=['transcription_noise'],
        analytical_priority='high',
    ),
    'doc_005': dict(
        title='"A House Divided": Speech at Springfield, Illinois',
        short_title='House Divided',
        date='1858-06-16',
        date_precision='exact',
        register='formal_public_address',
        authorship='lincoln_sole',
        authorship_confidence=0.99,
        authorship_notes=None,
        source_text='Collected Works vol.2 pp.461-469',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln2',
        risk_flags=[],
        analytical_priority='critical',
    ),
    'doc_006a': dict(
        title='First Debate with Stephen A. Douglas at Ottawa, Illinois',
        short_title='L-D Debate 1 Ottawa',
        date='1858-08-21',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_primary',
        authorship_confidence=0.83,
        authorship_notes='Full transcript includes both Lincoln and Douglas speeches. '
                         "Lincoln's portions from the Press & Tribune; Douglas's from the Chicago Times. "
                         'Annotate and analyze Lincoln turns only.',
        source_text='Collected Works vol.3 pp.1-37',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln3/1:1',
        risk_flags=['transcription_variants'],
        analytical_priority='high',
    ),
    'doc_006b': dict(
        title='Second Debate with Stephen A. Douglas at Freeport, Illinois',
        short_title='L-D Debate 2 Freeport',
        date='1858-08-27',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_primary',
        authorship_confidence=0.83,
        authorship_notes='Full transcript includes both Lincoln and Douglas speeches. '
                         'Annotate and analyze Lincoln turns only.',
        source_text='Collected Works vol.3 pp.38-76',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln3/1:5',
        risk_flags=['transcription_variants'],
        analytical_priority='high',
    ),
    'doc_006c': dict(
        title='Third Debate with Stephen A. Douglas at Jonesboro, Illinois',
        short_title='L-D Debate 3 Jonesboro',
        date='1858-09-15',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_primary',
        authorship_confidence=0.82,
        authorship_notes='Full transcript includes both Lincoln and Douglas speeches. '
                         'Southern IL audience — watch for metaphor suppression vs. northern venues. '
                         'Annotate and analyze Lincoln turns only.',
        source_text='Collected Works vol.3 pp.102-144',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln3',
        risk_flags=['transcription_variants'],
        analytical_priority='medium',
    ),
    'doc_006d': dict(
        title='Fourth Debate with Stephen A. Douglas at Charleston, Illinois',
        short_title='L-D Debate 4 Charleston',
        date='1858-09-18',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_primary',
        authorship_confidence=0.82,
        authorship_notes='Full transcript includes both Lincoln and Douglas speeches. '
                         'CRITICAL for absence analysis: Lincoln suppresses equality-proposition cluster here. '
                         'Tag explicitly. Annotate and analyze Lincoln turns only.',
        source_text='Collected Works vol.3 pp.145-201',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln3',
        risk_flags=['transcription_variants'],
        analytical_priority='medium',
    ),
    'doc_006e': dict(
        title='Fifth Debate with Stephen A. Douglas at Galesburg, Illinois',
        short_title='L-D Debate 5 Galesburg',
        date='1858-10-07',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_primary',
        authorship_confidence=0.83,
        authorship_notes='Full transcript includes both Lincoln and Douglas speeches. '
                         'Compare cluster activation with Jonesboro (suppressed) and Galesburg (receptive). '
                         'Annotate and analyze Lincoln turns only.',
        source_text='Collected Works vol.3 pp.207-244',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln3',
        risk_flags=['transcription_variants'],
        analytical_priority='medium',
    ),
    'doc_006f': dict(
        title='Sixth Debate with Stephen A. Douglas at Quincy, Illinois',
        short_title='L-D Debate 6 Quincy',
        date='1858-10-13',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_primary',
        authorship_confidence=0.83,
        authorship_notes='Full transcript includes both Lincoln and Douglas speeches. '
                         'Annotate and analyze Lincoln turns only.',
        source_text='Collected Works vol.3 pp.245-282',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln3',
        risk_flags=['transcription_variants'],
        analytical_priority='medium',
    ),
    'doc_006g': dict(
        title='Seventh Debate with Stephen A. Douglas at Alton, Illinois',
        short_title='L-D Debate 7 Alton',
        date='1858-10-15',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_primary',
        authorship_confidence=0.83,
        authorship_notes='Full transcript includes both Lincoln and Douglas speeches. '
                         "Final debate — Lincoln's closing synthesis after seven rounds of adversarial pressure. "
                         'Annotate and analyze Lincoln turns only.',
        source_text='Collected Works vol.3 pp.283-325',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln3',
        risk_flags=['transcription_variants'],
        analytical_priority='high',
    ),
    'doc_007': dict(
        title='Address at Cooper Institute, New York City',
        short_title='Cooper Union',
        date='1860-02-27',
        date_precision='exact',
        register='formal_public_address',
        authorship='lincoln_sole',
        authorship_confidence=0.99,
        authorship_notes=None,
        source_text='Collected Works vol.3 pp.522-550',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln3',
        risk_flags=[],
        analytical_priority='critical',
    ),
    'doc_010': dict(
        title='Message to Congress in Special Session',
        short_title='July 4 Message 1861',
        date='1861-07-04',
        date_precision='exact',
        register='congressional_message',
        authorship='lincoln_sole',
        authorship_confidence=0.88,
        authorship_notes=None,
        source_text='Collected Works vol.4 pp.421-441',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln4',
        risk_flags=[],
        analytical_priority='high',
    ),
    'doc_014': dict(
        title='Annual Message to Congress',
        short_title='Annual Message 1862',
        date='1862-12-01',
        date_precision='exact',
        register='congressional_message',
        authorship='lincoln_sole',
        authorship_confidence=0.87,
        authorship_notes=None,
        source_text='Collected Works vol.5 pp.518-537',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln5',
        risk_flags=[],
        analytical_priority='high',
    ),
    'doc_015': dict(
        title='Emancipation Proclamation',
        short_title='Final Emancipation',
        date='1863-01-01',
        date_precision='exact',
        register='legal_document',
        authorship='lincoln_sole',
        authorship_confidence=0.90,
        authorship_notes='Deliberately flat register. Absence of birth/body metaphor clusters is itself the analytical finding. Use as control document against Preliminary Emancipation.',
        source_text='Collected Works vol.6 pp.28-31',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln6',
        risk_flags=[],
        analytical_priority='medium',
    ),
    'doc_020': dict(
        title='Response to a Serenade',
        short_title='Re-election Serenade',
        date='1864-11-10',
        date_precision='exact',
        register='campaign_speech',
        authorship='lincoln_sole',
        authorship_confidence=0.88,
        authorship_notes='Extemporaneous response following Lincoln\'s re-election on November 8, 1864. '
                         'Experiment/proof frame unguarded — election result as empirical evidence that '
                         'democratic government can survive a major election in wartime.',
        source_text='Collected Works vol.8 pp.96-101',
        source_url='https://quod.lib.umich.edu/l/lincoln/lincoln8',
        risk_flags=['transcription_noise'],
        analytical_priority='medium',
    ),
}

# Already written manually with corrected text
ALREADY_DONE = {'doc_011', 'doc_013', 'doc_018'}


def make_frontmatter(doc_id: str, meta: dict) -> str:
    flags = meta['risk_flags']
    flags_str = '[]' if not flags else '[' + ', '.join(f'"{f}"' for f in flags) + ']'
    notes = meta['authorship_notes']
    notes_str = 'null' if notes is None else f'"{notes}"'
    return f"""---
id: "{doc_id}"
title: "{meta['title']}"
short_title: "{meta['short_title']}"
date: "{meta['date']}"
date_precision: "{meta['date_precision']}"
register: "{meta['register']}"
authorship: "{meta['authorship']}"
authorship_confidence: {meta['authorship_confidence']}
authorship_notes: {notes_str}
source_text: "{meta['source_text']}"
source_url: "{meta['source_url']}"
risk_flags: {flags_str}
analytical_priority: "{meta['analytical_priority']}"
pipeline_log: [{{stage: 2, agent: "scaffold", date: "{DATE}"}}]
---

"""


def clean_text(text: str) -> str:
    """Final text cleanup after strip_umich_nav."""
    # Remove residual indentation-only lines from page-break whitespace blocks
    text = re.sub(r'\n([ \t]+\n)+', '\n\n', text)
    # Collapse 3+ blank lines to 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def main():
    written, skipped, missing = 0, 0, 0

    for doc_id, meta in DOCS.items():
        if doc_id in ALREADY_DONE:
            print(f'  SKIP  {doc_id} (written manually)')
            skipped += 1
            continue

        out_path = TEXT_DIR / f'{doc_id}.md'
        if out_path.exists() and not FORCE:
            print(f'  SKIP  {doc_id} (already exists — use --force to overwrite)')
            skipped += 1
            continue

        raw_path = RAW_DIR / f'{doc_id}.txt'
        if not raw_path.exists():
            print(f'  MISS  {doc_id} (raw file not found)')
            missing += 1
            continue

        raw_text = raw_path.read_text(encoding='utf-8')
        cleaned  = clean_text(raw_text)
        content  = make_frontmatter(doc_id, meta) + cleaned + '\n'

        out_path.write_text(content, encoding='utf-8')
        print(f'  OK    {doc_id} → {out_path.name} ({len(cleaned)} chars)')
        written += 1

    print(f'\nDone. Written: {written}  Skipped: {skipped}  Missing: {missing}')
    if missing:
        print('Missing raw files need to be fetched before Stage 2 can complete.')


if __name__ == '__main__':
    main()
