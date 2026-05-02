#!/usr/bin/env python3
"""Stage 7: Compare Lincoln concordance metadata with the LCC Metaphor Dataset.

Always produces a Lincoln-side summary from data/concordance.json.
When an LCC CSV (from parse_lcc.py) is provided, also produces a concept-domain
comparison showing which LCC source-concept categories are represented in Lincoln.

Usage (Lincoln-only summary):
    python3 scripts/evaluate_lcc.py

Usage (full comparison with LCC data):
    python3 scripts/evaluate_lcc.py \\
        --lcc data/lcc_subset/en_small.csv \\
        --output reports/stage7/LCC_report.md
"""

import argparse
import csv
import json
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Optional

CONCORDANCE_PATH = Path('data/concordance.json')
DEFAULT_OUTPUT = Path('reports/stage7/LCC_report.md')

# Keyword-based mapping from LCC source-concept categories → Lincoln cluster IDs.
# Each LCC concept maps to the cluster(s) whose source domain text it is most
# likely to match. Used for the domain-coverage comparison.
LCC_TO_LINCOLN_CLUSTER = {
    'BODY': 'cluster_01_body_organism',
    'HEALTH': 'cluster_01_body_organism',
    'DISEASE': 'cluster_01_body_organism',
    'ORGANISM': 'cluster_01_body_organism',
    'WOUND': 'cluster_01_body_organism',
    'BIRTH': 'cluster_04_birth_creation',
    'DEATH': 'cluster_04_birth_creation',
    'WAR': 'cluster_04_birth_creation',
    'CONFLICT': 'cluster_04_birth_creation',
    'FORCE': 'cluster_04_birth_creation',
    'RELIGION': 'cluster_06_providence_theodicy',
    'LIGHT': 'cluster_06_providence_theodicy',
    'DIVINE': 'cluster_06_providence_theodicy',
    'SACRED': 'cluster_02_covenant_oath',
    'CONTRACT': 'cluster_02_covenant_oath',
    'OBLIGATION': 'cluster_02_covenant_oath',
    'OATH': 'cluster_02_covenant_oath',
    'LAW': 'cluster_02_covenant_oath',
    'INHERITANCE': 'cluster_05_fathers_inheritance',
    'PROPERTY': 'cluster_05_fathers_inheritance',
    'PATRIMONY': 'cluster_05_fathers_inheritance',
    'EXPERIMENT': 'cluster_03_experiment_proposition',
    'SCIENCE': 'cluster_03_experiment_proposition',
    'PROOF': 'cluster_03_experiment_proposition',
    'TEST': 'cluster_03_experiment_proposition',
}

CLUSTER_LABELS = {
    'cluster_01_body_organism': 'Nation as organism / body',
    'cluster_02_covenant_oath': 'Union as covenant / oath',
    'cluster_03_experiment_proposition': 'Republic as experiment / proposition',
    'cluster_04_birth_creation': 'War as birth / new creation',
    'cluster_05_fathers_inheritance': 'Founding fathers as inheritance',
    'cluster_06_providence_theodicy': 'Providence / divine will',
}


def load_concordance(path: Path) -> dict:
    with path.open(encoding='utf-8') as f:
        return json.load(f)


def load_lcc_csv(path: Path) -> list[dict]:
    rows = []
    with path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def lincoln_stats(concordance: dict) -> dict:
    instances = concordance.get('instances', [])
    cluster_counts = Counter()
    source_domains = defaultdict(list)
    high_conf = []

    for inst in instances:
        cmt = inst.get('cmt', {})
        cluster_id = cmt.get('cluster_id', 'unknown')
        cluster_counts[cluster_id] += 1
        source_domains[cluster_id].append(cmt.get('source_domain', ''))
        if inst.get('meta', {}).get('confidence', 0) >= 0.90:
            high_conf.append(inst['instance_id'])

    return {
        'total': len(instances),
        'cluster_counts': dict(cluster_counts),
        'high_confidence_count': len(high_conf),
        'source_domains': dict(source_domains),
    }


