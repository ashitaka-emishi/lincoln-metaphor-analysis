#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  validationInventory: 'data/corpus/corpus-v4-validation-inventory.json',
  schema: 'schemas/v4-validation-light-annotation.schema.json',
  template: 'data/corpus/v4-validation-light-annotation-template.csv',
  docs: 'docs/corpus/v4-validation-light-annotation-template.md'
};

function absolute(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(ROOT, inputPath);
}

function displayPath(inputPath) {
  if (path.isAbsolute(inputPath)) {
    const relative = path.relative(ROOT, inputPath);
    return relative.startsWith('..') ? inputPath : relative;
  }
  return inputPath;
}

function pathIsInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function readJSON(inputPath) {
  return JSON.parse(fs.readFileSync(absolute(inputPath), 'utf8'));
}

function parseArgs(argv) {
  const options = {
    check: false,
    json: false,
    paths: { ...DEFAULT_PATHS }
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!Object.prototype.hasOwnProperty.call(options.paths, key)) {
        throw new Error(`Unknown option ${arg}`);
      }
      index += 1;
      if (!argv[index]) {
        throw new Error(`${arg} requires a path`);
      }
      options.paths[key] = argv[index];
    }
  }

  return options;
}

function assertAllowedOutput(outputPath) {
  const target = absolute(outputPath);
  if (!pathIsInside(ROOT, target)) {
    return;
  }

  const relative = path.relative(ROOT, target);
  const allowed = new Set([
    DEFAULT_PATHS.template,
    DEFAULT_PATHS.docs
  ]);
  if (!allowed.has(relative)) {
    throw new Error(`Refusing to write undeclared v4 validation light-annotation output path: ${relative}`);
  }
  if (relative.startsWith('corpus/raw/') || relative.startsWith('corpus/segmented/') || relative.startsWith('corpus/annotated/')) {
    throw new Error(`Refusing to write corpus source or annotation path: ${relative}`);
  }
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (quoted) {
    throw new Error('Unterminated quoted field in CSV input.');
  }
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...dataRows] = rows.filter(items => items.some(value => value !== ''));
  if (!headers) {
    return { headers: [], rows: [] };
  }
  return {
    headers,
    rows: dataRows.map((values, rowIndex) => {
      if (values.length !== headers.length) {
        throw new Error(`CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}.`);
      }
      return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    })
  };
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function makeCSV(rows, columns) {
  return [
    columns.join(','),
    ...rows.map(row => columns.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
}

function templateRows(validationInventory, columns) {
  return validationInventory.documents.map(document => {
    const row = Object.fromEntries(columns.map(column => [column, '']));
    row.doc_id = document.doc_id;
    row.notes = `Light annotation placeholder for ${document.short_title}; not full Stage 4A annotation.`;
    return row;
  });
}

function validateRows(schema, rows, validationInventory) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const allowedDocIds = new Set(validationInventory.documents.map(document => document.doc_id));
  const findings = [];

  rows.forEach((row, index) => {
    if (!validate(row)) {
      findings.push(...validate.errors.map(error => ({
        row: index + 2,
        code: 'schema_error',
        message: `${error.instancePath || '/'} ${error.message}`
      })));
    }
    if (!allowedDocIds.has(row.doc_id)) {
      findings.push({
        row: index + 2,
        code: 'unknown_validation_doc_id',
        message: `doc_id ${row.doc_id} is not in the v4 validation inventory`
      });
    }
    if (row.metaphor_cluster_present === 'no' && row.cluster_id) {
      findings.push({
        row: index + 2,
        code: 'cluster_for_negative_metaphor',
        message: 'cluster_id must be blank when metaphor_cluster_present is no'
      });
    }
    if (row.cluster_id && !row.metaphor_cluster_present) {
      findings.push({
        row: index + 2,
        code: 'cluster_without_presence_value',
        message: 'metaphor_cluster_present must be yes or uncertain when cluster_id is populated'
      });
    }
  });

  return findings;
}

function generatedTemplate(paths) {
  const validationInventory = readJSON(paths.validationInventory);
  const schema = readJSON(paths.schema);
  const columns = schema['x-v4-validation-light-annotation-csv'].columns;
  const rows = templateRows(validationInventory, columns);
  return {
    validationInventory,
    schema,
    columns,
    rows,
    csv: makeCSV(rows, columns)
  };
}

function validateTemplate(paths, csvText = null) {
  const generated = generatedTemplate(paths);
  const csv = parseCSV(csvText ?? generated.csv);
  const expectedColumns = generated.columns;
  const findings = [];
  if (JSON.stringify(csv.headers) !== JSON.stringify(expectedColumns)) {
    findings.push({
      row: 1,
      code: 'header_mismatch',
      message: `CSV header must match schema columns: ${expectedColumns.join(', ')}`
    });
  }
  if (csv.rows.length !== generated.validationInventory.document_count) {
    findings.push({
      row: 0,
      code: 'row_count_mismatch',
      message: `CSV contains ${csv.rows.length} data row(s); expected ${generated.validationInventory.document_count} validation-corpus document row(s)`
    });
  }
  findings.push(...validateRows(generated.schema, csv.rows, generated.validationInventory));
  return {
    status: findings.length === 0 ? 'pass' : 'fail',
    rows: csv.rows.length,
    expected_rows: generated.validationInventory.document_count,
    findings
  };
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? '').replace(/\|/g, '\\|')).join(' | ')} |`)
  ].join('\n');
}

function renderDocs(paths, validationInventory, schema, validationReport) {
  const columns = schema['x-v4-validation-light-annotation-csv'].columns;
  return [
    '# V4 Validation Light Annotation Template',
    '',
    `Generated: ${CREATED_DATE}`,
    '',
    'This template supports validation-corpus screening without full Stage 4A annotation. It records limited sentence-level signals for coverage review, negative checks, and future reliability sampling.',
    '',
    '## Files',
    '',
    table(['File', 'Role'], [
      [displayPath(paths.template), 'CSV template seeded with one placeholder row per validation-corpus document.'],
      [displayPath(paths.schema), 'Row-level schema and canonical CSV column list.']
    ]),
    '',
    '## Corpus Boundary',
    '',
    'Light annotation is not equivalent to full interpretive annotation. These rows must not be treated as Stage 4A coded metaphor findings, adjudicated reliability data, or final evidence for interpretive claims.',
    '',
    '## Columns',
    '',
    table(['Column', 'Purpose'], columns.map(column => [column, columnPurpose(column)])),
    '',
    '## Validation',
    '',
    table(['Measure', 'Value'], [
      ['Validation status', validationReport.status],
      ['Template rows', validationReport.rows],
      ['Validation inventory documents', validationReport.expected_rows]
    ]),
    '',
    '## Negative-Check Fields',
    '',
    'The template includes `agency_absence_flag`, `disease_purification_present`, `providence_present`, `sacrifice_present`, and `war_powers_present` so validation-corpus review can record both positive signals and negative-check evidence.',
    '',
    '## Agency And Race Fields',
    '',
    'The template includes `enslaved_people_present` and `black_soldiers_present` so race and agency coverage can be checked separately from full metaphor interpretation.'
  ].join('\n').trimEnd() + '\n';
}

function columnPurpose(column) {
  const purposes = {
    doc_id: 'Validation-corpus document ID.',
    sentence_id: 'Stable sentence ID when available; blank in the generated placeholder rows.',
    metaphor_cluster_present: 'Light yes/no/uncertain screen for any project metaphor cluster.',
    cluster_id: 'Optional cluster ID for a present or uncertain metaphor signal.',
    key_lexical_unit: 'Optional lexical cue; not a fully adjudicated metaphor span.',
    agency_absence_flag: 'Light screen for agency/absence relevance.',
    enslaved_people_present: 'Light screen for enslaved-people references.',
    black_soldiers_present: 'Light screen for Black soldier references.',
    disease_purification_present: 'Negative-check screen for disease/purification language.',
    providence_present: 'Light screen for providence language.',
    sacrifice_present: 'Light screen for sacrifice/mourning language.',
    war_powers_present: 'Light screen for war-powers language.',
    notes: 'Free-text reviewer notes.'
  };
  return purposes[column] || '';
}

function writeOutput(outputPath, contents, options) {
  assertAllowedOutput(outputPath);
  const target = absolute(outputPath);
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${displayPath(outputPath)} is stale; rerun scripts/corpus/generate-validation-light-annotation-template.js`);
    }
    return false;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
  return existing !== contents;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const generated = generatedTemplate(options.paths);
  const validationReport = validateTemplate(options.paths, generated.csv);
  if (validationReport.status !== 'pass') {
    throw new Error(`Generated template failed validation: ${JSON.stringify(validationReport.findings, null, 2)}`);
  }
  const docs = renderDocs(options.paths, generated.validationInventory, generated.schema, validationReport);
  const changed = [
    writeOutput(options.paths.template, generated.csv, options),
    writeOutput(options.paths.docs, docs, options)
  ].some(Boolean);

  if (options.json) {
    console.log(JSON.stringify({
      status: validationReport.status,
      changed,
      rows: validationReport.rows,
      columns: generated.columns
    }, null, 2));
  } else {
    console.log(`V4 validation light annotation template: ${validationReport.status}`);
    console.log(`Rows: ${validationReport.rows}; columns: ${generated.columns.length}`);
    console.log(`${options.check ? 'Checked' : 'Wrote'} ${displayPath(options.paths.template)} and ${displayPath(options.paths.docs)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseCSV,
  validateTemplate,
  renderDocs,
  parseArgs
};
