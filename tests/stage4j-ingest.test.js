const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4j', 'ingest-adjudication-decisions.js');
const QUEUE_RELATIVE = 'data/reliability/human-adjudication/stage4j-adjudication-queue.json';

function copyWorkspace(t, queue = baseQueue([])) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4j-ingest-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-adjudication'), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, QUEUE_RELATIVE),
    JSON.stringify(queue, null, 2) + '\n'
  );
  return workspace;
}

function runIngest(workspace, args = []) {
  return spawnSync(process.execPath, [INGEST_SCRIPT, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4J_ROOT: workspace }
  });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function outputJSON(workspace, name) {
  return readJSON(path.join(workspace, 'data', 'reliability', 'human-adjudication', name));
}

function baseQueue(items) {
  return {
    schema_version: 'stage4j-adjudication-queue-1.0',
    status: items.length === 0 ? 'no_items' : 'review_ready',
    source_disagreement_log: 'data/reliability/human-comparison/human-disagreement-log.json',
    source_human_vs_reference: 'data/reliability/human-comparison/human-vs-reference-results.json',
    source_instability_report: 'data/reliability/human-comparison/human-instability-report.md',
    packet_id: 'stage4h_fixture',
    input_packet_hash: '0'.repeat(64),
    adjudication_policy: 'Stage 4J adjudication resolves human-coder disagreements for review. It does not automatically modify Stage 4A.',
    mutation_policy: 'Queue and template records are review inputs only. Stage 4A correction candidates require a separately authorized migration.',
    decision_values: ['accept_coder_a', 'accept_coder_b', 'accept_stage4a', 'synthesize', 'mark_uncertain', 'exclude', 'defer'],
    totals: {
      queue_items: items.length,
      high_priority: items.filter(item => item.priority === 'high').length,
      medium_priority: items.filter(item => item.priority === 'medium').length,
      low_priority: items.filter(item => item.priority === 'low').length,
      agency_or_absence_items: 0,
      disease_or_purification_items: 0
    },
    items
  };
}

function queueItem(overrides = {}) {
  return {
    adjudication_id: 'stage4j_0001',
    disagreement_id: 'stage4h_disagreement_0001',
    packet_unit_id: 'stage4h_field_00001',
    priority: 'high',
    priority_reasons: ['both_humans_disagree_with_stage4a'],
    doc_id: 'doc_001',
    sentence_id: 'doc_001_s01_p01_s01',
    field_name: 'metaphor_present',
    disagreement_category: 'metaphor_identification',
    agreement_pattern: 'human_disagreement',
    coder_a_id: 'coder_a',
    coder_b_id: 'coder_b',
    coder_a_value: 'yes',
    coder_b_value: 'no',
    stage4a_reference_value: 'yes',
    affected_claim_ids: ['CLAIM-001'],
    review_question: 'Resolve metaphor presence.',
    adjudicator_decision: '',
    adjudicated_value: '',
    adjudication_rationale: '',
    codebook_change_needed: '',
    stage4a_correction_candidate: '',
    claim_audit_review_candidate: '',
    notes: '',
    ...overrides
  };
}

function decision(overrides = {}) {
  return {
    adjudication_id: 'stage4j_0001',
    doc_id: 'doc_001',
    sentence_id: 'doc_001_s01_p01_s01',
    field_name: 'metaphor_present',
    decision: 'accept_coder_a',
    adjudicated_value: 'yes',
    rationale: 'Coder A preserves the stronger metaphor reading in context.',
    codebook_change_needed: 'no',
    codebook_change_type: 'none',
    stage4a_correction_candidate: 'no',
    requires_claim_audit_review: 'no',
    adjudicator: 'adjudicator_1',
    adjudication_date: '2026-08-12',
    notes: '',
    ...overrides
  };
}

function writeDecisionJSON(workspace, decisions) {
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-decisions.json'),
    JSON.stringify({
      schema_version: 'stage4j-adjudication-decisions-1.0',
      source_adjudication_queue: QUEUE_RELATIVE,
      adjudication_batch_id: 'stage4j_batch_fixture',
      decisions
    }, null, 2) + '\n'
  );
}

test('writes no-decision artifacts when human adjudication packets are absent', t => {
  const workspace = copyWorkspace(t);
  const result = runIngest(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /No completed Stage 4J adjudication decision files/);

  const normalized = outputJSON(workspace, 'stage4j-adjudication-decisions-normalized.json');
  assert.equal(normalized.status, 'no_decisions');
  assert.equal(normalized.totals.decision_files, 0);
  assert.deepEqual(normalized.decisions, []);

  const report = fs.readFileSync(
    path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-validation-report.md'),
    'utf8'
  );
  assert.match(report, /No completed Stage 4J decision files were found/);
  assert.match(report, /does not modify Stage 4A/);

  const candidates = outputJSON(workspace, 'stage4j-stage4a-correction-candidates.json');
  assert.equal(candidates.status, 'no_candidates');
  assert.deepEqual(candidates.candidates, []);
});

