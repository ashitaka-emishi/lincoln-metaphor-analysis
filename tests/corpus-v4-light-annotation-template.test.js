const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'corpus', 'generate-validation-light-annotation-template.js');
const TEMPLATE_PATH = path.join(ROOT, 'data', 'corpus', 'v4-validation-light-annotation-template.csv');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'v4-validation-light-annotation.schema.json');
const DOCS_PATH = path.join(ROOT, 'docs', 'corpus', 'v4-validation-light-annotation-template.md');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseCSV(text) {
  const [header, ...rows] = text.trimEnd().split(/\r?\n/);
  return {
    headers: header.split(','),
    rows: rows.map(row => row.split(','))
  };
}

test('v4 validation light annotation generator check mode confirms generated files are fresh', () => {
  const output = childProcess.execFileSync('node', [SCRIPT_PATH, '--check', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  const result = JSON.parse(output);

  assert.equal(result.status, 'pass');
  assert.equal(result.changed, false);
  assert.equal(result.rows, 78);
  assert.deepEqual(result.columns, readJSON(SCHEMA_PATH)['x-v4-validation-light-annotation-csv'].columns);
});

test('light annotation template exposes the required issue #126 columns', () => {
  const schema = readJSON(SCHEMA_PATH);
  const csv = parseCSV(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  const expected = [
    'doc_id',
    'sentence_id',
    'metaphor_cluster_present',
    'cluster_id',
    'key_lexical_unit',
    'agency_absence_flag',
    'enslaved_people_present',
    'black_soldiers_present',
    'disease_purification_present',
    'providence_present',
    'sacrifice_present',
    'war_powers_present',
    'notes'
  ];

  assert.deepEqual(schema['x-v4-validation-light-annotation-csv'].columns, expected);
  assert.deepEqual(csv.headers, expected);
});

test('light annotation template is seeded from the v4 validation corpus without overclaiming annotation', () => {
  const validation = readJSON(path.join(ROOT, 'data', 'corpus', 'corpus-v4-validation-inventory.json'));
  const csv = parseCSV(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  const docIds = csv.rows.map(row => row[0]);

  assert.equal(csv.rows.length, validation.document_count);
  assert.deepEqual(docIds, validation.documents.map(document => document.doc_id));
  assert.ok(csv.rows.every(row => row[2] === ''));
  assert.ok(csv.rows.every(row => /not full Stage 4A annotation/.test(row.at(-1))));
});

test('light annotation schema validates positive, negative, and uncertain screening rows', () => {
  const { validateTemplate } = require('../scripts/corpus/generate-validation-light-annotation-template.js');
  const schema = readJSON(SCHEMA_PATH);
  const columns = schema['x-v4-validation-light-annotation-csv'].columns;
  const rows = parseCSV(fs.readFileSync(TEMPLATE_PATH, 'utf8')).rows;
  rows[0] = ['doc_001', 'doc_001_s01_p01_s01', 'yes', 'cluster_01_body_organism', 'body', 'no', 'no', 'no', 'no', 'uncertain', 'no', 'no', 'positive light-screen row'];
  rows[69] = ['doc_070', '', 'no', '', '', 'uncertain', 'no', 'no', 'yes', 'no', 'no', 'yes', 'negative-check light-screen row'];
  const csv = `${columns.join(',')}\n${rows.map(row => row.join(',')).join('\n')}\n`;
  const report = validateTemplate({
    validationInventory: 'data/corpus/corpus-v4-validation-inventory.json',
    schema: 'schemas/v4-validation-light-annotation.schema.json',
    template: 'data/corpus/v4-validation-light-annotation-template.csv',
    docs: 'docs/corpus/v4-validation-light-annotation-template.md'
  }, csv);

  assert.equal(report.status, 'pass');
  assert.equal(report.rows, 78);
});

test('light annotation validation rejects incomplete validation-corpus templates', () => {
  const { validateTemplate } = require('../scripts/corpus/generate-validation-light-annotation-template.js');
  const schema = readJSON(SCHEMA_PATH);
  const columns = schema['x-v4-validation-light-annotation-csv'].columns;
  const csv = `${columns.join(',')}\ndoc_001,,,,,,,,,,,,partial template row\n`;
  const report = validateTemplate({
    validationInventory: 'data/corpus/corpus-v4-validation-inventory.json',
    schema: 'schemas/v4-validation-light-annotation.schema.json',
    template: 'data/corpus/v4-validation-light-annotation-template.csv',
    docs: 'docs/corpus/v4-validation-light-annotation-template.md'
  }, csv);

  assert.equal(report.status, 'fail');
  assert.ok(report.findings.some(finding => finding.code === 'row_count_mismatch'));
});

test('light annotation docs explain the boundary from full interpretive annotation', () => {
  const docs = fs.readFileSync(DOCS_PATH, 'utf8');

  assert.match(docs, /^# V4 Validation Light Annotation Template/m);
  assert.match(docs, /not equivalent to full interpretive annotation/);
  assert.match(docs, /must not be treated as Stage 4A coded metaphor findings/);
  assert.match(docs, /Negative-Check Fields/);
  assert.match(docs, /Agency And Race Fields/);
});

test('npm validate includes the v4 validation light annotation freshness check', () => {
  const packageJson = readJSON(path.join(ROOT, 'package.json'));
  assert.equal(packageJson.scripts['corpus:v4-light-annotation'], 'node scripts/corpus/generate-validation-light-annotation-template.js');
  assert.equal(packageJson.scripts['validate:corpus-v4-light-annotation'], 'node scripts/corpus/generate-validation-light-annotation-template.js --check');
  assert.match(packageJson.scripts.validate, /validate:corpus-v4-light-annotation/);
});
