const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'corpus', 'validate-corpus-inventory.js');
const REPORT_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-inventory-validation-report.json');
const CORE_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-core-inventory.json');
const VALIDATION_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-validation-inventory.json');
const REFERENCE_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-reference-inventory.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('v4 corpus inventory validator check mode confirms the report is fresh', () => {
  const output = childProcess.execFileSync('node', [SCRIPT_PATH, '--check', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  const result = JSON.parse(output);

  assert.equal(result.status, 'pass');
  assert.equal(result.summary.core_documents, 48);
  assert.equal(result.summary.validation_documents, 78);
  assert.equal(result.summary.reference_documents, 18);
  assert.equal(result.summary.errors, 0);
  assert.equal(result.report_changed, false);
});

test('v4 corpus inventory validation report is written to disk', () => {
  const report = readJSON(REPORT_PATH);

  assert.equal(report.validation_id, 'corpus_v4_inventory_validation');
  assert.equal(report.status, 'pass');
  assert.equal(report.summary.errors, 0);
  assert.ok(Array.isArray(report.warnings));
  assert.match(report.inputs.core_inventory, /corpus-v4-core-inventory\.json/);
});

test('v4 corpus inventory validator fails invalid inventory files readably', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'v4-inventory-validation-'));
  const badCorePath = path.join(tempDir, 'bad-core.json');
  const reportPath = path.join(tempDir, 'report.json');
  const badCore = readJSON(CORE_PATH);
  badCore.documents[1] = { ...badCore.documents[1], doc_id: badCore.documents[0].doc_id };
  badCore.document_count = badCore.documents.length;
  fs.writeFileSync(badCorePath, `${JSON.stringify(badCore, null, 2)}\n`);

  const result = childProcess.spawnSync('node', [
    SCRIPT_PATH,
    '--core',
    badCorePath,
    '--validation',
    VALIDATION_PATH,
    '--reference',
    REFERENCE_PATH,
    '--report',
    reportPath
  ], {
    cwd: ROOT,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Errors: [1-9]/);
  assert.match(result.stdout, /duplicate_doc_id/);
  assert.equal(readJSON(reportPath).status, 'fail');
});

test('npm validate includes the v4 corpus inventory validator', () => {
  const packageJson = readJSON(path.join(ROOT, 'package.json'));

  assert.match(packageJson.scripts.validate, /validate:corpus-v4/);
  assert.equal(packageJson.scripts['validate:corpus-v4'], 'node scripts/corpus/validate-corpus-inventory.js');
});
