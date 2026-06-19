#!/usr/bin/env node
// Generates a conservative Stage 4M synthesis of model convergence and divergence.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.env.STAGE4M_ROOT
  ? path.resolve(process.env.STAGE4M_ROOT)
  : path.resolve(__dirname, '..', '..');
const COMPARISON_DIR = path.join(ROOT, 'data', 'reliability', 'model-comparison');
const AGREEMENT_PATH = path.join(COMPARISON_DIR, 'model-agreement-results.json');
const DISAGREEMENT_PATH = path.join(COMPARISON_DIR, 'model-disagreement-log.json');
const QUEUE_PATH = path.join(
  ROOT,
  'data',
  'reliability',
  'model-adjudication',
  'stage4m-adjudication-queue.json'
);
const OUTPUT_PATHS = Object.freeze({
  json: path.join(COMPARISON_DIR, 'model-consensus-report.json'),
  markdown: path.join(COMPARISON_DIR, 'model-consensus-report.md')
});

const PRIORITY_RANK = Object.freeze({ high: 0, medium: 1, low: 2 });
const CLUSTER_NAMES = Object.freeze({
  cluster_01_body_organism: 'Nation as organism / body',
  cluster_02_covenant_oath: 'Union as covenant / oath',
  cluster_03_experiment_proposition: 'Republic as experiment / proposition',
  cluster_04_birth_creation: 'War as birth / new creation',
  cluster_05_fathers_inheritance: 'Founding fathers as inheritance',
  cluster_06_providence_theodicy: 'Providence / divine will'
});

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim().replace(/\s+/g, ' ').toLowerCase();
  return text === '' ? null : text;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function stabilityRecords(agreement, classification) {
  return Object.entries(agreement.stability.categories || {})
    .filter(([, values]) => values.classification === classification)
    .map(([field, values]) => ({
      field,
      layer: values.layer,
      agreements: values.agreements,
      comparisons: values.comparisons,
      agreement_rate_pct: values.agreement_rate_pct,
      classification: values.classification
    }))
    .sort((left, right) =>
      left.layer.localeCompare(right.layer) || left.field.localeCompare(right.field));
}

function queueByDisagreement(queue) {
  return new Map((queue.items || []).map(item => [item.disagreement_id, item]));
}

function aggregateHighRiskDocuments(disagreements, queueIndex) {
  const documents = new Map();
  for (const item of disagreements) {
    if (!documents.has(item.doc_id)) {
      documents.set(item.doc_id, {
        doc_id: item.doc_id,
        disagreement_records: 0,
        human_review_records: 0,
        reference_challenges: 0,
        high_priority_queue_items: 0,
        fields: []
      });
    }
    const document = documents.get(item.doc_id);
    document.disagreement_records += 1;
    if (item.requires_human_adjudication) document.human_review_records += 1;
    if (item.all_models_against_reference) document.reference_challenges += 1;
    if (queueIndex.get(item.disagreement_id)?.priority === 'high') {
      document.high_priority_queue_items += 1;
    }
    document.fields.push(item.field_name);
  }
  return [...documents.values()]
    .map(item => ({ ...item, fields: uniqueSorted(item.fields) }))
    .sort((left, right) =>
      right.high_priority_queue_items - left.high_priority_queue_items
      || right.human_review_records - left.human_review_records
      || right.reference_challenges - left.reference_challenges
      || right.disagreement_records - left.disagreement_records
      || left.doc_id.localeCompare(right.doc_id));
}

function clusterValues(disagreement) {
  if (disagreement.field_name !== 'cluster_id') return [];
  const values = [disagreement.reference_value, ...Object.values(disagreement.model_values || {})];
  return uniqueSorted(values.flatMap(value => Array.isArray(value) ? value.map(normalize) : [normalize(value)]));
}

