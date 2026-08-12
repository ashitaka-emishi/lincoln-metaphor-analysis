const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4h');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4hj-commands-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.cpSync(path.join(ROOT, 'package.json'), path.join(workspace, 'package.json'));
  fs.mkdirSync(path.join(workspace, 'scripts'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'scripts', 'stage4h'), path.join(workspace, 'scripts', 'stage4h'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'scripts', 'stage4j'), path.join(workspace, 'scripts', 'stage4j'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'scripts', 'stage4m'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'scripts', 'stage4m', 'write-guard.js'),
    path.join(workspace, 'scripts', 'stage4m', 'write-guard.js')
  );
  fs.cpSync(path.join(ROOT, 'scripts', 'schema_constants.js'), path.join(workspace, 'scripts', 'schema_constants.js'));

  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });

  fs.mkdirSync(path.join(workspace, 'data', 'reliability'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'reliability-sample.json'),
    path.join(workspace, 'data', 'reliability', 'reliability-sample.json')
  );
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-input-packets'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-sample-design.md'),
    path.join(workspace, 'data', 'reliability', 'human-input-packets', 'human-sample-design.md')
  );
  fs.mkdirSync(path.join(workspace, 'data', 'audit'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'data', 'audit', 'claim-audit.json'), path.join(workspace, 'data', 'audit', 'claim-audit.json'));

  fs.mkdirSync(path.join(workspace, 'docs', 'methodology'), { recursive: true });
  for (const name of ['annotation-codebook.md', 'human-coder-training-guide.md']) {
    fs.cpSync(path.join(ROOT, 'docs', 'methodology', name), path.join(workspace, 'docs', 'methodology', name));
  }
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-comparison'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-adjudication'), { recursive: true });
  return workspace;
}

function npmRun(workspace, script) {
  return spawnSync(NPM, ['run', script], {
    cwd: workspace,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_PATH: path.join(ROOT, 'node_modules'),
      STAGE4H_ROOT: workspace,
      STAGE4J_ROOT: workspace
    }
  });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function packetIdentity(workspace) {
  const manifest = readJSON(path.join(workspace, 'data', 'reliability', 'human-input-packets', 'human-packet-manifest.json'));
  return {
    input_packet_id: manifest.packet_id,
    input_packet_hash: manifest.input_packet_hash
  };
}

function installHumanFixture(workspace, fixtureName, mutate = value => value) {
  const fixture = mutate({
    ...readJSON(path.join(FIXTURE_DIR, fixtureName)),
    ...packetIdentity(workspace)
  });
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-output-submissions', fixtureName),
    JSON.stringify(fixture, null, 2) + '\n'
  );
}

