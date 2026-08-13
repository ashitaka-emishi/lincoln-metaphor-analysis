const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'corpus', 'create-corpus-v4-inventory.js');
const METADATA_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-document-metadata.json');
const SCRIPT_SOURCE = fs.readFileSync(SCRIPT_PATH, 'utf8');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('v4 inventory generator check mode confirms generated files are fresh', () => {
  const output = childProcess.execFileSync('node', [SCRIPT_PATH, '--check', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  const summary = JSON.parse(output);

  assert.equal(summary.mode, 'check');
  assert.equal(summary.inventories.core, 48);
  assert.equal(summary.inventories.validation, 78);
  assert.equal(summary.inventories.reference, 18);
  assert.equal(summary.inventories.metadata, 96);
  assert.equal(summary.changed.length, 0);
  assert.ok(summary.duplicate_dates_flagged > 0);
});

test('generated v4 document metadata preserves tier membership without duplicate doc IDs', () => {
  const metadata = readJSON(METADATA_PATH);
  const docIds = metadata.documents.map(record => record.doc_id);

  assert.equal(metadata.document_count, 96);
  assert.equal(new Set(docIds).size, docIds.length);
  assert.equal(metadata.tier_counts.v1, 28);
  assert.equal(metadata.tier_counts.v4_core, 48);
  assert.equal(metadata.tier_counts.v4_validation, 78);
  assert.equal(metadata.tier_counts.v4_reference, 18);

  const preservedV1 = metadata.documents.filter(record => record.included_in_v1);
  const referenceRecords = metadata.documents.filter(record => record.included_in_v4_reference);
  assert.equal(preservedV1.length, 28);
  assert.equal(referenceRecords.every(record => record.annotation_status !== 'fully_annotated'), true);
});

test('v4 inventory generator declares only explicit v4 output paths', () => {
  assert.match(SCRIPT_SOURCE, /OUTPUT_ALLOWLIST/);
  assert.match(SCRIPT_SOURCE, /Refusing to write non-v4 corpus path/);
  assert.equal(/corpus\/annotated/.test(SCRIPT_SOURCE), false);
  assert.equal(/corpus\/segmented/.test(SCRIPT_SOURCE), false);
  assert.equal(/corpus\/raw/.test(SCRIPT_SOURCE), false);
});