function aggregateHighRiskClusters(disagreements, queueIndex) {
  const clusters = new Map();
  for (const item of disagreements) {
    for (const clusterId of clusterValues(item)) {
      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, {
          cluster_id: clusterId,
          cluster_name: CLUSTER_NAMES[clusterId] || 'Unrecognized submitted cluster',
          disagreement_ids: [],
          reference_challenges: 0,
          high_priority_queue_items: 0
        });
      }
      const cluster = clusters.get(clusterId);
      cluster.disagreement_ids.push(item.disagreement_id);
      if (item.all_models_against_reference) cluster.reference_challenges += 1;
      if (queueIndex.get(item.disagreement_id)?.priority === 'high') {
        cluster.high_priority_queue_items += 1;
      }
    }
  }
  return [...clusters.values()]
    .map(item => ({
      ...item,
      disagreement_ids: uniqueSorted(item.disagreement_ids),
      disagreement_records: uniqueSorted(item.disagreement_ids).length
    }))
    .sort((left, right) =>
      right.high_priority_queue_items - left.high_priority_queue_items
      || right.reference_challenges - left.reference_challenges
      || right.disagreement_records - left.disagreement_records
      || left.cluster_id.localeCompare(right.cluster_id));
}

function aggregateInterpretiveCategories(disagreements, queueIndex) {
  const categories = new Map();
  for (const item of disagreements) {
    const category = item.disagreement_category;
    if (!categories.has(category)) {
      categories.set(category, {
        disagreement_category: category,
        disagreement_records: 0,
        human_review_records: 0,
        reference_challenges: 0,
        high_priority_queue_items: 0,
        fields: []
      });
    }
    const summary = categories.get(category);
    summary.disagreement_records += 1;
    if (item.requires_human_adjudication) summary.human_review_records += 1;
    if (item.all_models_against_reference) summary.reference_challenges += 1;
    if (queueIndex.get(item.disagreement_id)?.priority === 'high') {
      summary.high_priority_queue_items += 1;
    }
    summary.fields.push(item.field_name);
  }
  return [...categories.values()]
    .map(item => ({ ...item, fields: uniqueSorted(item.fields) }))
    .sort((left, right) =>
      right.high_priority_queue_items - left.high_priority_queue_items
      || right.human_review_records - left.human_review_records
      || right.disagreement_records - left.disagreement_records
      || left.disagreement_category.localeCompare(right.disagreement_category));
}

function referenceChallenges(disagreements) {
  return disagreements
    .filter(item => item.all_models_against_reference)
    .map(item => ({
      disagreement_id: item.disagreement_id,
      packet_unit_id: item.packet_unit_id,
      doc_id: item.doc_id,
      sentence_id: item.sentence_id,
      field_name: item.field_name,
      disagreement_category: item.disagreement_category,
      agreement_pattern: item.agreement_pattern,
      reference_value: item.reference_value,
      model_values: item.model_values,
      requires_human_adjudication: item.requires_human_adjudication,
      rationale: item.rationale
    }))
    .sort((left, right) =>
      left.doc_id.localeCompare(right.doc_id)
      || left.sentence_id.localeCompare(right.sentence_id)
      || left.field_name.localeCompare(right.field_name)
      || left.disagreement_id.localeCompare(right.disagreement_id));
}

function referenceStrongCases(itemResults) {
  return itemResults
    .filter(item => ['unanimous_with_reference', 'majority_with_reference'].includes(item.agreement_pattern))
    .map(item => ({
      packet_unit_id: item.packet_unit_id,
      doc_id: item.doc_id,
      sentence_id: item.sentence_id,
      task_type: item.task_type,
      agreement_pattern: item.agreement_pattern,
      disagreement_count: item.disagreement_count,
      field_patterns: item.field_patterns
    }))
    .sort((left, right) =>
      left.doc_id.localeCompare(right.doc_id)
      || left.sentence_id.localeCompare(right.sentence_id)
      || left.packet_unit_id.localeCompare(right.packet_unit_id));
}

