#!/usr/bin/env node
// Generates a deterministic Stage 4J adjudication queue from Stage 4H disagreements.
'use strict';

const fs = require('fs');
const path = require('path');
const { writeAtomic } = require('./write-guard');

const ROOT = process.env.STAGE4H_ROOT
  ? path.resolve(process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const DISAGREEMENT_PATH = path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-disagreement-log.json');
const REFERENCE_PATH = path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json');
const INSTABILITY_PATH = path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-instability-report.md');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'human-adjudication');

const OUTPUT_PATHS = Object.freeze({
  queueJson: path.join(OUTPUT_DIR, 'stage4j-adjudication-queue.json'),
  queueCsv: path.join(OUTPUT_DIR, 'stage4j-adjudication-queue.csv'),
  templateCsv: path.join(OUTPUT_DIR, 'stage4j-adjudication-template.csv')
});

const PRIORITY_RANK = Object.freeze({ high: 0, medium: 1, low: 2 });
const QUEUE_COLUMNS = Object.freeze([
  'adjudication_id',
  'priority',
  'priority_reasons',
  'doc_id',
  'sentence_id',
  'task_type',
  'sentence_text',
  'span_text',
  'field_name',
  'coder_a_value',
  'coder_b_value',
  'stage4a_reference_value',
  'stage4b_value_if_available',
  'stage4m_summary_if_available',
  'disagreement_category',
  'agreement_pattern',
  'affected_claim_ids',
  'review_question',
  'adjudicator_decision',
  'adjudicator_rationale',
  'codebook_change_needed',
  'stage4a_correction_candidate',
  'notes'
]);

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
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
    QUEUE_COLUMNS.join(','),
    ...rows.map(row => QUEUE_COLUMNS.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
}

function includesAny(value, needles) {
  const haystack = JSON.stringify(value || '').toLowerCase();
  return needles.some(needle => haystack.includes(needle));
}

function valuesEquivalent(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  return a && b && a !== b && (a.includes(b) || b.includes(a));
}

function priorityFor(disagreement) {
  const high = [];
  const medium = [];
  const low = [];
  const patternFlags = disagreement.agreement_pattern_flags || [disagreement.agreement_pattern];

  if (patternFlags.includes('human_unanimous_against_reference')) high.push('both_humans_disagree_with_stage4a');
  if (patternFlags.includes('both_humans_uncertain') && patternFlags.includes('reference_only_confident')) {
    high.push('both_humans_uncertain_against_confident_stage4a');
  }
  if (disagreement.field_name === 'metaphor_present') high.push('metaphor_presence_disputed');
  if (disagreement.disease_or_purification_flag) high.push('disease_or_purification_disputed');
  if (disagreement.agency_or_absence_flag) high.push('agency_or_absence_disputed');
  if (disagreement.field_name === 'obligatory_frame') high.push('obligatory_frame_disputed');
  if (disagreement.field_name === 'violence_logic') high.push('violence_logic_disputed');
  if (disagreement.major_synthesis_claim_flag) high.push('major_synthesis_claim_affected');
  if (disagreement.major_document_flag) high.push(`major_document:${disagreement.major_document_label || disagreement.doc_id}`);

  if (disagreement.field_name === 'source_domain'
    && normalize(disagreement.coder_a_value) && normalize(disagreement.coder_b_value)) {
    medium.push('source_domain_differs');
  }
  if (disagreement.field_name === 'target_domain'
    && !patternFlags.includes('human_split_reference_differs_from_both')) {
    medium.push('target_domain_differs');
  }
  if (disagreement.field_name === 'confidence') medium.push('confidence_band_differs');
  if (disagreement.boundary_pattern === 'partial_overlap') medium.push('lexical_boundary_partial_overlap');

  if (valuesEquivalent(disagreement.coder_a_value, disagreement.coder_b_value)) {
    low.push('wording_differs_classification_equivalent');
  }
  if (disagreement.field_name === 'ambiguity_flag') low.push('ambiguity_differs_main_label_stable');
  if (disagreement.field_name === 'confidence' && !disagreement.major_document_flag) {
    low.push('confidence_differs_without_classification_impact');
  }

  if (high.length > 0) return { priority: 'high', reasons: [...new Set(high)].sort() };
  if (medium.length > 0) return { priority: 'medium', reasons: [...new Set(medium)].sort() };
  return {
    priority: 'low',
    reasons: [...new Set(low.length > 0 ? low : ['requires_human_adjudication'])].sort()
  };
}

function questionFor(disagreement) {
  const claims = disagreement.affected_claim_ids || [];
  const claimText = claims.length > 0
    ? ` Consider the linked claim${claims.length === 1 ? '' : 's'} ${claims.join(', ')}.`
    : '';
  const questions = {
    mipvu_decision: 'Does this packet unit contain a metaphor-related expression under the Stage 4H codebook?',
    lexical_unit_boundary: 'What lexical-unit boundary should be used for this sentence or span?',
    basic_or_contextual_meaning: 'Which basic/contextual meaning contrast is textually warranted?',
    semantic_contrast: 'Does the submitted lexical unit create a defensible semantic contrast?',
    historical_semantics: 'Does historical usage support one coder value over the other?',
    cluster_assignment: 'Which canonical cluster best fits the coded metaphor, if any?',
    source_domain: 'What source domain is actually activated by the text?',
    target_domain: 'What target domain is actually structured by the text?',
    entailment: 'Which mapping description or entailment is warranted without over-reading?',
    koenigsberg_function: 'Which Koenigsberg function is supported by the passage?',
    violence_logic: 'What violence logic, if any, is supported by the passage?',
    obligatory_frame: 'Does the passage frame action or violence as obligatory rather than chosen?',
    sacrifice_logic: 'What sacrifice logic, if any, is supported by the passage?',
    guilt_logic: 'What guilt logic, if any, is supported by the passage?',
    providence_logic: 'What providence logic, if any, is supported by the passage?',
    reconciliation_logic: 'What reconciliation logic, if any, is supported by the passage?',
    agency_or_absence_flag: 'Which actor is granted, denied, displaced, or erased from agency, and does a canonical absence flag apply?',
    disease_or_purification_flag: 'Is disease or purification actually present, or is absence the safer code?',
    confidence_band: 'Which confidence band best reflects the remaining uncertainty?',
    ambiguity_flag: 'Is there a substantive rival reading that warrants the ambiguity flag?',
    rival_reading: 'What rival reading, if any, should be preserved?',
    textual_or_provenance_uncertainty: 'Is the disagreement caused by textual or provenance uncertainty?',
    over_interpretation: 'Is either coder over-reading beyond the text?',
    under_interpretation: 'Is either coder under-coding a warranted interpretive layer?',
    out_of_scope: 'Should this packet unit be excluded from Stage 4H coding scope?',
    codebook_ambiguity: 'Does this disagreement reveal a codebook ambiguity that needs clarification?'
  };
  return `${questions[disagreement.disagreement_category] || `What adjudicated value best resolves the ${disagreement.field_name} disagreement?`}${claimText}`;
}

function queueSort(left, right) {
  return PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority]
    || left.doc_id.localeCompare(right.doc_id)
    || left.sentence_id.localeCompare(right.sentence_id)
    || left.field_name.localeCompare(right.field_name)
    || left.adjudication_id.localeCompare(right.adjudication_id);
}

