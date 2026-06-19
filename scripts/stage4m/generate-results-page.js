#!/usr/bin/env node
// Renders the publication-facing Stage 4M results page from generated JSON artifacts.
'use strict';

const fs = require('fs');
const path = require('path');
const { writeAtomic } = require('./write-guard');

const ROOT = process.env.STAGE4M_ROOT
  ? path.resolve(process.env.STAGE4M_ROOT)
  : path.resolve(__dirname, '..', '..');
const RELIABILITY_DIR = path.join(ROOT, 'data', 'reliability');
const COMPARISON_DIR = path.join(RELIABILITY_DIR, 'model-comparison');
const INPUT_PATHS = Object.freeze({
  manifest: path.join(RELIABILITY_DIR, 'model-input-packets', 'model-packet-manifest.json'),
  normalized: path.join(COMPARISON_DIR, 'normalized-model-runs.json'),
  validation: path.join(COMPARISON_DIR, 'model-run-validation-report.json'),
  agreement: path.join(COMPARISON_DIR, 'model-agreement-results.json'),
  disagreement: path.join(COMPARISON_DIR, 'model-disagreement-log.json'),
  consensus: path.join(COMPARISON_DIR, 'model-consensus-report.json'),
  queue: path.join(RELIABILITY_DIR, 'model-adjudication', 'stage4m-adjudication-queue.json')
});
const OUTPUT_PATH = path.join(
  ROOT,
  'docs',
  'methodology',
  'multi-model-reliability-results.md'
);

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Required input is missing: ${relative(filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(escapeCell).join(' | ')} |`)
  ].join('\n');
}

function label(value) {
  return String(value).replaceAll('_', ' ');
}

function rate(value) {
  return value === null || value === undefined ? 'n/a' : `${value}%`;
}

function validateInputs(inputs) {
  const { manifest, normalized, validation, agreement, disagreement, consensus, queue } = inputs;
  const packetId = manifest.packet_id;
  for (const [name, artifact] of [
    ['normalized runs', normalized],
    ['validation report', validation],
    ['agreement results', agreement]
  ]) {
    if (artifact.packet_id !== packetId) {
      throw new Error(`Input artifacts are stale: ${name} packet ID differs from the manifest.`);
    }
  }
  const runCount = (normalized.runs || []).length;
  if (validation.totals.valid_runs !== runCount
      || agreement.totals.model_runs !== runCount
      || disagreement.totals.model_runs !== runCount
      || consensus.summary.model_runs !== runCount) {
    throw new Error('Input artifacts are stale: model-run counts differ.');
  }
  if (disagreement.totals.disagreement_records !== (disagreement.disagreements || []).length
      || consensus.summary.disagreement_records !== disagreement.totals.disagreement_records) {
    throw new Error('Input artifacts are stale: disagreement counts differ.');
  }
  if (queue.totals.queue_items !== (queue.items || []).length
      || consensus.summary.human_review_items !== queue.totals.queue_items) {
    throw new Error('Input artifacts are stale: adjudication queue counts differ.');
  }
  if (runCount === 0 && [normalized, validation, agreement, disagreement, consensus]
    .some(artifact => artifact.status !== 'no_submissions')) {
    throw new Error('No-submission inputs have conflicting lifecycle states.');
  }
}

function fieldRows(agreement, layer) {
  return Object.entries(agreement.stability.categories || {})
    .filter(([, values]) => values.layer === layer)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([field, values]) => [
      `\`${field}\``,
      `${values.agreements}/${values.comparisons}`,
      rate(values.agreement_rate_pct),
      label(values.classification)
    ]);
}

function fieldSection(lines, title, agreement, layer, emptyText) {
  lines.push(`## ${title}`, '');
  const rows = fieldRows(agreement, layer);
  lines.push(rows.length > 0
    ? markdownTable(['Field', 'Agreement', 'Rate', 'Classification'], rows)
    : emptyText, '');
}

