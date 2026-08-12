#!/usr/bin/env node
// Renders Stage 4H/4J codebook revision notes from disagreements and adjudication.
'use strict';

const fs = require('fs');
const path = require('path');
const { writeAtomic } = require('../stage4h/write-guard');

const ROOT = (process.env.STAGE4J_ROOT || process.env.STAGE4H_ROOT)
  ? path.resolve(process.env.STAGE4J_ROOT || process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const COMPARISON_DIR = path.join(ROOT, 'data', 'reliability', 'human-comparison');
const ADJUDICATION_DIR = path.join(ROOT, 'data', 'reliability', 'human-adjudication');
const INPUT_PATHS = Object.freeze({
  disagreement: path.join(COMPARISON_DIR, 'human-disagreement-log.json'),
  decisions: path.join(ADJUDICATION_DIR, 'stage4j-adjudication-decisions-normalized.json'),
  reliabilityReport: path.join(COMPARISON_DIR, 'human-reliability-report.json')
});
const OUTPUT_PATH = path.join(ROOT, 'docs', 'methodology', 'stage4h-codebook-revision-notes.md');

const REQUIRED_SECTIONS = Object.freeze([
  'Purpose',
  'Categories Confirmed as Stable',
  'Categories Needing Clarification',
  'Metaphor Identification Notes',
  'Lexical Boundary Notes',
  'CMT Mapping Notes',
  'Koenigsberg Layer Notes',
  'Absence and Agency Notes',
  'Disease and Purification Notes',
  'Confidence and Ambiguity Notes',
  'Recommended Changes',
  'Accepted Changes',
  'Deferred Changes',
  'Impact on Future Human Coding'
]);

const SECTION_FIELDS = Object.freeze({
  metaphor_identification: ['metaphor_present', 'mipvu_decision'],
  lexical_boundary: ['lexical_unit', 'lexical_unit_boundary', 'lexical_unit_start', 'lexical_unit_end'],
  cmt_mapping: ['cluster_id', 'source_domain', 'target_domain', 'source_domain_family', 'target_domain_family'],
  koenigsberg_layer: [
    'koenigsberg_function',
    'violence_logic',
    'obligatory_frame',
    'sacrifice_logic',
    'guilt_logic',
    'providence_logic',
    'reconciliation_logic'
  ],
  absence_agency: [
    'primary_actor',
    'acted_upon_entity',
    'agency_status',
    'absence_flag',
    'enslaved_people_present',
    'black_soldiers_present'
  ],
  disease_purification: ['disease_or_purification_present'],
  confidence_ambiguity: ['confidence', 'ambiguity_flag', 'rival_reading_presence']
});

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

function validateInputs({ disagreement, decisions, reliabilityReport }) {
  if (disagreement.totals?.disagreements !== (disagreement.disagreements || []).length) {
    throw new Error('Human disagreement log is stale: disagreement total does not match records length.');
  }
  if (decisions.totals?.valid_decisions !== (decisions.decisions || []).length) {
    throw new Error('Stage 4J decisions are stale: valid decision total does not match decisions length.');
  }
  if (reliabilityReport.source_human_disagreement_log !== relative(INPUT_PATHS.disagreement)) {
    throw new Error('Human reliability report is stale: disagreement source does not match.');
  }
  if (reliabilityReport.source_stage4j_adjudication_decisions !== relative(INPUT_PATHS.decisions)) {
    throw new Error('Human reliability report is stale: Stage 4J decision source does not match.');
  }
}

function sectionForField(fieldName, category) {
  for (const [section, fields] of Object.entries(SECTION_FIELDS)) {
    if (fields.includes(fieldName)) return section;
  }
  if (category === 'agency_or_absence_flag') return 'absence_agency';
  if (category === 'disease_or_purification_flag') return 'disease_purification';
  return 'recommended';
}

function stableCategories(reliabilityReport) {
  const summaries = reliabilityReport.summaries || {};
  return Object.entries({
    cmt_mapping: summaries.cmt_mapping,
    koenigsberg_interpretation: summaries.koenigsberg_interpretation,
    absence_agency: summaries.absence_agency,
    disease_purification: summaries.disease_purification,
    confidence_ambiguity: summaries.confidence_ambiguity
  })
    .filter(([, rows]) => Array.isArray(rows) && rows.length > 0)
    .filter(([, rows]) => rows.every(row => {
      const text = Array.isArray(row) ? row[2] : null;
      if (!text || text === 'n/a') return false;
      const number = Number(String(text).replace('%', ''));
      return Number.isFinite(number) && number >= 80;
    }))
    .map(([section]) => section);
}

function buildNotes(inputs) {
  validateInputs(inputs);
  const { disagreement, decisions, reliabilityReport } = inputs;
  const disagreements = disagreement.disagreements || [];
  const adjudications = decisions.decisions || [];
  const recommended = disagreements.map(row => ({
    source: 'disagreement',
    id: row.disagreement_id,
    doc_id: row.doc_id,
    sentence_id: row.sentence_id,
    field_name: row.field_name,
    section: sectionForField(row.field_name, row.disagreement_category),
    category: row.disagreement_category,
    reason: row.agreement_pattern || 'human disagreement',
    note: `Clarify ${label(row.field_name)} because coders diverged (${row.coder_a_value || 'blank'} vs ${row.coder_b_value || 'blank'}).`
  }));
  const accepted = adjudications
    .filter(row => row.codebook_change_needed === 'yes')
    .map(row => ({
      source: 'adjudication',
      id: row.adjudication_id,
      doc_id: row.doc_id,
      sentence_id: row.sentence_id,
      field_name: row.field_name,
      section: sectionForField(row.field_name, row.queue_context?.disagreement_category),
      change_type: row.codebook_change_type,
      reason: row.decision,
      note: row.rationale
    }));
  const deferred = adjudications
    .filter(row => row.decision === 'defer' || row.codebook_change_needed !== 'yes')
    .map(row => ({
      source: 'adjudication',
      id: row.adjudication_id,
      doc_id: row.doc_id,
      sentence_id: row.sentence_id,
      field_name: row.field_name,
      section: sectionForField(row.field_name, row.queue_context?.disagreement_category),
      reason: row.decision,
      note: row.decision === 'defer'
        ? row.rationale
        : 'No accepted codebook change was recorded for this adjudication.'
    }));
  const clarificationSections = [...new Set([
    ...recommended.map(item => item.section),
    ...accepted.map(item => item.section)
  ])].sort();
  return {
    status: reliabilityReport.status === 'complete_enough_for_metrics' || adjudications.length > 0
      ? 'review_ready'
      : 'designed_but_not_executed',
    source_human_disagreement_log: relative(INPUT_PATHS.disagreement),
    source_stage4j_adjudication_decisions: relative(INPUT_PATHS.decisions),
    source_human_reliability_report: relative(INPUT_PATHS.reliabilityReport),
    totals: {
      primary_human_coders: reliabilityReport.totals?.primary_human_coders || 0,
      disagreements: disagreements.length,
      adjudication_decisions: adjudications.length,
      recommended_changes: recommended.length,
      accepted_changes: accepted.length,
      deferred_changes: deferred.length
    },
    stable_categories: stableCategories(reliabilityReport),
    clarification_sections: clarificationSections,
    recommended_changes: recommended,
    accepted_changes: accepted,
    deferred_changes: deferred,
    required_sections: REQUIRED_SECTIONS
  };
}

function changesFor(notes, section) {
  return [
    ...notes.recommended_changes.filter(item => item.section === section),
    ...notes.accepted_changes.filter(item => item.section === section),
    ...notes.deferred_changes.filter(item => item.section === section && item.reason === 'defer')
  ];
}

function renderChangeList(items, emptyText) {
  if (items.length === 0) return emptyText;
  return markdownTable(
    ['Source', 'ID', 'Document', 'Sentence', 'Field', 'Reason', 'Note'],
    items.map(item => [
      item.source,
      `\`${item.id}\``,
      item.doc_id,
      item.sentence_id,
      `\`${item.field_name}\``,
      label(item.change_type || item.reason),
      item.note
    ])
  );
}

function renderPage(notes) {
  const lines = [
    '---',
    'title: "Stage 4H/4J Codebook Revision Notes"',
    'description: "Generated codebook revision notes from Stage 4H disagreements and Stage 4J adjudication decisions."',
    '---',
    '',
    '# Stage 4H/4J Codebook Revision Notes',
    '',
    `Status: **${label(notes.status)}**`,
    '',
    '## Purpose',
    '',
    'These notes collect codebook implications from Stage 4H human-coder disagreement and Stage 4J adjudication. They are review notes for future human coding and do not retroactively alter Stage 4A.',
    '',
    `Inputs: \`${notes.source_human_disagreement_log}\`, \`${notes.source_stage4j_adjudication_decisions}\`, and \`${notes.source_human_reliability_report}\`.`,
    '',
    '## Categories Confirmed as Stable',
    ''
  ];
  lines.push(notes.stable_categories.length > 0
    ? notes.stable_categories.map(category => `- ${label(category)}`).join('\n')
    : 'No category is confirmed stable by Stage 4H yet. Two validated human submissions are required before stability can be inferred from human-human agreement.', '');
  lines.push('## Categories Needing Clarification', '');
  lines.push(notes.clarification_sections.length > 0
    ? notes.clarification_sections.map(section => `- ${label(section)}`).join('\n')
    : 'No clarification category has been identified yet because no Stage 4H disagreement or Stage 4J decision is available.', '');

  for (const [title, section, empty] of [
    ['Metaphor Identification Notes', 'metaphor_identification', 'No metaphor-identification codebook note is available yet.'],
    ['Lexical Boundary Notes', 'lexical_boundary', 'No lexical-boundary codebook note is available yet.'],
    ['CMT Mapping Notes', 'cmt_mapping', 'No CMT mapping codebook note is available yet.'],
    ['Koenigsberg Layer Notes', 'koenigsberg_layer', 'No Koenigsberg-layer codebook note is available yet.'],
    ['Absence and Agency Notes', 'absence_agency', 'No absence or agency codebook note is available yet.'],
    ['Disease and Purification Notes', 'disease_purification', 'No disease or purification codebook note is available yet.'],
    ['Confidence and Ambiguity Notes', 'confidence_ambiguity', 'No confidence or ambiguity codebook note is available yet.']
  ]) {
    lines.push(`## ${title}`, '', renderChangeList(changesFor(notes, section), empty), '');
  }

  lines.push('## Recommended Changes', '');
  lines.push(renderChangeList(
    notes.recommended_changes,
    'No recommended codebook change is available before Stage 4H disagreement records exist.'
  ), '');
  lines.push('## Accepted Changes', '');
  lines.push(renderChangeList(
    notes.accepted_changes,
    'No accepted codebook change is recorded before Stage 4J adjudication decisions exist.'
  ), '');
  lines.push('## Deferred Changes', '');
  lines.push(renderChangeList(
    notes.deferred_changes,
    'No deferred codebook change is recorded yet.'
  ), '');
  lines.push(
    '## Impact on Future Human Coding',
    '',
    notes.status === 'review_ready'
      ? 'Future human coding should use these notes as candidates for revised definitions, examples, or boundary rules after editorial review. Stage 4A remains unchanged unless a separate migration is authorized.'
      : 'Future human coding can use this page as a placeholder for revision governance. Substantive codebook updates require completed Stage 4H packets and Stage 4J adjudication.',
    '',
    'Stage 4H/4J codebook notes are advisory. They do not prove an interpretation, revise synthesis claims, or overwrite Stage 4A.'
  );
  return lines.join('\n').trimEnd() + '\n';
}

function generate({ write }) {
  const inputs = Object.fromEntries(Object.entries(INPUT_PATHS).map(([key, filePath]) => [key, readJSON(filePath)]));
  const notes = buildNotes(inputs);
  if (write) writeAtomic(OUTPUT_PATH, renderPage(notes));
  if (notes.status === 'designed_but_not_executed') console.warn('WARN: Stage 4H/4J codebook revision notes are pending human submissions and adjudication.');
  else console.log(`Stage 4H/4J codebook revision notes generated: ${notes.totals.recommended_changes} recommended, ${notes.totals.accepted_changes} accepted.`);
  if (write) console.log(`Codebook revision notes: ${relative(OUTPUT_PATH)}`);
  return notes;
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
    console.error(`Stage 4H/4J codebook revision notes failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  buildNotes,
  generate,
  renderPage,
  validateInputs
};
