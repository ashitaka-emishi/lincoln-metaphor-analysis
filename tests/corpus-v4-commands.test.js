const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const packageJson = require('../package.json');
const ROOT = path.resolve(__dirname, '..');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function writeJSON(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function inventory(documents) {
  return { documents };
}

test('package exposes v4 corpus pipeline commands', () => {
  const scripts = packageJson.scripts;
  const expectedCommands = {
    'corpus:v4:inventory': 'node scripts/corpus/create-corpus-v4-inventory.js',
    'corpus:v4:validate-inventory': 'node scripts/corpus/validate-corpus-inventory.js',
    'corpus:v4:validate-provenance': 'node scripts/corpus/validate-corpus-provenance.js',
    'corpus:v4:ingest': 'node scripts/corpus/ingest-corpus-documents.js',
    'corpus:v4:segment': 'node scripts/corpus/segment-corpus-v4.js',
    'corpus:v4:validate-sentences': 'node scripts/corpus/validate-sentence-ids.js',
    'corpus:v4:coverage': 'node scripts/corpus/generate-corpus-coverage-report.js',
    'corpus:v4:impact': 'node scripts/corpus/generate-corpus-expansion-impact-report.js',
    'corpus:v4:reliability-sample': 'node scripts/corpus/generate-reliability-sample-update.js',
    'corpus:v4:light-annotation': 'node scripts/corpus/generate-validation-light-annotation-template.js'
  };

  for (const [command, script] of Object.entries(expectedCommands)) {
    assert.equal(scripts[command], script);
  }
  assert.equal(
    scripts['corpus:v4'],
    'npm run corpus:v4:inventory && npm run corpus:v4:validate-inventory && npm run corpus:v4:validate-provenance && npm run corpus:v4:ingest && npm run corpus:v4:segment && npm run corpus:v4:validate-sentences && npm run corpus:v4:coverage && npm run corpus:v4:impact && npm run corpus:v4:reliability-sample && npm run corpus:v4:light-annotation'
  );
});

test('package preserves existing v4 corpus aliases', () => {
  const scripts = packageJson.scripts;
  assert.equal(scripts['corpus:v4-core-raw'], 'python3 scripts/corpus/build-v4-core-raw-texts.py');
  assert.equal(scripts['corpus:v4-ingest'], 'node scripts/corpus/ingest-corpus-documents.js');
  assert.equal(scripts['corpus:v4-segment'], 'node scripts/corpus/segment-corpus-v4.js');
  assert.equal(scripts['corpus:v4-coverage'], 'node scripts/corpus/generate-corpus-coverage-report.js');
  assert.equal(scripts['corpus:v4-impact'], 'node scripts/corpus/generate-corpus-expansion-impact-report.js');
  assert.equal(scripts['corpus:v4-reliability-sampling'], 'node scripts/corpus/generate-reliability-sample-update.js');
  assert.equal(scripts['corpus:v4-light-annotation'], 'node scripts/corpus/generate-validation-light-annotation-template.js');
});

test('project validation keeps v4 corpus checks wired in order', () => {
  const scripts = packageJson.scripts;
  for (const command of [
    'validate:corpus-v4',
    'validate:corpus-v4-ingestion',
    'validate:corpus-v4-segmentation',
    'validate:sentence-ids',
    'validate:corpus-v4-coverage',
    'validate:corpus-v4-impact',
    'validate:corpus-v4-reliability-sampling',
    'validate:corpus-v4-light-annotation',
    'validate:corpus-provenance'
  ]) {
    assert.match(scripts.validate, new RegExp(`npm run ${command}`));
  }
});

test('npm v4 ingestion validation fails when release mode is enabled with missing raw files', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-v4-command-release-'));
  try {
    fs.mkdirSync(path.join(workspace, 'scripts', 'corpus'), { recursive: true });
    fs.cpSync(path.join(ROOT, 'package.json'), path.join(workspace, 'package.json'));
    fs.cpSync(
      path.join(ROOT, 'scripts', 'corpus', 'ingest-corpus-documents.js'),
      path.join(workspace, 'scripts', 'corpus', 'ingest-corpus-documents.js')
    );
    fs.cpSync(
      path.join(ROOT, 'scripts', 'corpus', 'write-guard.js'),
      path.join(workspace, 'scripts', 'corpus', 'write-guard.js')
    );
    writeJSON(path.join(workspace, 'data', 'corpus', 'corpus-v4-core-inventory.json'), inventory([
      {
        doc_id: 'doc_901',
        corpus_tier: 'v4-core',
        title: 'Missing Raw Core Fixture',
        date: '1860-01-01',
        included_in_v1: false
      }
    ]));
    writeJSON(path.join(workspace, 'data', 'corpus', 'corpus-v4-validation-inventory.json'), inventory([]));

    const result = spawnSync(NPM, ['run', 'validate:corpus-v4-ingestion'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        CORPUS_V4_RELEASE_MODE: '1'
      }
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /inventory_record_missing_raw_file/);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
