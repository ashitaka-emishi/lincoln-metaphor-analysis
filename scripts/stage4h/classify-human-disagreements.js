#!/usr/bin/env node
// Classifies Stage 4H human-coder disagreements for Stage 4J queue generation.
'use strict';

const fs = require('fs');
const path = require('path');
const { writeAtomic } = require('./write-guard');

const ROOT = process.env.STAGE4H_ROOT
  ? path.resolve(process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const AGREEMENT_PATH = path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-agreement-results.json');
const NORMALIZED_PATH = path.join(ROOT, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json');
const REFERENCE_PATH = path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json');
const SAMPLE_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
const CLAIM_AUDIT_PATH = path.join(ROOT, 'data', 'audit', 'claim-audit.json');
const SENTENCE_PACKET_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-sentence-identification-packet.jsonl');
const FIELD_PACKET_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-field-agreement-packet.jsonl');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'human-comparison');

const OUTPUT_PATHS = Object.freeze({
  json: path.join(OUTPUT_DIR, 'human-disagreement-log.json'),
  csv: path.join(OUTPUT_DIR, 'human-disagreement-log.csv'),
  markdown: path.join(OUTPUT_DIR, 'human-instability-report.md')
});

const PRIMARY_CODER_IDS = Object.freeze(['human_coder_a', 'human_coder_b']);
const MAJOR_DOCUMENTS = Object.freeze({
  doc_001: 'Lyceum Address',
  doc_010: 'July 4 Message 1861',
  doc_017: 'Gettysburg Address',
  doc_021: 'Second Inaugural'
});
const FIELD_CATEGORIES = Object.freeze({
  metaphor_present: 'mipvu_decision',
  lexical_unit_boundary: 'lexical_unit_boundary',
  basic_meaning: 'basic_or_contextual_meaning',
  contextual_meaning: 'basic_or_contextual_meaning',
  semantic_contrast: 'semantic_contrast',
  cluster_id: 'cluster_assignment',
  source_domain: 'source_domain',
  target_domain: 'target_domain',
  mapping_description: 'entailment',
  koenigsberg_function: 'koenigsberg_function',
  violence_logic: 'violence_logic',
  obligatory_frame: 'obligatory_frame',
  sacrifice_logic: 'sacrifice_logic',
  guilt_logic: 'guilt_logic',
  providence_logic: 'providence_logic',
  reconciliation_logic: 'reconciliation_logic',
  primary_actor: 'agency_or_absence_flag',
  acted_upon_entity: 'agency_or_absence_flag',
  agency_status: 'agency_or_absence_flag',
  absence_flag: 'agency_or_absence_flag',
  enslaved_people_present: 'agency_or_absence_flag',
  black_soldiers_present: 'agency_or_absence_flag',
  disease_or_purification_present: 'disease_or_purification_flag',
  confidence: 'confidence_band',
  ambiguity_flag: 'ambiguity_flag',
  rival_reading: 'rival_reading',
  out_of_scope: 'out_of_scope'
});
const SENTENCE_FIELDS = Object.freeze(['metaphor_present', 'confidence', 'ambiguity_flag', 'rival_reading', 'out_of_scope']);
const FIELD_FIELDS = Object.freeze([
  'metaphor_present',
  'lexical_unit_boundary',
  'basic_meaning',
  'contextual_meaning',
  'semantic_contrast',
  'source_domain',
  'target_domain',
  'cluster_id',
  'mapping_description',
  'koenigsberg_function',
  'violence_logic',
  'obligatory_frame',
  'sacrifice_logic',
  'guilt_logic',
  'providence_logic',
  'reconciliation_logic',
  'primary_actor',
  'acted_upon_entity',
  'agency_status',
  'absence_flag',
  'enslaved_people_present',
  'black_soldiers_present',
  'disease_or_purification_present',
  'confidence',
  'ambiguity_flag',
  'rival_reading',
  'out_of_scope'
]);
const CSV_COLUMNS = Object.freeze([
  'disagreement_id',
  'packet_unit_id',
  'doc_id',
  'sentence_id',
  'task_type',
  'field_name',
  'disagreement_category',
  'agreement_pattern',
  'coder_a_value',
  'coder_b_value',
  'stage4a_reference_value',
  'requires_human_adjudication',
  'major_document_flag',
  'major_synthesis_claim_flag',
  'agency_or_absence_flag',
  'disease_or_purification_flag',
  'source_audit_ids',
  'affected_claim_ids'
]);

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

function normalize(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim().replace(/\s+/g, ' ').toLowerCase();
  return text === '' ? null : text;
}

function csvEscape(value) {
  const text = value === null || value === undefined
    ? ''
    : Array.isArray(value) ? value.join('|')
      : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function makeCSV(rows) {
  return [
    CSV_COLUMNS.join(','),
    ...rows.map(row => CSV_COLUMNS.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
}

function splitList(value) {
  const normalized = normalize(value);
  return normalized ? normalized.split('|').map(part => part.trim()).filter(Boolean).sort() : [];
}

function valuesEqual(field, left, right) {
  if (field === 'violence_logic') return JSON.stringify(splitList(left)) === JSON.stringify(splitList(right));
  return normalize(left) === normalize(right);
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

function boundaryValue(items) {
  const positives = (items || []).filter(item => item.metaphor_present === 'yes');
  if (positives.length === 0) return null;
  return positives.map(item => ({
    lexical_unit: item.lexical_unit,
    lexical_unit_start: item.lexical_unit_start,
    lexical_unit_end: item.lexical_unit_end
  })).sort((left, right) =>
    (left.lexical_unit_start ?? -1) - (right.lexical_unit_start ?? -1)
    || String(left.lexical_unit || '').localeCompare(String(right.lexical_unit || '')));
}

function boundariesEqual(leftItems, rightItems) {
  const left = boundaryValue(leftItems) || [];
  const right = boundaryValue(rightItems) || [];
  if (left.length !== right.length) return false;
  return left.every((item, index) =>
    item.lexical_unit_start === right[index].lexical_unit_start
    && item.lexical_unit_end === right[index].lexical_unit_end
    && normalize(item.lexical_unit) === normalize(right[index].lexical_unit));
}

function boundaryPattern(leftItems, rightItems) {
  const left = boundaryValue(leftItems) || [];
  const right = boundaryValue(rightItems) || [];
  if (left.length === 0 || right.length === 0) return 'missing_boundary';
  if (boundariesEqual(leftItems, rightItems)) return 'exact_boundary_agreement';
  const partial = left.some(a => right.some(b => rangesOverlap(
    { start: a.lexical_unit_start, end: a.lexical_unit_end },
    { start: b.lexical_unit_start, end: b.lexical_unit_end }
  ) || lexicalOverlap(a.lexical_unit, b.lexical_unit)));
  return partial ? 'partial_overlap' : 'no_overlap';
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
  if (field === 'lexical_unit_boundary') return boundaryValue(items);
  const positive = items.find(item => item.metaphor_present === 'yes') || items[0];
  return positive[field];
}

function displayValue(value) {
  if (Array.isArray(value)) {
    return value.map(item => `${item.lexical_unit || ''}@${item.lexical_unit_start ?? ''}:${item.lexical_unit_end ?? ''}`).join('|');
  }
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return String(value);
  return value;
}

function buildPacketContext() {
  return new Map([...readJSONL(SENTENCE_PACKET_PATH), ...readJSONL(FIELD_PACKET_PATH)].map(record => [record.packet_unit_id, {
    packet_unit_id: record.packet_unit_id,
    task_type: record.packet_type,
    doc_id: record.document_id,
    sentence_id: record.sentence_id,
    sentence_text: record.sentence_text,
    span_text: record.provided_span_text || null,
    document_short_title: record.document_context && record.document_context.short_title || null
  }]));
}

function buildUnitContext(sample) {
  const context = new Map();
  for (const unit of sample.identification_units || []) {
    context.set(`${unit.document_id}\u001f${unit.sentence_id}\u001fsentence_identification`, {
      reliability_unit_id: unit.reliability_unit_id,
      source_audit_ids: unit.stage4_anchor_audit_ids || []
    });
  }
  for (const unit of sample.field_agreement_units || []) {
    context.set(`${unit.document_id}\u001f${unit.sentence_id}\u001ffield_agreement`, {
      reliability_unit_id: unit.reliability_unit_id,
      source_audit_ids: unit.source_audit_id ? [unit.source_audit_id] : []
    });
  }
  return context;
}

function buildClaimIndex(claimAudit) {
  const index = new Map();
  for (const claim of claimAudit.claims || []) {
    for (const record of claim.selected_records || []) {
      if (!index.has(record.audit_id)) index.set(record.audit_id, []);
      index.get(record.audit_id).push({ claim_id: claim.claim_id, title: claim.title });
    }
  }
  return index;
}

function referenceIndex(referenceResults) {
  const index = new Map();
  for (const comparison of referenceResults.human_vs_reference || []) {
    if (comparison.subject_id !== 'human_coder_a') continue;
    for (const item of comparison.item_results || []) {
      index.set(`${item.packet_unit_id}\u001f${item.field}`, item.stage4a_value);
    }
  }
  return index;
}

function referenceValueFor(index, packetUnitId, field) {
  if (field === 'lexical_unit_boundary') return null;
  return index.get(`${packetUnitId}\u001f${field}`) ?? null;
}

function classifyAgreementPattern(left, right, reference, field, leftConfidence, rightConfidence, boundaryStatus) {
  const flags = [];
  const leftMatches = reference !== null && valuesEqual(field, left, reference);
  const rightMatches = reference !== null && valuesEqual(field, right, reference);
  const split = field === 'lexical_unit_boundary'
    ? boundaryStatus !== 'exact_boundary_agreement'
    : !valuesEqual(field, left, right);

  if (!split && reference !== null && leftMatches && rightMatches) flags.push('human_unanimous_with_reference');
  if (!split && reference !== null && !leftMatches && !rightMatches) flags.push('human_unanimous_against_reference');
  if (split && leftMatches && !rightMatches) flags.push('human_split_reference_supports_coder_a');
  if (split && rightMatches && !leftMatches) flags.push('human_split_reference_supports_coder_b');
  if (split && reference !== null && !leftMatches && !rightMatches) flags.push('human_split_reference_differs_from_both');
  if (normalize(left) === 'uncertain' && normalize(right) === 'uncertain') flags.push('both_humans_uncertain');
  if (reference !== null && (normalize(left) === 'uncertain' || normalize(right) === 'uncertain')) flags.push('reference_only_confident');
  if (leftConfidence === 'high' || rightConfidence === 'high') flags.push('high_confidence_disagreement');
  if (leftConfidence === 'low' || rightConfidence === 'low') flags.push('low_confidence_disagreement');
  flags.push('requires_adjudication');
  const priority = [
    'human_unanimous_against_reference',
    'human_split_reference_supports_coder_a',
    'human_split_reference_supports_coder_b',
    'human_split_reference_differs_from_both',
    'both_humans_uncertain',
    'reference_only_confident',
    'high_confidence_disagreement',
    'low_confidence_disagreement',
    'requires_adjudication'
  ];
  return {
    agreement_pattern: priority.find(pattern => flags.includes(pattern)) || flags[0],
    agreement_pattern_flags: [...new Set(flags)]
  };
}

function categoryFor(field, left, right) {
  if (field === 'ambiguity_flag' && (normalize(left) === 'yes' || normalize(right) === 'yes')) return 'codebook_ambiguity';
  return FIELD_CATEGORIES[field] || 'requires_human_adjudication';
}

function affectsDisease(row) {
  const values = JSON.stringify([row.field_name, row.disagreement_category, row.coder_a_value, row.coder_b_value, row.stage4a_reference_value]).toLowerCase();
  return row.disagreement_category === 'disease_or_purification_flag' || values.includes('disease') || values.includes('purif');
}

function renderMarkdown(results) {
  const lines = [
    '# Stage 4H Human Disagreement Instability Report',
    '',
    `Status: **${results.status.replaceAll('_', ' ')}**`,
    '',
    results.policy,
    ''
  ];
  if (results.status !== 'review_ready') {
    lines.push('No two-primary-coder disagreement log is available yet. The classifier will emit review categories after both validated Stage 4H packets are ingested.');
    return lines.join('\n').trimEnd() + '\n';
  }
  lines.push(
    '## Summary',
    '',
    `- Disagreements classified: ${results.totals.disagreements}.`,
    `- Requiring Stage 4J adjudication: ${results.totals.requires_human_adjudication}.`,
    `- Major-document disagreements: ${results.totals.major_document_disagreements}.`,
    `- Major synthesis claim flags: ${results.totals.major_synthesis_claim_disagreements}.`,
    `- Agency/absence flags: ${results.totals.agency_or_absence_disagreements}.`,
    `- Disease/purification flags: ${results.totals.disease_or_purification_disagreements}.`,
    '',
    '## Categories',
    ''
  );
  for (const [category, count] of Object.entries(results.category_counts).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`- ${category}: ${count}`);
  }
  lines.push('', '## Stage 4A Policy', '', 'Human disagreement is routed to Stage 4J review and does not overwrite Stage 4A.');
  return lines.join('\n').trimEnd() + '\n';
}

function classify({ write }) {
  const agreement = readJSON(AGREEMENT_PATH);
  const normalized = readJSON(NORMALIZED_PATH);
  const reference = readJSON(REFERENCE_PATH);
  const sample = readJSON(SAMPLE_PATH);
  const claimAudit = readJSON(CLAIM_AUDIT_PATH);
  if (normalized.status === 'validation_failed') {
    throw new Error('Normalized human runs report upstream validation failures; fix submissions before disagreement classification.');
  }
  const primary = (normalized.submissions || [])
    .filter(submission => PRIMARY_CODER_IDS.includes(submission.coder_id))
    .sort((left, right) => left.coder_id.localeCompare(right.coder_id));
  const status = primary.length === 0 ? 'no_submissions' : primary.length < 2 ? 'partial_execution' : 'review_ready';
  const upstreamStatus = status === 'review_ready' ? 'complete' : status;
  if (agreement.status !== upstreamStatus) {
    throw new Error(`Human agreement artifact is stale: expected status ${upstreamStatus}, found ${agreement.status}.`);
  }
  if (reference.status !== upstreamStatus) {
    throw new Error(`Human-vs-reference artifact is stale: expected status ${upstreamStatus}, found ${reference.status}.`);
  }
  const packetContext = buildPacketContext();
  const unitContext = buildUnitContext(sample);
  const claimsByAuditId = buildClaimIndex(claimAudit);
  const references = referenceIndex(reference);
  const disagreements = [];

  if (status === 'review_ready') {
    const leftSubmission = primary[0];
    const rightSubmission = primary[1];
    const leftPackets = aggregateByPacket(leftSubmission);
    const rightPackets = aggregateByPacket(rightSubmission);
    const packetIds = [...new Set([...leftPackets.keys(), ...rightPackets.keys()])].sort();
    for (const packetUnitId of packetIds) {
      const packet = packetContext.get(packetUnitId);
      if (!packet) continue;
      const leftItems = leftPackets.get(packetUnitId) || [];
      const rightItems = rightPackets.get(packetUnitId) || [];
      if (leftItems.length === 0 || rightItems.length === 0) continue;
      const fields = packet.task_type === 'sentence_identification' ? SENTENCE_FIELDS : FIELD_FIELDS;
      const unit = unitContext.get(`${packet.doc_id}\u001f${packet.sentence_id}\u001f${packet.task_type}`) || {
        reliability_unit_id: null,
        source_audit_ids: []
      };
      const claims = [...new Map(unit.source_audit_ids
        .flatMap(auditId => claimsByAuditId.get(auditId) || [])
        .map(claim => [claim.claim_id, claim])).values()]
        .sort((left, right) => left.claim_id.localeCompare(right.claim_id));
      for (const field of fields) {
        const leftValue = primaryValue(leftItems, field);
        const rightValue = primaryValue(rightItems, field);
        const equal = field === 'lexical_unit_boundary'
          ? boundariesEqual(leftItems, rightItems)
          : valuesEqual(field, leftValue, rightValue);
        if (equal) continue;
        const boundaryStatus = field === 'lexical_unit_boundary' ? boundaryPattern(leftItems, rightItems) : null;
        const stage4aReference = referenceValueFor(references, packetUnitId, field);
        const pattern = classifyAgreementPattern(
          displayValue(leftValue),
          displayValue(rightValue),
          stage4aReference,
          field,
          primaryValue(leftItems, 'confidence'),
          primaryValue(rightItems, 'confidence'),
          boundaryStatus
        );
        const row = {
          disagreement_id: `stage4h_disagreement_${String(disagreements.length + 1).padStart(4, '0')}`,
          packet_unit_id: packetUnitId,
          reliability_unit_id: unit.reliability_unit_id,
          source_audit_ids: unit.source_audit_ids,
          affected_claim_ids: claims.map(claim => claim.claim_id),
          affected_claim_titles: claims.map(claim => claim.title),
          doc_id: packet.doc_id,
          document_short_title: packet.document_short_title,
          sentence_id: packet.sentence_id,
          sentence_text: packet.sentence_text,
          span_text: packet.span_text,
          task_type: packet.task_type,
          field_name: field,
          disagreement_category: categoryFor(field, displayValue(leftValue), displayValue(rightValue)),
          agreement_pattern: pattern.agreement_pattern,
          agreement_pattern_flags: pattern.agreement_pattern_flags,
          boundary_pattern: boundaryStatus,
          coder_a_value: displayValue(leftValue),
          coder_b_value: displayValue(rightValue),
          stage4a_reference_value: stage4aReference,
          requires_human_adjudication: true,
          major_document_flag: Boolean(MAJOR_DOCUMENTS[packet.doc_id]),
          major_document_label: MAJOR_DOCUMENTS[packet.doc_id] || null,
          major_synthesis_claim_flag: claims.length > 0,
          agency_or_absence_flag: false,
          disease_or_purification_flag: false
        };
        row.agency_or_absence_flag = row.disagreement_category === 'agency_or_absence_flag';
        row.disease_or_purification_flag = affectsDisease(row);
        disagreements.push(row);
      }
    }
  }

  const categoryCounts = {};
  const patternCounts = {};
  for (const row of disagreements) {
    categoryCounts[row.disagreement_category] = (categoryCounts[row.disagreement_category] || 0) + 1;
    patternCounts[row.agreement_pattern] = (patternCounts[row.agreement_pattern] || 0) + 1;
  }
  const results = {
    schema_version: 'stage4h-human-disagreement-log-1.0',
    status,
    source_human_agreement: relative(AGREEMENT_PATH),
    source_normalized_runs: relative(NORMALIZED_PATH),
    source_human_vs_reference: relative(REFERENCE_PATH),
    source_claim_audit: relative(CLAIM_AUDIT_PATH),
    packet_id: normalized.packet_id || agreement.packet_id || reference.packet_id,
    input_packet_hash: normalized.input_packet_hash || agreement.input_packet_hash || reference.input_packet_hash,
    policy: 'Human disagreement categories are Stage 4J review signals. They do not revise Stage 4A and are not blended with AI-assisted reliability layers.',
    totals: {
      primary_human_coders: primary.length,
      disagreements: disagreements.length,
      requires_human_adjudication: disagreements.filter(row => row.requires_human_adjudication).length,
      major_document_disagreements: disagreements.filter(row => row.major_document_flag).length,
      major_synthesis_claim_disagreements: disagreements.filter(row => row.major_synthesis_claim_flag).length,
      agency_or_absence_disagreements: disagreements.filter(row => row.agency_or_absence_flag).length,
      disease_or_purification_disagreements: disagreements.filter(row => row.disease_or_purification_flag).length
    },
    category_counts: categoryCounts,
    agreement_pattern_counts: patternCounts,
    disagreements
  };
  if (write) {
    writeAtomic(OUTPUT_PATHS.json, JSON.stringify(results, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.csv, makeCSV(disagreements));
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(results));
  }
  if (status === 'no_submissions') console.warn('WARN: No validated Stage 4H human submissions are available for disagreement classification.');
  else if (status === 'partial_execution') console.warn('WARN: Stage 4H disagreement classification requires two primary human coder submissions.');
  else console.log(`Stage 4H human disagreements classified: ${disagreements.length}.`);
  if (write) console.log(`Human disagreement log: ${relative(OUTPUT_PATHS.json)}`);
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  classify({ write: !args.includes('--check') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4H disagreement classification failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  boundaryPattern,
  categoryFor,
  classify,
  classifyAgreementPattern,
  valuesEqual
};