function humanReport(workspace) {
  return readJSON(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-reliability-report.json'));
}

test('package exposes Stage 4H and Stage 4J independent commands and ordered workflows', () => {
  const scripts = require('../package.json').scripts;
  assert.equal(scripts['stage4h:packets'], 'node scripts/stage4h/generate-human-packets.js');
  assert.equal(scripts['stage4h:ingest'], 'node scripts/stage4h/ingest-human-outputs.js');
  assert.equal(scripts['stage4h:compare'], 'node scripts/stage4h/compare-human-runs.js');
  assert.equal(scripts['stage4h:reference'], 'node scripts/stage4h/compare-human-to-reference.js');
  assert.equal(scripts['stage4h:disagreements'], 'node scripts/stage4h/classify-human-disagreements.js');
  assert.equal(scripts['stage4h:adjudication-queue'], 'node scripts/stage4h/generate-human-adjudication-queue.js');
  assert.equal(scripts['stage4h:report'], 'node scripts/stage4h/generate-human-reliability-report.js');
  assert.equal(
    scripts.stage4h,
    'npm run stage4h:packets && npm run stage4h:ingest && npm run stage4h:compare && npm run stage4h:reference && npm run stage4h:disagreements && npm run stage4h:adjudication-queue && npm run stage4j:ingest && npm run stage4h:report'
  );
  assert.equal(scripts['stage4j:ingest'], 'node scripts/stage4j/ingest-adjudication-decisions.js');
  assert.equal(scripts['stage4j:results'], 'node scripts/stage4j/generate-adjudication-results.js');
  assert.equal(scripts['stage4j:codebook-notes'], 'node scripts/stage4j/generate-codebook-revision-notes.js');
  assert.equal(
    scripts.stage4j,
    'npm run stage4j:ingest && npm run stage4j:results && npm run stage4j:codebook-notes'
  );
});

test('stage4h command preserves designed-but-not-executed state without human outputs', t => {
  const workspace = copyWorkspace(t);
  const result = npmRun(workspace, 'stage4h');

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /No Stage 4H human submissions found/);
  assert.match(result.stderr, /designed but not executed/);
  const report = humanReport(workspace);
  assert.equal(report.status, 'designed_but_not_executed');
  assert.equal(report.totals.primary_human_coders, 0);
  assert.equal(readJSON(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-agreement-results.json')).status, 'no_submissions');
});

test('stage4h command reports partial execution with one primary human output', t => {
  const workspace = copyWorkspace(t);
  const packets = npmRun(workspace, 'stage4h:packets');
  assert.equal(packets.status, 0, `${packets.stdout}\n${packets.stderr}`);
  installHumanFixture(workspace, 'valid-human-output-coder-a.json');

  const result = npmRun(workspace, 'stage4h');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /partially executed/);
  const report = humanReport(workspace);
  assert.equal(report.status, 'partially_executed');
  assert.equal(report.totals.primary_human_coders, 1);
  assert.equal(readJSON(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json')).status, 'partial_execution');
});

test('stage4h command generates complete-enough metrics with two primary human outputs', t => {
  const workspace = copyWorkspace(t);
  const packets = npmRun(workspace, 'stage4h:packets');
  assert.equal(packets.status, 0, `${packets.stdout}\n${packets.stderr}`);
  installHumanFixture(workspace, 'valid-human-output-coder-a.json');
  installHumanFixture(workspace, 'valid-human-output-coder-b.json', fixture => {
    const item = fixture.items.find(entry => entry.packet_unit_id === 'stage4h_field_00001');
    item.lexical_unit = 'legal inheritors';
    item.lexical_unit_start = 62;
    item.lexical_unit_end = 78;
    item.cluster_id = 'cluster_01_body_organism';
    item.absence_flag = 'disease_purification_absent';
    item.disease_or_purification_present = 'yes';
    item.confidence = 'low';
    return fixture;
  });

  const result = npmRun(workspace, 'stage4h');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const report = humanReport(workspace);
  assert.equal(report.status, 'complete_enough_for_metrics');
  assert.equal(report.totals.primary_human_coders, 2);
  assert.ok(report.summaries.identification);
  assert.equal(readJSON(path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-queue.json')).status, 'review_ready');
});

test('stage4j command validates pending adjudication and renders result pages', t => {
  const workspace = copyWorkspace(t);
  const stage4h = npmRun(workspace, 'stage4h');
  assert.equal(stage4h.status, 0, `${stage4h.stdout}\n${stage4h.stderr}`);

  const result = npmRun(workspace, 'stage4j');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /No completed Stage 4J adjudication decision files/);
  assert.match(result.stderr, /adjudication results are pending/);

  assert.equal(readJSON(path.join(
    workspace,
    'data',
    'reliability',
    'human-adjudication',
    'stage4j-adjudication-decisions-normalized.json'
  )).status, 'no_decisions');
  assert.match(
    fs.readFileSync(path.join(workspace, 'docs', 'methodology', 'stage4j-adjudication-results.md'), 'utf8'),
    /Status: \*\*no decisions\*\*/
  );
  assert.match(
    fs.readFileSync(path.join(workspace, 'docs', 'methodology', 'stage4h-codebook-revision-notes.md'), 'utf8'),
    /designed but not executed/
  );
});
