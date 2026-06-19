const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-commands-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  fs.cpSync(path.join(ROOT, 'package.json'), path.join(workspace, 'package.json'));
  fs.mkdirSync(path.join(workspace, 'scripts'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'scripts', 'stage4m'),
    path.join(workspace, 'scripts', 'stage4m'),
    { recursive: true }
  );
  fs.cpSync(
    path.join(ROOT, 'scripts', 'schema_constants.js'),
    path.join(workspace, 'scripts', 'schema_constants.js')
  );
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'corpus', 'corpus_manifest.json'),
    path.join(workspace, 'corpus', 'corpus_manifest.json')
  );
  fs.cpSync(
    path.join(ROOT, 'corpus', 'segmented'),
    path.join(workspace, 'corpus', 'segmented'),
    { recursive: true }
  );
  const reliability = path.join(workspace, 'data', 'reliability');
  fs.mkdirSync(reliability, { recursive: true });
  for (const name of [
    'reliability-sample.json',
    'double-coding-template.csv',
    'double-coding-completed.csv',
    'adjudication-log.csv'
  ]) {
    fs.cpSync(path.join(ROOT, 'data', 'reliability', name), path.join(reliability, name));
  }
  fs.mkdirSync(path.join(reliability, 'model-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'audit'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'data', 'audit', 'claim-audit.json'),
    path.join(workspace, 'data', 'audit', 'claim-audit.json')
  );
  fs.mkdirSync(path.join(workspace, 'docs', 'methodology'), { recursive: true });
  for (const name of ['annotation-codebook.md', 'reliability-report.md']) {
    fs.cpSync(
      path.join(ROOT, 'docs', 'methodology', name),
      path.join(workspace, 'docs', 'methodology', name)
    );
  }
  return workspace;
}

function npmRun(workspace, script) {
  return spawnSync(NPM, ['run', script], {
    cwd: workspace,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_PATH: path.join(ROOT, 'node_modules'),
      STAGE4M_ROOT: workspace
    }
  });
}

test('package exposes every independent Stage 4M command and the ordered full workflow', () => {
  const scripts = require('../package.json').scripts;
  assert.equal(scripts['stage4m:packets'], 'node scripts/stage4m/generate-model-packets.js');
  assert.equal(scripts['stage4m:ingest'], 'node scripts/stage4m/ingest-model-outputs.js');
  assert.equal(scripts['stage4m:compare'], 'node scripts/stage4m/compare-model-runs.js');
  assert.equal(scripts['stage4m:disagreements'], 'node scripts/stage4m/classify-model-disagreements.js');
  assert.equal(scripts['stage4m:adjudication'], 'node scripts/stage4m/generate-adjudication-queue.js');
  assert.equal(scripts['stage4m:consensus'], 'node scripts/stage4m/generate-model-consensus-report.js');
  assert.equal(
    scripts.stage4m,
    'npm run stage4m:packets && npm run stage4m:ingest && npm run stage4m:compare && npm run stage4m:disagreements && npm run stage4m:adjudication && npm run stage4m:consensus'
  );
  assert.match(scripts.validate, /npm run validate:stage4m/);
  assert.match(scripts['validate:stage4m'], /validate-artifacts\.js/);
});

