#!/usr/bin/env node
// Validates and normalizes completed Stage 4J adjudication decisions.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');
const { writeAtomic } = require('../stage4h/write-guard');

const ROOT = (process.env.STAGE4J_ROOT || process.env.STAGE4H_ROOT)
  ? path.resolve(process.env.STAGE4J_ROOT || process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const ADJUDICATION_DIR = path.join(ROOT, 'data', 'reliability', 'human-adjudication');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'stage4j-adjudication.schema.json');
const QUEUE_PATH = path.join(ADJUDICATION_DIR, 'stage4j-adjudication-queue.json');
const INPUT_PATHS = Object.freeze([
  path.join(ADJUDICATION_DIR, 'stage4j-adjudication-decisions.json'),
  path.join(ADJUDICATION_DIR, 'stage4j-adjudication-decisions.csv')
]);
const OUTPUT_PATHS = Object.freeze({
  normalized: path.join(ADJUDICATION_DIR, 'stage4j-adjudication-decisions-normalized.json'),
  markdown: path.join(ADJUDICATION_DIR, 'stage4j-adjudication-validation-report.md'),
  correctionCandidatesJson: path.join(ADJUDICATION_DIR, 'stage4j-stage4a-correction-candidates.json'),
  correctionCandidatesCsv: path.join(ADJUDICATION_DIR, 'stage4j-stage4a-correction-candidates.csv')
});

