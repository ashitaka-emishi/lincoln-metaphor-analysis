#!/usr/bin/env python3
"""Strip UMich DLXS page navigation chrome from downloaded .txt files.

The body.innerText fallback in the snippet captures the full page including
navigation headers ("Collection Home", "Item Information", etc.). This script
extracts just the content between the "Pages" section header and the bottom
navigation ("Previous Section ◆ Next Section").

Also cleans up inline artifacts:
  - "NJump to section" suffixes on headings (where N is a footnote number)
  - "keyboard_returnReturn" footnote-back links
"""

import re
import sys
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / 'corpus' / 'raw'


def strip_nav(text: str) -> str:
    # Find the "Pages" section start — this is where DLXS puts the document body
    pages_match = re.search(r'\bPages\b\s*\n', text)
    if pages_match:
        content = text[pages_match.end():]
        # Cut at the bottom "Previous Section" navigation block
        bottom_nav = re.search(r'\n\s*Previous Section\s*\n\s*◆\s*\n\s*Next Section', content)
        if bottom_nav:
            content = content[:bottom_nav.start()]
    else:
        content = text

    # Remove "NJump to section" artifacts (heading + footnote anchor text merged)
    content = re.sub(r'\d+Jump to section\n?', '', content)

    # Remove "keyboard_returnReturn" footnote-back links
    content = re.sub(r'keyboard_return\s*Return\n?', '', content)

    # Remove page-break navigation blocks (at file start OR mid-content).
    # Pattern: optional leading whitespace/newline + "description" + "Page NNN" + more markup.
    content = re.sub(
        r'(?:^|(?<=\n))\s*description\s*\n\s*Page\s+\d+\s*\n[\s\S]*?(?=\S)',
        '',
        content,
        flags=re.MULTILINE,
    )

    # Collapse runs of 3+ blank lines to 2
    content = re.sub(r'\n{3,}', '\n\n', content)

    return content.strip()


def main():
    target_files = sorted(RAW_DIR.glob('doc_*.txt'))
    if not target_files:
        print(f'No doc_*.txt files found in {RAW_DIR}')
        sys.exit(1)

    for path in target_files:
        original = path.read_text(encoding='utf-8')
        cleaned = strip_nav(original)
        if cleaned == original.strip():
            print(f'  SKIP  {path.name} (no Pages marker found)')
            continue
        path.write_text(cleaned, encoding='utf-8')
        print(f'  OK    {path.name}: {len(original)} → {len(cleaned)} chars')


if __name__ == '__main__':
    main()