function reviewPriorities(queue) {
  return [...(queue.items || [])]
    .map(item => ({
      queue_order: item.queue_order,
      queue_id: item.queue_id,
      disagreement_id: item.disagreement_id,
      priority: item.priority,
      priority_reasons: item.priority_reasons,
      doc_id: item.doc_id,
      sentence_id: item.sentence_id,
      field_name: item.field_name,
      disagreement_category: item.disagreement_category,
      suggested_review_question: item.suggested_review_question
    }))
    .sort((left, right) =>
      PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority]
      || left.queue_order - right.queue_order
      || left.queue_id.localeCompare(right.queue_id));
}

function codebookImplications(stable, unstable, insufficient, disagreements) {
  const implications = [];
  if (unstable.length > 0) {
    implications.push(`Clarify coding guidance for unstable fields: ${unstable.map(item => item.field).join(', ')}.`);
  }
  if (disagreements.some(item => item.disagreement_category === 'agency_or_absence_flag')) {
    implications.push('Preserve explicit human review for agency and absence coding; model consensus must not settle actor erasure.');
  }
  if (disagreements.some(item => item.over_read_type === 'purification')) {
    implications.push('Add or reinforce boundary examples that distinguish purification readings from non-purificatory violence or theodicy.');
  }
  if (disagreements.some(item => item.cmt_agreement_koenigsberg_disagreement)) {
    implications.push('Separate CMT mapping guidance from Koenigsberg-function guidance because agreement at one layer does not validate the other.');
  }
  if (insufficient.length > 0) {
    implications.push(`Do not revise the codebook from model evidence alone for insufficient-evidence fields: ${insufficient.map(item => item.field).join(', ')}.`);
  }
  if (stable.length > 0) {
    implications.push(`Treat stable fields as reproducibility evidence, not as authority to overwrite Stage 4A: ${stable.map(item => item.field).join(', ')}.`);
  }
  if (implications.length === 0) {
    implications.push('No model-derived codebook revision is warranted from the current evidence.');
  }
  return implications;
}

function validateInputs(agreement, disagreementLog, queue) {
  if (agreement.totals.model_runs !== disagreementLog.totals.model_runs) {
    throw new Error('Input artifacts are stale: agreement and disagreement model-run counts differ.');
  }
  if (disagreementLog.totals.disagreement_records !== (disagreementLog.disagreements || []).length) {
    throw new Error('Disagreement-log totals do not match its item records.');
  }
  if (queue.totals.queue_items !== (queue.items || []).length) {
    throw new Error('Adjudication queue totals do not match its item records.');
  }
  if (queue.totals.queue_items !== disagreementLog.totals.disagreement_records) {
    throw new Error('Input artifacts are stale: adjudication queue does not cover every disagreement.');
  }
  const disagreementIds = new Set((disagreementLog.disagreements || []).map(item => item.disagreement_id));
  const missing = (queue.items || []).find(item => !disagreementIds.has(item.disagreement_id));
  if (missing) {
    throw new Error(`Adjudication queue references an unknown disagreement: ${missing.disagreement_id}`);
  }
  if (agreement.status === 'no_submissions'
    && (disagreementLog.status !== 'no_submissions' || queue.items.length > 0)) {
    throw new Error('No-submission agreement results conflict with downstream artifacts.');
  }
}

