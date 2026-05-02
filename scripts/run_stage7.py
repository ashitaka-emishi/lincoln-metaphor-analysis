#!/usr/bin/env python3
"""Stage 7 orchestrator: optionally download LCC data, parse, and evaluate.

Checks for data at each step and skips work already done.
When LCC data is absent, prompts the user before downloading (~4.6 MB).

Usage:
    python3 scripts/run_stage7.py            # full flow with prompt
    python3 scripts/run_stage7.py --yes      # skip confirmation prompt
    python3 scripts/run_stage7.py --no-lcc   # Lincoln-only report, no download
"""

import argparse
import subprocess
import sys
from pathlib import Path

LCC_XML = Path('data/lcc/en_small.xml')
LCC_CSV = Path('data/lcc_subset/en_small.csv')
REPORT  = Path('reports/stage7/LCC_report.md')

PY = sys.executable


def run(cmd: list[str]) -> int:
    return subprocess.run(cmd).returncode


def _prompt_download() -> bool:
    print()
    print('  LCC Metaphor Dataset (en_small.xml) not found.')
    print('  The full comparison requires downloading ~4.6 MB from GitHub:')
    print('  https://github.com/lcc-api/metaphor')
    print()
    try:
        answer = input('  Download now? [y/N] ').strip().lower()
    except (EOFError, KeyboardInterrupt):
        print()
        return False
    return answer in ('y', 'yes')


def main() -> None:
    parser = argparse.ArgumentParser(description='Stage 7 pipeline')
    parser.add_argument('--yes', '-y', action='store_true',
                        help='Confirm download without prompting')
    parser.add_argument('--no-lcc', action='store_true',
                        help='Skip LCC data; generate Lincoln-only report')
    parser.add_argument('--force-download', action='store_true',
                        help='Re-download LCC data even if already present')
    parser.add_argument('--output', default=str(REPORT),
                        help='Report output path')
    args = parser.parse_args()

    report_path = Path(args.output)

    # ── Step 1: ensure LCC XML ────────────────────────────────────────────
    have_xml = LCC_XML.exists() and not args.force_download
    want_lcc = not args.no_lcc

    if want_lcc and not have_xml:
        if args.yes or _prompt_download():
            print()
            sys.stdout.flush()
            rc = run([PY, 'scripts/download_lcc.py'] +
                     (['--force'] if args.force_download else []))
            if rc != 0:
                print('\nDownload failed — generating Lincoln-only report.\n',
                      file=sys.stderr)
                want_lcc = False
            else:
                have_xml = LCC_XML.exists()
        else:
            print('\n  Skipping download — generating Lincoln-only report.\n',
                  flush=True)
            want_lcc = False

    # ── Step 2: parse XML → CSV ───────────────────────────────────────────
    have_csv = LCC_CSV.exists()

    if want_lcc and have_xml and (not have_csv or args.force_download):
        print(f'Parsing {LCC_XML} → {LCC_CSV}')
        rc = run([PY, 'scripts/parse_lcc.py',
                  '--input', str(LCC_XML),
                  '--output', str(LCC_CSV)])
        if rc != 0:
            print('\nParse failed — generating Lincoln-only report.\n',
                  file=sys.stderr)
            want_lcc = False
        else:
            have_csv = True
    elif want_lcc and have_csv:
        print(f'Using cached CSV: {LCC_CSV}', flush=True)

    # ── Step 3: evaluate ─────────────────────────────────────────────────
    sys.stdout.flush()
    cmd = [PY, 'scripts/evaluate_lcc.py', '--output', str(report_path)]
    if want_lcc and have_csv:
        cmd += ['--lcc', str(LCC_CSV)]

    rc = run(cmd)
    if rc != 0:
        sys.exit(rc)

    print(f'\nReport: {report_path}')


if __name__ == '__main__':
    main()
