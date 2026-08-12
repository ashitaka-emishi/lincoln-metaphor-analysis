#!/usr/bin/env node
// Validates and normalizes untrusted Stage 4H human coder submissions.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');
const { writeAtomic } = require('./write-guard');

const ROOT = process.env.STAGE4H_ROOT
  ? path.resolve(process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');
const SUBMISSION_DIR = path.join(ROOT, 'data', 'reliability', 'human-output-submissions');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'human-comparison');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'stage4h-human-output.schema.json');
const MANIFEST_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-packet-manifest.json');
const SENTENCE_PACKET_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-sentence-identification-packet.jsonl');
const FIELD_PACKET_PATH = path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-field-agreement-packet.jsonl');
const CORPUS_MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');
const SEGMENTED_DIR = path.join(ROOT, 'corpus', 'segmented');

const OUTPUT_PATHS = Object.freeze({
  normalized: path.join(OUTPUT_DIR, 'normalized-human-runs.json'),
  report: path.join(OUTPUT_DIR, 'human-output-validation-report.json'),
  markdown: path.join(OUTPUT_DIR, 'human-output-validation-report.md')
});

const PRIMARY_CODER_IDS = new Set(['human_coder_a', 'human_coder_b']);
const VIOLENCE_LOGIC_VALUES = new Set([
  'restorative',
  'generative',
  'punitive',
  'purifying',
  'evidentiary',
  'obligatory'
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
  return text.split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`${relative(filePath)} line ${index + 1}: ${error.message}`);
    }
  });
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
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
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('Unterminated quoted CSV field.');
  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter(values => values.some(value => value !== ''));
}

