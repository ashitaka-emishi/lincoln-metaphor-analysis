#!/usr/bin/env node
// Renders the publication-facing Stage 4J adjudication results page.
'use strict';

const fs = require('fs');
const path = require('path');
const { writeAtomic } = require('../stage4h/write-guard');

const ROOT = (process.env.STAGE4J_ROOT || process.env.STAGE4H_ROOT)
  ? path.resolve(process.env.STAGE4J_ROOT || process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const ADJUDICATION_DIR = path.join(ROOT, 'data', 'reliability', 'human-adjudication');
const COMPARISON_DIR = path.join(ROOT, 'data', 'reliability', 'human-comparison');
const INPUT_PATHS = Object.freeze({
  queue: path.join(ADJUDICATION_DIR, 'stage4j-adjudication-queue.json'),
  decisions: path.join(ADJUDICATION_DIR, 'stage4j-adjudication-decisions-normalized.json'),
  correctionCandidates: path.join(ADJUDICATION_DIR, 'stage4j-stage4a-correction-candidates.json'),
  reliabilityReport: path.join(COMPARISON_DIR, 'human-reliability-report.json')
});
const OUTPUT_PATH = path.join(ROOT, 'docs', 'methodology', 'stage4j-adjudication-results.md');

const REQUIRED_SECTIONS = Object.freeze([
  'Purpose',
  'Inputs',
  'Decision Counts',
  'High-Priority Cases',
  'Stage 4A Correction Candidates',
  'Codebook Change Candidates',
  'Claim-Audit Review Candidates',
  'Deferred Cases',
  'Limits'
]);

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Required input is missing: ${relative(filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function label(value) {
  return String(value || 'not_available').replaceAll('_', ' ');
}

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function markdownTable(headers, rows) {
  if (rows.length === 0) return 'No rows are available.';
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(escapeCell).join(' | ')} |`)
  ].join('\n');
}

function validateInputs({ queue, decisions, correctionCandidates, reliabilityReport }) {
  if (decisions.source_adjudication_queue !== relative(INPUT_PATHS.queue)) {
    throw new Error('Stage 4J decisions are stale: source queue path does not match the configured queue.');
  }
  if (queue.totals?.queue_items !== (queue.items || []).length) {
    throw new Error('Stage 4J queue is stale: queue item total does not match items length.');
  }
  if (decisions.totals?.valid_decisions !== (decisions.decisions || []).length) {
    throw new Error('Stage 4J decisions are stale: valid decision total does not match decisions length.');
  }
  if (decisions.totals?.stage4a_correction_candidates !== (decisions.stage4a_correction_candidates || []).length) {
    throw new Error('Stage 4J decisions are stale: correction candidate total does not match candidate length.');
  }
  if ((correctionCandidates.candidates || []).length !== (decisions.stage4a_correction_candidates || []).length) {
    throw new Error('Stage 4A correction-candidate export is stale relative to normalized decisions.');
  }
  if (reliabilityReport.source_stage4j_adjudication_decisions !== relative(INPUT_PATHS.decisions)) {
    throw new Error('Human reliability report is stale: Stage 4J decision source does not match.');
  }
}

function buildSummary(inputs) {
  validateInputs(inputs);
  const { queue, decisions, correctionCandidates, reliabilityReport } = inputs;
  const decisionRows = (decisions.decisions || []);
  const byDecision = {};
  const byCodebookType = {};
  const codebookChanges = [];
  const claimAudit = [];
  const deferred = [];
  for (const decision of decisionRows) {
    byDecision[decision.decision] = (byDecision[decision.decision] || 0) + 1;
    if (decision.codebook_change_needed === 'yes') {
      byCodebookType[decision.codebook_change_type] = (byCodebookType[decision.codebook_change_type] || 0) + 1;
      codebookChanges.push(decision);
    }
    if (decision.requires_claim_audit_review === 'yes') claimAudit.push(decision);
    if (decision.decision === 'defer') deferred.push(decision);
  }
  return {
    status: decisions.status,
    queue_status: queue.status,
    reliability_status: reliabilityReport.status,
    totals: {
      queue_items: queue.totals?.queue_items || 0,
      high_priority_queue_items: queue.totals?.high_priority || 0,
      valid_decisions: decisions.totals?.valid_decisions || 0,
      missing_decisions: decisions.totals?.missing_decisions || 0,
      stage4a_correction_candidates: decisions.totals?.stage4a_correction_candidates || 0,
      codebook_change_candidates: codebookChanges.length,
      claim_audit_review_candidates: claimAudit.length,
      deferred_cases: deferred.length
    },
    by_decision: byDecision,
    by_codebook_change_type: byCodebookType,
    high_priority_cases: decisionRows.filter(decision => decision.queue_context?.priority === 'high'),
    correction_candidates: correctionCandidates.candidates || decisions.stage4a_correction_candidates || [],
    codebook_changes: codebookChanges,
    claim_audit_review_candidates: claimAudit,
    deferred_cases: deferred,
    missing_decision_ids: decisions.missing_decision_ids || [],
    required_sections: REQUIRED_SECTIONS
  };
}

function caseRows(items) {
  return items.map(item => [
    `\`${item.adjudication_id}\``,
    item.doc_id,
    item.sentence_id,
    `\`${item.field_name}\``,
    label(item.decision),
    item.rationale || item.notes || ''
  ]);
}

