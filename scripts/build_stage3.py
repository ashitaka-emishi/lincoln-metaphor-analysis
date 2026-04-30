#!/usr/bin/env python3
"""Build Stage 3 corpus/segmented/{doc_id}.json from Stage 2 corpus/text/{doc_id}.md.

Segments each document into sections → paragraphs → sentences with permanent
hierarchical IDs. Outputs one JSON file per document.

Usage: python3 scripts/build_stage3.py [--force] [doc_id ...]
  --force   overwrite existing segmented files
  doc_id    process only these IDs (default: all)
"""

import json
import re
import sys
from pathlib import Path

TEXT_DIR = Path(__file__).parent.parent / 'corpus' / 'text'
SEG_DIR  = Path(__file__).parent.parent / 'corpus' / 'segmented'
SEG_DIR.mkdir(parents=True, exist_ok=True)

DATE  = '2026-04-28'
FORCE = '--force' in sys.argv
ONLY  = [a for a in sys.argv[1:] if not a.startswith('--')]

# ── Sentence splitter ─────────────────────────────────────────────────────────

# Periods that don't end sentences
_ABBREV_RE = re.compile(
    r'\b(?:Mr|Mrs|Ms|Dr|Gov|Hon|Gen|Col|Maj|Capt|Sen|Rep|Lt|Sgt|Pvt|St|Sq'
    r'|No|Vs|Vol|Pp|Sec|Dept|etc|approx|appr|orig'
    r'|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
    r'|U\.S|U)\.',
    re.IGNORECASE,
)
# Single-letter initials: word boundary + single uppercase + period
_INITIAL_RE = re.compile(r'\b[A-Z]\.')

_PH = '\x00'  # placeholder replacing protected periods


