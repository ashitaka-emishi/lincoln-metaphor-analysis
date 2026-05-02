#!/usr/bin/env python3
"""Download and extract en_small.xml from the LCC Metaphor Dataset.

Downloads LCC_Metaphor_Dataset.small.tar.gz (~4.6 MB compressed) from GitHub
and extracts en_small.xml to data/lcc/en_small.xml.

Usage:
    python3 scripts/download_lcc.py
    python3 scripts/download_lcc.py --force   # re-download even if already present
"""

import argparse
import sys
import tarfile
import urllib.error
import urllib.request
from pathlib import Path

ARCHIVE_URL = (
    'https://raw.githubusercontent.com/lcc-api/metaphor/main'
    '/LCC_Metaphor_Dataset.small.tar.gz'
)
ARCHIVE_COMPRESSED_MB = 4.6
DATA_DIR = Path('data/lcc')
TARGET_XML = DATA_DIR / 'en_small.xml'
ARCHIVE_DEST = DATA_DIR / 'LCC_Metaphor_Dataset.small.tar.gz'


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


def download(force: bool = False) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if TARGET_XML.exists() and not force:
        print(f"Already present: {TARGET_XML}")
        return TARGET_XML

    print(f"Source: {ARCHIVE_URL}")
    try:
        urllib.request.urlretrieve(ARCHIVE_URL, ARCHIVE_DEST, _progress_hook)
        print()  # end progress line
    except urllib.error.URLError as exc:
        print(f'\nDownload failed: {exc}', file=sys.stderr)
        if ARCHIVE_DEST.exists():
            ARCHIVE_DEST.unlink()
        raise

    print(f"Extracting en_small.xml …")
    try:
        with tarfile.open(ARCHIVE_DEST, 'r:gz') as tar:
            members = tar.getnames()
            target_name = next(
                (m for m in members if m.endswith('en_small.xml')), None
            )
            if target_name is None:
                raise FileNotFoundError(
                    f"en_small.xml not found in archive.\nContents: {members}"
                )
            with tar.extractfile(target_name) as src:
                TARGET_XML.write_bytes(src.read())
    except Exception:
        if ARCHIVE_DEST.exists():
            ARCHIVE_DEST.unlink()
        raise

    ARCHIVE_DEST.unlink()
    size_mb = TARGET_XML.stat().st_size / 1024 / 1024
    print(f"Extracted: {TARGET_XML}  ({size_mb:.1f} MB)")
    return TARGET_XML


def main() -> None:
    parser = argparse.ArgumentParser(description='Download LCC en_small.xml')
    parser.add_argument('--force', action='store_true',
                        help='Re-download even if already present')
    args = parser.parse_args()
    download(force=args.force)


if __name__ == '__main__':
    main()
