const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'corpus', 'validate-corpus-provenance.js');
const REPORT_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-provenance-validation-report.json');
const REGISTER_PATH = path.join(ROOT, 'corpus', 'provenance', 'source-authority-register.json');
const PROVENANCE_PATH = path.join(ROOT, 'corpus', 'provenance', 'corpus-v4-provenance.json');
const CORE_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-core-inventory.json');
const VALIDATION_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-validation-inventory.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('v4 corpus provenance validator check mode confirms the report is fresh', () => {
  const output = childProcess.execFileSync('node', [SCRIPT_PATH, '--check', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  const result = JSON.parse(output);

  assert.equal(result.status, 'pass');
  assert.equal(result.summary.errors, 0);
  assert.equal(result.summary.core_documents, 48);
  assert.equal(result.summary.validation_documents, 78);
  assert.equal(result.summary.provenance_records, 78);
  assert.equal(result.report_changed, false);
});

test('v4 corpus provenance validation report is written to disk', () => {
  const report = readJSON(REPORT_PATH);

  assert.equal(report.validation_id, 'corpus_v4_provenance_validation');
  assert.equal(report.status, 'pass');
  assert.equal(report.summary.errors, 0);
  assert.ok(report.warnings.some(warning => warning.code === 'provenance_placeholder'));
});

test('v4 corpus provenance validator fails unknown source IDs readably', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'v4-provenance-validation-'));
  const badProvenancePath = path.join(tempDir, 'bad-provenance.json');
  const reportPath = path.join(tempDir, 'report.json');
  const badProvenance = readJSON(PROVENANCE_PATH);
  badProvenance.records[0] = {
    ...badProvenance.records[0],
    source_id: 'not_registered'
  };
  fs.writeFileSync(badProvenancePath, `${JSON.stringify(badProvenance, null, 2)}\n`);

  const result = childProcess.spawnSync('node', [
    SCRIPT_PATH,
    '--sourceAuthority',
    REGISTER_PATH,
    '--provenance',
    badProvenancePath,
    '--core',
    CORE_PATH,
    '--validation',
    VALIDATION_PATH,
    '--report',
    reportPath
  ], {
    cwd: ROOT,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Errors: [1-9]/);
  assert.match(result.stdout, /unknown_source_id/);
  assert.equal(readJSON(reportPath).status, 'fail');
});

test('npm validate includes the v4 corpus provenance validator', () => {
  const packageJson = readJSON(path.join(ROOT, 'package.json'));

  assert.match(packageJson.scripts.validate, /validate:corpus-provenance/);
  assert.equal(packageJson.scripts['validate:corpus-provenance'], 'node scripts/corpus/validate-corpus-provenance.js');
});
