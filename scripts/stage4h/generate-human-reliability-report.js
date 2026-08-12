#!/usr/bin/env node
// Generates the publication-facing Stage 4H human reliability report.
'use strict';

const fs = require('fs');
const path = require('path');
const { writeAtomic } = require('./write-guard');

const ROOT = process.env.STAGE4H_ROOT
  ? path.resolve(process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const COMPARISON_DIR = path.join(ROOT, 'data', 'reliability', 'human-comparison');
const ADJUDICATION_DIR = path.join(ROOT, 'data', 'reliability', 'human-adjudication');
const DOC_OUTPUT_PATH = path.join(ROOT, 'docs', 'methodology', 'human-reliability-results.md');
const INPUT_PATHS = Object.freeze({
  agreement: path.join(COMPARISON_DIR, 'human-agreement-results.json'),
  reference: path.join(COMPARISON_DIR, 'human-vs-reference-results.json'),
  disagreement: path.join(COMPARISON_DIR, 'human-disagreement-log.json'),
  adjudication: path.join(ADJUDICATION_DIR, 'stage4j-adjudication-decisions-normalized.json')
});
const OUTPUT_PATHS = Object.freeze({
  json: path.join(COMPARISON_DIR, 'human-reliability-report.json'),
  markdown: path.join(COMPARISON_DIR, 'human-reliability-report.md'),
  docs: DOC_OUTPUT_PATH
});

const REQUIRED_SECTIONS = Object.freeze([
  'Study Design',
  'Human Coders',
  'Blindness Protocol',
  'Sample',
  'Coding Tasks',
  'Identification Reliability',
  'Lexical Boundary Agreement',
  'CMT Mapping Agreement',
  'Koenigsberg Interpretive Agreement',
  'Absence and Agency Agreement',
  'Disease and Purification Checks',
  'Confidence and Ambiguity',
  'Human-vs-Reference Comparison',
  'Disagreement Categories',
  'Adjudication Summary',
  'Codebook Implications',
  'Limitations',
  'Publication Use'
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

function rate(value) {
  return value === null || value === undefined ? 'n/a' : `${value}%`;
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

function primaryCoderCount(agreement, reference, disagreement) {
  return Math.max(
    agreement.totals?.primary_human_coders || 0,
    reference.totals?.primary_human_coders || 0,
    disagreement.totals?.primary_human_coders || 0
  );
}

function studyStatus(coderCount) {
  if (coderCount === 0) return 'designed_but_not_executed';
  if (coderCount === 1) return 'partially_executed';
  return 'complete_enough_for_metrics';
}

function validateInputs({ agreement, reference, disagreement, adjudication }) {
  const statuses = [agreement.status, reference.status, disagreement.status];
  if (statuses.some(status => status === 'validation_failed')) {
    throw new Error('Upstream Stage 4H validation failed; fix human submissions before generating the report.');
  }
  const packetIds = [agreement.packet_id, reference.packet_id, disagreement.packet_id].filter(Boolean);
  if (new Set(packetIds).size > 1) throw new Error('Input artifacts are stale: packet IDs differ.');
  const hashes = [agreement.input_packet_hash, reference.input_packet_hash, disagreement.input_packet_hash].filter(Boolean);
  if (new Set(hashes).size > 1) throw new Error('Input artifacts are stale: packet hashes differ.');
  const coderCount = primaryCoderCount(agreement, reference, disagreement);
  const expected = coderCount === 0 ? 'no_submissions' : coderCount === 1 ? 'partial_execution' : 'complete';
  for (const [name, artifact] of [
    ['human agreement', agreement],
    ['human-vs-reference', reference]
  ]) {
    if (artifact.status !== expected) {
      throw new Error(`Input artifacts are stale: ${name} status should be ${expected}, found ${artifact.status}.`);
    }
  }
  const expectedDisagreement = coderCount < 2 ? expected : 'review_ready';
  if (disagreement.status !== expectedDisagreement) {
    throw new Error(`Input artifacts are stale: disagreement status should be ${expectedDisagreement}, found ${disagreement.status}.`);
  }
  if (!adjudication.schema_version || !adjudication.schema_version.startsWith('stage4j-adjudication-decisions-normalized-')) {
    throw new Error('Stage 4J adjudication input is not a normalized decision artifact.');
  }
}

function categoryRows(disagreement) {
  return Object.entries(disagreement.category_counts || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, count]) => [label(category), count]);
}

function fieldMetricRows(agreement, layer) {
  const fields = agreement.human_human?.layers?.[layer] || {};
  return Object.entries(fields)
    .filter(([, values]) => values && typeof values === 'object' && 'comparisons' in values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([field, values]) => [
      `\`${field}\``,
      `${values.agreements}/${values.comparisons}`,
      rate(values.rate_pct)
    ]);
}

function buildReport(inputs) {
  validateInputs(inputs);
  const { agreement, reference, disagreement, adjudication } = inputs;
  const coderCount = primaryCoderCount(agreement, reference, disagreement);
  const status = studyStatus(coderCount);
  return {
    schema_version: 'stage4h-human-reliability-report-1.0',
    status,
    adjudication_status: adjudication.status,
    source_human_agreement: relative(INPUT_PATHS.agreement),
    source_human_vs_reference: relative(INPUT_PATHS.reference),
    source_human_disagreement_log: relative(INPUT_PATHS.disagreement),
    source_stage4j_adjudication_decisions: relative(INPUT_PATHS.adjudication),
    packet_id: agreement.packet_id || reference.packet_id || disagreement.packet_id || null,
    input_packet_hash: agreement.input_packet_hash || reference.input_packet_hash || disagreement.input_packet_hash || null,
    separation_policy: 'Human-human agreement, human-vs-Stage 4A comparison, Stage 4B AI-assisted review, and Stage 4M model-consensus diagnostics are reported separately and are not averaged.',
    stage4a_policy: 'Stage 4H and Stage 4J outputs are review layers. They do not modify Stage 4A.',
    totals: {
      primary_human_coders: coderCount,
      packet_units: agreement.totals?.packet_units || reference.totals?.packet_units || 0,
      identification_units: agreement.totals?.identification_units || 0,
      field_agreement_units: agreement.totals?.field_agreement_units || 0,
      disagreements: disagreement.totals?.disagreements || 0,
      adjudication_decisions: adjudication.totals?.valid_decisions || 0,
      stage4a_correction_candidates: adjudication.totals?.stage4a_correction_candidates || 0
    },
    summaries: {
      identification: agreement.human_human?.layers?.identification || null,
      lexical_boundary: agreement.human_human?.layers?.lexical_boundary || null,
      cmt_mapping: fieldMetricRows(agreement, 'cmt_mapping'),
      koenigsberg_interpretation: fieldMetricRows(agreement, 'koenigsberg_interpretation'),
      absence_agency: fieldMetricRows(agreement, 'absence_agency'),
      disease_purification: fieldMetricRows(agreement, 'absence_agency')
        .filter(row => row[0] === '`disease_or_purification_present`'),
      confidence_ambiguity: fieldMetricRows(agreement, 'confidence_ambiguity'),
      human_vs_reference_subjects: (reference.human_vs_reference || []).map(item => ({
        subject_id: item.subject_id,
        coder_id: item.coder_id || item.subject_id,
        overall: item.overall || null
      })),
      disagreement_categories: categoryRows(disagreement)
    },
    required_sections: REQUIRED_SECTIONS
  };
}

function pendingText(report) {
  if (report.status === 'designed_but_not_executed') {
    return 'The study is designed but not executed. No validated Stage 4H human coder submissions are present, so no human-human metric is reported.';
  }
  if (report.status === 'partially_executed') {
    return 'The study is partially executed. One primary human coder submission is present; two primary submissions are required before human-human agreement can be computed.';
  }
  return null;
}

function renderReport(report, { frontMatter = false } = {}) {
  const pending = pendingText(report);
  const lines = [];
  if (frontMatter) {
    lines.push('---', 'title: "Human Inter-Annotator Reliability Results"', 'description: "Generated Stage 4H human-human reliability, human-vs-reference, and Stage 4J adjudication status."', '---', '');
  }
  lines.push(
    '# Human Inter-Annotator Reliability Results',
    '',
    `Status: **${label(report.status)}**`,
    '',
    'This Stage 4H study reports two-human blind inter-annotator reliability. Coders were not shown Stage 4A reference annotations, Stage 4B AI-assisted review results, Stage 4M model-consensus outputs, final synthesis claims, or each other’s annotations during coding.',
    '',
    'Human-human agreement and human-vs-reference comparison are reported separately. This report does not average human agreement with Stage 4B or Stage 4M AI-assisted reliability diagnostics.',
    '',
    '## Study Design',
    '',
    'Stage 4H is a blind two-human reliability branch over the generated human coding packet. Stage 4J is the post-coding adjudication layer for disagreements and review candidates.',
    ''
  );
  if (pending) lines.push(pending, '');
  lines.push(
    '## Human Coders',
    '',
    `Primary human coder submissions available: **${report.totals.primary_human_coders}**. The complete metric gate requires two primary coders, \`human_coder_a\` and \`human_coder_b\`.`,
    '',
    '## Blindness Protocol',
    '',
    'The packet manifest records that Stage 4A reference values, Stage 4B values, Stage 4M values, adjudication results, reliability results, and synthesis claims were excluded from coder packets.',
    '',
    '## Sample',
    '',
    `Packet: \`${report.packet_id || 'not available'}\`. Packet units: **${report.totals.packet_units}**; identification units: **${report.totals.identification_units}**; field-agreement units: **${report.totals.field_agreement_units}**.`,
    '',
    '## Coding Tasks',
    '',
    'Coders complete sentence-level metaphor identification tasks and field-level agreement tasks covering lexical boundaries, CMT mappings, Koenigsberg interpretive fields, agency and absence fields, disease/purification checks, confidence, and ambiguity.',
    '',
    '## Identification Reliability',
    ''
  );
  if (!report.summaries.identification) {
    lines.push('No identification reliability metric is available before two validated primary submissions exist.', '');
  } else {
    const identification = report.summaries.identification;
    lines.push(markdownTable(['Metric', 'Value'], [
      ['Label agreement', `${identification.label_agreement.agreements}/${identification.label_agreement.comparisons} (${rate(identification.label_agreement.rate_pct)})`],
      ['Cohen kappa, present/absent', identification.cohens_kappa_present_absent ?? 'n/a'],
      ['Positive agreement', rate(identification.positive_agreement_pct)],
      ['Negative-control accuracy', `${identification.negative_control_accuracy.correct_absent}/${identification.negative_control_accuracy.total} (${rate(identification.negative_control_accuracy.rate_pct)})`]
    ]), '');
  }
  lines.push('## Lexical Boundary Agreement', '');
  if (!report.summaries.lexical_boundary) {
    lines.push('No lexical-boundary agreement metric is available before two validated primary submissions exist.', '');
  } else {
    const boundary = report.summaries.lexical_boundary;
    lines.push(markdownTable(['Metric', 'Count'], [
      ['Comparisons', boundary.comparisons],
      ['Exact boundary agreement', `${boundary.exact_boundary_agreement} (${rate(boundary.exact_rate_pct)})`],
      ['Partial overlap agreement', boundary.partial_overlap_agreement],
      ['No overlap', boundary.no_overlap],
      ['Missing boundary', boundary.missing_boundary]
    ]), '');
  }
  for (const [title, key, empty] of [
    ['CMT Mapping Agreement', 'cmt_mapping', 'No CMT mapping agreement metrics are available.'],
    ['Koenigsberg Interpretive Agreement', 'koenigsberg_interpretation', 'No Koenigsberg interpretive agreement metrics are available.'],
    ['Absence and Agency Agreement', 'absence_agency', 'No absence or agency agreement metrics are available.'],
    ['Disease and Purification Checks', 'disease_purification', 'No disease or purification agreement metric is available before two validated primary submissions exist.'],
    ['Confidence and Ambiguity', 'confidence_ambiguity', 'No confidence or ambiguity agreement metrics are available.']
  ]) {
    lines.push(`## ${title}`, '');
    const rows = report.summaries[key] || [];
    lines.push(rows.length > 0 ? markdownTable(['Field', 'Agreement', 'Rate'], rows) : empty, '');
  }
  lines.push('## Human-vs-Reference Comparison', '');
  if (report.summaries.human_vs_reference_subjects.length === 0) {
    lines.push('No human-vs-Stage 4A comparison is available before validated human submissions exist.', '');
  } else {
    lines.push(markdownTable(['Subject', 'Overall matches', 'Overall rate'], report.summaries.human_vs_reference_subjects.map(subject => [
      `\`${subject.subject_id}\``,
      subject.overall ? `${subject.overall.matches}/${subject.overall.comparisons}` : 'n/a',
      subject.overall ? rate(subject.overall.rate_pct) : 'n/a'
    ])), '');
  }
  lines.push('## Disagreement Categories', '');
  lines.push(report.summaries.disagreement_categories.length > 0
    ? markdownTable(['Category', 'Records'], report.summaries.disagreement_categories)
    : 'No human-human disagreement categories are available before two validated primary submissions exist.', '');
  lines.push(
    '## Adjudication Summary',
    '',
    `Stage 4J status: **${label(report.adjudication_status)}**. Valid adjudication decisions: **${report.totals.adjudication_decisions}**. Stage 4A correction candidates exported for review: **${report.totals.stage4a_correction_candidates}**.`,
    '',
    '## Codebook Implications',
    '',
    report.totals.adjudication_decisions === 0
      ? 'No accepted codebook revision is reported before Stage 4J adjudication decisions exist.'
      : 'Codebook implications should be read from the generated Stage 4J adjudication and revision artifacts.',
    '',
    '## Limitations',
    '',
    '- Human reliability is not complete until two trained human coders submit valid blind packets.',
    '- Human-vs-reference comparison is a diagnostic review layer; disagreement with Stage 4A is not an automatic correction.',
    '- Stage 4J correction candidates remain review-only and require a separate documented migration before any Stage 4A change.',
    '- AI-assisted Stage 4B and Stage 4M outputs are methodologically separate and are not averaged with Stage 4H.',
    '',
    '## Publication Use',
    '',
    report.status === 'complete_enough_for_metrics'
      ? 'Publication materials may describe the Stage 4H study as complete enough for human-human reliability metrics, while keeping human-human, human-vs-reference, Stage 4B, and Stage 4M claims separate.'
      : 'Publication materials may cite this page as the Stage 4H/4J design and execution-status report, but must not claim completed human inter-annotator reliability yet.'
  );
  return lines.join('\n').trimEnd() + '\n';
}

function generate({ write }) {
  const inputs = Object.fromEntries(Object.entries(INPUT_PATHS).map(([key, filePath]) => [key, readJSON(filePath)]));
  const report = buildReport(inputs);
  if (write) {
    writeAtomic(OUTPUT_PATHS.json, JSON.stringify(report, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.markdown, renderReport(report));
    writeAtomic(OUTPUT_PATHS.docs, renderReport(report, { frontMatter: true }));
  }
  if (report.status === 'designed_but_not_executed') console.warn('WARN: Stage 4H human reliability is designed but not executed.');
  else if (report.status === 'partially_executed') console.warn('WARN: Stage 4H human reliability is partially executed.');
  else console.log('Stage 4H human reliability report generated with complete-enough metrics.');
  if (write) console.log(`Human reliability report: ${relative(OUTPUT_PATHS.docs)}`);
  return report;
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
    console.error(`Stage 4H human reliability report failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  buildReport,
  generate,
  renderReport,
  validateInputs
};