function renderPage(inputs) {
  validateInputs(inputs);
  const { manifest, normalized, validation, agreement, disagreement, consensus, queue } = inputs;
  const runs = normalized.runs || [];
  const executed = runs.length > 0;
  const lines = [
    '---',
    'title: "Multi-Model Reliability Results"',
    'description: "Generated Stage 4M run coverage, agreement, disagreement, and human-review status."',
    '---',
    '',
    '> This page is generated from validated Stage 4M JSON artifacts. Model agreement is diagnostic; it is not historical evidence, human inter-annotator reliability, or authority to revise Stage 4A.',
    '',
    '## Run Summary',
    ''
  ];

  if (!executed) {
    lines.push(
      '**Stage 4M is designed but not yet executed.** No validated external model outputs have been submitted, so no agreement, disagreement, stability, or consensus finding is reported.',
      ''
    );
  } else {
    lines.push(
      `Status: **${label(consensus.status)}**. Validated model runs: **${runs.length}**; packet units: **${agreement.totals.packet_units}**; disagreement records: **${disagreement.totals.disagreement_records}**; human-review items: **${queue.totals.queue_items}**.`,
      ''
    );
  }
  lines.push(markdownTable(
    ['Submission files', 'Valid runs', 'Invalid runs', 'Normalized items'],
    [[
      validation.totals.submission_files,
      validation.totals.valid_runs,
      validation.totals.invalid_runs,
      validation.totals.normalized_items
    ]]
  ), '');

  lines.push('## Models Compared', '');
  if (runs.length === 0) {
    lines.push('No validated model runs are available for comparison.', '');
  } else {
    lines.push(markdownTable(
      ['Run', 'Provider', 'Model', 'Version', 'Date', 'Temperature', 'Items'],
      runs.map(run => [
        `\`${run.run_id}\``,
        run.provider,
        run.model_name,
        run.model_version,
        run.run_date,
        run.temperature === null ? 'not reported' : run.temperature,
        (run.items || []).length
      ])
    ), '');
  }

  lines.push(
    '## Input Packets',
    '',
    `Packet: \`${manifest.packet_id}\`; generator version: \`${manifest.generator.version}\`; input hash: \`${manifest.model_output_contract.input_packet_hash}\`.`,
    '',
    markdownTable(
      ['Sentence identification', 'Field agreement', 'Total seeded rows', 'Documents'],
      [[
        manifest.counts.sentence_identification_units,
        manifest.counts.field_agreement_units,
        manifest.counts.output_template_seed_rows,
        manifest.selected_document_ids.length
      ]]
    ),
    ''
  );

  lines.push('## Overall Agreement', '');
  if (!executed) {
    lines.push('No agreement rate is available before validated model submissions exist.', '');
  } else {
    lines.push(
      `Stable fields: **${consensus.summary.stable_fields}**; unstable fields: **${consensus.summary.unstable_fields}**; insufficient-evidence fields: **${consensus.summary.insufficient_evidence_fields}**. Model-vs-reference runs: **${agreement.model_vs_reference.length}**; model-vs-model pairs: **${agreement.model_vs_model.length}**.`,
      '',
      agreement.stability.policy,
      ''
    );
  }

  lines.push('## Identification Agreement', '');
  if (!executed) {
    lines.push('No identification diagnostics are available.', '');
  } else {
    lines.push(markdownTable(
      ['Run', 'Coverage', 'TP', 'TN', 'FP', 'FN', 'Uncertain', 'Identification rate'],
      agreement.model_vs_reference.map(item => [
        `\`${item.run_id}\``,
        `${item.coverage.covered_packet_units}/${item.coverage.total_packet_units}`,
        item.metaphor_identification.true_positive,
        item.metaphor_identification.true_negative,
        item.metaphor_identification.false_positive,
        item.metaphor_identification.false_negative,
        item.metaphor_identification.uncertain,
        rate(item.fields.metaphor_present.agreement_rate_pct)
      ])
    ), '');
  }

  fieldSection(lines, 'CMT Mapping Agreement', agreement, 'cmt_mapping', 'No CMT mapping metrics are available.');
  fieldSection(lines, 'Koenigsberg Layer Agreement', agreement, 'koenigsberg_interpretation', 'No Koenigsberg-layer metrics are available.');
  fieldSection(lines, 'Absence and Agency Agreement', agreement, 'agency_absence', 'No agency/absence metrics are available.');

  lines.push('## Disagreement Types', '');
  const disagreementRows = Object.entries(disagreement.summaries.by_disagreement_category || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, count]) => [label(category), count]);
  lines.push(disagreementRows.length > 0
    ? markdownTable(['Category', 'Records'], disagreementRows)
    : executed
      ? 'No disagreement records were generated from the validated model runs.'
      : 'No disagreement types can be reported before validated model submissions exist.', '');

  lines.push('## Unstable Categories', '');
  const unstable = consensus.unstable_coding_fields || [];
  if (unstable.length > 0) {
    lines.push(markdownTable(
      ['Field', 'Layer', 'Agreement', 'Rate'],
      unstable.map(item => [
        `\`${item.field}\``,
        label(item.layer),
        `${item.agreements}/${item.comparisons}`,
        rate(item.agreement_rate_pct)
      ])
    ), '');
  } else {
    lines.push(executed
      ? 'No coding field currently meets the declared unstable-field rule.'
      : 'No category can be classified as unstable. All fields remain insufficient evidence until model runs exist.', '');
  }
  const insufficient = consensus.insufficient_evidence_fields || [];
  if (insufficient.length > 0) {
    lines.push(`Insufficient-evidence fields: ${insufficient.map(item => `\`${item.field}\``).join(', ')}.`, '');
  }

  lines.push('## Human Adjudication Queue', '');
  if ((queue.items || []).length === 0) {
    lines.push('No human-adjudication item is currently available.', '');
  } else {
    const displayed = queue.items.slice(0, 20);
    lines.push(markdownTable(
      ['Order', 'Priority', 'Document', 'Sentence', 'Field', 'Category'],
      displayed.map(item => [
        item.queue_order,
        item.priority,
        `\`${item.doc_id}\``,
        `\`${item.sentence_id}\``,
        `\`${item.field_name}\``,
        label(item.disagreement_category)
      ])
    ), '');
    if (displayed.length < queue.items.length) {
      lines.push(`Showing 20 of ${queue.items.length} queued items. See the generated adjudication artifacts for the complete queue.`, '');
    }
  }

  lines.push(
    '## Limits of Interpretation',
    '',
    '- Stage 4M measures model behavior under one packet and prompt; it does not establish human inter-annotator reliability.',
    '- Related model systems may share training data, architecture, or provider defaults, so convergence is not necessarily independent corroboration.',
    '- Agreement with Stage 4A is not evidence that a historical interpretation is true; disagreement is not evidence that the reference is wrong.',
    '- Model consensus cannot automatically revise Stage 4A. Every proposed correction requires human review and a separately authorized migration.',
    '- No result should be generalized beyond the sampled packet, recorded model versions, and disclosed run settings.',
    '',
    'See the [Stage 4M methodology](multi-model-reliability.md), [external model-review workflow](model-review-instructions.md), and [publication package](../../publication_package.md) for the governing design, submission process, and publication boundary.',
    ''
  );
  return lines.join('\n').trimEnd() + '\n';
}

function loadInputs() {
  return Object.fromEntries(
    Object.entries(INPUT_PATHS).map(([name, filePath]) => [name, readJSON(filePath)])
  );
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  const page = renderPage(loadInputs());
  if (args.includes('--check')) {
    if (!fs.existsSync(OUTPUT_PATH) || fs.readFileSync(OUTPUT_PATH, 'utf8') !== page) {
      throw new Error(`Generated results page is missing or stale; run 'npm run stage4m:results'.`);
    }
    console.log(`Stage 4M results page is current: ${relative(OUTPUT_PATH)}`);
  } else {
    writeAtomic(OUTPUT_PATH, page);
    console.log(`Stage 4M results page: ${relative(OUTPUT_PATH)}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4M results page failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { loadInputs, renderPage, validateInputs };
