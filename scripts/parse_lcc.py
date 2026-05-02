#!/usr/bin/env python3
"""Parse LCC Metaphor Dataset XML into a flat CSV for Stage 7 evaluation.

Actual schema (en_small.xml):
  <LCC-Metaphor-SMALL lang="ENGLISH">
    <LmInstance id="..." docid="..." targetConcept="TARGET" type="..." chain="...">
      <TextContent>
        <Prev>...</Prev>
        <Current>...<LmSource>word</LmSource>...<LmTarget>word</LmTarget>...</Current>
        <Next>...</Next>
      </TextContent>
      <Annotations>
        <MetaphoricityAnnotations>
          <MetaphoricityAnnotation id="..." score="3.0" annotatorID="..." />
          ...
        </MetaphoricityAnnotations>
        <CMSourceAnnotations>            <!-- present on ~3.5k of 16k instances -->
          <CMSourceAnnotation id="..." sourceConcept="DISEASE" score="3.0" ... />
          ...
        </CMSourceAnnotations>
      </Annotations>
    </LmInstance>
  </LCC-Metaphor-SMALL>

Multiple annotators contribute MetaphoricityAnnotation entries per instance.
Aggregation: average score across annotators; majority sourceConcept by weighted score.

Usage:
    python3 scripts/parse_lcc.py --input data/lcc/en_small.xml --output data/lcc_subset/en_small.csv
    python3 scripts/parse_lcc.py --input data/lcc/en_small.xml --inspect
"""

import argparse
import csv
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path


def inspect_xml(path: Path) -> None:
    tree = ET.parse(path)
    root = tree.getroot()
    print(f"Root: <{root.tag}> attribs={dict(root.attrib)}")
    print(f"Total child elements: {len(list(root))}")
    print()
    inst = list(root)[0]
    ET.dump(inst)


def _current_text(current_elem: ET.Element) -> str:
    return ''.join(current_elem.itertext()).strip()


def _context_text(inst: ET.Element) -> str:
    tc = inst.find('TextContent')
    if tc is None:
        return ''
    parts = []
    for tag in ('Prev', 'Current', 'Next'):
        elem = tc.find(tag)
        if elem is not None:
            parts.append(''.join(elem.itertext()).strip())
    return ' '.join(p for p in parts if p)


def _avg_metaphoricity(inst: ET.Element) -> float:
    scores = []
    for ann in inst.findall('Annotations/MetaphoricityAnnotations/MetaphoricityAnnotation'):
        try:
            scores.append(float(ann.get('score', '-1')))
        except ValueError:
            pass
    valid = [s for s in scores if s >= 0]
    return sum(valid) / len(valid) if valid else -1.0


def _best_source_concept(inst: ET.Element) -> str:
    """Return source concept with highest aggregate score across annotators."""
    concept_scores: dict[str, float] = defaultdict(float)
    for ann in inst.findall('Annotations/CMSourceAnnotations/CMSourceAnnotation'):
        concept = ann.get('sourceConcept', '').strip().upper()
        try:
            score = float(ann.get('score', '0'))
        except ValueError:
            score = 0.0
        if concept:
            concept_scores[concept] += score
    if not concept_scores:
        return ''
    return max(concept_scores, key=lambda c: concept_scores[c])


def parse(input_path: Path, output_path: Path) -> int:
    tree = ET.parse(input_path)
    root = tree.getroot()

    rows = []
    skipped = 0

    for inst in root:
        if inst.tag != 'LmInstance':
            continue

        avg_score = _avg_metaphoricity(inst)
        if avg_score < 0:
            skipped += 1
            continue

        sentence = _context_text(inst)
        source_concept = _best_source_concept(inst)
        target_concept = inst.get('targetConcept', '').strip().upper()

        lm_source_elem = inst.find('TextContent/Current/LmSource')
        lm_target_elem = inst.find('TextContent/Current/LmTarget')
        lm_source = (lm_source_elem.text or '').strip() if lm_source_elem is not None else ''
        lm_target = (lm_target_elem.text or '').strip() if lm_target_elem is not None else ''

        rows.append({
            'docid': inst.get('docid', ''),
            'instance_id': inst.get('id', ''),
            'sentence': sentence,
            'lm_source_word': lm_source,
            'lm_target_word': lm_target,
            'avg_score': round(avg_score, 2),
            'is_metaphor': int(avg_score > 0),
            'source_concept': source_concept,
            'target_concept': target_concept,
        })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ['docid', 'instance_id', 'sentence', 'lm_source_word', 'lm_target_word',
                  'avg_score', 'is_metaphor', 'source_concept', 'target_concept']
    with output_path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    metaphor_count = sum(r['is_metaphor'] for r in rows)
    with_source = sum(1 for r in rows if r['source_concept'])
    print(f"Parsed {len(rows)} valid annotations → {output_path}")
    print(f"Skipped {skipped} invalid (score=-1) annotations")
    print(f"Metaphorical (avg_score > 0): {metaphor_count}  |  Literal: {len(rows) - metaphor_count}")
    print(f"With source concept annotation: {with_source} / {len(rows)}")
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description='Parse LCC XML → CSV')
    parser.add_argument('--input', required=True, help='Path to LCC XML file')
    parser.add_argument('--output', default='data/lcc_subset/en_small.csv',
                        help='Output CSV path')
    parser.add_argument('--inspect', action='store_true',
                        help='Print XML structure and exit')
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: {input_path} not found. Run: npm run stage7:download", file=sys.stderr)
        sys.exit(1)

    if args.inspect:
        inspect_xml(input_path)
        return

    parse(input_path, Path(args.output))


if __name__ == '__main__':
    main()
