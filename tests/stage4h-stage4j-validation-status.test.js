const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { stage4hStatus, stage4jStatus } = require('../scripts/pipeline_status');

const ROOT = path.resolve(__dirname, '..');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4h');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4hj-validation-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.cpSync(path.join(ROOT, 'package.json'), path.join(workspace, 'package.json'));
  fs.mkdirSync(path.join(workspace, 'scripts'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'scripts', 'stage4h'), path.join(workspace, 'scripts', 'stage4h'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'scripts', 'stage4j'), path.join(workspace, 'scripts', 'stage4j'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'scripts', 'stage4m'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'scripts', 'stage4m', 'write-guard.js'), path.join(workspace, 'scripts', 'stage4m', 'write-guard.js'));
  fs.cpSync(path.join(ROOT, 'scripts', 'schema_constants.js'), path.join(workspace, 'scripts', 'schema_constants.js'));

  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });

  const reliability = path.join(workspace, 'data', 'reliability');
  fs.mkdirSync(path.join(reliability, 'human-input-packets'), { recursive: true });
  fs.mkdirSync(path.join(reliability, 'human-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(reliability, 'human-comparison'), { recursive: true });
  fs.mkdirSync(path.join(reliability, 'human-adjudication'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'data', 'reliability', 'reliability-sample.json'), path.join(reliability, 'reliability-sample.json'));
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-sample-design.md'),
    path.join(reliability, 'human-input-packets', 'human-sample-design.md')
  );

  fs.mkdirSync(path.join(workspace, 'data', 'audit'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'data', 'audit', 'claim-audit.json'), path.join(workspace, 'data', 'audit', 'claim-audit.json'));
  fs.mkdirSync(path.join(workspace, 'docs', 'methodology'), { recursive: true });
  for (const name of ['annotation-codebook.md', 'human-coder-training-guide.md']) {
    fs.cpSync(path.join(ROOT, 'docs', 'methodology', name), path.join(workspace, 'docs', 'methodology', name));
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
      STAGE4H_ROOT: workspace,
      STAGE4J_ROOT: workspace
    }
  });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(root, parts, value) {
  const filePath = path.join(root, ...parts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
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

function decisionForQueueItem(item) {
  return {
    adjudication_id: item.adjudication_id,
    doc_id: item.doc_id,
    sentence_id: item.sentence_id,
    field_name: item.field_name,
    decision: 'accept_coder_a',
    adjudicated_value: item.coder_a_value || 'yes',
    rationale: 'Accept coder A for validation-status integration coverage.',
    codebook_change_needed: 'no',
    codebook_change_type: 'none',
    stage4a_correction_candidate: 'no',
    requires_claim_audit_review: 'no',
    adjudicator: 'adjudicator_1',
    adjudication_date: '2026-08-12',
    notes: ''
  };
}

function writeStage4jDecisionFile(workspace, decisions) {
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-decisions.json'),
    JSON.stringify({
      schema_version: 'stage4j-adjudication-decisions-1.0',
      source_adjudication_queue: 'data/reliability/human-adjudication/stage4j-adjudication-queue.json',
      adjudication_batch_id: 'stage4j_batch_validation_status',
      decisions
    }, null, 2) + '\n'
  );
}

test('package wires Stage 4H/4J validation into the project validate command', () => {
  const scripts = require('../package.json').scripts;
  assert.match(scripts.validate, /npm run validate:stage4h/);
  assert.match(scripts['validate:stage4h'], /stage4h\/validate-artifacts\.js/);
  assert.match(scripts['validate:stage4h'], /generate-human-reliability-report\.js --check/);
  assert.match(scripts['validate:stage4h'], /generate-adjudication-results\.js --check/);
  assert.match(scripts['validate:stage4h'], /generate-codebook-revision-notes\.js --check/);
});

test('status helpers report Stage 4H and Stage 4J designed, partial, complete, pending, and executed states', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4hj-status-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'data', 'reliability', 'human-output-submissions'), { recursive: true });

  writeJSON(root, ['data', 'reliability', 'human-input-packets', 'human-packet-manifest.json'], {
    status: 'packet_ready'
  });
  assert.equal(stage4hStatus(root).summary, 'Stage 4H designed but not executed');

  writeJSON(root, ['data', 'reliability', 'human-comparison', 'human-output-validation-report.json'], {
    status: 'valid',
    totals: { valid_submissions: 1, primary_coders: 1 }
  });
  assert.equal(stage4hStatus(root).summary, 'Stage 4H partially executed');

  writeJSON(root, ['data', 'reliability', 'human-comparison', 'human-reliability-report.json'], {
    status: 'complete_enough_for_metrics'
  });
  writeJSON(root, ['data', 'reliability', 'human-comparison', 'human-agreement-results.json'], {
    status: 'complete'
  });
  assert.equal(stage4hStatus(root).summary, 'Stage 4H complete enough for metrics');

  writeJSON(root, ['data', 'reliability', 'human-adjudication', 'stage4j-adjudication-queue.json'], {
    status: 'review_ready',
    totals: { queue_items: 2 }
  });
  writeJSON(root, ['data', 'reliability', 'human-adjudication', 'stage4j-adjudication-decisions-normalized.json'], {
    status: 'no_decisions',
    totals: { valid_decisions: 0, missing_decisions: 2 }
  });
  assert.equal(stage4jStatus(root).summary, 'Stage 4J adjudication pending');

  writeJSON(root, ['data', 'reliability', 'human-adjudication', 'stage4j-adjudication-decisions-normalized.json'], {
    status: 'valid',
    totals: { valid_decisions: 2, missing_decisions: 0 }
  });
  assert.equal(stage4jStatus(root).summary, 'Stage 4J adjudication executed');
});

