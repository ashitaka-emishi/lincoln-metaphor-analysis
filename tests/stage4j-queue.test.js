const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const {
  buildQueue,
  priorityFor,
  questionFor
} = require('../scripts/stage4h/generate-human-adjudication-queue');

const ROOT = path.resolve(__dirname, '..');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'ingest-human-outputs.js');
const AGREEMENT_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'compare-human-runs.js');
const REFERENCE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'compare-human-to-reference.js');
const DISAGREE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'classify-human-disagreements.js');
const QUEUE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'generate-human-adjudication-queue.js');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4h');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4j-queue-'));
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
  return workspace;
}

function runScript(scriptPath, workspace, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4H_ROOT: workspace }
  });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function installJSON(workspace, fixtureName, mutate = value => value) {
  const fixture = mutate(readJSON(path.join(FIXTURE_DIR, fixtureName)));
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-output-submissions', fixtureName),
    JSON.stringify(fixture, null, 2)
  );
}

function outputJSON(workspace, name) {
  return readJSON(path.join(workspace, 'data', 'reliability', 'human-adjudication', name));
}

function runPrerequisites(workspace) {
  for (const script of [INGEST_SCRIPT, AGREEMENT_SCRIPT, REFERENCE_SCRIPT, DISAGREE_SCRIPT]) {
    const result = runScript(script, workspace);
    assert.equal(result.status, 0, result.stderr);
  }
}

test('queue command writes stable no-item artifacts without Stage 4A mutation', t => {
  const workspace = copyWorkspace(t);
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-disagreement-log.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-disagreement-log.json')
  );
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json')
  );
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-instability-report.md'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-instability-report.md')
  );

  const result = runScript(QUEUE_SCRIPT, workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /No Stage 4H disagreement records/);
  const queue = outputJSON(workspace, 'stage4j-adjudication-queue.json');
  assert.equal(queue.status, 'no_items');
  assert.equal(queue.totals.queue_items, 0);
  assert.match(queue.mutation_policy, /separately authorized migration/);
  const template = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-template.csv'), 'utf8');
  assert.match(template, /adjudicator_decision/);
  assert.match(template, /stage4a_correction_candidate/);
});

test('fixture disagreements become prioritized Stage 4J queue rows', t => {
  const workspace = copyWorkspace(t);
  installJSON(workspace, 'valid-human-output-coder-a.json');
  installJSON(workspace, 'valid-human-output-coder-b.json', fixture => {
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
  runPrerequisites(workspace);

  const result = runScript(QUEUE_SCRIPT, workspace);
  assert.equal(result.status, 0, result.stderr);
  const queue = outputJSON(workspace, 'stage4j-adjudication-queue.json');
  assert.equal(queue.status, 'review_ready');
  assert.ok(queue.totals.queue_items > 0);
  assert.ok(queue.totals.high_priority > 0);
  assert.ok(queue.totals.agency_or_absence_items > 0);
  assert.ok(queue.totals.disease_or_purification_items > 0);
  assert.deepEqual(queue.decision_values, ['accept_coder_a', 'accept_coder_b', 'accept_stage4a', 'synthesize', 'mark_uncertain', 'exclude', 'defer']);
  assert.equal(queue.items[0].priority, 'high');

  const cluster = queue.items.find(item => item.field_name === 'cluster_id');
  assert.ok(cluster);
  assert.equal(cluster.priority, 'high');
  assert.ok(cluster.priority_reasons.includes('major_synthesis_claim_affected'));
  assert.deepEqual(cluster.affected_claim_ids, ['CLAIM-004']);
  assert.match(cluster.review_question, /canonical cluster/);
  assert.equal(cluster.adjudicator_decision, '');
  assert.equal(cluster.stage4a_correction_candidate, '');

  const boundary = queue.items.find(item => item.field_name === 'lexical_unit_boundary');
  assert.ok(boundary);
  assert.equal(boundary.priority, 'high');
  assert.ok(boundary.priority_reasons.some(reason => reason.startsWith('major_document:')));
  assert.match(boundary.review_question, /lexical-unit boundary/);

  const csv = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-queue.csv'), 'utf8');
  assert.match(csv, /stage4j_0001/);
  assert.match(csv, /review_question/);
});

test('priority and question helpers cover issue #96 routing rules', () => {
  const high = priorityFor({
    agreement_pattern_flags: ['human_unanimous_against_reference'],
    field_name: 'violence_logic',
    disease_or_purification_flag: false,
    agency_or_absence_flag: false,
    major_synthesis_claim_flag: false,
    major_document_flag: false
  });
  assert.equal(high.priority, 'high');
  assert.ok(high.reasons.includes('both_humans_disagree_with_stage4a'));
  assert.ok(high.reasons.includes('violence_logic_disputed'));
  const uncertainReference = priorityFor({
    agreement_pattern_flags: ['both_humans_uncertain', 'reference_only_confident'],
    field_name: 'metaphor_present',
    disease_or_purification_flag: false,
    agency_or_absence_flag: false,
    major_synthesis_claim_flag: false,
    major_document_flag: false
  });
  assert.ok(uncertainReference.reasons.includes('both_humans_uncertain_against_confident_stage4a'));

  const medium = priorityFor({
    agreement_pattern_flags: [],
    field_name: 'source_domain',
    coder_a_value: 'inheritance',
    coder_b_value: 'property transfer',
    major_document_flag: false
  });
  assert.equal(medium.priority, 'medium');

  const low = priorityFor({
    agreement_pattern_flags: [],
    field_name: 'ambiguity_flag',
    coder_a_value: 'yes',
    coder_b_value: 'no',
    major_document_flag: false
  });
  assert.equal(low.priority, 'low');
  assert.match(questionFor({
    disagreement_category: 'agency_or_absence_flag',
    affected_claim_ids: ['CLAIM-001']
  }), /Which actor is granted, denied, displaced, or erased/);
});

test('queue rejects stale human-vs-reference packet identity', () => {
  const disagreementLog = readJSON(path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-disagreement-log.json'));
  const reference = readJSON(path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json'));
  assert.throws(
    () => buildQueue(disagreementLog, { ...reference, input_packet_hash: '0'.repeat(64) }),
    /different packet hashes/
  );
});