function renderPage(inputs, summary = buildSummary(inputs)) {
  const { queue, decisions, reliabilityReport } = inputs;
  const lines = [
    '---',
    'title: "Stage 4J Adjudication Results"',
    'description: "Generated Stage 4J adjudication decision status, review candidates, and limits."',
    '---',
    '',
    '# Stage 4J Adjudication Results',
    '',
    `Status: **${label(summary.status)}**`,
    '',
    '## Purpose',
    '',
    'Stage 4J summarizes post-coding human adjudication decisions for Stage 4H disagreements. It identifies review implications without modifying Stage 4A annotations.',
    '',
    'This page links conceptually to [Human Inter-Annotator Reliability Results](human-reliability-results.md), which reports the Stage 4H execution state and keeps human-human agreement separate from human-vs-reference comparison.',
    '',
    '## Inputs',
    '',
    markdownTable(['Input', 'Status', 'Path'], [
      ['Stage 4J queue', label(queue.status), relative(INPUT_PATHS.queue)],
      ['Normalized adjudication decisions', label(decisions.status), relative(INPUT_PATHS.decisions)],
      ['Human reliability report', label(reliabilityReport.status), relative(INPUT_PATHS.reliabilityReport)]
    ]),
    '',
    '## Decision Counts',
    '',
    markdownTable(['Measure', 'Count'], [
      ['Queue items', summary.totals.queue_items],
      ['High-priority queue items', summary.totals.high_priority_queue_items],
      ['Valid decisions', summary.totals.valid_decisions],
      ['Missing decisions', summary.totals.missing_decisions],
      ['Stage 4A correction candidates', summary.totals.stage4a_correction_candidates],
      ['Codebook change candidates', summary.totals.codebook_change_candidates],
      ['Claim-audit review candidates', summary.totals.claim_audit_review_candidates],
      ['Deferred cases', summary.totals.deferred_cases]
    ]),
    ''
  ];

  const decisionCounts = Object.entries(summary.by_decision)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([decision, count]) => [label(decision), count]);
  if (decisionCounts.length > 0) {
    lines.push(markdownTable(['Decision', 'Count'], decisionCounts), '');
  } else {
    lines.push('No completed adjudication decisions are available yet. Stage 4J remains pending until human adjudication packets are filled and ingested.', '');
  }

  lines.push('## High-Priority Cases', '');
  lines.push(summary.high_priority_cases.length > 0
    ? markdownTable(['Adjudication ID', 'Document', 'Sentence', 'Field', 'Decision', 'Rationale'], caseRows(summary.high_priority_cases))
    : 'No high-priority adjudication decision can be reported yet.', '');

  lines.push('## Stage 4A Correction Candidates', '');
  if (summary.correction_candidates.length > 0) {
    lines.push(markdownTable(
      ['Adjudication ID', 'Document', 'Sentence', 'Field', 'Stage 4A value', 'Adjudicated value', 'Rationale'],
      summary.correction_candidates.map(item => [
        `\`${item.adjudication_id}\``,
        item.doc_id,
        item.sentence_id,
        `\`${item.field_name}\``,
        item.stage4a_reference_value,
        item.adjudicated_value,
        item.rationale
      ])
    ), '');
  } else {
    lines.push('No Stage 4A correction candidate has been exported. Any future candidate remains review-only and does not apply a Stage 4A mutation.', '');
  }

  lines.push('## Codebook Change Candidates', '');
  if (summary.codebook_changes.length > 0) {
    lines.push(markdownTable(
      ['Adjudication ID', 'Field', 'Change type', 'Rationale'],
      summary.codebook_changes.map(item => [
        `\`${item.adjudication_id}\``,
        `\`${item.field_name}\``,
        label(item.codebook_change_type),
        item.rationale
      ])
    ), '');
  } else {
    lines.push('No codebook change candidate has been accepted through Stage 4J adjudication yet.', '');
  }

  lines.push('## Claim-Audit Review Candidates', '');
  lines.push(summary.claim_audit_review_candidates.length > 0
    ? markdownTable(['Adjudication ID', 'Document', 'Sentence', 'Field', 'Decision', 'Rationale'], caseRows(summary.claim_audit_review_candidates))
    : 'No claim-audit review candidate has been exported from Stage 4J adjudication yet.', '');

  lines.push('## Deferred Cases', '');
  lines.push(summary.deferred_cases.length > 0
    ? markdownTable(['Adjudication ID', 'Document', 'Sentence', 'Field', 'Decision', 'Rationale'], caseRows(summary.deferred_cases))
    : 'No adjudication case is currently marked deferred.', '');

  lines.push(
    '## Limits',
    '',
    '- Stage 4J is a post-coding adjudication and review layer; it does not overwrite Stage 4A.',
    '- Stage 4A correction candidates require a separate documented migration before any canonical annotation changes.',
    '- Claim-audit review candidates identify downstream review work; they do not revise synthesis claims automatically.',
    '- Before completed human adjudication packets exist, this page reports design and pending status rather than adjudication findings.'
  );
  return lines.join('\n').trimEnd() + '\n';
}

function generate({ write }) {
  const inputs = Object.fromEntries(Object.entries(INPUT_PATHS).map(([key, filePath]) => [key, readJSON(filePath)]));
  const summary = buildSummary(inputs);
  if (write) writeAtomic(OUTPUT_PATH, renderPage(inputs, summary));
  if (summary.status === 'no_decisions') console.warn('WARN: Stage 4J adjudication results are pending; no decisions are available.');
  else if (summary.status === 'incomplete') console.warn(`WARN: Stage 4J adjudication results are incomplete (${summary.totals.missing_decisions} missing).`);
  else console.log(`Stage 4J adjudication results generated for ${summary.totals.valid_decisions} decision(s).`);
  if (write) console.log(`Stage 4J adjudication results page: ${relative(OUTPUT_PATH)}`);
  return summary;
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  generate({ write: !args.includes('--check') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4J adjudication results failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  buildSummary,
  generate,
  renderPage,
  validateInputs
};