test('full Stage 4M command runs without API keys and preserves the empty-submission state', t => {
  const workspace = copyWorkspace(t);
  const envKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY'];
  const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  t.after(() => {
    for (const key of envKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
  for (const key of envKeys) delete process.env[key];

  const result = npmRun(workspace, 'stage4m');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /No Stage 4M model submissions found/);
  assert.match(result.stderr, /No validated Stage 4M model runs/);
  assert.match(result.stderr, /No validated Stage 4M model submissions are available for a consensus report/);

  const comparison = path.join(workspace, 'data', 'reliability', 'model-comparison');
  const adjudication = path.join(workspace, 'data', 'reliability', 'model-adjudication');
  const expected = [
    path.join(workspace, 'data', 'reliability', 'model-input-packets', 'model-packet-manifest.json'),
    path.join(comparison, 'normalized-model-runs.json'),
    path.join(comparison, 'model-agreement-results.json'),
    path.join(comparison, 'model-disagreement-log.json'),
    path.join(adjudication, 'stage4m-adjudication-queue.json'),
    path.join(comparison, 'model-consensus-report.json')
  ];
  assert.ok(expected.every(filePath => fs.existsSync(filePath)));
  assert.equal(JSON.parse(fs.readFileSync(expected[1], 'utf8')).status, 'no_submissions');
  assert.equal(JSON.parse(fs.readFileSync(expected[5], 'utf8')).status, 'no_submissions');

  const validation = npmRun(workspace, 'validate:stage4m');
  assert.equal(validation.status, 0, `${validation.stdout}\n${validation.stderr}`);
  assert.match(validation.stdout, /generated artifacts valid \(6\/6 present\)/);
  assert.match(validation.stderr, /Stage 4M designed but not executed/);
});

test('Stage 4M artifact validation rejects cross-file count drift', t => {
  const workspace = copyWorkspace(t);
  const run = npmRun(workspace, 'stage4m');
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);

  const queuePath = path.join(
    workspace,
    'data',
    'reliability',
    'model-adjudication',
    'stage4m-adjudication-queue.json'
  );
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  queue.totals.queue_items = 1;
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + '\n');

  const validation = npmRun(workspace, 'validate:stage4m');
  assert.notEqual(validation.status, 0);
  assert.match(validation.stderr, /Adjudication queue item count mismatch/);
});

test('Stage 4M artifact validation rejects malformed artifact fields', t => {
  const workspace = copyWorkspace(t);
  const run = npmRun(workspace, 'stage4m');
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);

  const consensusPath = path.join(
    workspace,
    'data',
    'reliability',
    'model-comparison',
    'model-consensus-report.json'
  );
  const consensus = JSON.parse(fs.readFileSync(consensusPath, 'utf8'));
  consensus.human_review_priorities = {};
  fs.writeFileSync(consensusPath, JSON.stringify(consensus, null, 2) + '\n');

  const validation = npmRun(workspace, 'validate:stage4m');
  assert.notEqual(validation.status, 0);
  assert.match(validation.stderr, /human_review_priorities.*must be an array/);
});

test('Stage 4M artifact validation rejects normalized packet identity drift', t => {
  const workspace = copyWorkspace(t);
  fs.cpSync(
    path.join(ROOT, 'tests', 'fixtures', 'stage4m', 'valid-model-output.json'),
    path.join(workspace, 'data', 'reliability', 'model-output-submissions', 'valid-model-output.json')
  );
  const run = npmRun(workspace, 'stage4m');
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);

  const normalizedPath = path.join(
    workspace,
    'data',
    'reliability',
    'model-comparison',
    'normalized-model-runs.json'
  );
  const normalized = JSON.parse(fs.readFileSync(normalizedPath, 'utf8'));
  normalized.runs[0].items[0].packet_unit_id = 'stage4m_unit_99999';
  fs.writeFileSync(normalizedPath, JSON.stringify(normalized, null, 2) + '\n');

  const validation = npmRun(workspace, 'validate:stage4m');
  assert.notEqual(validation.status, 0);
  assert.match(validation.stderr, /references unknown packet item 'stage4m_unit_99999'/);
});

test('Stage 4M validation requires generated outputs when submissions exist', t => {
  const workspace = copyWorkspace(t);
  const packets = npmRun(workspace, 'stage4m:packets');
  assert.equal(packets.status, 0, `${packets.stdout}\n${packets.stderr}`);
  fs.cpSync(
    path.join(ROOT, 'tests', 'fixtures', 'stage4m', 'valid-model-output.json'),
    path.join(workspace, 'data', 'reliability', 'model-output-submissions', 'valid-model-output.json')
  );

  const validation = npmRun(workspace, 'validate:stage4m');
  assert.notEqual(validation.status, 0);
  assert.match(validation.stderr, /generated Stage 4M artifacts are incomplete/);
  assert.match(validation.stderr, /run 'npm run stage4m'/);
});
