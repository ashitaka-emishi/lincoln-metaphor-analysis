const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'corpus', 'ingest-corpus-documents.js');
const MANIFEST_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-ingestion-manifest.json');
const CORE_NORMALIZED_DIR = path.join(ROOT, 'corpus', 'normalized', 'v4-core');
const VALIDATION_NORMALIZED_DIR = path.join(ROOT, 'corpus', 'normalized', 'v4-validation');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function inventory(documents) {
  return {
    inventory_id: 'test_inventory',
    corpus_version: 'v4',
    created_date: '2026-08-13',
    description: 'Test inventory.',
    source_files: [],
    document_count: documents.length,
    tier_counts: {
      v1: documents.filter(document => document.included_in_v1).length,
      v4_core: documents.filter(document => document.included_in_v4_core).length,
      v4_validation: documents.filter(document => document.included_in_v4_validation).length,
      v4_reference: 0
    },
    documents
  };
}

function document(overrides) {
  return {
    doc_id: overrides.doc_id,
    corpus_version: 'v4',
    corpus_tier: overrides.corpus_tier,
    title: overrides.title || overrides.doc_id,
    short_title: overrides.title || overrides.doc_id,
    date: overrides.date || '1860-01-01',
    date_precision: 'exact',
    year: Number((overrides.date || '1860').slice(0, 4)),
    period: 'antebellum',
    genre: 'speech',
    audience: 'public',
    rhetorical_function: ['test'],
    research_relevance: ['test'],
    source_authority: 'test',
    source_url: '',
    source_citation: 'Test citation.',
    edition_notes: 'Test edition.',
    text_status: 'complete',
    authorship_status: 'secure',
    included_in_v1: overrides.included_in_v1 || false,
    included_in_v4_core: overrides.included_in_v4_core || false,
    included_in_v4_validation: overrides.included_in_v4_validation || false,
    included_in_v4_reference: false,
    annotation_status: 'unprocessed',
    provenance_notes: 'Test note.',
    selection_rationale: 'Test rationale.'
  };
}

function runScript(args, options = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    ...options
  });
}

test('v4 ingestion manifest and normalized core outputs stay generated', () => {
  execFileSync(process.execPath, [SCRIPT, '--check'], { cwd: ROOT, stdio: 'pipe' });

  const manifest = readJSON(MANIFEST_PATH);
  assert.equal(manifest.status, 'pass');
  assert.equal(manifest.summary.expected_v4_core_raw_records, 20);
  assert.equal(manifest.summary.expected_v4_validation_raw_records, 30);
  assert.equal(manifest.summary.normalized_files_written, 20);
  assert.equal(manifest.summary.missing_raw_files, 30);
  assert.equal(manifest.summary.skipped_v1_records, 28);
  assert.equal(manifest.summary.errors, 0);

  const ingested = manifest.records.filter(record => record.status === 'ingested');
  assert.equal(ingested.length, 20);
  assert.ok(ingested.every(record => record.normalized_path.startsWith('corpus/normalized/v4-core/')));
  assert.ok(manifest.records.some(record => record.doc_id === 'doc_043' && record.status === 'missing_raw'));
  assert.ok(manifest.skipped_records.every(record => record.raw_path.startsWith('corpus/raw/doc_')));

  const normalizedFiles = fs.readdirSync(CORE_NORMALIZED_DIR).filter(file => file.endsWith('.txt'));
  assert.equal(normalizedFiles.length, 20);
  assert.ok(fs.existsSync(path.join(VALIDATION_NORMALIZED_DIR, '.gitkeep')));
});

test('v4 ingestion normalizes line endings, strips configured boilerplate, and preserves paragraphs', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-v4-ingest-'));
  const paths = {
    coreRaw: path.join(tmp, 'raw-core'),
    validationRaw: path.join(tmp, 'raw-validation'),
    coreInventory: path.join(tmp, 'core.json'),
    validationInventory: path.join(tmp, 'validation.json'),
    coreNormalized: path.join(tmp, 'normalized-core'),
    validationNormalized: path.join(tmp, 'normalized-validation'),
    manifest: path.join(tmp, 'manifest.json')
  };
  fs.mkdirSync(paths.coreRaw, { recursive: true });
  fs.writeFileSync(
    path.join(paths.coreRaw, 'doc_901--sample-text--1860-01-01.txt'),
    'Project Gutenberg sample\r\n\r\nFirst paragraph.   \r\n\r\n\r\nSecond paragraph.\r\n'
  );
  writeJSON(paths.coreInventory, inventory([
    document({
      doc_id: 'doc_901',
      corpus_tier: 'v4-core',
      included_in_v4_core: true
    })
  ]));
  writeJSON(paths.validationInventory, inventory([
    document({
      doc_id: 'doc_902',
      corpus_tier: 'v4-validation',
      included_in_v4_validation: true
    })
  ]));

  const result = runScript([
    '--coreRaw', paths.coreRaw,
    '--validationRaw', paths.validationRaw,
    '--coreInventory', paths.coreInventory,
    '--validationInventory', paths.validationInventory,
    '--coreNormalized', paths.coreNormalized,
    '--validationNormalized', paths.validationNormalized,
    '--manifest', paths.manifest
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const normalized = fs.readFileSync(
    path.join(paths.coreNormalized, 'doc_901--sample-text--1860-01-01.txt'),
    'utf8'
  );
  assert.equal(normalized, 'First paragraph.\n\nSecond paragraph.\n');

  const manifest = readJSON(paths.manifest);
  const record = manifest.records.find(item => item.doc_id === 'doc_901');
  assert.equal(record.paragraph_count, 2);
  assert.equal(record.line_endings_normalized, true);
  assert.equal(record.boilerplate_removed_lines, 1);
  assert.ok(manifest.records.some(item => item.doc_id === 'doc_902' && item.status === 'missing_raw'));
});

test('v4 ingestion reports raw files missing inventory metadata as errors', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-v4-ingest-'));
  const paths = {
    coreRaw: path.join(tmp, 'raw-core'),
    validationRaw: path.join(tmp, 'raw-validation'),
    coreInventory: path.join(tmp, 'core.json'),
    validationInventory: path.join(tmp, 'validation.json'),
    coreNormalized: path.join(tmp, 'normalized-core'),
    validationNormalized: path.join(tmp, 'normalized-validation'),
    manifest: path.join(tmp, 'manifest.json')
  };
  fs.mkdirSync(paths.coreRaw, { recursive: true });
  fs.writeFileSync(path.join(paths.coreRaw, 'doc_999--unknown--1860-01-01.txt'), 'Unknown document.\n');
  writeJSON(paths.coreInventory, inventory([]));
  writeJSON(paths.validationInventory, inventory([]));

  const result = runScript([
    '--coreRaw', paths.coreRaw,
    '--validationRaw', paths.validationRaw,
    '--coreInventory', paths.coreInventory,
    '--validationInventory', paths.validationInventory,
    '--coreNormalized', paths.coreNormalized,
    '--validationNormalized', paths.validationNormalized,
    '--manifest', paths.manifest,
    '--json'
  ]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, 'fail');
  assert.ok(output.errors.some(error => error.code === 'raw_missing_inventory_record'));
});
