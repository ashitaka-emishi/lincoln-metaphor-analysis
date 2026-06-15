#!/usr/bin/env python3
"""Stage 7 orchestrator: optionally download LCC data, parse, and evaluate.

Checks for data at each step and skips work already done.
When LCC data is absent, prompts the user before downloading.

Usage:
    python3 scripts/run_stage7.py            # full flow with prompt
    python3 scripts/run_stage7.py --yes      # skip confirmation prompt
    python3 scripts/run_stage7.py --no-lcc   # Lincoln-only report, no download
    python3 scripts/run_stage7.py --dataset large --yes
"""

import argparse
import subprocess
import sys
from pathlib import Path

REPORT  = Path('reports/stage7/LCC_report.md')

PY = sys.executable


def run(cmd: list[str]) -> int:
    return subprocess.run(cmd).returncode


def _dataset_paths(dataset: str) -> tuple[Path, Path]:
    return (
        Path(f'data/lcc/en_{dataset}.xml'),
        Path(f'data/lcc_subset/en_{dataset}.csv'),
    )


def _prompt_download(dataset: str) -> bool:
    print()
    print(f'  LCC Metaphor Dataset (en_{dataset}.xml) not found.')
    print('  The full comparison requires downloading data from GitHub:')
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
    parser.add_argument('--dataset', choices=['small', 'large'], default='small',
                        help='LCC English dataset size to use')
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
    lcc_xml, lcc_csv = _dataset_paths(args.dataset)

    # ── Step 1: ensure LCC XML ────────────────────────────────────────────
    have_xml = lcc_xml.exists() and not args.force_download
    want_lcc = not args.no_lcc

    if want_lcc and not have_xml:
        if args.yes or _prompt_download(args.dataset):
            print()
            sys.stdout.flush()
            rc = run([PY, 'scripts/download_lcc.py',
                      '--dataset', args.dataset] +
                     (['--force'] if args.force_download else []))
            if rc != 0:
                print('\nDownload failed — generating Lincoln-only report.\n',
                      file=sys.stderr)
                want_lcc = False
            else:
                have_xml = lcc_xml.exists()
        else:
            print('\n  Skipping download — generating Lincoln-only report.\n',
                  flush=True)
            want_lcc = False

    # ── Step 2: parse XML → CSV ───────────────────────────────────────────
    have_csv = lcc_csv.exists()

    if want_lcc and have_xml and (not have_csv or args.force_download):
        print(f'Parsing {lcc_xml} → {lcc_csv}')
        rc = run([PY, 'scripts/parse_lcc.py',
                  '--input', str(lcc_xml),
                  '--output', str(lcc_csv)])
        if rc != 0:
            print('\nParse failed — generating Lincoln-only report.\n',
                  file=sys.stderr)
            want_lcc = False
        else:
            have_csv = True
    elif want_lcc and have_csv:
        print(f'Using cached CSV: {lcc_csv}', flush=True)

    # ── Step 3: evaluate ─────────────────────────────────────────────────
    sys.stdout.flush()
    cmd = [PY, 'scripts/evaluate_lcc.py', '--output', str(report_path)]
    if want_lcc and have_csv:
        cmd += ['--lcc', str(lcc_csv)]

    rc = run(cmd)
    if rc != 0:
        sys.exit(rc)

    print(f'\nReport: {report_path}')


if __name__ == '__main__':
    main()