function parseCSVSubmission(filePath, schema) {
  const rows = parseCSV(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('CSV must contain a header and at least one data row.');

  const headers = rows[0];
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicates.length > 0) throw new Error(`Duplicate CSV column(s): ${[...new Set(duplicates)].join(', ')}.`);

  const mapping = schema['x-stage4h-csv'];
  const expected = [...mapping.metadata_columns, ...mapping.item_columns];
  const missing = expected.filter(column => !headers.includes(column));
  const extra = headers.filter(column => !expected.includes(column));
  if (missing.length > 0 || extra.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(', ')}` : null,
      extra.length > 0 ? `unexpected: ${extra.join(', ')}` : null
    ].filter(Boolean).join('; ');
    throw new Error(`CSV columns do not match the Stage 4H schema (${details}).`);
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
        throw new Error(`CSV row ${rowIndex + 2} has inconsistent submission metadata in '${column}'.`);
      }
    }
  }

  const nullableStrings = new Set([
    'span_id',
    'lexical_unit',
    'basic_meaning',
    'contextual_meaning',
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
    'absence_flag',
    'rival_reading'
  ]);
  const integerFields = new Set(['lexical_unit_start', 'lexical_unit_end']);
  const booleanMetadata = new Set(['training_completed']);
  const convertItem = record => Object.fromEntries(mapping.item_columns.map(column => {
    const value = record[column];
    if (nullableStrings.has(column)) return [column, value === '' ? null : value];
    if (integerFields.has(column)) {
      if (value === '') return [column, null];
      return /^-?\d+$/.test(value) ? [column, Number(value)] : [column, value];
    }
    return [column, value];
  }));

  return {
    ...Object.fromEntries(Object.entries(metadata).map(([key, value]) => {
      if (booleanMetadata.has(key)) {
        if (value === 'true') return [key, true];
        if (value === 'false') return [key, false];
      }
      return [key, value];
    })),
    items: records.map(convertItem)
  };
}

function schemaMessage(error) {
  if (error.keyword === 'required') return `Missing required field '${error.params.missingProperty}'.`;
  if (error.keyword === 'additionalProperties') return `Unexpected field '${error.params.additionalProperty}'.`;
  if (error.keyword === 'enum') return `Invalid label; expected one of ${error.params.allowedValues.join(', ')}.`;
  if (error.keyword === 'const') return `Invalid value; expected '${error.params.allowedValue}'.`;
  return `${error.message[0].toUpperCase()}${error.message.slice(1)}.`;
}

function addFinding(result, severity, code, location, message) {
  result.findings.push({ severity, code, location, message });
}

function buildCanonicalSentenceIndex(documentIds) {
  const index = new Map();
  for (const documentId of documentIds) {
    const filePath = path.join(SEGMENTED_DIR, `${documentId}.json`);
    if (!fs.existsSync(filePath)) throw new Error(`Missing canonical segmented file: ${relative(filePath)}`);
    const segmented = readJSON(filePath);
    const sentenceIds = new Set();
    for (const section of segmented.sections || []) {
      for (const paragraph of section.paragraphs || []) {
        for (const sentence of paragraph.sentences || []) sentenceIds.add(sentence.sentence_id);
      }
    }
    index.set(documentId, sentenceIds);
  }
  return index;
}

function responseKey(item) {
  return [
    item.packet_unit_id,
    item.span_id || '',
    item.lexical_unit || '',
    item.lexical_unit_start === null || item.lexical_unit_start === undefined ? '' : item.lexical_unit_start,
    item.lexical_unit_end === null || item.lexical_unit_end === undefined ? '' : item.lexical_unit_end
  ].join('\u001f');
}

function semanticValidation(result, submission, context) {
  if (!submission || typeof submission !== 'object' || Array.isArray(submission)) return;

  if (submission.input_packet_id !== context.manifest.packet_id) {
    addFinding(result, 'error', 'packet_id_mismatch', '/input_packet_id',
      `Expected '${context.manifest.packet_id}', received '${submission.input_packet_id}'.`);
  }
  if (submission.input_packet_hash !== context.manifest.input_packet_hash) {
    addFinding(result, 'error', 'packet_hash_mismatch', '/input_packet_hash',
      'The submission was produced from a different Stage 4H input packet hash.');
  }
  if (submission.training_completed !== true) {
    addFinding(result, 'warning', 'training_not_confirmed', '/training_completed',
      'The coder did not confirm training completion.');
  }

  const seenResponseKeys = new Set();
  const packetCoverage = new Map();
  for (const [index, item] of (Array.isArray(submission.items) ? submission.items : []).entries()) {
    const location = `/items/${index}`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

    if (!context.documentIds.has(item.doc_id)) {
      addFinding(result, 'error', 'unknown_doc_id', `${location}/doc_id`,
        `Unknown corpus document '${item.doc_id}'.`);
    }
    const sentenceIds = context.sentenceIds.get(item.doc_id);
    if (!sentenceIds || !sentenceIds.has(item.sentence_id)) {
      addFinding(result, 'error', 'unknown_sentence_id', `${location}/sentence_id`,
        `Sentence '${item.sentence_id}' does not exist in document '${item.doc_id}'.`);
    }

    const packetUnit = context.packetUnits.get(item.packet_unit_id);
    if (!packetUnit) {
      addFinding(result, 'error', 'unknown_packet_item', `${location}/packet_unit_id`,
        `Response '${item.packet_unit_id}' does not map to a known Stage 4H packet item.`);
      continue;
    }

    if (packetUnit.packet_type !== item.task_type) {
      addFinding(result, 'error', 'packet_task_mismatch', `${location}/task_type`,
        `Packet item '${item.packet_unit_id}' has task type '${packetUnit.packet_type}', not '${item.task_type}'.`);
    }
    if (packetUnit.document_id !== item.doc_id) {
      addFinding(result, 'error', 'packet_document_mismatch', `${location}/doc_id`,
        `Packet item '${item.packet_unit_id}' belongs to '${packetUnit.document_id}', not '${item.doc_id}'.`);
    }
    if (packetUnit.sentence_id !== item.sentence_id) {
      addFinding(result, 'error', 'packet_sentence_mismatch', `${location}/sentence_id`,
        `Packet item '${item.packet_unit_id}' belongs to sentence '${packetUnit.sentence_id}'.`);
    }

    if (!packetCoverage.has(item.packet_unit_id)) packetCoverage.set(item.packet_unit_id, []);
    packetCoverage.get(item.packet_unit_id).push({ item, location, packetUnit });

    const key = responseKey(item);
    if (seenResponseKeys.has(key)) {
      addFinding(result, 'error', 'duplicate_item_response', `${location}/packet_unit_id`,
        `Duplicate response row for '${item.packet_unit_id}' with the same span and lexical unit.`);
    }
    seenResponseKeys.add(key);

    if (item.out_of_scope === 'yes' && String(item.coder_comment || '').trim() === '') {
      addFinding(result, 'error', 'missing_out_of_scope_reason', `${location}/coder_comment`,
        'Out-of-scope items must include a reason in coder_comment.');
    }
    if (item.lexical_unit_start !== null && item.lexical_unit_end !== null && item.lexical_unit_end < item.lexical_unit_start) {
      addFinding(result, 'error', 'invalid_lexical_offsets', `${location}/lexical_unit_end`,
        'lexical_unit_end must be greater than or equal to lexical_unit_start.');
    }
    if (item.violence_logic !== null) {
      const values = String(item.violence_logic).split('|').map(value => value.trim()).filter(Boolean);
      const invalid = values.filter(value => !VIOLENCE_LOGIC_VALUES.has(value));
      if (invalid.length > 0) {
        addFinding(result, 'error', 'invalid_violence_logic', `${location}/violence_logic`,
          `Invalid violence_logic value(s): ${invalid.join(', ')}.`);
      }
    }
  }

  for (const [packetUnitId, responses] of packetCoverage.entries()) {
    const packetUnit = responses[0].packetUnit;
    if (packetUnit.packet_type === 'field_agreement' && responses.length > 1) {
      for (const response of responses.slice(1)) {
        addFinding(result, 'error', 'duplicate_field_agreement_response', `${response.location}/packet_unit_id`,
          `Field-agreement item '${packetUnitId}' must have exactly one response.`);
      }
    }
  }

  const missingCount = context.packetUnits.size - packetCoverage.size;
  if (missingCount > 0) {
    addFinding(result, 'warning', 'incomplete_packet_coverage', '/items',
      `${missingCount} of ${context.packetUnits.size} packet items have no response in this submission.`);
  }
}

function normalizeSubmission(result) {
  const coderKind = PRIMARY_CODER_IDS.has(result.submission.coder_id) ? 'primary' : 'supplemental';
  return {
    source_file: result.source_file,
    source_format: result.source_format,
    source_sha256: result.source_sha256,
    submission_id: result.submission.submission_id,
    coder_id: result.submission.coder_id,
    coder_kind: coderKind,
    coder_role: result.submission.coder_role,
    submission_date: result.submission.submission_date,
    input_packet_id: result.submission.input_packet_id,
    input_packet_hash: result.submission.input_packet_hash,
    training_completed: result.submission.training_completed,
    conflict_disclosure: result.submission.conflict_disclosure,
    notes: result.submission.notes,
    items: result.submission.items.map(item => ({ ...item }))
  };
}

function markdownEscape(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function renderMarkdown(report) {
  const lines = [
    '# Stage 4H Human-Output Validation Report',
    '',
    `Status: **${report.status.replaceAll('_', ' ')}**`,
    '',
    `Packet: \`${report.packet_id}\``,
    '',
    `Submissions: ${report.totals.submission_files}; valid: ${report.totals.valid_submissions}; invalid: ${report.totals.invalid_submissions}; primary coders: ${report.totals.primary_coders}; supplemental coders: ${report.totals.supplemental_coders}; input items: ${report.totals.input_items}; normalized items: ${report.totals.normalized_items}.`,
    ''
  ];

  if (report.files.length === 0) {
    lines.push('No human-output submissions were found. Stage 4H is designed but not executed.', '');
    return lines.join('\n').trimEnd() + '\n';
  }

  if (report.status === 'partial_execution') {
    lines.push('Only one primary human coder submission is currently valid. Stage 4H is partially executed; human-human agreement metrics require two primary coders.', '');
  }

  lines.push('| Submission | Format | Coder | Kind | Result | Items | Errors | Warnings |', '| --- | --- | --- | --- | --- | ---: | ---: | ---: |');
  for (const file of report.files) {
    lines.push(`| ${markdownEscape(file.source_file)} | ${file.source_format} | ${markdownEscape(file.coder_id || 'n/a')} | ${file.coder_kind || 'n/a'} | ${file.valid ? 'valid' : 'invalid'} | ${file.input_items} | ${file.error_count} | ${file.warning_count} |`);
  }
  lines.push('');

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
  return lines.join('\n').trimEnd() + '\n';
}