def split_sentences(text: str) -> list[str]:
    text = text.strip()
    if not text:
        return []

    # Protect abbreviation and initial periods with a placeholder
    protected = _ABBREV_RE.sub(lambda m: m.group().replace('.', _PH), text)
    protected = _INITIAL_RE.sub(lambda m: m.group().replace('.', _PH), protected)

    # Split at sentence-ending punctuation followed by space + sentence-start char
    # Sentence-start: uppercase letter, ``(open quote), or [ (editorial bracket)
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z`\[])', protected)

    return [p.replace(_PH, '.').strip() for p in parts if p.strip()]


# ── Section header detection ──────────────────────────────────────────────────

# Matches standalone debate-turn headers (applied after normalization)
_DEBATE_HDR_RE = re.compile(
    r"^(?:MR\.?|SENATOR)\s+(?:LINCOLN|DOUGLAS)'?S?\s+"
    r"(?:SPEECH|REPLY|REJOINDER|ADDRESS)\.?$",
    re.IGNORECASE,
)


def _normalize_header(line: str) -> str:
    """Normalize typographic variants found in UMich transcriptions."""
    s = line.strip()
    s = re.sub(r'\bM\s+R\b', 'MR', s)       # "M R. LINCOLN" → "MR. LINCOLN"
    s = re.sub(r'MR\.(?=[A-Z])', 'MR. ', s)  # "MR.LINCOLN" → "MR. LINCOLN"
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def _classify_line(line: str):
    """Return (is_header, section_label, authorship_note) or (False, None, None)."""
    s = line.strip()
    if s == 'Annotation':
        return True, 'annotation', 'editorial_apparatus'
    norm = _normalize_header(s)
    if _DEBATE_HDR_RE.match(norm):
        upper = norm.upper()
        is_lincoln = 'LINCOLN' in upper
        is_reply   = any(t in upper for t in ('REPLY', 'REJOINDER'))
        if is_lincoln:
            label = 'lincoln_reply' if is_reply else 'lincoln_speech'
            return True, label, None          # Lincoln turns: no authorship note
        else:
            label = 'douglas_reply' if is_reply else 'douglas_speech'
            return True, label, 'douglas_speech'
    return False, None, None


# ── Frontmatter parser ────────────────────────────────────────────────────────

def _parse_md(path: Path):
    """Return (meta_dict, body_text). Parses YAML frontmatter manually."""
    content = path.read_text(encoding='utf-8')
    if not content.startswith('---'):
        return {}, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content

    fm_lines = parts[1].strip().split('\n')
    body     = parts[2]

    meta = {}
    for line in fm_lines:
        if ':' not in line:
            continue
        key, _, raw = line.partition(':')
        key = key.strip()
        val: object = raw.strip()

        # Unquote strings
        if isinstance(val, str) and len(val) >= 2 and val[0] == val[-1] == '"':
            val = val[1:-1]

        # Typed conversions
        if key == 'authorship_confidence':
            try:
                val = float(val)  # type: ignore[arg-type]
            except (ValueError, TypeError):
                pass
        elif val == 'null':
            val = None
        elif isinstance(val, str) and val.startswith('[') and val.endswith(']'):
            inner = val[1:-1].strip()
            if inner:
                val = [x.strip().strip('"') for x in inner.split(',')]
            else:
                val = []

        meta[key] = val

    return meta, body


# ── Segmentation ──────────────────────────────────────────────────────────────

def _segment(doc_id: str, meta: dict, body: str) -> dict:
    is_debate = meta.get('authorship') == 'lincoln_primary'

    # Freeport, Charleston, Quincy: Lincoln opens; Annotation field is irrelevant here.
    # All other debates: Douglas opens.
    LINCOLN_OPENS = {'doc_006b', 'doc_006d', 'doc_006f'}

    # Split body into non-empty lines; each line is one paragraph
    lines = [ln.strip() for ln in body.split('\n') if ln.strip()]

    # Walk lines, grouping into sections
    if is_debate:
        if doc_id in LINCOLN_OPENS:
            cur_label, cur_auth = 'lincoln_speech', None
        else:
            cur_label, cur_auth = 'douglas_speech', 'douglas_speech'
    else:
        cur_label, cur_auth = 'body', None

    raw_sections: list[dict] = []
    cur_paras: list[str] = []

    for line in lines:
        is_hdr, new_label, new_auth = _classify_line(line)
        if is_hdr:
            if cur_paras:
                raw_sections.append({
                    'label': cur_label,
                    'authorship_note': cur_auth,
                    'paras': cur_paras,
                })
            cur_label, cur_auth = new_label, new_auth
            cur_paras = []
        else:
            cur_paras.append(line)

    if cur_paras:
        raw_sections.append({
            'label': cur_label,
            'authorship_note': cur_auth,
            'paras': cur_paras,
        })

    # Build JSON structure
    word_offset   = 0
    sec_ordinal   = 0
    sections_json = []

    for sec in raw_sections:
        sec_ordinal += 1
        sec_id = f'{doc_id}_s{sec_ordinal:02d}'
        paras_json = []
        para_ordinal = 0

        for para_text in sec['paras']:
            sents = split_sentences(para_text)
            if not sents:
                continue
            para_ordinal += 1
            para_id = f'{sec_id}_p{para_ordinal:02d}'
            sents_json = []
            sent_ordinal = 0

            for sent_text in sents:
                sent_ordinal += 1
                wc = len(sent_text.split())
                sents_json.append({
                    'sentence_id':      f'{para_id}_s{sent_ordinal:02d}',
                    'sentence_ordinal': sent_ordinal,
                    'text':             sent_text,
                    'word_offset_start': word_offset,
                    'word_offset_end':   word_offset + wc,
                    'authorship_note':  sec['authorship_note'],
                    'metaphor_instances': [],
                })
                word_offset += wc

            paras_json.append({
                'paragraph_id':      para_id,
                'paragraph_ordinal': para_ordinal,
                'sentences':         sents_json,
            })

        if paras_json:
            sections_json.append({
                'section_id':      sec_id,
                'section_label':   sec['label'],
                'section_ordinal': sec_ordinal,
                'paragraphs':      paras_json,
            })

    return {
        'document_id': doc_id,
        'meta':        meta,
        'sections':    sections_json,
        'pipeline_log': [{'stage': 3, 'agent': 'scaffold', 'date': DATE}],
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def _count_sents(doc: dict) -> int:
    return sum(
        len(p['sentences'])
        for sec in doc['sections']
        for p in sec['paragraphs']
    )


def main():
    md_paths = sorted(TEXT_DIR.glob('*.md'))
    if ONLY:
        md_paths = [p for p in md_paths if p.stem in ONLY]

    written = skipped = 0

    for md_path in md_paths:
        doc_id   = md_path.stem
        out_path = SEG_DIR / f'{doc_id}.json'

        if out_path.exists() and not FORCE:
            print(f'  SKIP  {doc_id}')
            skipped += 1
            continue

        meta, body = _parse_md(md_path)
        doc = _segment(doc_id, meta, body)

        out_path.write_text(
            json.dumps(doc, indent=2, ensure_ascii=False),
            encoding='utf-8',
        )

        n_sec  = len(doc['sections'])
        n_sent = _count_sents(doc)
        print(f'  OK    {doc_id}  {n_sec} sections  {n_sent} sentences')
        written += 1

    print(f'\nDone. Written: {written}  Skipped: {skipped}')


if __name__ == '__main__':
    main()