test('normalizes valid JSON decisions and exports Stage 4A correction candidates separately', t => {
  const itemOne = queueItem();
  const itemTwo = queueItem({
    adjudication_id: 'stage4j_0002',
    disagreement_id: 'stage4h_disagreement_0002',
    packet_unit_id: 'stage4h_field_00002',
    priority: 'medium',
    field_name: 'source_domain',
    coder_a_value: 'inheritance',
    coder_b_value: 'property',
    stage4a_reference_value: 'inheritance'
  });
  const workspace = copyWorkspace(t, baseQueue([itemOne, itemTwo]));
  writeDecisionJSON(workspace, [
    decision(),
    decision({
      adjudication_id: 'stage4j_0002',
      field_name: 'source_domain',
      decision: 'synthesize',
      adjudicated_value: 'inheritance/property transfer',
      rationale: 'The decision records a synthesized label for review.',
      codebook_change_needed: 'yes',
      codebook_change_type: 'controlled_vocabulary',
      stage4a_correction_candidate: 'yes',
      requires_claim_audit_review: 'yes',
      notes: 'Review Stage 4A vocabulary.'
    })
  ]);

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validated: 2/);

  const normalized = outputJSON(workspace, 'stage4j-adjudication-decisions-normalized.json');
  assert.equal(normalized.status, 'valid');
  assert.equal(normalized.decisions.length, 2);
  assert.equal(normalized.stage4a_correction_candidates.length, 1);
  assert.equal(normalized.stage4a_correction_candidates[0].stage4a_reference_value, 'inheritance');

  const candidates = outputJSON(workspace, 'stage4j-stage4a-correction-candidates.json');
  assert.equal(candidates.status, 'review_ready');
  assert.match(candidates.mutation_policy, /review-only/);
  assert.equal(candidates.candidates[0].requires_claim_audit_review, 'yes');
});

test('reports missing queue decisions without failing ingestion', t => {
  const workspace = copyWorkspace(t, baseQueue([
    queueItem(),
    queueItem({ adjudication_id: 'stage4j_0002', field_name: 'source_domain' })
  ]));
  writeDecisionJSON(workspace, [decision()]);

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /incomplete \(1 queue item/);

  const normalized = outputJSON(workspace, 'stage4j-adjudication-decisions-normalized.json');
  assert.equal(normalized.status, 'incomplete');
  assert.deepEqual(normalized.missing_decision_ids, ['stage4j_0002']);
});

test('rejects invalid decision values with validation findings', t => {
  const workspace = copyWorkspace(t, baseQueue([queueItem()]));
  writeDecisionJSON(workspace, [decision({ decision: 'maybe_accept' })]);

  const result = runIngest(workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /validation failed/);

  const normalized = outputJSON(workspace, 'stage4j-adjudication-decisions-normalized.json');
  assert.equal(normalized.status, 'validation_failed');
  const report = fs.readFileSync(
    path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-validation-report.md'),
    'utf8'
  );
  assert.match(report, /schema_enum/);
});

test('rejects decisions that do not link back to queue items', t => {
  const workspace = copyWorkspace(t, baseQueue([queueItem()]));
  writeDecisionJSON(workspace, [decision({ adjudication_id: 'stage4j_9999' })]);

  const result = runIngest(workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /validation failed/);

  const normalized = outputJSON(workspace, 'stage4j-adjudication-decisions-normalized.json');
  assert.equal(normalized.status, 'validation_failed');
  assert.equal(normalized.decisions.length, 0);
  assert.equal(normalized.totals.errors, 1);
  const report = fs.readFileSync(
    path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-validation-report.md'),
    'utf8'
  );
  assert.match(report, /unknown_adjudication_id/);
});

test('ingests flattened CSV decisions using schema column metadata', t => {
  const workspace = copyWorkspace(t, baseQueue([queueItem()]));
  const columns = [
    'schema_version',
    'source_adjudication_queue',
    'adjudication_batch_id',
    'adjudication_id',
    'doc_id',
    'sentence_id',
    'field_name',
    'decision',
    'adjudicated_value',
    'rationale',
    'codebook_change_needed',
    'codebook_change_type',
    'stage4a_correction_candidate',
    'requires_claim_audit_review',
    'adjudicator',
    'adjudication_date',
    'notes'
  ];
  const values = [
    'stage4j-adjudication-decisions-1.0',
    QUEUE_RELATIVE,
    'stage4j_batch_fixture',
    'stage4j_0001',
    'doc_001',
    'doc_001_s01_p01_s01',
    'metaphor_present',
    'defer',
    '',
    'More adjudication context is needed.',
    'no',
    'none',
    'no',
    'no',
    'adjudicator_1',
    '2026-08-12',
    ''
  ];
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-adjudication-decisions.csv'),
    `${columns.join(',')}\n${values.join(',')}\n`
  );

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);
  const normalized = outputJSON(workspace, 'stage4j-adjudication-decisions-normalized.json');
  assert.equal(normalized.status, 'valid');
  assert.equal(normalized.decisions[0].decision, 'defer');
  assert.equal(normalized.decisions[0].adjudicated_value, null);
});
