#!/usr/bin/env node
// Compares Stage 4H human outputs with immutable Stage 4A reference values.
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
  results: path.join(OUTPUT_DIR, 'human-vs-reference-results.json'),
  summary: path.join(OUTPUT_DIR, 'human-vs-reference-summary.csv'),
  markdown: path.join(OUTPUT_DIR, 'human-vs-reference-results.md')
});

const PRIMARY_CODER_IDS = Object.freeze(['human_coder_a', 'human_coder_b']);
const SUMMARY_COLUMNS = Object.freeze([
  'scope', 'subject_id', 'layer', 'field', 'matches', 'comparisons', 'rate_pct', 'notes'
]);
const FIELD_SPECS = Object.freeze({
  metaphor_present: { layer: 'identification' },
  cluster_id: { layer: 'cmt_mapping' },
  source_domain: { layer: 'cmt_mapping' },
  target_domain: { layer: 'cmt_mapping' },
  koenigsberg_function: { layer: 'koenigsberg_interpretation' },
  violence_logic: { layer: 'koenigsberg_interpretation' },
  obligatory_frame: { layer: 'koenigsberg_interpretation' },
  absence_flag: { layer: 'absence_agency' },
  ambiguity_flag: { layer: 'confidence_ambiguity' }
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

function humanBooleanPresence(value) {
  const normalized = normalize(value);
  if (normalized === null) return 'no';
  if (['no', 'false', 'none', 'n/a', 'not applicable'].includes(normalized)) return 'no';
  return 'yes';
}

function metric(matches, comparisons) {
  return {
    matches,
    comparisons,
    rate_pct: comparisons === 0 ? null : Number(((matches / comparisons) * 100).toFixed(2))
  };
}

function referenceMetaphor(value) {
  return value === 'metaphor_related' ? 'yes' : 'no';
}

function referenceBool(value) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return null;
}

function sampleKey(docId, sentenceId, spanText = '') {
  return `${docId}\u001f${sentenceId}\u001f${normalize(spanText) || ''}`;
}

function buildReferenceContext() {
  const manifest = readJSON(MANIFEST_PATH);
  const sample = readJSON(SAMPLE_PATH);
  const identificationRefs = new Map((sample.identification_units || []).map(unit => [sampleKey(unit.document_id, unit.sentence_id), {
    reliability_unit_id: unit.reliability_unit_id,
    reference_confident: true,
    values: {
      metaphor_present: unit.stage4_anchor_count > 0 ? 'yes' : 'no'
    }
  }]));
  const fieldRefs = new Map((sample.field_agreement_units || []).map(unit => {
    const reference = unit.reference_values || {};
    return [sampleKey(unit.document_id, unit.sentence_id, unit.span_text), {
      reliability_unit_id: unit.reliability_unit_id,
      reference_confident: Number(reference.confidence_score || 0) >= 0.85,
      values: {
        metaphor_present: referenceMetaphor(reference.mipvu_decision),
        cluster_id: reference.cluster_id || null,
        source_domain: reference.source_domain || null,
        target_domain: reference.target_domain || null,
        koenigsberg_function: reference.fantasy_type || null,
        violence_logic: reference.violence_logic || null,
        obligatory_frame: referenceBool(reference.obligatory_frame),
        absence_flag: Array.isArray(reference.absence_flags) && reference.absence_flags.length > 0 ? reference.absence_flags[0] : null,
        ambiguity_flag: referenceBool(reference.ambiguity_flag)
      }
    }];
  }));
  const sentencePackets = readJSONL(SENTENCE_PACKET_PATH).map(record => ({
    packet_unit_id: record.packet_unit_id,
    task_type: record.packet_type,
    doc_id: record.document_id,
    sentence_id: record.sentence_id,
    reference: identificationRefs.get(sampleKey(record.document_id, record.sentence_id)) || null
  }));
  const fieldPackets = readJSONL(FIELD_PACKET_PATH).map(record => ({
    packet_unit_id: record.packet_unit_id,
    task_type: record.packet_type,
    doc_id: record.document_id,
    sentence_id: record.sentence_id,
    span_text: record.provided_span_text,
    reference: fieldRefs.get(sampleKey(record.document_id, record.sentence_id, record.provided_span_text)) || null
  }));
  return { manifest, packets: [...sentencePackets, ...fieldPackets] };
}

function aggregateByPacket(submission) {
  const grouped = new Map();
  for (const item of submission.items || []) {
    if (!grouped.has(item.packet_unit_id)) grouped.set(item.packet_unit_id, []);
    grouped.get(item.packet_unit_id).push(item);
  }
  return grouped;
}

function humanValue(items, field) {
  if (!items || items.length === 0) return null;
  if (field === 'metaphor_present') {
    if (items.some(item => item.metaphor_present === 'split')) return 'split';
    if (items.some(item => item.metaphor_present === 'yes')) return 'yes';
    if (items.some(item => item.metaphor_present === 'uncertain')) return 'uncertain';
    return 'no';
  }
  const positive = items.find(item => item.metaphor_present === 'yes') || items[0];
  if (field === 'obligatory_frame') return humanBooleanPresence(positive.obligatory_frame);
  return positive[field];
}

function valuesMatch(field, human, reference) {
  if (field === 'violence_logic') {
    const split = value => normalize(value) ? normalize(value).split('|').map(part => part.trim()).sort() : [];
    return JSON.stringify(split(human)) === JSON.stringify(split(reference));
  }
  return normalize(human) === normalize(reference);
}

function compareSubject(subject, packets) {
  const grouped = aggregateByPacket(subject);
  const counters = Object.fromEntries(Object.entries(FIELD_SPECS).map(([field, spec]) => [field, {
    layer: spec.layer,
    matches: 0,
    comparisons: 0
  }]));
  const item_results = [];

  for (const packet of packets) {
    const items = grouped.get(packet.packet_unit_id) || [];
    if (items.length === 0 || !packet.reference) continue;
    const fields = packet.task_type === 'sentence_identification'
      ? ['metaphor_present']
      : Object.keys(FIELD_SPECS);
    for (const field of fields) {
      const referenceValue = packet.reference.values[field];
      if (referenceValue === undefined) continue;
      const value = humanValue(items, field);
      const matches_reference = valuesMatch(field, value, referenceValue);
      counters[field].comparisons += 1;
      if (matches_reference) counters[field].matches += 1;
      item_results.push({
        packet_unit_id: packet.packet_unit_id,
        task_type: packet.task_type,
        field,
        layer: FIELD_SPECS[field].layer,
        human_value: value,
        stage4a_value: referenceValue,
        matches_reference,
        reference_confident: packet.reference.reference_confident,
        reliability_unit_id: packet.reference.reliability_unit_id
      });
    }
  }

  return {
    subject_id: subject.coder_id || subject.subject_id,
    subject_type: subject.subject_type || 'human_coder',
    fields: Object.fromEntries(Object.entries(counters).map(([field, counter]) => [field, {
      layer: counter.layer,
      ...metric(counter.matches, counter.comparisons)
    }])),
    item_results
  };
}

function buildConsensus(primary) {
  if (primary.length < 2) return null;
  const grouped = primary.map(submission => ({ submission, items: aggregateByPacket(submission) }));
  const packetIds = new Set(grouped.flatMap(({ items }) => [...items.keys()]));
  const items = [];
  for (const packetUnitId of packetIds) {
    const left = grouped[0].items.get(packetUnitId) || [];
    const right = grouped[1].items.get(packetUnitId) || [];
    if (left.length === 0 || right.length === 0) continue;
    const fields = Object.keys(FIELD_SPECS);
    const consensus = { packet_unit_id: packetUnitId };
    consensus.metaphor_present = humanValue(left, 'metaphor_present') === humanValue(right, 'metaphor_present')
      ? humanValue(left, 'metaphor_present')
      : 'split';
    for (const field of fields.filter(field => field !== 'metaphor_present')) {
      const leftValue = humanValue(left, field);
      const rightValue = humanValue(right, field);
      consensus[field] = valuesMatch(field, leftValue, rightValue) ? leftValue : null;
    }
    items.push(consensus);
  }
  return {
    subject_id: 'human_consensus_unadjudicated',
    subject_type: 'human_consensus',
    coder_id: 'human_consensus_unadjudicated',
    items
  };
}

function classifyStage4JCandidates(primaryComparisons) {
  if (primaryComparisons.length < 2) return [];
  const byKey = new Map();
  for (const comparison of primaryComparisons) {
    for (const result of comparison.item_results) {
      const key = `${result.packet_unit_id}\u001f${result.field}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ coder_id: comparison.subject_id, ...result });
    }
  }
  const candidates = [];
  for (const [key, records] of byKey) {
    if (records.length < 2) continue;
    const [left, right] = records;
    const bothDisagree = !left.matches_reference && !right.matches_reference;
    const split = !valuesMatch(left.field, left.human_value, right.human_value);
    const stage4aAlignsOne = (left.matches_reference && !right.matches_reference) || (!left.matches_reference && right.matches_reference);
    const bothUncertainAgainstConfident = left.reference_confident
      && normalize(left.human_value) === 'uncertain'
      && normalize(right.human_value) === 'uncertain'
      && normalize(left.stage4a_value) !== 'uncertain';
    const reasons = [];
    if (bothDisagree) reasons.push('both_humans_disagree_with_stage4a');
    if (split && stage4aAlignsOne) reasons.push('human_split_stage4a_aligns_with_one_coder');
    if (bothUncertainAgainstConfident) reasons.push('both_humans_uncertain_against_confident_stage4a');
    if (reasons.length === 0) continue;
    candidates.push({
      candidate_id: `stage4j_candidate_${String(candidates.length + 1).padStart(4, '0')}`,
      packet_unit_id: left.packet_unit_id,
      field: left.field,
      layer: left.layer,
      stage4a_value: left.stage4a_value,
      coder_values: Object.fromEntries(records.map(record => [record.coder_id, record.human_value])),
      reasons,
      stage4a_policy: 'Candidate requires Stage 4J review; it is not an automatic Stage 4A correction.'
    });
  }
  return candidates;
}

function summaryRows(results) {
  const rows = [];
  for (const comparison of [...results.human_vs_reference, ...(results.consensus_vs_reference ? [results.consensus_vs_reference] : [])]) {
    for (const [field, values] of Object.entries(comparison.fields)) {
      rows.push({
        scope: comparison.subject_type === 'human_consensus' ? 'consensus_vs_reference' : 'coder_vs_reference',
        subject_id: comparison.subject_id,
        layer: values.layer,
        field,
        matches: values.matches,
        comparisons: values.comparisons,
        rate_pct: values.rate_pct,
        notes: ''
      });
    }
  }
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
    '# Stage 4H Human vs Stage 4A Reference Results',
    '',
    `Status: **${results.status.replaceAll('_', ' ')}**`,
    '',
    results.reference_policy,
    ''
  ];
  if (results.status === 'no_submissions') {
    lines.push('No validated human submissions are available. Human-vs-reference comparison will be generated after Stage 4H submissions are ingested.');
    return lines.join('\n').trimEnd() + '\n';
  }
  const rows = summaryRows(results).map(row => [
    row.scope,
    row.subject_id,
    row.layer,
    row.field,
    `${row.matches}/${row.comparisons}`,
    row.rate_pct === null ? 'n/a' : `${row.rate_pct}%`
  ]);
  lines.push('## Layered Human vs Reference Metrics', '', markdownTable(
    ['Scope', 'Subject', 'Layer', 'Field', 'Matches', 'Rate'],
    rows
  ), '', '## Stage 4J Candidate Flags', '');
  if (results.stage4j_candidates.length === 0) lines.push('No Stage 4J candidates are generated from current validated submissions.');
  else {
    lines.push(markdownTable(
      ['Candidate', 'Packet unit', 'Field', 'Reasons'],
      results.stage4j_candidates.map(candidate => [
        candidate.candidate_id,
        candidate.packet_unit_id,
        candidate.field,
        candidate.reasons.join('; ')
      ])
    ));
  }
  lines.push('', '## Policy', '', 'Human disagreement with Stage 4A is a review signal, not an automatic correction.');
  return lines.join('\n').trimEnd() + '\n';
}

function compare({ write }) {
  const normalized = readJSON(NORMALIZED_PATH);
  if (normalized.status === 'validation_failed') {
    throw new Error('Normalized human runs report upstream validation failures; fix submissions before reference comparison.');
  }
  const { manifest, packets } = buildReferenceContext();
  const primary = (normalized.submissions || [])
    .filter(submission => PRIMARY_CODER_IDS.includes(submission.coder_id))
    .sort((left, right) => left.coder_id.localeCompare(right.coder_id));
  const humanVsReference = primary.map(submission => compareSubject(submission, packets));
  const consensus = buildConsensus(primary);
  const consensusVsReference = consensus ? compareSubject(consensus, packets) : null;
  const stage4jCandidates = classifyStage4JCandidates(humanVsReference);
  const status = primary.length === 0
    ? 'no_submissions'
    : primary.length < 2 ? 'partial_execution' : 'complete';
  const results = {
    schema_version: 'stage4h-human-vs-reference-results-1.0',
    status,
    source_normalized_runs: relative(NORMALIZED_PATH),
    source_packet_manifest: relative(MANIFEST_PATH),
    source_reliability_sample: relative(SAMPLE_PATH),
    packet_id: normalized.packet_id || manifest.packet_id,
    input_packet_hash: normalized.input_packet_hash || manifest.input_packet_hash,
    reference_policy: 'Stage 4A is an immutable reference layer in this artifact. Human disagreement creates Stage 4J review candidates, not automatic corrections.',
    separation_policy: 'Human-vs-reference comparison is reported separately from human-human agreement and is not averaged with Stage 4B or Stage 4M.',
    totals: {
      primary_human_coders: primary.length,
      packet_units: packets.length,
      stage4j_candidate_count: stage4jCandidates.length
    },
    human_vs_reference: humanVsReference,
    consensus_vs_reference: consensusVsReference,
    adjudicated_vs_reference: {
      available: false,
      reason: 'Stage 4J adjudication decisions are not available yet.'
    },
    stage4j_candidates: stage4jCandidates
  };
  const rows = summaryRows(results);
  if (write) {
    writeAtomic(OUTPUT_PATHS.results, JSON.stringify(results, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.summary, makeCSV(rows));
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(results));
  }
  if (status === 'no_submissions') console.warn('WARN: No validated Stage 4H human submissions are available for reference comparison.');
  else console.log(`Stage 4H human-vs-reference comparison computed for ${primary.length} primary human coder(s).`);
  if (write) console.log(`Human-vs-reference results: ${relative(OUTPUT_PATHS.results)}`);
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
    console.error(`Stage 4H human-vs-reference comparison failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  buildConsensus,
  classifyStage4JCandidates,
  compare,
  compareSubject,
  humanBooleanPresence,
  valuesMatch
};