test('Stage 4H/4J validation passes with warnings when no human submissions exist', t => {
  const workspace = copyWorkspace(t);
  const stage4h = npmRun(workspace, 'stage4h');
  assert.equal(stage4h.status, 0, `${stage4h.stdout}\n${stage4h.stderr}`);

  const validation = npmRun(workspace, 'validate:stage4h');
  assert.equal(validation.status, 0, `${validation.stdout}\n${validation.stderr}`);
  assert.match(validation.stdout, /Stage 4H\/4J generated artifacts valid \(9\/9 present\)/);
  assert.match(validation.stderr, /Stage 4H designed but not executed/);
  assert.match(validation.stderr, /Stage 4J adjudication pending/);
});

test('Stage 4H/4J validation requires generated artifacts when human submissions exist', t => {
  const workspace = copyWorkspace(t);
  const packets = npmRun(workspace, 'stage4h:packets');
  assert.equal(packets.status, 0, `${packets.stdout}\n${packets.stderr}`);
  installHumanFixture(workspace, 'valid-human-output-coder-a.json');

  const validation = npmRun(workspace, 'validate:stage4h');
  assert.notEqual(validation.status, 0);
  assert.match(validation.stderr, /Human submissions exist but generated Stage 4H\/4J artifacts are incomplete/);
  assert.match(validation.stderr, /run 'npm run stage4h'/);
});

test('Stage 4H/4J validation passes with warnings after one primary human submission is processed', t => {
  const workspace = copyWorkspace(t);
  const packets = npmRun(workspace, 'stage4h:packets');
  assert.equal(packets.status, 0, `${packets.stdout}\n${packets.stderr}`);
  installHumanFixture(workspace, 'valid-human-output-coder-a.json');

  const stage4h = npmRun(workspace, 'stage4h');
  assert.equal(stage4h.status, 0, `${stage4h.stdout}\n${stage4h.stderr}`);

  const validation = npmRun(workspace, 'validate:stage4h');
  assert.equal(validation.status, 0, `${validation.stdout}\n${validation.stderr}`);
  assert.match(validation.stderr, /Stage 4H partially executed/);
  assert.equal(stage4hStatus(workspace).summary, 'Stage 4H partially executed');
});

test('Stage 4H/4J validation accepts complete-enough human agreement artifacts', t => {
  const workspace = copyWorkspace(t);
  const packets = npmRun(workspace, 'stage4h:packets');
  assert.equal(packets.status, 0, `${packets.stdout}\n${packets.stderr}`);
  installHumanFixture(workspace, 'valid-human-output-coder-a.json');
  installHumanFixture(workspace, 'valid-human-output-coder-b.json');

  const stage4h = npmRun(workspace, 'stage4h');
  assert.equal(stage4h.status, 0, `${stage4h.stdout}\n${stage4h.stderr}`);

  const validation = npmRun(workspace, 'validate:stage4h');
  assert.equal(validation.status, 0, `${validation.stdout}\n${validation.stderr}`);
  assert.match(validation.stdout, /Stage 4H\/4J generated artifacts valid \(9\/9 present\)/);
  assert.equal(stage4hStatus(workspace).summary, 'Stage 4H complete enough for metrics');
  assert.equal(stage4jStatus(workspace).summary, 'Stage 4J adjudication pending');
});

test('Stage 4H/4J validation requires Stage 4J result pages after decisions execute', t => {
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

  const stage4h = npmRun(workspace, 'stage4h');
  assert.equal(stage4h.status, 0, `${stage4h.stdout}\n${stage4h.stderr}`);

  const queue = readJSON(path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-queue.json'));
  assert.ok(queue.items.length > 0);
  writeStage4jDecisionFile(workspace, queue.items.map(decisionForQueueItem));

  const stage4j = npmRun(workspace, 'stage4j');
  assert.equal(stage4j.status, 0, `${stage4j.stdout}\n${stage4j.stderr}`);
  assert.equal(stage4jStatus(workspace).summary, 'Stage 4J adjudication executed');
  const report = npmRun(workspace, 'stage4h:report');
  assert.equal(report.status, 0, `${report.stdout}\n${report.stderr}`);

  const validation = npmRun(workspace, 'validate:stage4h');
  assert.equal(validation.status, 0, `${validation.stdout}\n${validation.stderr}`);

  fs.rmSync(path.join(workspace, 'docs', 'methodology', 'stage4j-adjudication-results.md'));
  const missingPage = npmRun(workspace, 'validate:stage4h');
  assert.notEqual(missingPage.status, 0);
  assert.match(missingPage.stderr, /stage4j-adjudication-results\.md is required/);
});