function generateReport(agreement, disagreementLog, queue) {
  validateInputs(agreement, disagreementLog, queue);
  const disagreements = disagreementLog.disagreements || [];
  const stable = stabilityRecords(agreement, 'stable');
  const unstable = stabilityRecords(agreement, 'unstable');
  const insufficient = stabilityRecords(agreement, 'insufficient_evidence');
  const queueIndex = queueByDisagreement(queue);
  const challenges = referenceChallenges(disagreements);
  const strongCases = referenceStrongCases(disagreementLog.item_results || []);
  const priorities = reviewPriorities(queue);
  const status = agreement.status === 'no_submissions'
    ? 'no_submissions'
    : priorities.length > 0 ? 'review_ready' : 'complete';

  return {
    schema_version: 'stage4m-model-consensus-report-1.0',
    status,
    source_agreement_results: relative(AGREEMENT_PATH),
    source_disagreement_log: relative(DISAGREEMENT_PATH),
    source_adjudication_queue: relative(QUEUE_PATH),
    interpretation_policy: 'Model convergence and divergence are diagnostic evidence. No majority, unanimity, or aggregate score is decisive, and this report cannot revise Stage 4A.',
    summary: {
      model_runs: agreement.totals.model_runs,
      packet_units: agreement.totals.packet_units,
      stable_fields: stable.length,
      unstable_fields: unstable.length,
      insufficient_evidence_fields: insufficient.length,
      disagreement_records: disagreementLog.totals.disagreement_records,
      reference_challenges: challenges.length,
      strong_reference_cases: strongCases.length,
      human_review_items: priorities.length,
      high_priority_review_items: priorities.filter(item => item.priority === 'high').length
    },
    stable_coding_fields: stable,
    unstable_coding_fields: unstable,
    insufficient_evidence_fields: insufficient,
    high_risk_documents: aggregateHighRiskDocuments(disagreements, queueIndex),
    high_risk_clusters: aggregateHighRiskClusters(disagreements, queueIndex),
    high_risk_interpretive_categories: aggregateInterpretiveCategories(disagreements, queueIndex),
    cases_where_models_challenge_reference: challenges,
    cases_where_reference_remains_strong: strongCases,
    human_review_priorities: priorities,
    annotation_codebook_implications: codebookImplications(stable, unstable, insufficient, disagreements)
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(value => String(value).replace(/\|/g, '\\|')).join(' | ')} |`)
  ].join('\n');
}

function rate(value) {
  return value === null ? 'n/a' : `${value}%`;
}

function fieldSection(title, records, emptyText) {
  const lines = [`## ${title}`, ''];
  if (records.length === 0) return [...lines, emptyText, ''];
  return [...lines, markdownTable(
    ['Layer', 'Field', 'Agreement', 'Rate'],
    records.map(item => [
      item.layer,
      item.field,
      `${item.agreements}/${item.comparisons}`,
      rate(item.agreement_rate_pct)
    ])
  ), ''];
}

