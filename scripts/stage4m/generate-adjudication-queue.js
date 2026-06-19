#!/usr/bin/env node
// Generates a deterministic, human-directed Stage 4M adjudication packet.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.env.STAGE4M_ROOT
  ? path.resolve(process.env.STAGE4M_ROOT)
  : path.resolve(__dirname, '..', '..');
const DISAGREEMENT_PATH = path.join(ROOT, 'data', 'reliability', 'model-comparison', 'model-disagreement-log.json');
const INSTABILITY_PATH = path.join(ROOT, 'data', 'reliability', 'model-comparison', 'model-instability-report.md');
const NORMALIZED_PATH = path.join(ROOT, 'data', 'reliability', 'model-comparison', 'normalized-model-runs.json');
const SAMPLE_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
const CLAIM_AUDIT_PATH = path.join(ROOT, 'data', 'audit', 'claim-audit.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'model-adjudication');
const GUIDE_PATH = path.join(ROOT, 'docs', 'methodology', 'stage4m-adjudication-guide.md');
const OUTPUT_PATHS = Object.freeze({
  queueJson: path.join(OUTPUT_DIR, 'stage4m-adjudication-queue.json'),
  queueCsv: path.join(OUTPUT_DIR, 'stage4m-adjudication-queue.csv'),
  templateCsv: path.join(OUTPUT_DIR, 'stage4m-adjudication-template.csv')
});

const MAJOR_DOCUMENTS = Object.freeze({
  doc_001: 'Lyceum Address',
  doc_010: 'July 4 Message 1861',
  doc_017: 'Gettysburg Address',
  doc_021: 'Second Inaugural'
});

const PRIORITY_RANK = Object.freeze({ high: 0, medium: 1, low: 2 });

const QUEUE_COLUMNS = Object.freeze([
  'queue_order', 'queue_id', 'disagreement_id', 'priority', 'priority_reasons',
  'packet_unit_id', 'reliability_unit_id', 'source_audit_ids', 'claim_ids',
  'claim_titles', 'task_type',
  'doc_id', 'sentence_id', 'sentence_text', 'field_name',
  'disagreement_category', 'agreement_pattern', 'reference_value',
  'model_values', 'model_context', 'suggested_review_question',
  'requires_human_adjudication', 'generated_record_immutable'
]);

const TEMPLATE_COLUMNS = Object.freeze([
  ...QUEUE_COLUMNS,
  'adjudicator',
  'adjudicated_date',
  'decision',
  'adjudicated_value',
  'rationale',
  'codebook_clarification_needed',
  'follow_up_required',
  'follow_up_issue'
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
    : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function makeCSV(rows, columns) {
  return [
    columns.join(','),
    ...rows.map(row => columns.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
}

function buildUnitContext(sample) {
  const context = new Map();
  for (const unit of sample.identification_units || []) {
    context.set(unit.reliability_unit_id, {
      sentence_text: unit.sentence_text,
      source_audit_ids: unit.stage4_anchor_audit_ids || []
    });
  }
  for (const unit of sample.field_agreement_units || []) {
    context.set(unit.reliability_unit_id, {
      sentence_text: unit.sentence_text,
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
      index.get(record.audit_id).push({
        claim_id: claim.claim_id,
        title: claim.title
      });
    }
  }
  return index;
}

function buildModelContext(normalized) {
  const context = new Map();
  for (const run of normalized.runs || []) {
    for (const item of run.items || []) {
      const key = `${run.run_id}|${item.packet_unit_id}|${item.span_id}`;
      context.set(key, {
        run_id: run.run_id,
        model_id: run.model_id,
        provider: run.provider,
        span_id: item.span_id,
        confidence: item.confidence,
        ambiguity_flag: item.ambiguity_flag,
        rival_reading: item.rival_reading,
        justification: item.justification
      });
    }
  }
  return context;
}

function contextsFor(disagreement, normalized, modelContext) {
  const records = [];
  for (const run of normalized.runs || []) {
    for (const item of run.items || []) {
      if (item.packet_unit_id !== disagreement.packet_unit_id) continue;
      const record = modelContext.get(`${run.run_id}|${item.packet_unit_id}|${item.span_id}`);
      if (record) records.push(record);
    }
  }
  return records.sort((left, right) =>
    left.run_id.localeCompare(right.run_id) || left.span_id.localeCompare(right.span_id));
}

function lexicalTokens(value) {
  const values = Array.isArray(value) ? value : [value];
  return new Set(values.flatMap(item => normalize(item).split(/[^a-z0-9]+/).filter(token => token.length > 2)));
}

function partialOverlap(referenceValue, modelValues) {
  const referenceTokens = lexicalTokens(referenceValue);
  if (referenceTokens.size === 0) return false;
  return Object.values(modelValues || {}).some(value => {
    const modelTokens = lexicalTokens(value);
    const intersection = [...referenceTokens].filter(token => modelTokens.has(token)).length;
    return intersection > 0 && intersection < Math.max(referenceTokens.size, modelTokens.size);
  });
}

function wordingEquivalent(referenceValue, modelValues) {
  const reference = normalize(referenceValue);
  if (!reference) return false;
  return Object.values(modelValues || {}).some(value => {
    const model = normalize(value);
    return model && model !== reference && (model.includes(reference) || reference.includes(model));
  });
}

function includesPurification(disagreement) {
  const values = JSON.stringify({
    reference: disagreement.reference_value,
    models: disagreement.model_values,
    over_read_type: disagreement.over_read_type
  }).toLowerCase();
  return values.includes('disease') || values.includes('purif');
}

function priorityFor(disagreement, claims, itemResult, modelContexts = []) {
  const high = [];
  const medium = [];
  const low = [];

  if (disagreement.all_models_against_reference) high.push('all_models_disagree_with_stage4a');
  if (disagreement.agreement_pattern === 'unanimous_against_reference') high.push('unanimous_against_reference');
  if (disagreement.disagreement_category === 'agency_or_absence_flag') high.push('agency_or_absence_disputed');
  if (includesPurification(disagreement)) high.push('disease_or_purification_disputed');
  if (disagreement.field_name === 'obligatory_frame') high.push('obligatory_frame_disputed');
  if (MAJOR_DOCUMENTS[disagreement.doc_id]) high.push(`major_document:${MAJOR_DOCUMENTS[disagreement.doc_id]}`);
  if (claims.length > 0) {
    high.push('claim_audit_entry_affected');
    high.push('major_synthesis_claim_affected');
  }
  if (disagreement.requires_human_adjudication || itemResult.requires_human_adjudication) {
    high.push('classifier_requires_human_adjudication');
  }

  const clusterStable = itemResult.field_patterns
    && ['unanimous_with_reference', 'majority_with_reference'].includes(itemResult.field_patterns.cluster_id);
  if (disagreement.field_name === 'source_domain' && clusterStable) {
    medium.push('source_domain_differs_cluster_stable');
  }
  if (disagreement.field_name === 'confidence' && clusterStable) {
    medium.push('confidence_differs_classification_stable');
  }
  if (disagreement.field_name === 'lexical_unit'
    && partialOverlap(disagreement.reference_value, disagreement.model_values)) {
    medium.push('lexical_boundary_partial_overlap');
  }

  if (wordingEquivalent(disagreement.reference_value, disagreement.model_values)) {
    low.push('wording_differs_classification_equivalent');
  }
  if (disagreement.field_name === 'ambiguity_flag') {
    low.push('uncertainty_differs_without_classification_change');
  }
  const normalizedModelValues = new Set(
    Object.values(disagreement.model_values || {}).map(normalize).filter(Boolean)
  );
  const weakJustification = modelContexts.some(
    record => normalize(record.justification).length < 40
  );
  if (normalizedModelValues.size === 1 && weakJustification) {
    low.push('same_model_label_with_weak_justification');
  }

  if (high.length > 0) return { priority: 'high', reasons: [...new Set(high)].sort() };
  if (medium.length > 0) return { priority: 'medium', reasons: [...new Set(medium)].sort() };
  return {
    priority: 'low',
    reasons: [...new Set(low.length > 0 ? low : ['other_interpretive_disagreement'])].sort()
  };
}

function questionFor(disagreement, claims) {
  const claimText = claims.length > 0
    ? ` Consider the linked claim${claims.length === 1 ? '' : 's'} ${claims.map(claim => claim.claim_id).join(', ')}.`
    : '';
  const questions = {
    mipvu_decision: 'Does the lexical unit meet the project’s MIPVU criteria in this sentence?',
    lexical_unit_boundary: 'What is the narrowest defensible lexical-unit boundary in the canonical sentence?',
    cluster_assignment: 'Which canonical metaphor cluster best fits the source-to-target mapping?',
    source_domain: 'What source domain is actually activated by the lexical unit?',
    target_domain: 'What target concept is structured by this mapping?',
    koenigsberg_function: 'Which Koenigsberg function is warranted without over-reading the passage?',
    violence_logic: 'What violence logic, if any, is supported by the passage?',
    obligatory_frame: 'Does the passage frame action or violence as required rather than chosen?',
    agency_or_absence_flag: 'Which actor is granted, denied, or erased from agency, and does a canonical absence flag apply?',
    confidence_band: 'What confidence band best represents the remaining interpretive uncertainty?',
    ambiguity_flag: 'Is there a genuine rival reading that warrants the ambiguity flag?',
    rival_reading: 'What rival reading is plausible enough to preserve in the record?',
    over_interpretation: `Is the proposed ${disagreement.over_read_type || 'interpretive'} function textually warranted, or is the model over-reading it?`,
    under_interpretation: 'Did the model omit a warranted interpretive field, or is the Stage 4A value too strong?',
    model_hallucination: 'Is the submitted span present in the canonical sentence, and what text should be reviewed instead?',
    reference_challenge: 'After independent human review, should Stage 4A be retained or should a separate migration candidate be documented?'
  };
  return `${questions[disagreement.disagreement_category] || `What adjudicated value best resolves the ${disagreement.field_name} disagreement?`}${claimText}`;
}

function queueSort(left, right) {
  return PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority]
    || left.doc_id.localeCompare(right.doc_id)
    || left.sentence_id.localeCompare(right.sentence_id)
    || left.field_name.localeCompare(right.field_name)
    || left.disagreement_id.localeCompare(right.disagreement_id);
}

function generateQueue(disagreementLog, normalized, sample, claimAudit) {
  if (disagreementLog.totals.model_runs !== (normalized.runs || []).length) {
    throw new Error('Disagreement log is stale: model-run count does not match normalized runs.');
  }
  if (disagreementLog.status === 'no_submissions' && (normalized.runs || []).length > 0) {
    throw new Error('Disagreement log is stale: normalized runs exist but the log reports no submissions.');
  }
  if (normalized.status === 'validation_failed') {
    throw new Error('Normalized model runs failed validation; adjudication queue generation is unsafe.');
  }
  const unitContext = buildUnitContext(sample);
  const claimIndex = buildClaimIndex(claimAudit);
  const modelContext = buildModelContext(normalized);
  const itemResults = new Map((disagreementLog.item_results || []).map(item => [item.packet_unit_id, item]));

  const queue = (disagreementLog.disagreements || []).map(disagreement => {
    const context = unitContext.get(disagreement.reliability_unit_id);
    if (!context) throw new Error(`Reliability unit not found: ${disagreement.reliability_unit_id}`);
    const claims = [...new Map(context.source_audit_ids
      .flatMap(auditId => claimIndex.get(auditId) || [])
      .map(claim => [claim.claim_id, claim])).values()]
      .sort((left, right) => left.claim_id.localeCompare(right.claim_id));
    const itemResult = itemResults.get(disagreement.packet_unit_id);
    if (!itemResult) throw new Error(`Item result not found: ${disagreement.packet_unit_id}`);
    const modelContexts = contextsFor(disagreement, normalized, modelContext);
    const priority = priorityFor(disagreement, claims, itemResult, modelContexts);
    return {
      queue_id: `stage4m_queue_${disagreement.disagreement_id.replace('stage4m_disagreement_', '')}`,
      disagreement_id: disagreement.disagreement_id,
      priority: priority.priority,
      priority_reasons: priority.reasons,
      packet_unit_id: disagreement.packet_unit_id,
      reliability_unit_id: disagreement.reliability_unit_id,
      source_audit_ids: context.source_audit_ids,
      claim_ids: claims.map(claim => claim.claim_id),
      claim_titles: claims.map(claim => claim.title),
      task_type: disagreement.task_type,
      doc_id: disagreement.doc_id,
      sentence_id: disagreement.sentence_id,
      sentence_text: context.sentence_text,
      field_name: disagreement.field_name,
      disagreement_category: disagreement.disagreement_category,
      agreement_pattern: disagreement.agreement_pattern,
      reference_value: disagreement.reference_value,
      model_values: disagreement.model_values,
      model_context: modelContexts,
      suggested_review_question: questionFor(disagreement, claims),
      requires_human_adjudication: disagreement.requires_human_adjudication,
      generated_record_immutable: true
    };
  }).sort(queueSort);

  queue.forEach((item, index) => {
    item.queue_order = index + 1;
  });
  const byPriority = { high: 0, medium: 0, low: 0 };
  for (const item of queue) byPriority[item.priority] += 1;
  return {
    schema_version: 'stage4m-adjudication-queue-1.0',
    status: queue.length === 0 ? 'no_items' : 'review_ready',
    source_disagreement_log: relative(DISAGREEMENT_PATH),
    source_instability_report: relative(INSTABILITY_PATH),
    source_normalized_runs: relative(NORMALIZED_PATH),
    reference_policy: 'This queue supports independent human adjudication. Model agreement is evidence about reliability, not authority to revise Stage 4A.',
    mutation_policy: 'Generated queue records are immutable review inputs. Any Stage 4A change requires a separately authorized, documented migration.',
    decision_values: [
      'retain_stage4a',
      'document_migration_candidate',
      'defer_insufficient_evidence',
      'codebook_clarification'
    ],
    totals: {
      queue_items: queue.length,
      high_priority: byPriority.high,
      medium_priority: byPriority.medium,
      low_priority: byPriority.low
    },
    items: queue
  };
}

function makeTemplateRows(queue) {
  return queue.items.map(item => ({
    ...item,
    adjudicator: '',
    adjudicated_date: '',
    decision: '',
    adjudicated_value: '',
    rationale: '',
    codebook_clarification_needed: '',
    follow_up_required: '',
    follow_up_issue: ''
  }));
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`)
  ].join('\n');
}

function renderGuide(queue) {
  const lines = [
    '---',
    'title: "Stage 4M Human Adjudication Guide"',
    'draft: false',
    '---',
    '',
    'This queue supports human-directed review of model disagreement. Model consensus is diagnostic evidence, not a vote that can overwrite Stage 4A.',
    '',
    '## Current Queue',
    '',
    `Status: **${queue.status.replaceAll('_', ' ')}**. Queue items: ${queue.totals.queue_items}; high priority: ${queue.totals.high_priority}; medium: ${queue.totals.medium_priority}; low: ${queue.totals.low_priority}.`,
    ''
  ];
  if (queue.items.length === 0) {
    lines.push('No validated model disagreement currently requires queueing. The committed CSV and JSON artifacts intentionally preserve this empty state.', '');
  } else {
    lines.push(markdownTable(
      ['Order', 'Priority', 'Document', 'Sentence', 'Field', 'Category', 'Question'],
      queue.items.map(item => [
        String(item.queue_order),
        item.priority,
        item.doc_id,
        item.sentence_id,
        item.field_name,
        item.disagreement_category,
        item.suggested_review_question.replace(/\|/g, '\\|')
      ])
    ), '');
  }
  lines.push(
    '## Review Procedure',
    '',
    '1. Review the canonical sentence and the supplied Stage 4A reference value before reading model rationales.',
    '2. Read each model value, confidence, ambiguity flag, rival reading, and justification.',
    '3. Answer the suggested review question independently. Model unanimity may raise priority, but it does not decide the outcome.',
    '4. Record one allowed `decision` in `stage4m-adjudication-template.csv`: `retain_stage4a`, `document_migration_candidate`, `defer_insufficient_evidence`, or `codebook_clarification`.',
    '5. Supply an adjudicated value and rationale. Mark follow-up work explicitly.',
    '',
    '## Immutability Boundary',
    '',
    'Completing the template does not edit Stage 4A, Stage 4B, concordance, analysis, or synthesis outputs. A proposed correction remains a migration candidate until separately authorized and validated under the repository’s stage-immutability rules.',
    '',
    '## Priority Policy',
    '',
    '- **High:** all-model challenges to Stage 4A, agency/absence or purification disputes, obligatory-frame disputes, major-document passages, claim-audit anchors, or classifier-mandated human review.',
    '- **Medium:** source-domain differences with stable clusters, confidence differences with stable classification, or partial lexical-boundary overlap.',
    '- **Low:** wording-equivalent differences, same-label submissions with at least one brief justification, ambiguity-only differences, or other interpretive disagreements not promoted by the high/medium rules.',
    '',
    '## Files',
    '',
    `- Generated queue: \`${relative(OUTPUT_PATHS.queueJson)}\` and \`${relative(OUTPUT_PATHS.queueCsv)}\``,
    `- Human completion template: \`${relative(OUTPUT_PATHS.templateCsv)}\``,
    `- Source disagreement log: \`${queue.source_disagreement_log}\``
  );
  return lines.join('\n').trimEnd() + '\n';
}

function writeAtomic(filePath, contents, root) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) {
    throw new Error(`Refusing write outside allowed Stage 4M path: ${filePath}`);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents);
  fs.renameSync(temporaryPath, filePath);
}

function run({ write }) {
  if (!fs.existsSync(INSTABILITY_PATH)) throw new Error(`Instability report missing: ${relative(INSTABILITY_PATH)}`);
  const disagreementLog = readJSON(DISAGREEMENT_PATH);
  const normalized = readJSON(NORMALIZED_PATH);
  const sample = readJSON(SAMPLE_PATH);
  const claimAudit = readJSON(CLAIM_AUDIT_PATH);
  const queue = generateQueue(disagreementLog, normalized, sample, claimAudit);
  const templateRows = makeTemplateRows(queue);
  if (write) {
    writeAtomic(OUTPUT_PATHS.queueJson, JSON.stringify(queue, null, 2) + '\n', OUTPUT_DIR);
    writeAtomic(OUTPUT_PATHS.queueCsv, makeCSV(queue.items, QUEUE_COLUMNS), OUTPUT_DIR);
    writeAtomic(OUTPUT_PATHS.templateCsv, makeCSV(templateRows, TEMPLATE_COLUMNS), OUTPUT_DIR);
    writeAtomic(GUIDE_PATH, renderGuide(queue), path.dirname(GUIDE_PATH));
  }
  if (queue.status === 'no_items') {
    console.warn('WARN: No Stage 4M disagreement records are available for human adjudication.');
  } else {
    console.log(`Stage 4M adjudication queue: ${queue.totals.queue_items} item(s), ${queue.totals.high_priority} high priority.`);
  }
  if (write) console.log(`Adjudication guide: ${relative(GUIDE_PATH)}`);
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
    console.error(`Stage 4M adjudication queue failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { generateQueue, priorityFor, questionFor, run };