function loadContext() {
  const schema = readJSON(SCHEMA_PATH);
  const manifest = readJSON(MANIFEST_PATH);
  for (const output of manifest.outputs || []) {
    const filePath = path.resolve(ROOT, output.path);
    if (!filePath.startsWith(path.resolve(ROOT) + path.sep)) {
      throw new Error(`Packet manifest references a path outside the repository: ${output.path}`);
    }
    if (!fs.existsSync(filePath)) throw new Error(`Packet manifest output is missing: ${output.path}`);
    if (sha256(filePath) !== output.sha256) throw new Error(`Packet manifest hash mismatch for ${output.path}.`);
  }
  const schemaSource = (manifest.source_files || []).find(source => source.path === relative(SCHEMA_PATH));
  if (!schemaSource) throw new Error('Packet manifest does not record the Stage 4H human-output schema source.');
  if (sha256(SCHEMA_PATH) !== schemaSource.sha256) throw new Error(`Packet manifest hash mismatch for ${relative(SCHEMA_PATH)}.`);

  const corpusManifest = readJSON(CORPUS_MANIFEST_PATH);
  const documentIds = new Set((corpusManifest.documents || []).map(document => document.id));
  const sentenceIds = buildCanonicalSentenceIndex(documentIds);
  const packetRecords = [...readJSONL(SENTENCE_PACKET_PATH), ...readJSONL(FIELD_PACKET_PATH)];
  const packetUnits = new Map(packetRecords.map(record => [record.packet_unit_id, record]));
  if (packetUnits.size !== packetRecords.length) throw new Error('Stage 4H packet files contain duplicate packet_unit_id values.');

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return { schema, manifest, documentIds, sentenceIds, packetUnits, validate: ajv.compile(schema) };
}

