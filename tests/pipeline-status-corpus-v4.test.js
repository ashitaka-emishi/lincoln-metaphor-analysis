const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { v4CorpusStatus } = require('../scripts/pipeline_status');

const ROOT = path.resolve(__dirname, '..');

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-v4-status-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function writeJSON(root, parts, value) {
  const filePath = path.join(root, ...parts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function touch(root, parts, contents = '') {
  const filePath = path.join(root, ...parts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function inventory(count) {
  return {
    document_count: count,
    documents: Array.from({ length: count }, (_, index) => ({ doc_id: `doc_${String(index + 1).padStart(3, '0')}` }))
  };
}

function report(status = 'pass', warnings = 0, errors = 0) {
  return {
    status,
    summary: { warnings, errors }
  };
}

test('v4 corpus status reports not implemented when v4 files are absent', t => {
  const root = workspace(t);
  const status = v4CorpusStatus(root);
  assert.equal(status.summary, 'not implemented');
  assert.equal(status.validation_summary, 'pass');
  assert.equal(status.inventory_status, 'not_generated');
});

test('v4 corpus status reports drafted inventory before raw ingestion exists', t => {
  const root = workspace(t);
  writeJSON(root, ['data', 'corpus', 'corpus-v4-core-inventory.json'], inventory(48));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-validation-inventory.json'], inventory(78));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-reference-inventory.json'], inventory(18));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-inventory-validation-report.json'], report('pass', 2));

  const status = v4CorpusStatus(root);
  assert.equal(status.summary, 'inventory drafted, ingestion incomplete');
  assert.equal(status.validation_summary, 'pass_with_warnings');
  assert.equal(status.core_documents, 48);
  assert.equal(status.core_raw_files, 0);
});

test('v4 corpus status reports in-progress core corpus with warning-level missing validation raw files', t => {
  const root = workspace(t);
  writeJSON(root, ['data', 'corpus', 'corpus-v4-core-inventory.json'], inventory(48));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-validation-inventory.json'], inventory(78));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-reference-inventory.json'], inventory(18));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-inventory-validation-report.json'], report('pass', 2));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-provenance-validation-report.json'], report('pass', 4));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-ingestion-manifest.json'], {
    status: 'pass',
    summary: {
      normalized_files_written: 20,
      missing_raw_files: 30,
      warnings: 30,
      errors: 0
    }
  });
  writeJSON(root, ['data', 'corpus', 'corpus-v4-segmentation-manifest.json'], {
    status: 'pass',
    summary: { documents: 48 }
  });
  writeJSON(root, ['data', 'corpus', 'corpus-v4-sentence-id-validation-report.json'], {
    status: 'pass',
    summary: { errors: 0 }
  });
  touch(root, ['corpus', 'raw', 'v4-core', 'doc_023--sample--1860-01-01.txt'], 'Sample.\n');

  const status = v4CorpusStatus(root);
  assert.equal(status.summary, 'core corpus in progress');
  assert.equal(status.validation_summary, 'pass_with_warnings');
  assert.equal(status.ingestion_status, 'pass');
  assert.equal(status.missing_raw_files, 30);
});

test('v4 corpus status treats release-ready missing raw files as blocking', t => {
  const root = workspace(t);
  writeJSON(root, ['data', 'corpus', 'corpus-v4-release-status.json'], {
    status: 'release_candidate',
    release_ready: true
  });
  writeJSON(root, ['data', 'corpus', 'corpus-v4-core-inventory.json'], inventory(48));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-validation-inventory.json'], inventory(78));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-reference-inventory.json'], inventory(18));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-inventory-validation-report.json'], report('pass'));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-provenance-validation-report.json'], report('pass'));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-ingestion-manifest.json'], {
    status: 'pass',
    summary: {
      normalized_files_written: 20,
      missing_raw_files: 1,
      warnings: 1,
      errors: 0
    }
  });
  touch(root, ['corpus', 'raw', 'v4-core', 'doc_023--sample--1860-01-01.txt'], 'Sample.\n');

  const status = v4CorpusStatus(root);
  assert.equal(status.summary, 'release candidate');
  assert.equal(status.release_mode, true);
  assert.equal(status.validation_summary, 'fail');
});

test('v4 corpus status requires generated checks once core raw files exist', t => {
  const root = workspace(t);
  writeJSON(root, ['data', 'corpus', 'corpus-v4-core-inventory.json'], inventory(48));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-validation-inventory.json'], inventory(78));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-reference-inventory.json'], inventory(18));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-inventory-validation-report.json'], report('pass'));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-provenance-validation-report.json'], report('pass'));
  writeJSON(root, ['data', 'corpus', 'corpus-v4-ingestion-manifest.json'], {
    status: 'pass',
    summary: {
      normalized_files_written: 1,
      missing_raw_files: 0,
      warnings: 0,
      errors: 0
    }
  });
  touch(root, ['corpus', 'raw', 'v4-core', 'doc_023--sample--1860-01-01.txt'], 'Sample.\n');

  const status = v4CorpusStatus(root);
  assert.equal(status.summary, 'core corpus in progress');
  assert.equal(status.segmentation_status, 'not_generated');
  assert.equal(status.validation_summary, 'fail');
  assert.ok(status.required_status_failures > 0);
});

test('current repository reports the expected v4 corpus progress state', () => {
  const status = v4CorpusStatus(ROOT);
  assert.equal(status.summary, 'core corpus in progress');
  assert.equal(status.validation_summary, 'pass_with_warnings');
  assert.equal(status.core_documents, 48);
  assert.equal(status.validation_documents, 78);
  assert.equal(status.reference_documents, 18);
  assert.equal(status.core_raw_files, 20);
  assert.equal(status.missing_raw_files, 30);
});

test('npm status output includes the v4 corpus status section', () => {
  const result = spawnSync(process.execPath, ['scripts/pipeline_status.js'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /--- V4 Corpus Expansion ---/);
  assert.match(result.stdout, /V4 corpus status: core corpus in progress/);
  assert.match(result.stdout, /Validation: pass_with_warnings/);
});