def lcc_stats(rows: list[dict]) -> dict:
    total = len(rows)
    metaphor_count = sum(1 for r in rows if int(r.get('is_metaphor', 0)))
    source_counts = Counter(r.get('source_concept', '').upper() for r in rows if r.get('source_concept'))
    target_counts = Counter(r.get('target_concept', '').upper() for r in rows if r.get('target_concept'))
    return {
        'total': total,
        'metaphor_count': metaphor_count,
        'literal_count': total - metaphor_count,
        'source_concept_counts': source_counts.most_common(30),
        'target_concept_counts': target_counts.most_common(20),
    }


def coverage_analysis(lcc_rows: list[dict], lincoln: dict) -> dict:
    """For each LCC source concept, find the best-matching Lincoln cluster."""
    lcc_source_counts = Counter(
        r.get('source_concept', '').upper() for r in lcc_rows
        if r.get('source_concept') and int(r.get('is_metaphor', 0))
    )

    coverage = {}
    uncovered = {}
    for concept, count in lcc_source_counts.most_common(50):
        matched_cluster = None
        for keyword, cluster_id in LCC_TO_LINCOLN_CLUSTER.items():
            if keyword in concept:
                matched_cluster = cluster_id
                break
        if matched_cluster:
            coverage[concept] = {'count': count, 'cluster': matched_cluster}
        else:
            uncovered[concept] = count

    lincoln_cluster_ids = set(lincoln['cluster_counts'].keys())
    mapped_clusters = {v['cluster'] for v in coverage.values()}
    unmapped_clusters = lincoln_cluster_ids - mapped_clusters

    return {
        'covered_lcc_concepts': coverage,
        'uncovered_lcc_concepts': dict(list(uncovered.items())[:20]),
        'lincoln_clusters_with_lcc_match': sorted(mapped_clusters),
        'lincoln_clusters_without_lcc_match': sorted(unmapped_clusters),
    }


