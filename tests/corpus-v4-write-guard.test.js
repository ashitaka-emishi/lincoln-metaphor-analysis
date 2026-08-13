const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createCorpusV4WriteGuard } = require('../scripts/corpus/write-guard');

const ROOT = path.resolve(__dirname, '..');

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-v4-write-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const directory of [
    ['corpus', 'raw'],
    ['corpus', 'segmented'],
    ['corpus', 'annotated'],
    ['data', 'evidence'],
    ['data', 'audit'],
    ['analysis'],
    ['data', 'corpus'],
    ['docs', 'corpus'],
    ['corpus', 'provenance']
  ]) {
    fs.mkdirSync(path.join(root, ...directory), { recursive: true });
  }
  return root;
}

test('v4 corpus write guard permits only explicit v4 output locations', t => {
  const root = workspace(t);
  const guard = createCorpusV4WriteGuard(root);

  for (const relativePath of [
    'corpus/raw/v4-core/doc_023.txt',
    'corpus/raw/v4-validation/doc_043.txt',
    'corpus/raw/v4-reference/doc_077.txt',
    'corpus/normalized/v4-core/doc_023.txt',
    'corpus/normalized/v4-validation/doc_043.txt',
    'corpus/segmented/v4-core/doc_023.json',
    'corpus/segmented/v4-validation/doc_043.json',
    'data/corpus/corpus-v4-ingestion-manifest.json',
    'docs/corpus/corpus-v4-coverage-report.md',
    'corpus/provenance/corpus-v4-provenance.json'
  ]) {
    assert.doesNotThrow(() => guard.assertCorpusV4WritePath(path.join(root, relativePath)), relativePath);
  }
});

test('v4 corpus write guard rejects v1 and Stage 4 protected paths', t => {
  const root = workspace(t);
  const guard = createCorpusV4WriteGuard(root);

  for (const relativePath of [
    'corpus/raw/doc_001.txt',
    'corpus/segmented/doc_001.json',
    'corpus/annotated/doc_001_annotated.json',
    'data/evidence/annotation-evidence.json',
    'data/audit/claim-audit.json',
    'analysis/analysis.json'
  ]) {
    assert.throws(
      () => guard.assertCorpusV4WritePath(path.join(root, relativePath)),
      /protected v1\/Stage 4 path/,
      relativePath
    );
  }
});

test('v4 corpus write guard resolves symlinks before allowlist checks', t => {
  const root = workspace(t);
  const guard = createCorpusV4WriteGuard(root);
  const symlink = path.join(root, 'data', 'corpus', 'claim-audit-link');
  fs.symlinkSync(path.join(root, 'data', 'audit'), symlink);

  assert.throws(
    () => guard.assertCorpusV4WritePath(path.join(symlink, 'claim-audit.json')),
    /protected v1\/Stage 4 path/
  );
});

test('v4 corpus writer scripts import the shared write guard', () => {
  const writers = [
    'create-corpus-v4-inventory.js',
    'generate-corpus-coverage-report.js',
    'generate-corpus-expansion-impact-report.js',
    'generate-reliability-sample-update.js',
    'generate-validation-light-annotation-template.js',
    'ingest-corpus-documents.js',
    'segment-corpus-v4.js',
    'validate-corpus-inventory.js',
    'validate-corpus-provenance.js',
    'validate-sentence-ids.js'
  ];

  for (const name of writers) {
    const source = fs.readFileSync(path.join(ROOT, 'scripts', 'corpus', name), 'utf8');
    assert.match(source, /require\(['"]\.\/write-guard['"]\)/, `${name} must import the shared v4 write guard`);
  }
});

test('Python v4 raw builder guards create, delete, and write paths', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts', 'corpus', 'build-v4-core-raw-texts.py'), 'utf8');
  assert.match(source, /def assert_v4_write_path/);
  assert.match(source, /assert_v4_write_path\(OUTPUT_DIR \/ "\.gitkeep"\)/);
  assert.match(source, /assert_v4_write_path\(stale_path\)/);
  assert.match(source, /assert_v4_write_path\(target\)/);
});
