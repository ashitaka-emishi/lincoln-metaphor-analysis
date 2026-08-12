#!/usr/bin/env node
// Computes layered Stage 4H human-human inter-annotator agreement.
'use strict';

const fs = require('fs');
const path = require('path');
const { writeAtomic } = require('./write-guard');

const ROOT = process.env.STAGE4H_ROOT
  ? path.resolve(process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const NORMALIZED_PATH = path.join(ROOT, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json');
const MANIFEST_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-packet-manifest.json');
const SAMPLE_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
const SENTENCE_PACKET_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-sentence-identification-packet.jsonl');
const FIELD_PACKET_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-field-agreement-packet.jsonl');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'human-comparison');

const OUTPUT_PATHS = Object.freeze({
  results: path.join(OUTPUT_DIR, 'human-agreement-results.json'),
  summary: path.join(OUTPUT_DIR, 'human-agreement-summary.csv'),
  markdown: path.join(OUTPUT_DIR, 'human-agreement-results.md')
});

const PRIMARY_CODER_IDS = Object.freeze(['human_coder_a', 'human_coder_b']);
const SUMMARY_COLUMNS = Object.freeze([
  'layer', 'metric', 'agreements', 'comparisons', 'rate_pct', 'notes'
]);

const FIELD_LAYERS = Object.freeze({
  cmt_mapping: ['cluster_id', 'source_domain', 'target_domain'],
  koenigsberg_interpretation: [
    'koenigsberg_function', 'violence_logic', 'obligatory_frame', 'sacrifice_logic',
    'guilt_logic', 'providence_logic', 'reconciliation_logic'
  ],
  absence_agency: [
    'primary_actor', 'acted_upon_entity', 'agency_status', 'absence_flag',
    'enslaved_people_present', 'black_soldiers_present', 'disease_or_purification_present'
  ],
  confidence_ambiguity: ['confidence', 'ambiguity_flag', 'rival_reading_presence']
});

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJSONL(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').trim();
  if (!text) return [];
  return text.split(/\r?\n/).map(line => JSON.parse(line));
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function makeCSV(rows) {
  return [
    SUMMARY_COLUMNS.join(','),
    ...rows.map(row => SUMMARY_COLUMNS.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
}

function normalize(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim().replace(/\s+/g, ' ').toLowerCase();
  return text === '' ? null : text;
}

function metric(agreements, comparisons) {
  return {
    agreements,
    comparisons,
    rate_pct: comparisons === 0 ? null : Number(((agreements / comparisons) * 100).toFixed(2))
  };
}

function pairwiseKappa(rows) {
  const usable = rows.filter(([left, right]) => ['yes', 'no'].includes(left) && ['yes', 'no'].includes(right));
  if (usable.length === 0) return null;
  const observed = usable.filter(([left, right]) => left === right).length / usable.length;
  const labels = ['yes', 'no'];
  let expected = 0;
  for (const label of labels) {
    const leftRate = usable.filter(([left]) => left === label).length / usable.length;
    const rightRate = usable.filter(([, right]) => right === label).length / usable.length;
    expected += leftRate * rightRate;
  }
  if (expected === 1) return observed === 1 ? 1 : null;
  return Number(((observed - expected) / (1 - expected)).toFixed(4));
}

function positiveAgreement(rows) {
  let bothYes = 0;
  let leftYesRightNo = 0;
  let leftNoRightYes = 0;
  for (const [left, right] of rows) {
    if (left === 'yes' && right === 'yes') bothYes += 1;
    else if (left === 'yes' && right !== 'yes') leftYesRightNo += 1;
    else if (left !== 'yes' && right === 'yes') leftNoRightYes += 1;
  }
  const denominator = (2 * bothYes) + leftYesRightNo + leftNoRightYes;
  return denominator === 0 ? null : Number((((2 * bothYes) / denominator) * 100).toFixed(2));
}

function rangesOverlap(left, right) {
  return Number.isInteger(left.start) && Number.isInteger(left.end)
    && Number.isInteger(right.start) && Number.isInteger(right.end)
    && left.start < right.end && right.start < left.end;
}

function lexicalOverlap(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const aTokens = new Set(a.split(/[^a-z0-9]+/).filter(token => token.length > 2));
  const bTokens = new Set(b.split(/[^a-z0-9]+/).filter(token => token.length > 2));
  const intersection = [...aTokens].filter(token => bTokens.has(token)).length;
  return intersection > 0 && intersection / Math.min(aTokens.size, bTokens.size) >= 0.5;
}

function boundaryClassification(leftItems, rightItems) {
  const left = leftItems.filter(item => item.metaphor_present === 'yes');
  const right = rightItems.filter(item => item.metaphor_present === 'yes');
  if (left.length === 0 || right.length === 0) return 'missing_boundary';
  const leftKeys = left.map(item => `${item.lexical_unit_start}:${item.lexical_unit_end}:${normalize(item.lexical_unit)}`).sort();
  const rightKeys = right.map(item => `${item.lexical_unit_start}:${item.lexical_unit_end}:${normalize(item.lexical_unit)}`).sort();
  if (JSON.stringify(leftKeys) === JSON.stringify(rightKeys)) return 'exact_boundary_agreement';
  const partial = left.some(a => right.some(b => rangesOverlap(
    { start: a.lexical_unit_start, end: a.lexical_unit_end },
    { start: b.lexical_unit_start, end: b.lexical_unit_end }
  ) || lexicalOverlap(a.lexical_unit, b.lexical_unit)));
  return partial ? 'partial_overlap_agreement' : 'no_overlap';
}

function valuesEqual(field, left, right) {
  if (field === 'violence_logic') {
    const split = value => normalize(value) ? normalize(value).split('|').map(part => part.trim()).sort() : [];
    return JSON.stringify(split(left)) === JSON.stringify(split(right));
  }
  if (field === 'rival_reading_presence') return Boolean(normalize(left)) === Boolean(normalize(right));
  return normalize(left) === normalize(right);
}

function aggregateByPacket(submission) {
  const grouped = new Map();
  for (const item of submission.items || []) {
    if (!grouped.has(item.packet_unit_id)) grouped.set(item.packet_unit_id, []);
    grouped.get(item.packet_unit_id).push(item);
  }
  return grouped;
}

function primaryValue(items, field) {
  if (!items || items.length === 0) return null;
  if (field === 'metaphor_present') {
    if (items.some(item => item.metaphor_present === 'yes')) return 'yes';
    if (items.some(item => item.metaphor_present === 'uncertain')) return 'uncertain';
    return 'no';
  }
  if (field === 'rival_reading_presence') return items.some(item => normalize(item.rival_reading));
  const positive = items.find(item => item.metaphor_present === 'yes');
  return (positive || items[0])[field];
}

function buildPacketContext() {
  const manifest = readJSON(MANIFEST_PATH);
  const sample = readJSON(SAMPLE_PATH);
  const sampleControls = new Map((sample.identification_units || [])
    .map(unit => [`${unit.document_id}\u001f${unit.sentence_id}`, unit.control_type || null]));
  const packets = [...readJSONL(SENTENCE_PACKET_PATH), ...readJSONL(FIELD_PACKET_PATH)].map(record => ({
    packet_unit_id: record.packet_unit_id,
    task_type: record.packet_type,
    doc_id: record.document_id,
    sentence_id: record.sentence_id,
    control_type: sampleControls.get(`${record.document_id}\u001f${record.sentence_id}`) || null
  }));
  return { manifest, packets };
}

function emptyLayerMetrics() {
  return {
    identification: {
      label_agreement: metric(0, 0),
      labels: { yes: metric(0, 0), no: metric(0, 0), uncertain: metric(0, 0) },
      cohens_kappa_present_absent: null,
      positive_agreement_pct: null,
      negative_control_accuracy: { correct_absent: 0, false_positive: 0, uncertain: 0, total: 0, rate_pct: null },
      adjudicated_consensus: {
        available: false,
        false_positives: null,
        false_negatives: null
      }
    },
    lexical_boundary: {
      comparisons: 0,
      exact_boundary_agreement: 0,
      partial_overlap_agreement: 0,
      no_overlap: 0,
      missing_boundary: 0,
      exact_rate_pct: null
    },
    cmt_mapping: {},
    koenigsberg_interpretation: {},
    absence_agency: {},
    confidence_ambiguity: {}
  };
}

function comparePrimaryPair(left, right, packets) {
  const leftItems = aggregateByPacket(left);
  const rightItems = aggregateByPacket(right);
  const layers = emptyLayerMetrics();
  const identificationPairs = [];
  const fieldCounters = Object.fromEntries(Object.entries(FIELD_LAYERS)
    .flatMap(([layer, fields]) => fields.map(field => [`${layer}.${field}`, { agreements: 0, comparisons: 0 }])));

  for (const packet of packets) {
    const leftPacketItems = leftItems.get(packet.packet_unit_id) || [];
    const rightPacketItems = rightItems.get(packet.packet_unit_id) || [];
    if (leftPacketItems.length === 0 || rightPacketItems.length === 0) continue;
    const leftPresent = primaryValue(leftPacketItems, 'metaphor_present');
    const rightPresent = primaryValue(rightPacketItems, 'metaphor_present');

    if (packet.task_type === 'sentence_identification') {
      identificationPairs.push([leftPresent, rightPresent, packet]);
      if (packet.control_type === 'negative_control') {
        layers.identification.negative_control_accuracy.total += 1;
        if (leftPresent === 'no' && rightPresent === 'no') layers.identification.negative_control_accuracy.correct_absent += 1;
        else if (leftPresent === 'yes' || rightPresent === 'yes') layers.identification.negative_control_accuracy.false_positive += 1;
        else layers.identification.negative_control_accuracy.uncertain += 1;
      }
    }

    if (leftPresent === 'yes' || rightPresent === 'yes') {
      const boundary = boundaryClassification(leftPacketItems, rightPacketItems);
      layers.lexical_boundary.comparisons += 1;
      layers.lexical_boundary[boundary] += 1;
    }

    if (packet.task_type === 'field_agreement') {
      for (const [layer, fields] of Object.entries(FIELD_LAYERS)) {
        for (const field of fields) {
          const key = `${layer}.${field}`;
          fieldCounters[key].comparisons += 1;
          if (valuesEqual(field, primaryValue(leftPacketItems, field), primaryValue(rightPacketItems, field))) {
            fieldCounters[key].agreements += 1;
          }
        }
      }
    }
  }

  const agreedLabels = identificationPairs.filter(([leftValue, rightValue]) => leftValue === rightValue).length;
  layers.identification.label_agreement = metric(agreedLabels, identificationPairs.length);
  for (const label of ['yes', 'no', 'uncertain']) {
    const comparisons = identificationPairs.filter(([leftValue, rightValue]) => leftValue === label || rightValue === label).length;
    const agreements = identificationPairs.filter(([leftValue, rightValue]) => leftValue === label && rightValue === label).length;
    layers.identification.labels[label] = metric(agreements, comparisons);
  }
  layers.identification.cohens_kappa_present_absent = pairwiseKappa(identificationPairs.map(([leftValue, rightValue]) => [leftValue, rightValue]));
  layers.identification.positive_agreement_pct = positiveAgreement(identificationPairs.map(([leftValue, rightValue]) => [leftValue, rightValue]));
  const negative = layers.identification.negative_control_accuracy;
  negative.rate_pct = negative.total === 0 ? null : Number(((negative.correct_absent / negative.total) * 100).toFixed(2));
  layers.lexical_boundary.exact_rate_pct = layers.lexical_boundary.comparisons === 0
    ? null
    : Number(((layers.lexical_boundary.exact_boundary_agreement / layers.lexical_boundary.comparisons) * 100).toFixed(2));

  for (const [layer, fields] of Object.entries(FIELD_LAYERS)) {
    for (const field of fields) {
      const counter = fieldCounters[`${layer}.${field}`];
      layers[layer][field] = metric(counter.agreements, counter.comparisons);
    }
  }
  layers.cmt_mapping.source_domain_family = { available: false, ...metric(0, 0) };
  layers.cmt_mapping.target_domain_family = { available: false, ...metric(0, 0) };

  return {
    comparison_id: `${left.coder_id}__vs__${right.coder_id}`,
    coder_ids: [left.coder_id, right.coder_id],
    shared_packet_units: new Set([...leftItems.keys()].filter(key => rightItems.has(key))).size,
    layers
  };
}

function summaryRows(results) {
  const rows = [];
  if (!results.human_human) return rows;
  const { layers } = results.human_human;
  rows.push({
    layer: 'identification',
    metric: 'present_absent_uncertain_agreement',
    ...layers.identification.label_agreement,
    notes: `kappa=${layers.identification.cohens_kappa_present_absent ?? 'n/a'}; positive_agreement=${layers.identification.positive_agreement_pct ?? 'n/a'}`
  });
  rows.push({
    layer: 'identification',
    metric: 'negative_control_accuracy',
    agreements: layers.identification.negative_control_accuracy.correct_absent,
    comparisons: layers.identification.negative_control_accuracy.total,
    rate_pct: layers.identification.negative_control_accuracy.rate_pct,
    notes: `false_positive=${layers.identification.negative_control_accuracy.false_positive}; uncertain=${layers.identification.negative_control_accuracy.uncertain}`
  });
  rows.push({
    layer: 'lexical_boundary',
    metric: 'exact_boundary_agreement',
    agreements: layers.lexical_boundary.exact_boundary_agreement,
    comparisons: layers.lexical_boundary.comparisons,
    rate_pct: layers.lexical_boundary.exact_rate_pct,
    notes: `partial=${layers.lexical_boundary.partial_overlap_agreement}; no_overlap=${layers.lexical_boundary.no_overlap}; missing=${layers.lexical_boundary.missing_boundary}`
  });
  for (const [layer, fields] of Object.entries(FIELD_LAYERS)) {
    for (const field of fields) {
      rows.push({ layer, metric: `${field}_agreement`, ...layers[layer][field], notes: '' });
    }
  }
  rows.push({ layer: 'cmt_mapping', metric: 'source_domain_family_agreement', ...layers.cmt_mapping.source_domain_family, notes: 'not_available' });
  rows.push({ layer: 'cmt_mapping', metric: 'target_domain_family_agreement', ...layers.cmt_mapping.target_domain_family, notes: 'not_available' });
  return rows;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`)
  ].join('\n');
}

function renderMarkdown(results) {
  const lines = [
    '# Stage 4H Human-Human Agreement Results',
    '',
    `Status: **${results.status.replaceAll('_', ' ')}**`,
    '',
    'These metrics report only two-human Stage 4H agreement. They are not averaged with Stage 4B or Stage 4M.',
    ''
  ];
  if (results.status === 'no_submissions') {
    lines.push('No validated human submissions are available. Stage 4H agreement metrics will be generated after both primary human coders submit valid packets.');
    return lines.join('\n').trimEnd() + '\n';
  }
  if (results.status === 'partial_execution') {
    lines.push('Only one primary human submission is available. Human-human agreement requires both `human_coder_a` and `human_coder_b`.', '');
    return lines.join('\n').trimEnd() + '\n';
  }
  const rows = summaryRows(results).map(row => [
    row.layer,
    row.metric,
    `${row.agreements}/${row.comparisons}`,
    row.rate_pct === null ? 'n/a' : `${row.rate_pct}%`,
    row.notes || ''
  ]);
  lines.push('## Layered Agreement', '', markdownTable(['Layer', 'Metric', 'Agreement', 'Rate', 'Notes'], rows), '',
    '## Identification Diagnostics', '',
    `Cohen's kappa for present/absent labels: ${results.human_human.layers.identification.cohens_kappa_present_absent ?? 'n/a'}.`, '',
    `Positive agreement: ${results.human_human.layers.identification.positive_agreement_pct ?? 'n/a'}%.`, '',
    '## Stage 4A Policy', '', results.stage4a_policy);
  return lines.join('\n').trimEnd() + '\n';
}

function compare({ write }) {
  const normalized = readJSON(NORMALIZED_PATH);
  if (normalized.status === 'validation_failed') {
    throw new Error('Normalized human runs report upstream validation failures; fix submissions before computing agreement.');
  }
  const { manifest, packets } = buildPacketContext();
  const primary = (normalized.submissions || [])
    .filter(submission => PRIMARY_CODER_IDS.includes(submission.coder_id))
    .sort((left, right) => left.coder_id.localeCompare(right.coder_id));
  const status = primary.length === 0
    ? 'no_submissions'
    : primary.length < 2 ? 'partial_execution' : 'complete';
  const humanHuman = primary.length >= 2 ? comparePrimaryPair(primary[0], primary[1], packets) : null;
  const results = {
    schema_version: 'stage4h-human-agreement-results-1.0',
    status,
    source_normalized_runs: relative(NORMALIZED_PATH),
    source_packet_manifest: relative(MANIFEST_PATH),
    source_reliability_sample: relative(SAMPLE_PATH),
    packet_id: normalized.packet_id || manifest.packet_id,
    input_packet_hash: normalized.input_packet_hash || manifest.input_packet_hash,
    metric_policy: 'Metrics are reported by layer. Stage 4H human-human agreement is not averaged with Stage 4B or Stage 4M.',
    stage4a_policy: 'Human-vs-Stage 4A comparison is intentionally not included in this artifact; #94 reports that separately.',
    totals: {
      primary_human_coders: primary.length,
      packet_units: packets.length,
      identification_units: packets.filter(packet => packet.task_type === 'sentence_identification').length,
      field_agreement_units: packets.filter(packet => packet.task_type === 'field_agreement').length
    },
    human_human: humanHuman
  };
  const rows = summaryRows(results);
  if (write) {
    writeAtomic(OUTPUT_PATHS.results, JSON.stringify(results, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.summary, makeCSV(rows));
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(results));
  }
  if (status === 'no_submissions') console.warn('WARN: No validated Stage 4H human submissions are available for agreement metrics.');
  else if (status === 'partial_execution') console.warn('WARN: Stage 4H agreement requires two primary human coder submissions.');
  else console.log(`Stage 4H human-human agreement computed for ${primary[0].coder_id} and ${primary[1].coder_id}.`);
  if (write) console.log(`Agreement results: ${relative(OUTPUT_PATHS.results)}`);
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  compare({ write: !args.includes('--check') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4H comparison failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  boundaryClassification,
  compare,
  comparePrimaryPair,
  pairwiseKappa,
  positiveAgreement
};