function ingest({ write }) {
  const context = loadContext();
  const submissionFiles = fs.existsSync(SUBMISSION_DIR)
    ? fs.readdirSync(SUBMISSION_DIR, { withFileTypes: true })
      .filter(entry => entry.isFile() && !entry.name.startsWith('.') && ['.json', '.csv'].includes(path.extname(entry.name).toLowerCase()))
      .map(entry => entry.name)
      .sort()
      .map(name => path.join(SUBMISSION_DIR, name))
    : [];

  const results = submissionFiles.map(filePath => {
    const sourceFormat = path.extname(filePath).slice(1).toLowerCase();
    const result = {
      source_file: relative(filePath),
      source_format: sourceFormat,
      source_sha256: sha256(filePath),
      submission: null,
      findings: []
    };
    try {
      result.submission = sourceFormat === 'json'
        ? readJSON(filePath)
        : parseCSVSubmission(filePath, context.schema);
    } catch (error) {
      addFinding(result, 'error', 'parse_error', '/', error.message);
      return result;
    }

    if (!context.validate(result.submission)) {
      for (const error of context.validate.errors || []) {
        addFinding(result, 'error', `schema_${error.keyword}`, error.instancePath || '/', schemaMessage(error));
      }
    }
    semanticValidation(result, result.submission, context);
    return result;
  });

  const bySubmissionId = new Map();
  const byPrimaryCoder = new Map();
  for (const result of results) {
    const submissionId = result.submission && result.submission.submission_id;
    if (typeof submissionId === 'string' && submissionId !== '') {
      if (!bySubmissionId.has(submissionId)) bySubmissionId.set(submissionId, []);
      bySubmissionId.get(submissionId).push(result);
    }
    const coderId = result.submission && result.submission.coder_id;
    if (PRIMARY_CODER_IDS.has(coderId)) {
      if (!byPrimaryCoder.has(coderId)) byPrimaryCoder.set(coderId, []);
      byPrimaryCoder.get(coderId).push(result);
    }
  }
  for (const [submissionId, duplicates] of bySubmissionId) {
    if (duplicates.length < 2) continue;
    for (const result of duplicates) {
      addFinding(result, 'error', 'duplicate_submission_id', '/submission_id',
        `Submission ID '${submissionId}' appears in ${duplicates.length} submission files.`);
    }
  }
  for (const [coderId, duplicates] of byPrimaryCoder) {
    if (duplicates.length < 2) continue;
    for (const result of duplicates) {
      addFinding(result, 'error', 'duplicate_primary_coder_submission', '/coder_id',
        `Primary coder '${coderId}' appears in ${duplicates.length} submission files.`);
    }
  }

  const files = results.map(result => {
    const errorCount = result.findings.filter(finding => finding.severity === 'error').length;
    const warningCount = result.findings.filter(finding => finding.severity === 'warning').length;
    const coderId = result.submission && typeof result.submission.coder_id === 'string' ? result.submission.coder_id : null;
    const coderKind = coderId && PRIMARY_CODER_IDS.has(coderId) ? 'primary' : coderId ? 'supplemental' : null;
    return {
      source_file: result.source_file,
      source_format: result.source_format,
      source_sha256: result.source_sha256,
      submission_id: result.submission && typeof result.submission.submission_id === 'string' ? result.submission.submission_id : null,
      coder_id: coderId,
      coder_kind: coderKind,
      valid: errorCount === 0,
      input_items: result.submission && Array.isArray(result.submission.items) ? result.submission.items.length : 0,
      normalized_items: errorCount === 0 && result.submission && Array.isArray(result.submission.items) ? result.submission.items.length : 0,
      error_count: errorCount,
      warning_count: warningCount,
      findings: result.findings
    };
  });
  const validResults = results.filter((result, index) => files[index].valid);
  const normalizedSubmissions = validResults.map(normalizeSubmission)
    .sort((left, right) => left.coder_id.localeCompare(right.coder_id) || left.submission_id.localeCompare(right.submission_id));
  const invalidSubmissions = files.filter(file => !file.valid).length;
  const primaryCoders = new Set(normalizedSubmissions.filter(run => run.coder_kind === 'primary').map(run => run.coder_id));
  const supplementalCoders = new Set(normalizedSubmissions.filter(run => run.coder_kind === 'supplemental').map(run => run.coder_id));
  const status = submissionFiles.length === 0
    ? 'no_submissions'
    : invalidSubmissions > 0
      ? 'validation_failed'
      : primaryCoders.size < 2
        ? 'partial_execution'
        : 'valid';
  const totals = {
    submission_files: files.length,
    valid_submissions: normalizedSubmissions.length,
    invalid_submissions: invalidSubmissions,
    primary_coders: primaryCoders.size,
    supplemental_coders: supplementalCoders.size,
    input_items: files.reduce((sum, file) => sum + file.input_items, 0),
    normalized_items: normalizedSubmissions.reduce((sum, run) => sum + run.items.length, 0),
    errors: files.reduce((sum, file) => sum + file.error_count, 0),
    warnings: files.reduce((sum, file) => sum + file.warning_count, 0) + (submissionFiles.length === 0 ? 1 : 0)
  };
  const normalized = {
    schema_version: 'stage4h-normalized-human-runs-1.0',
    status,
    source_schema: relative(SCHEMA_PATH),
    packet_id: context.manifest.packet_id,
    input_packet_hash: context.manifest.input_packet_hash,
    submissions: normalizedSubmissions
  };
  const report = {
    schema_version: 'stage4h-human-output-validation-report-1.0',
    status,
    source_directory: relative(SUBMISSION_DIR),
    source_schema: relative(SCHEMA_PATH),
    packet_id: context.manifest.packet_id,
    input_packet_hash: context.manifest.input_packet_hash,
    totals,
    files
  };

  if (write) {
    writeAtomic(OUTPUT_PATHS.normalized, JSON.stringify(normalized, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.report, JSON.stringify(report, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(report));
  }

  if (status === 'no_submissions') {
    console.warn(`WARN: No Stage 4H human submissions found in ${relative(SUBMISSION_DIR)}.`);
  } else {
    console.log(`Stage 4H submissions: ${totals.submission_files}; valid: ${totals.valid_submissions}; invalid: ${totals.invalid_submissions}; primary coders: ${totals.primary_coders}.`);
  }
  if (write) console.log(`Validation report: ${relative(OUTPUT_PATHS.markdown)}`);
  if (invalidSubmissions > 0) {
    for (const file of files.filter(entry => !entry.valid)) {
      for (const finding of file.findings.filter(entry => entry.severity === 'error')) {
        console.error(`ERROR [${file.source_file}${finding.location}]: ${finding.message}`);
      }
    }
    process.exitCode = 1;
  }
  return { normalized, report };
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--check');
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  ingest({ write: !args.includes('--check') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Stage 4H ingestion failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { ingest, parseCSVSubmission };