const CORRECTION_COLUMNS = Object.freeze([
  'adjudication_id',
  'doc_id',
  'sentence_id',
  'field_name',
  'stage4a_reference_value',
  'adjudicated_value',
  'decision',
  'rationale',
  'requires_claim_audit_review',
  'notes'
]);

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function csvEscape(value) {
  const text = value === null || value === undefined
    ? ''
    : Array.isArray(value) ? value.join('|')
      : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function makeCSV(rows, columns) {
  return [
    columns.join(','),
    ...rows.map(row => columns.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  if (quoted) throw new Error('Unterminated quoted CSV field.');
  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter(values => values.some(value => value !== ''));
}

function parseCSVDecisions(filePath, schema) {
  const rows = parseCSV(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('CSV must contain a header and at least one data row.');
  const headers = rows[0];
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicates.length > 0) throw new Error(`Duplicate CSV column(s): ${[...new Set(duplicates)].join(', ')}.`);
  const mapping = schema['x-stage4j-csv'];
  const expected = [...mapping.metadata_columns, ...mapping.decision_columns];
  const missing = expected.filter(column => !headers.includes(column));
  const extra = headers.filter(column => !expected.includes(column));
  if (missing.length > 0 || extra.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(', ')}` : null,
      extra.length > 0 ? `unexpected: ${extra.join(', ')}` : null
    ].filter(Boolean).join('; ');
    throw new Error(`CSV columns do not match the Stage 4J schema (${details}).`);
  }
  const records = rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
  const metadata = Object.fromEntries(mapping.metadata_columns.map(column => [column, records[0][column]]));
  for (const [rowIndex, record] of records.entries()) {
    for (const column of mapping.metadata_columns) {
      if (record[column] !== metadata[column]) {
        throw new Error(`CSV row ${rowIndex + 2} has inconsistent adjudication metadata in '${column}'.`);
      }
    }
  }
  const decisions = records.map(record => Object.fromEntries(mapping.decision_columns.map(column => {
    const value = record[column];
    if (column === 'adjudicated_value' && value === '') return [column, null];
    return [column, value];
  })));
  return { ...metadata, decisions };
}

function schemaMessage(error) {
  if (error.keyword === 'required') return `Missing required field '${error.params.missingProperty}'.`;
  if (error.keyword === 'additionalProperties') return `Unexpected field '${error.params.additionalProperty}'.`;
  if (error.keyword === 'enum') return `Invalid label; expected one of ${error.params.allowedValues.join(', ')}.`;
  if (error.keyword === 'const') return `Invalid value; expected '${error.params.allowedValue}'.`;
  return `${error.message[0].toUpperCase()}${error.message.slice(1)}.`;
}

function addFinding(fileResult, severity, code, location, message) {
  fileResult.findings.push({ severity, code, location, message });
}

function queueIndex(queue) {
  return new Map((queue.items || []).map(item => [item.adjudication_id, item]));
}

function semanticValidation(fileResult, document, context) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) return;
  if (document.source_adjudication_queue !== relative(QUEUE_PATH)) {
    addFinding(fileResult, 'error', 'queue_source_mismatch', '/source_adjudication_queue',
      `Expected '${relative(QUEUE_PATH)}'.`);
  }
  const seen = new Set();
  for (const [index, decision] of (Array.isArray(document.decisions) ? document.decisions : []).entries()) {
    const location = `/decisions/${index}`;
    if (!decision || typeof decision !== 'object' || Array.isArray(decision)) continue;
    const queueItem = context.queueItems.get(decision.adjudication_id);
    if (!queueItem) {
      addFinding(fileResult, 'error', 'unknown_adjudication_id', `${location}/adjudication_id`,
        `Decision '${decision.adjudication_id}' does not link to the Stage 4J queue.`);
      continue;
    }
    if (seen.has(decision.adjudication_id)) {
      addFinding(fileResult, 'error', 'duplicate_adjudication_decision', `${location}/adjudication_id`,
        `Decision '${decision.adjudication_id}' appears more than once.`);
    }
    seen.add(decision.adjudication_id);
    for (const field of ['doc_id', 'sentence_id', 'field_name']) {
      if (decision[field] !== queueItem[field]) {
        addFinding(fileResult, 'error', `${field}_mismatch`, `${location}/${field}`,
          `Queue '${decision.adjudication_id}' has ${field} '${queueItem[field]}'.`);
      }
    }
  }
}

function normalizeDecision(source, decision, queueItem) {
  return {
    source_file: source.source_file,
    source_format: source.source_format,
    source_sha256: source.source_sha256,
    adjudication_id: decision.adjudication_id,
    disagreement_id: queueItem.disagreement_id,
    packet_unit_id: queueItem.packet_unit_id,
    doc_id: decision.doc_id,
    sentence_id: decision.sentence_id,
    field_name: decision.field_name,
    decision: decision.decision,
    adjudicated_value: decision.adjudicated_value,
    rationale: decision.rationale,
    codebook_change_needed: decision.codebook_change_needed,
    codebook_change_type: decision.codebook_change_type,
    stage4a_correction_candidate: decision.stage4a_correction_candidate,
    requires_claim_audit_review: decision.requires_claim_audit_review,
    adjudicator: decision.adjudicator,
    adjudication_date: decision.adjudication_date,
    notes: decision.notes,
    queue_context: {
      priority: queueItem.priority,
      disagreement_category: queueItem.disagreement_category,
      agreement_pattern: queueItem.agreement_pattern,
      coder_a_value: queueItem.coder_a_value,
      coder_b_value: queueItem.coder_b_value,
      stage4a_reference_value: queueItem.stage4a_reference_value,
      affected_claim_ids: queueItem.affected_claim_ids || []
    }
  };
}

function markdownEscape(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function renderMarkdown(report) {
  const lines = [
    '# Stage 4J Adjudication Decision Validation Report',
    '',
    `Status: **${report.status.replaceAll('_', ' ')}**`,
    '',
    `Queue: \`${report.source_adjudication_queue}\``,
    '',
    `Decision files: ${report.totals.decision_files}; valid decisions: ${report.totals.valid_decisions}; invalid files: ${report.totals.invalid_files}; queue items: ${report.totals.queue_items}; missing decisions: ${report.totals.missing_decisions}; correction candidates: ${report.totals.stage4a_correction_candidates}.`,
    ''
  ];
  if (report.files.length === 0) {
    lines.push('No completed Stage 4J decision files were found. This is expected before human adjudication has been performed.', '');
  } else {
    lines.push('| File | Format | Result | Decisions | Errors | Warnings |', '| --- | --- | --- | ---: | ---: | ---: |');
    for (const file of report.files) {
      lines.push(`| ${markdownEscape(file.source_file)} | ${file.source_format} | ${file.valid ? 'valid' : 'invalid'} | ${file.decision_count} | ${file.error_count} | ${file.warning_count} |`);
    }
    lines.push('');
  }
  if (report.missing_decision_ids.length > 0) {
    lines.push('## Missing Queue Decisions', '');
    for (const id of report.missing_decision_ids) lines.push(`- \`${id}\``);
    lines.push('');
  }
  for (const file of report.files) {
    lines.push(`## ${file.source_file}`, '');
    if (file.findings.length === 0) {
      lines.push('No validation findings.', '');
      continue;
    }
    for (const finding of file.findings) {
      lines.push(`- **${finding.severity.toUpperCase()} - ${finding.code}** at \`${finding.location}\`: ${finding.message}`);
    }
    lines.push('');
  }
  lines.push('## Stage 4A Policy', '', 'Correction candidates are exported separately for review. This ingestion step does not modify Stage 4A files.');
  return lines.join('\n').trimEnd() + '\n';
}

function loadContext() {
  const schema = readJSON(SCHEMA_PATH);
  const queue = readJSON(QUEUE_PATH);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return {
    schema,
    queue,
    queueItems: queueIndex(queue),
    validate: ajv.compile(schema)
  };
}

function sourceFiles() {
  return INPUT_PATHS.filter(filePath => fs.existsSync(filePath));
}

function ingest({ write }) {
  const context = loadContext();
  const files = sourceFiles().map(filePath => {
    const sourceFormat = path.extname(filePath).slice(1).toLowerCase();
    const result = {
      source_file: relative(filePath),
      source_format: sourceFormat,
      source_sha256: sha256(filePath),
      document: null,
      findings: []
    };
    try {
      result.document = sourceFormat === 'json'
        ? readJSON(filePath)
        : parseCSVDecisions(filePath, context.schema);
    } catch (error) {
      addFinding(result, 'error', 'parse_error', '/', error.message);
      return result;
    }
    if (!context.validate(result.document)) {
      for (const error of context.validate.errors || []) {
        addFinding(result, 'error', `schema_${error.keyword}`, error.instancePath || '/', schemaMessage(error));
      }
    }
    semanticValidation(result, result.document, context);
    return result;
  });

  const byAdjudicationId = new Map();
  for (const file of files) {
    for (const decision of (file.document && Array.isArray(file.document.decisions) ? file.document.decisions : [])) {
      if (!decision || typeof decision.adjudication_id !== 'string') continue;
      if (!byAdjudicationId.has(decision.adjudication_id)) byAdjudicationId.set(decision.adjudication_id, []);
      byAdjudicationId.get(decision.adjudication_id).push(file);
    }
  }
  for (const [adjudicationId, duplicates] of byAdjudicationId) {
    if (duplicates.length < 2) continue;
    for (const file of duplicates) {
      addFinding(file, 'error', 'duplicate_adjudication_decision_across_files', '/decisions',
        `Decision '${adjudicationId}' appears in ${duplicates.length} decision files.`);
    }
  }

  const fileSummaries = files.map(file => {
    const errorCount = file.findings.filter(finding => finding.severity === 'error').length;
    const warningCount = file.findings.filter(finding => finding.severity === 'warning').length;
    return {
      source_file: file.source_file,
      source_format: file.source_format,
      source_sha256: file.source_sha256,
      valid: errorCount === 0,
      decision_count: file.document && Array.isArray(file.document.decisions) ? file.document.decisions.length : 0,
      error_count: errorCount,
      warning_count: warningCount,
      findings: file.findings
    };
  });
  const validFiles = files.filter((file, index) => fileSummaries[index].valid);
  const normalizedDecisions = validFiles.flatMap(file =>
    (file.document.decisions || []).map(decision => normalizeDecision(file, decision, context.queueItems.get(decision.adjudication_id)))
  ).sort((left, right) => left.adjudication_id.localeCompare(right.adjudication_id));
  const decidedIds = new Set(normalizedDecisions.map(decision => decision.adjudication_id));
  const missingIds = [...context.queueItems.keys()].filter(id => !decidedIds.has(id)).sort();
  const correctionCandidates = normalizedDecisions
    .filter(decision => decision.stage4a_correction_candidate === 'yes')
    .map(decision => ({
      adjudication_id: decision.adjudication_id,
      doc_id: decision.doc_id,
      sentence_id: decision.sentence_id,
      field_name: decision.field_name,
      stage4a_reference_value: decision.queue_context.stage4a_reference_value,
      adjudicated_value: decision.adjudicated_value,
      decision: decision.decision,
      rationale: decision.rationale,
      requires_claim_audit_review: decision.requires_claim_audit_review,
      notes: decision.notes
    }));
  const invalidFiles = fileSummaries.filter(file => !file.valid).length;
  const status = files.length === 0
    ? 'no_decisions'
    : invalidFiles > 0 ? 'validation_failed'
      : missingIds.length > 0 ? 'incomplete'
        : 'valid';
  const totals = {
    decision_files: files.length,
    valid_files: validFiles.length,
    invalid_files: invalidFiles,
    valid_decisions: normalizedDecisions.length,
    queue_items: context.queueItems.size,
    missing_decisions: missingIds.length,
    stage4a_correction_candidates: correctionCandidates.length,
    errors: fileSummaries.reduce((sum, file) => sum + file.error_count, 0),
    warnings: fileSummaries.reduce((sum, file) => sum + file.warning_count, 0) + (files.length === 0 ? 1 : 0)
  };
  const normalized = {
    schema_version: 'stage4j-adjudication-decisions-normalized-1.0',
    status,
    source_schema: relative(SCHEMA_PATH),
    source_adjudication_queue: relative(QUEUE_PATH),
    decision_files: fileSummaries.map(file => file.source_file),
    totals,
    decisions: normalizedDecisions,
    missing_decision_ids: missingIds,
    stage4a_correction_candidates: correctionCandidates
  };
  const report = {
    schema_version: 'stage4j-adjudication-validation-report-1.0',
    status,
    source_schema: relative(SCHEMA_PATH),
    source_adjudication_queue: relative(QUEUE_PATH),
    source_directory: relative(ADJUDICATION_DIR),
    totals,
    missing_decision_ids: missingIds,
    files: fileSummaries
  };
  if (write) {
    writeAtomic(OUTPUT_PATHS.normalized, JSON.stringify(normalized, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(report));
    writeAtomic(OUTPUT_PATHS.correctionCandidatesJson, JSON.stringify({
      schema_version: 'stage4j-stage4a-correction-candidates-1.0',
      status: correctionCandidates.length === 0 ? 'no_candidates' : 'review_ready',
      source_normalized_decisions: relative(OUTPUT_PATHS.normalized),
      mutation_policy: 'Correction candidates are review-only and do not modify Stage 4A.',
      candidates: correctionCandidates
    }, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.correctionCandidatesCsv, makeCSV(correctionCandidates, CORRECTION_COLUMNS));
  }
  if (status === 'no_decisions') console.warn('WARN: No completed Stage 4J adjudication decision files found.');
  else if (status === 'incomplete') console.warn(`WARN: Stage 4J decisions are incomplete (${missingIds.length} queue item(s) missing).`);
  else if (status === 'validation_failed') console.error('Stage 4J adjudication decision validation failed.');
  else console.log(`Stage 4J adjudication decisions validated: ${normalizedDecisions.length}.`);
  if (write) console.log(`Stage 4J normalized decisions: ${relative(OUTPUT_PATHS.normalized)}`);
  return { normalized, report };
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  const { report } = ingest({ write: !args.includes('--check') });
  if (report.status === 'validation_failed') process.exit(1);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4J adjudication decision ingestion failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  ingest,
  parseCSV,
  parseCSVDecisions,
  semanticValidation
};
