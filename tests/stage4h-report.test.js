const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4h');
const REPORT_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'generate-human-reliability-report.js');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'ingest-human-outputs.js');
const AGREEMENT_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'compare-human-runs.js');
const REFERENCE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'compare-human-to-reference.js');
const DISAGREE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'classify-human-disagreements.js');
const QUEUE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'generate-human-adjudication-queue.js');
const ADJUDICATION_SCRIPT = path.join(ROOT, 'scripts', 'stage4j', 'ingest-adjudication-decisions.js');

function copyMinimalWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4h-report-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-comparison'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-adjudication'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'docs', 'methodology'), { recursive: true });
  for (const name of [
    'human-agreement-results.json',
    'human-vs-reference-results.json',
    'human-disagreement-log.json'
  ]) {
    fs.cpSync(
      path.join(ROOT, 'data', 'reliability', 'human-comparison', name),
      path.join(workspace, 'data', 'reliability', 'human-comparison', name)
    );
  }
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-decisions-normalized.json'),
    path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-decisions-normalized.json')
  );
  return workspace;
}

function copyPipelineWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4h-report-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability'), { recursive: true });
  for (const name of ['human-input-packets', 'reliability-sample.json']) {
    fs.cpSync(
      path.join(ROOT, 'data', 'reliability', name),
      path.join(workspace, 'data', 'reliability', name),
      { recursive: true }
    );
  }
  fs.mkdirSync(path.join(workspace, 'data', 'audit'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'data', 'audit', 'claim-audit.json'), path.join(workspace, 'data', 'audit', 'claim-audit.json'));
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-comparison'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-adjudication'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'docs', 'methodology'), { recursive: true });
  return workspace;
}

function runScript(scriptPath, workspace, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4H_ROOT: workspace, STAGE4J_ROOT: workspace }
  });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function installFixture(workspace, name, mutate = value => value) {
  const fixture = mutate(readJSON(path.join(FIXTURE_DIR, name)));
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-output-submissions', name),
    JSON.stringify(fixture, null, 2) + '\n'
  );
}

function reportJSON(workspace) {
  return readJSON(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-reliability-report.json'));
}

test('human reliability report preserves designed-but-not-executed state', t => {
  const workspace = copyMinimalWorkspace(t);
  const result = runScript(REPORT_SCRIPT, workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /designed but not executed/);

  const report = reportJSON(workspace);
  assert.equal(report.status, 'designed_but_not_executed');
  assert.equal(report.totals.primary_human_coders, 0);
  assert.equal(report.adjudication_status, 'no_decisions');
  assert.match(report.separation_policy, /not averaged/);

  const page = fs.readFileSync(path.join(workspace, 'docs', 'methodology', 'human-reliability-results.md'), 'utf8');
  for (const section of report.required_sections) {
    assert.match(page, new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
  assert.match(page, /Coders were not shown Stage 4A reference annotations/);
  assert.match(page, /must not claim completed human inter-annotator reliability yet/);
});

test('human reliability report summarizes complete-enough fixture metrics separately from reference comparison', t => {
  const workspace = copyPipelineWorkspace(t);
  installFixture(workspace, 'valid-human-output-coder-a.json');
  installFixture(workspace, 'valid-human-output-coder-b.json', fixture => {
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
  for (const script of [INGEST_SCRIPT, AGREEMENT_SCRIPT, REFERENCE_SCRIPT, DISAGREE_SCRIPT, QUEUE_SCRIPT, ADJUDICATION_SCRIPT]) {
    const result = runScript(script, workspace);
    assert.equal(result.status, 0, result.stderr);
  }

  const result = runScript(REPORT_SCRIPT, workspace);
  assert.equal(result.status, 0, result.stderr);

  const report = reportJSON(workspace);
  assert.equal(report.status, 'complete_enough_for_metrics');
  assert.equal(report.totals.primary_human_coders, 2);
  assert.ok(report.summaries.identification);
  assert.ok(report.summaries.cmt_mapping.length > 0);
  assert.ok(report.summaries.human_vs_reference_subjects.length > 0);
  assert.match(report.separation_policy, /Human-human agreement, human-vs-Stage 4A comparison/);

  const page = fs.readFileSync(path.join(workspace, 'docs', 'methodology', 'human-reliability-results.md'), 'utf8');
  assert.match(page, /Publication materials may describe the Stage 4H study as complete enough/);
  assert.match(page, /Human-human agreement and human-vs-reference comparison are reported separately/);
});

test('human reliability report rejects stale upstream status combinations', t => {
  const workspace = copyMinimalWorkspace(t);
  const agreementPath = path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-agreement-results.json');
  const agreement = readJSON(agreementPath);
  agreement.status = 'complete';
  agreement.totals.primary_human_coders = 0;
  fs.writeFileSync(agreementPath, JSON.stringify(agreement, null, 2) + '\n');

  const result = runScript(REPORT_SCRIPT, workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /status should be no_submissions/);
});