function renderMarkdown(report) {
  const lines = [
    '# Model Consensus Report',
    '',
    `Status: **${report.status.replaceAll('_', ' ')}**`,
    '',
    report.interpretation_policy,
    '',
    '## Summary',
    '',
    `Model runs: ${report.summary.model_runs}; packet units: ${report.summary.packet_units}; disagreement records: ${report.summary.disagreement_records}; human-review items: ${report.summary.human_review_items}.`,
    ''
  ];
  if (report.status === 'no_submissions') {
    lines.push('No validated model submissions are available. The report preserves an explicit insufficient-evidence state and makes no convergence or divergence claim.', '');
  }
  lines.push(
    ...fieldSection(
      'Stable Coding Fields',
      report.stable_coding_fields,
      'No coding field currently meets the declared stability threshold.'
    ),
    ...fieldSection(
      'Unstable Coding Fields',
      report.unstable_coding_fields,
      'No coding field is currently classified as unstable.'
    ),
    '## High-Risk Documents',
    ''
  );
  if (report.high_risk_documents.length === 0) {
    lines.push('No document-level disagreement risk is currently available.', '');
  } else {
    lines.push(markdownTable(
      ['Document', 'Disagreements', 'Human review', 'Reference challenges', 'High priority', 'Fields'],
      report.high_risk_documents.map(item => [
        item.doc_id,
        item.disagreement_records,
        item.human_review_records,
        item.reference_challenges,
        item.high_priority_queue_items,
        item.fields.join(', ')
      ])
    ), '');
  }
  lines.push('## High-Risk Clusters', '');
  if (report.high_risk_clusters.length === 0) {
    lines.push('No cluster-assignment disagreement is currently available.', '');
  } else {
    lines.push(markdownTable(
      ['Cluster', 'Name', 'Disagreements', 'Reference challenges', 'High priority'],
      report.high_risk_clusters.map(item => [
        item.cluster_id,
        item.cluster_name,
        item.disagreement_records,
        item.reference_challenges,
        item.high_priority_queue_items
      ])
    ), '');
  }
  lines.push('## High-Risk Interpretive Categories', '');
  if (report.high_risk_interpretive_categories.length === 0) {
    lines.push('No interpretive disagreement category is currently available.', '');
  } else {
    lines.push(markdownTable(
      ['Category', 'Disagreements', 'Human review', 'Reference challenges', 'High priority'],
      report.high_risk_interpretive_categories.map(item => [
        item.disagreement_category,
        item.disagreement_records,
        item.human_review_records,
        item.reference_challenges,
        item.high_priority_queue_items
      ])
    ), '');
  }
  lines.push('## Cases Where Models Challenge Reference', '');
  if (report.cases_where_models_challenge_reference.length === 0) {
    lines.push('No all-model challenge to the Stage 4A reference is currently recorded.', '');
  } else {
    lines.push(markdownTable(
      ['Document', 'Sentence', 'Field', 'Pattern', 'Category'],
      report.cases_where_models_challenge_reference.map(item => [
        item.doc_id,
        item.sentence_id,
        item.field_name,
        item.agreement_pattern,
        item.disagreement_category
      ])
    ), '');
  }
  lines.push('## Cases Where Reference Remains Strong', '');
  if (report.cases_where_reference_remains_strong.length === 0) {
    lines.push('No model-supported reference case is currently available; `reference_only` is not counted as model support.', '');
  } else {
    lines.push(markdownTable(
      ['Document', 'Sentence', 'Task', 'Pattern'],
      report.cases_where_reference_remains_strong.map(item => [
        item.doc_id,
        item.sentence_id,
        item.task_type,
        item.agreement_pattern
      ])
    ), '');
  }
  lines.push('## Human Review Priorities', '');
  if (report.human_review_priorities.length === 0) {
    lines.push('No adjudication queue item is currently available.', '');
  } else {
    lines.push(markdownTable(
      ['Priority', 'Document', 'Sentence', 'Field', 'Category', 'Review question'],
      report.human_review_priorities.map(item => [
        item.priority,
        item.doc_id,
        item.sentence_id,
        item.field_name,
        item.disagreement_category,
        item.suggested_review_question
      ])
    ), '');
  }
  lines.push('## Implications for the Annotation Codebook', '');
  for (const implication of report.annotation_codebook_implications) {
    lines.push(`- ${implication}`);
  }
  lines.push('', '### Insufficient Evidence', '');
  if (report.insufficient_evidence_fields.length === 0) {
    lines.push('All coding fields have enough pooled comparisons for stability classification.');
  } else {
    lines.push(`The following fields remain below the declared comparison threshold: ${report.insufficient_evidence_fields.map(item => item.field).join(', ')}.`);
  }
  return lines.join('\n').trimEnd() + '\n';
}

function writeAtomic(filePath, contents) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(COMPARISON_DIR) + path.sep)) {
    throw new Error(`Refusing write outside Stage 4M comparison directory: ${filePath}`);
  }
  fs.mkdirSync(COMPARISON_DIR, { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents);
  fs.renameSync(temporaryPath, filePath);
}

function run({ write }) {
  const agreement = readJSON(AGREEMENT_PATH);
  const disagreementLog = readJSON(DISAGREEMENT_PATH);
  const queue = readJSON(QUEUE_PATH);
  const report = generateReport(agreement, disagreementLog, queue);
  if (write) {
    writeAtomic(OUTPUT_PATHS.json, JSON.stringify(report, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(report));
  }
  if (report.status === 'no_submissions') {
    console.warn('WARN: No validated Stage 4M model submissions are available for a consensus report.');
  } else {
    console.log(`Stage 4M consensus report: ${report.summary.stable_fields} stable field(s), ${report.summary.unstable_fields} unstable field(s), ${report.summary.human_review_items} review item(s).`);
  }
  if (write) console.log(`Consensus report: ${relative(OUTPUT_PATHS.markdown)}`);
  return report;
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
    console.error(`Stage 4M consensus report failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  aggregateHighRiskClusters,
  aggregateHighRiskDocuments,
  generateReport,
  renderMarkdown,
  run
};
