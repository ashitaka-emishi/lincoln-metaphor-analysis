#!/usr/bin/env node
// Validates and normalizes untrusted Stage 4M JSON/CSV model submissions.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');
const { writeAtomic } = require('./write-guard');

const ROOT = process.env.STAGE4M_ROOT
  ? path.resolve(process.env.STAGE4M_ROOT)
  : path.resolve(__dirname, '..', '..');
const SUBMISSION_DIR = path.join(ROOT, 'data', 'reliability', 'model-output-submissions');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'model-comparison');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'stage4m-model-output.schema.json');
const MANIFEST_PATH = path.join(ROOT, 'data', 'reliability', 'model-input-packets', 'model-packet-manifest.json');
const SENTENCE_PACKET_PATH = path.join(ROOT, 'data', 'reliability', 'model-input-packets', 'model-packet-sentences.jsonl');
const FIELD_PACKET_PATH = path.join(ROOT, 'data', 'reliability', 'model-input-packets', 'model-packet-field-agreement.jsonl');
const CORPUS_MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');
const SEGMENTED_DIR = path.join(ROOT, 'corpus', 'segmented');

const OUTPUT_PATHS = Object.freeze({
  normalized: path.join(OUTPUT_DIR, 'normalized-model-runs.json'),
  report: path.join(OUTPUT_DIR, 'model-run-validation-report.json'),
  markdown: path.join(OUTPUT_DIR, 'model-run-validation-report.md')
});

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

  const mapping = schema['x-stage4m-csv'];
  const expected = [...mapping.metadata_columns, ...mapping.item_columns];
  const missing = expected.filter(column => !headers.includes(column));
  const extra = headers.filter(column => !expected.includes(column));
  if (missing.length > 0 || extra.length > 0) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(', ')}` : null,
      extra.length > 0 ? `unexpected: ${extra.join(', ')}` : null
    ].filter(Boolean).join('; ');
    throw new Error(`CSV columns do not match the Stage 4M schema (${details}).`);
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
        throw new Error(`CSV row ${rowIndex + 2} has inconsistent run metadata in '${column}'.`);
      }
    }
  }

  const nullableStrings = new Set([
    'span_id', 'lexical_unit', 'source_domain', 'target_domain', 'cluster_id',
    'koenigsberg_function', 'violence_logic', 'obligatory_frame',
    'agency_or_absence_flag', 'rival_reading'
  ]);
  const integerFields = new Set(['lexical_unit_start', 'lexical_unit_end']);
  const convertItem = record => Object.fromEntries(mapping.item_columns.map(column => {
    const value = record[column];
    if (nullableStrings.has(column)) return [column, value === '' ? null : value];
    if (integerFields.has(column)) {
      if (value === '') return [column, null];
      return [column, /^-?\d+$/.test(value) ? Number(value) : value];
    }
    return [column, value];
  }));

  return {
    ...metadata,
    temperature: metadata.temperature === ''
      ? null
      : /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(metadata.temperature)
        ? Number(metadata.temperature)
        : metadata.temperature,
    items: records.map(convertItem)
  };
}

function schemaMessage(error) {
  if (error.keyword === 'required') {
    return `Missing required field '${error.params.missingProperty}'.`;
  }
  if (error.keyword === 'additionalProperties') {
    return `Unexpected field '${error.params.additionalProperty}'.`;
  }
  if (error.keyword === 'enum') {
    return `Invalid label; expected one of ${error.params.allowedValues.join(', ')}.`;
  }
  return `${error.message[0].toUpperCase()}${error.message.slice(1)}.`;
}

function addFinding(result, severity, code, location, message) {
  result.findings.push({ severity, code, location, message });
}

function packetUnitId(spanId) {
  if (typeof spanId !== 'string') return null;
  const match = spanId.match(/^(stage4m_unit_[0-9]{5})(?:_r[0-9]+)?$/);
  return match ? match[1] : null;
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

function semanticValidation(result, run, context) {
  if (!run || typeof run !== 'object' || Array.isArray(run)) return;

  if (run.input_packet_id !== context.manifest.packet_id) {
    addFinding(result, 'error', 'packet_id_mismatch', '/input_packet_id',
      `Expected '${context.manifest.packet_id}', received '${run.input_packet_id}'.`);
  }
  if (run.input_packet_hash !== context.manifest.model_output_contract.input_packet_hash) {
    addFinding(result, 'error', 'packet_hash_mismatch', '/input_packet_hash',
      'The submission was produced from a different input packet hash.');
  }
  if (run.prompt_hash !== context.manifest.model_output_contract.prompt_hash) {
    addFinding(result, 'error', 'prompt_hash_mismatch', '/prompt_hash',
      'The submission prompt hash does not match the packet instructions.');
  }

  const seenSpanIds = new Set();
  const coveredPacketUnits = new Set();
  for (const [index, item] of (Array.isArray(run.items) ? run.items : []).entries()) {
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

    if (typeof item.span_id === 'string') {
      if (seenSpanIds.has(item.span_id)) {
        addFinding(result, 'error', 'duplicate_item_response', `${location}/span_id`,
          `Duplicate response identifier '${item.span_id}'.`);
      }
      seenSpanIds.add(item.span_id);
    }

    const unitId = packetUnitId(item.span_id);
    const packetUnit = unitId ? context.packetUnits.get(unitId) : null;
    if (!packetUnit) {
      addFinding(result, 'error', 'unknown_packet_item', `${location}/span_id`,
        `Response '${item.span_id}' does not map to a known packet item.`);
      continue;
    }
    coveredPacketUnits.add(unitId);
    if (packetUnit.packet_type !== item.task_type) {
      addFinding(result, 'error', 'packet_task_mismatch', `${location}/task_type`,
        `Packet item '${unitId}' has task type '${packetUnit.packet_type}', not '${item.task_type}'.`);
    }
    if (packetUnit.document_id !== item.doc_id) {
      addFinding(result, 'error', 'packet_document_mismatch', `${location}/doc_id`,
        `Packet item '${unitId}' belongs to '${packetUnit.document_id}', not '${item.doc_id}'.`);
    }
    if (packetUnit.sentence_id !== item.sentence_id) {
      addFinding(result, 'error', 'packet_sentence_mismatch', `${location}/sentence_id`,
        `Packet item '${unitId}' belongs to sentence '${packetUnit.sentence_id}'.`);
    }
    if (packetUnit.packet_type === 'field_agreement' && item.span_id !== unitId) {
      addFinding(result, 'error', 'field_response_suffix', `${location}/span_id`,
        `Field-agreement item '${unitId}' must have exactly one unsuffixed response.`);
    }
  }

  const missingCount = context.packetUnits.size - coveredPacketUnits.size;
  if (missingCount > 0) {
    addFinding(result, 'warning', 'incomplete_packet_coverage', '/items',
      `${missingCount} of ${context.packetUnits.size} packet items have no response in this run.`);
  }
}

function normalizeRun(result) {
  return {
    source_file: result.source_file,
    source_format: result.source_format,
    source_sha256: result.source_sha256,
    run_id: result.run.run_id,
    model_id: result.run.model_id,
    provider: result.run.provider,
    model_name: result.run.model_name,
    model_version: result.run.model_version,
    run_date: result.run.run_date,
    operator: result.run.operator,
    input_packet_id: result.run.input_packet_id,
    input_packet_hash: result.run.input_packet_hash,
    prompt_hash: result.run.prompt_hash,
    temperature: result.run.temperature,
    notes: result.run.notes,
    items: result.run.items.map(item => ({
      packet_unit_id: packetUnitId(item.span_id),
      ...item
    }))
  };
}

function markdownEscape(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function renderMarkdown(report) {
  const lines = [
    '# Stage 4M Model-Run Validation Report',
    '',
    `Status: **${report.status.replaceAll('_', ' ')}**`,
    '',
    `Packet: \`${report.packet_id}\``,
    '',
    `Submissions: ${report.totals.submission_files}; valid runs: ${report.totals.valid_runs}; invalid runs: ${report.totals.invalid_runs}; input items: ${report.totals.input_items}; normalized items: ${report.totals.normalized_items}.`,
    ''
  ];

  if (report.files.length === 0) {
    lines.push('No model-output submissions were found. This is expected before external model review begins.', '');
    return lines.join('\n').trimEnd() + '\n';
  }

  lines.push('| Submission | Format | Result | Items | Errors | Warnings |', '| --- | --- | --- | ---: | ---: | ---: |');
  for (const file of report.files) {
    lines.push(`| ${markdownEscape(file.source_file)} | ${file.source_format} | ${file.valid ? 'valid' : 'invalid'} | ${file.input_items} | ${file.error_count} | ${file.warning_count} |`);
  }
  lines.push('');

  for (const file of report.files) {
    lines.push(`## ${file.source_file}`, '');
    if (file.findings.length === 0) {
      lines.push('No validation findings.', '');
      continue;
    }
    for (const finding of file.findings) {
      lines.push(`- **${finding.severity.toUpperCase()} — ${finding.code}** at \`${finding.location}\`: ${finding.message}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}

function loadContext() {
  const schema = readJSON(SCHEMA_PATH);
  const manifest = readJSON(MANIFEST_PATH);
  if (!manifest.model_output_contract) throw new Error('Packet manifest is missing model_output_contract.');
  for (const output of manifest.outputs || []) {
    const filePath = path.resolve(ROOT, output.path);
    if (!filePath.startsWith(path.resolve(ROOT) + path.sep)) {
      throw new Error(`Packet manifest references a path outside the repository: ${output.path}`);
    }
    if (!fs.existsSync(filePath)) throw new Error(`Packet manifest output is missing: ${output.path}`);
    if (sha256(filePath) !== output.sha256) throw new Error(`Packet manifest hash mismatch for ${output.path}.`);
  }
  const schemaSource = (manifest.source_files || []).find(source => source.path === relative(SCHEMA_PATH));
  if (!schemaSource) throw new Error('Packet manifest does not record the model-output schema source.');
  if (sha256(SCHEMA_PATH) !== schemaSource.sha256) throw new Error(`Packet manifest hash mismatch for ${relative(SCHEMA_PATH)}.`);
  const corpusManifest = readJSON(CORPUS_MANIFEST_PATH);
  const documentIds = new Set((corpusManifest.documents || []).map(document => document.id));
  const sentenceIds = buildCanonicalSentenceIndex(documentIds);
  const packetRecords = [...readJSONL(SENTENCE_PACKET_PATH), ...readJSONL(FIELD_PACKET_PATH)];
  const packetUnits = new Map(packetRecords.map(record => [record.packet_unit_id, record]));
  if (packetUnits.size !== packetRecords.length) throw new Error('Packet files contain duplicate packet_unit_id values.');

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
      run: null,
      findings: []
    };
    try {
      result.run = sourceFormat === 'json'
        ? readJSON(filePath)
        : parseCSVSubmission(filePath, context.schema);
    } catch (error) {
      addFinding(result, 'error', 'parse_error', '/', error.message);
      return result;
    }

    if (!context.validate(result.run)) {
      for (const error of context.validate.errors || []) {
        addFinding(result, 'error', `schema_${error.keyword}`, error.instancePath || '/', schemaMessage(error));
      }
    }
    semanticValidation(result, result.run, context);
    return result;
  });

  const byRunId = new Map();
  for (const result of results) {
    const runId = result.run && result.run.run_id;
    if (typeof runId !== 'string' || runId === '') continue;
    if (!byRunId.has(runId)) byRunId.set(runId, []);
    byRunId.get(runId).push(result);
  }
  for (const [runId, duplicates] of byRunId) {
    if (duplicates.length < 2) continue;
    for (const result of duplicates) {
      addFinding(result, 'error', 'duplicate_run_id', '/run_id',
        `Run ID '${runId}' appears in ${duplicates.length} submission files.`);
    }
  }

  const files = results.map(result => {
    const errorCount = result.findings.filter(finding => finding.severity === 'error').length;
    const warningCount = result.findings.filter(finding => finding.severity === 'warning').length;
    return {
      source_file: result.source_file,
      source_format: result.source_format,
      source_sha256: result.source_sha256,
      run_id: result.run && typeof result.run.run_id === 'string' ? result.run.run_id : null,
      valid: errorCount === 0,
      input_items: result.run && Array.isArray(result.run.items) ? result.run.items.length : 0,
      normalized_items: errorCount === 0 && result.run && Array.isArray(result.run.items) ? result.run.items.length : 0,
      error_count: errorCount,
      warning_count: warningCount,
      findings: result.findings
    };
  });
  const validResults = results.filter((result, index) => files[index].valid);
  const normalizedRuns = validResults.map(normalizeRun)
    .sort((left, right) => left.run_id.localeCompare(right.run_id) || left.source_file.localeCompare(right.source_file));
  const invalidRuns = files.filter(file => !file.valid).length;
  const status = submissionFiles.length === 0
    ? 'no_submissions'
    : invalidRuns > 0 ? 'validation_failed' : 'valid';
  const totals = {
    submission_files: files.length,
    valid_runs: normalizedRuns.length,
    invalid_runs: invalidRuns,
    input_items: files.reduce((sum, file) => sum + file.input_items, 0),
    normalized_items: normalizedRuns.reduce((sum, run) => sum + run.items.length, 0),
    errors: files.reduce((sum, file) => sum + file.error_count, 0),
    warnings: files.reduce((sum, file) => sum + file.warning_count, 0) + (submissionFiles.length === 0 ? 1 : 0)
  };
  const normalized = {
    schema_version: 'stage4m-normalized-model-runs-1.0',
    status,
    source_schema: relative(SCHEMA_PATH),
    packet_id: context.manifest.packet_id,
    input_packet_hash: context.manifest.model_output_contract.input_packet_hash,
    runs: normalizedRuns
  };
  const report = {
    schema_version: 'stage4m-model-run-validation-report-1.0',
    status,
    source_directory: relative(SUBMISSION_DIR),
    source_schema: relative(SCHEMA_PATH),
    packet_id: context.manifest.packet_id,
    input_packet_hash: context.manifest.model_output_contract.input_packet_hash,
    totals,
    files
  };

  if (write) {
    writeAtomic(OUTPUT_PATHS.normalized, JSON.stringify(normalized, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.report, JSON.stringify(report, null, 2) + '\n');
    writeAtomic(OUTPUT_PATHS.markdown, renderMarkdown(report));
  }

  if (status === 'no_submissions') {
    console.warn(`WARN: No Stage 4M model submissions found in ${relative(SUBMISSION_DIR)}.`);
  } else {
    console.log(`Stage 4M submissions: ${totals.submission_files}; valid: ${totals.valid_runs}; invalid: ${totals.invalid_runs}.`);
  }
  if (write) console.log(`Validation report: ${relative(OUTPUT_PATHS.markdown)}`);
  if (invalidRuns > 0) {
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
    console.error(`Stage 4M ingestion failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { ingest, parseCSVSubmission, packetUnitId };
