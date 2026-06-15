#!/usr/bin/env python3
"""Download and extract English XML from the LCC Metaphor Dataset.

Downloads an LCC archive from GitHub and extracts the matching English XML
to data/lcc/.

Usage:
    python3 scripts/download_lcc.py
    python3 scripts/download_lcc.py --dataset large
    python3 scripts/download_lcc.py --force   # re-download even if already present
"""

import argparse
import sys
import tarfile
import urllib.error
import urllib.request
from pathlib import Path

ARCHIVES = {
    'small': {
        'archive': 'LCC_Metaphor_Dataset.small.tar.gz',
        'xml': 'en_small.xml',
        'compressed_mb': 4.6,
    },
    'large': {
        'archive': 'LCC_Metaphor_Dataset.large.tar.gz',
        'xml': 'en_large.xml',
        'compressed_mb': 83.6,
    },
}

ARCHIVE_BASE_URL = 'https://raw.githubusercontent.com/lcc-api/metaphor/main'
DATA_DIR = Path('data/lcc')


def _progress_hook(block_num: int, block_size: int, total_size: int) -> None:
    if total_size <= 0:
        downloaded_mb = block_num * block_size / 1024 / 1024
        print(f'\r  downloading … {downloaded_mb:.1f} MB', end='', flush=True)
        return
    downloaded = min(block_num * block_size, total_size)
    pct = downloaded * 100 // total_size
    filled = pct // 5
    bar = '#' * filled + '-' * (20 - filled)
    downloaded_mb = downloaded / 1024 / 1024
    total_mb = total_size / 1024 / 1024
    print(f'\r  [{bar}] {pct:3d}%  {downloaded_mb:.1f} / {total_mb:.1f} MB',
          end='', flush=True)


def download(dataset: str = 'small', force: bool = False) -> Path:
    if dataset not in ARCHIVES:
        raise ValueError(f"Unknown dataset '{dataset}'. Choose one of: {', '.join(ARCHIVES)}")

    config = ARCHIVES[dataset]
    archive_url = f"{ARCHIVE_BASE_URL}/{config['archive']}"
    archive_dest = DATA_DIR / config['archive']
    target_xml = DATA_DIR / config['xml']

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if target_xml.exists() and not force:
        print(f"Already present: {target_xml}")
        return target_xml

    size_note = (
        f" (~{config['compressed_mb']} MB compressed)"
        if config['compressed_mb'] is not None else ''
    )
    print(f"Dataset: {dataset}{size_note}")
    print(f"Source: {archive_url}")
    try:
        urllib.request.urlretrieve(archive_url, archive_dest, _progress_hook)
        print()  # end progress line
    except urllib.error.URLError as exc:
        print(f'\nDownload failed: {exc}', file=sys.stderr)
        if archive_dest.exists():
            archive_dest.unlink()
        raise

    print(f"Extracting {config['xml']} …")
    try:
        with tarfile.open(archive_dest, 'r:gz') as tar:
            members = tar.getnames()
            target_name = next(
                (m for m in members if m.endswith(config['xml'])), None
            )
            if target_name is None:
                raise FileNotFoundError(
                    f"{config['xml']} not found in archive.\nContents: {members}"
                )
            with tar.extractfile(target_name) as src:
                target_xml.write_bytes(src.read())
    except Exception:
        if archive_dest.exists():
            archive_dest.unlink()
        raise

    archive_dest.unlink()
    size_mb = target_xml.stat().st_size / 1024 / 1024
    print(f"Extracted: {target_xml}  ({size_mb:.1f} MB)")
    return target_xml


def main() -> None:
    parser = argparse.ArgumentParser(description='Download LCC English XML')
    parser.add_argument('--dataset', choices=sorted(ARCHIVES), default='small',
                        help='LCC English dataset size to download')
    parser.add_argument('--force', action='store_true',
                        help='Re-download even if already present')
    args = parser.parse_args()
    download(dataset=args.dataset, force=args.force)


if __name__ == '__main__':
    main()