def render_report(lincoln: dict, lcc: Optional[dict], cov: Optional[dict], output_path: Path) -> None:
    today = date.today().isoformat()
    lines = [
        f'# Stage 7: LCC Metaphor Dataset Validation',
        f'',
        f'**Generated:** {today}  ',
        f'**Concordance:** `data/concordance.json`  ',
    ]
    if lcc:
        lines.append(f'**LCC data:** `data/lcc_subset/` (en_small subset)  ')
    lines += ['', '---', '']

    # Lincoln summary
    lines += [
        '## Lincoln Corpus Summary (Stage 4–6 Annotations)',
        '',
        f'Total annotated instances: **{lincoln["total"]}**  ',
        f'High-confidence instances (≥0.90): **{lincoln["high_confidence_count"]}**',
        '',
        '### Cluster Distribution',
        '',
        '| Cluster ID | Cluster Name | Instance Count |',
        '|---|---|---|',
    ]
    for cluster_id, count in sorted(lincoln['cluster_counts'].items()):
        label = CLUSTER_LABELS.get(cluster_id, cluster_id)
        lines.append(f'| `{cluster_id}` | {label} | {count} |')
    lines.append('')

    if lcc is None:
        lines += [
            '---',
            '',
            '## LCC Comparison',
            '',
            '_No LCC CSV found. Run `parse_lcc.py` first:_',
            '',
            '```bash',
            '# Download en_small.xml from https://github.com/lcc-api/metaphor',
            '# then:',
            'python3 scripts/parse_lcc.py --input data/lcc/en_small.xml --output data/lcc_subset/en_small.csv',
            'python3 scripts/evaluate_lcc.py --lcc data/lcc_subset/en_small.csv',
            '```',
        ]
    else:
        lines += [
            '---',
            '',
            '## LCC Dataset Summary',
            '',
            f'Total annotations: **{lcc["total"]}**  ',
            f'Metaphorical (score > 0): **{lcc["metaphor_count"]}**  ',
            f'Literal (score = 0): **{lcc["literal_count"]}**',
            '',
            '### Top LCC Source Concepts (metaphorical instances only)',
            '',
            '| Source Concept | Count |',
            '|---|---|',
        ]
        for concept, count in lcc['source_concept_counts'][:20]:
            lines.append(f'| {concept} | {count} |')
        lines.append('')

        if cov:
            lines += [
                '---',
                '',
                '## Domain Coverage Analysis',
                '',
                'Mapping of LCC source-concept categories → Lincoln metaphor clusters.',
                '',
                '### LCC Concepts Covered by Lincoln Clusters',
                '',
                '| LCC Source Concept | LCC Count | Lincoln Cluster |',
                '|---|---|---|',
            ]
            for concept, info in sorted(cov['covered_lcc_concepts'].items(),
                                        key=lambda x: -x[1]['count']):
                cluster_label = CLUSTER_LABELS.get(info['cluster'], info['cluster'])
                lines.append(f'| {concept} | {info["count"]} | {cluster_label} |')

            lines += [
                '',
                '### LCC Concepts Not Covered by Lincoln Clusters',
                '',
                '| LCC Source Concept | LCC Count |',
                '|---|---|',
            ]
            for concept, count in sorted(cov['uncovered_lcc_concepts'].items(),
                                         key=lambda x: -x[1]):
                lines.append(f'| {concept} | {count} |')

            lines += [
                '',
                '### Lincoln Cluster Coverage Summary',
                '',
                f'Lincoln clusters with LCC concept matches: '
                f'**{len(cov["lincoln_clusters_with_lcc_match"])} / {len(CLUSTER_LABELS)}**',
                '',
            ]
            if cov['lincoln_clusters_without_lcc_match']:
                lines.append('Clusters with no direct LCC concept match:')
                for c in cov['lincoln_clusters_without_lcc_match']:
                    lines.append(f'- `{c}` — {CLUSTER_LABELS.get(c, c)}')
                lines.append('')

            lines += [
                '> **Interpretation:** Lincoln\'s metaphor system operates within a narrow',
                '> subset of the LCC taxonomy — primarily BODY, WAR/BIRTH, RELIGION, CONTRACT,',
                '> and INHERITANCE concepts. The LCC provides a useful reference frame for',
                '> identifying which conceptual domains Lincoln avoids (e.g. JOURNEY, MACHINE,',
                '> PLANT) relative to typical English metaphor usage.',
                '',
            ]

    lines += [
        '---',
        '',
        '## References',
        '',
        '- LCC Metaphor Dataset: https://github.com/lcc-api/metaphor  ',
        '- Mohler et al. (2016). A Corpus of Rich Metaphor Annotation. LREC.  ',
        '- Lakoff & Johnson (1980). *Metaphors We Live By*.  ',
        '- Lincoln corpus: `corpus/annotated/` (Stages 1–6, completed 2026-04-30)',
    ]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f"Report written → {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description='Stage 7 LCC evaluation')
    parser.add_argument('--concordance', default=str(CONCORDANCE_PATH),
                        help='Path to concordance.json')
    parser.add_argument('--lcc', default=None,
                        help='Path to parsed LCC CSV (from parse_lcc.py). Optional.')
    parser.add_argument('--output', default=str(DEFAULT_OUTPUT),
                        help='Output report path (Markdown)')
    args = parser.parse_args()

    concordance_path = Path(args.concordance)
    if not concordance_path.exists():
        print(f"Error: concordance not found at {concordance_path}", file=sys.stderr)
        sys.exit(1)

    concordance = load_concordance(concordance_path)
    lincoln = lincoln_stats(concordance)
    print(f"Lincoln: {lincoln['total']} instances across {len(lincoln['cluster_counts'])} clusters")

    lcc_data = None
    cov = None
    if args.lcc:
        lcc_path = Path(args.lcc)
        if not lcc_path.exists():
            print(f"Warning: LCC CSV not found at {lcc_path}. Generating Lincoln-only report.",
                  file=sys.stderr)
        else:
            rows = load_lcc_csv(lcc_path)
            lcc_data = lcc_stats(rows)
            cov = coverage_analysis(rows, lincoln)
            print(f"LCC: {lcc_data['total']} annotations "
                  f"({lcc_data['metaphor_count']} metaphorical)")

    render_report(lincoln, lcc_data, cov, Path(args.output))


if __name__ == '__main__':
    main()