function buildQueue(disagreementLog, referenceResults) {
  if (disagreementLog.input_packet_hash !== referenceResults.input_packet_hash) {
    throw new Error('Human disagreement log and human-vs-reference results use different packet hashes.');
  }
  if (disagreementLog.status === 'review_ready' && referenceResults.status !== 'complete') {
    throw new Error('Human-vs-reference results are stale or incomplete for a review-ready disagreement log.');
  }
  const queue = (disagreementLog.disagreements || []).map(disagreement => {
    const priority = priorityFor(disagreement);
    return {
      adjudication_id: `stage4j_${disagreement.disagreement_id.replace('stage4h_disagreement_', '')}`,
      disagreement_id: disagreement.disagreement_id,
      priority: priority.priority,
      priority_reasons: priority.reasons,
      packet_unit_id: disagreement.packet_unit_id,
      reliability_unit_id: disagreement.reliability_unit_id,
      source_audit_ids: disagreement.source_audit_ids || [],
      doc_id: disagreement.doc_id,
      sentence_id: disagreement.sentence_id,
      task_type: disagreement.task_type,
      sentence_text: disagreement.sentence_text,
      span_text: disagreement.span_text,
      field_name: disagreement.field_name,
      coder_a_value: disagreement.coder_a_value,
      coder_b_value: disagreement.coder_b_value,
      stage4a_reference_value: disagreement.stage4a_reference_value,
      stage4b_value_if_available: null,
      stage4m_summary_if_available: null,
      disagreement_category: disagreement.disagreement_category,
      agreement_pattern: disagreement.agreement_pattern,
      agreement_pattern_flags: disagreement.agreement_pattern_flags || [],
      affected_claim_ids: disagreement.affected_claim_ids || [],
      affected_claim_titles: disagreement.affected_claim_titles || [],
      review_question: questionFor(disagreement),
      adjudicator_decision: '',
      adjudicator_rationale: '',
      codebook_change_needed: '',
      stage4a_correction_candidate: '',
      notes: '',
      generated_record_immutable: true
    };
  }).sort(queueSort);

  const totals = { high: 0, medium: 0, low: 0 };
  for (const item of queue) totals[item.priority] += 1;
  return {
    schema_version: 'stage4j-adjudication-queue-1.0',
    status: queue.length === 0 ? 'no_items' : 'review_ready',
    source_disagreement_log: relative(DISAGREEMENT_PATH),
    source_human_vs_reference: relative(REFERENCE_PATH),
    source_instability_report: relative(INSTABILITY_PATH),
    packet_id: disagreementLog.packet_id || referenceResults.packet_id,
    input_packet_hash: disagreementLog.input_packet_hash || referenceResults.input_packet_hash,
    adjudication_policy: 'Stage 4J adjudication resolves human-coder disagreements for review. It does not automatically modify Stage 4A.',
    mutation_policy: 'Queue and template records are review inputs only. Stage 4A correction candidates require a separately authorized migration.',
    decision_values: ['accept_coder_a', 'accept_coder_b', 'accept_stage4a', 'synthesize', 'mark_uncertain', 'exclude', 'defer'],
    totals: {
      queue_items: queue.length,
      high_priority: totals.high,
      medium_priority: totals.medium,
      low_priority: totals.low,
      agency_or_absence_items: queue.filter(item => item.disagreement_category === 'agency_or_absence_flag').length,
      disease_or_purification_items: queue.filter(item => includesAny(item, ['disease', 'purif'])).length
    },
    items: queue
  };
}

function run({ write }) {
  if (!fs.existsSync(INSTABILITY_PATH)) throw new Error(`Instability report missing: ${relative(INSTABILITY_PATH)}`);
  const disagreementLog = readJSON(DISAGREEMENT_PATH);
  const referenceResults = readJSON(REFERENCE_PATH);
  const queue = buildQueue(disagreementLog, referenceResults);
  if (write) {
    writeAtomic(OUTPUT_PATHS.queueJson, JSON.stringify(queue, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.queueCsv, makeCSV(queue.items));
    writeAtomic(OUTPUT_PATHS.templateCsv, makeCSV(queue.items));
  }
  if (queue.status === 'no_items') console.warn('WARN: No Stage 4H disagreement records are available for Stage 4J adjudication.');
  else console.log(`Stage 4J adjudication queue generated with ${queue.totals.queue_items} item(s).`);
  if (write) console.log(`Stage 4J adjudication queue: ${relative(OUTPUT_PATHS.queueJson)}`);
  return queue;
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  run({ write: !args.includes('--check') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4J adjudication queue generation failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  buildQueue,
  priorityFor,
  questionFor,
  run
};
