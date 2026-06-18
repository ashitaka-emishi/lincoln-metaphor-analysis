const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const {
  generateQueue,
  priorityFor
} = require('../scripts/stage4m/generate-adjudication-queue');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'generate-adjudication-queue.js');

function itemResult(packetUnitId, clusterPattern = 'split_no_majority') {
  return {
    packet_unit_id: packetUnitId,
    requires_human_adjudication: false,
    field_patterns: { cluster_id: clusterPattern }
  };
}

function disagreement(overrides = {}) {
  return {
    disagreement_id: 'stage4m_disagreement_00001',
    packet_unit_id: 'stage4m_unit_00001',
    reliability_unit_id: 'rel_001',
    task_type: 'field_agreement',
    doc_id: 'doc_002',
    sentence_id: 'doc_002_s01_p01_s01',
    field_name: 'target_domain',
    disagreement_category: 'target_domain',
    agreement_pattern: 'split_no_majority',
    reference_value: 'political union',
    model_values: { model_a: 'national union', model_b: 'political union' },
    all_models_against_reference: false,
    requires_human_adjudication: false,
    ...overrides
  };
}

function modelRun(runId, modelId, items) {
  return {
    run_id: runId,
    model_id: modelId,
    provider: 'fixture-provider',
    items: items.map(item => ({
      span_id: item.packet_unit_id,
      confidence: 'medium',
      ambiguity_flag: 'no',
      rival_reading: null,
      justification: `${modelId} provides a distinct fixture rationale for human review.`,
      ...item
    }))
  };
}

function populatedInputs() {
  const disagreements = [
    disagreement({
      disagreement_id: 'stage4m_disagreement_00003',
      packet_unit_id: 'stage4m_unit_00003',
      reliability_unit_id: 'rel_003',
      doc_id: 'doc_003',
      sentence_id: 'doc_003_s01_p01_s01',
      field_name: 'ambiguity_flag',
      disagreement_category: 'ambiguity_flag',
      reference_value: 'no',
      model_values: { model_a: 'yes', model_b: 'no' }
    }),
    disagreement({
      disagreement_id: 'stage4m_disagreement_00001',
      packet_unit_id: 'stage4m_unit_00001',
      reliability_unit_id: 'rel_001',
      doc_id: 'doc_021',
      sentence_id: 'doc_021_s01_p01_s01',
      field_name: 'obligatory_frame',
      disagreement_category: 'obligatory_frame',
      reference_value: 'no',
      model_values: { model_a: 'yes', model_b: 'yes' },
      agreement_pattern: 'unanimous_against_reference',
      all_models_against_reference: true,
      requires_human_adjudication: true
    }),
    disagreement({
      disagreement_id: 'stage4m_disagreement_00002',
      packet_unit_id: 'stage4m_unit_00002',
      reliability_unit_id: 'rel_002',
      doc_id: 'doc_002',
      sentence_id: 'doc_002_s01_p01_s02',
      field_name: 'source_domain',
      disagreement_category: 'source_domain',
      reference_value: 'journey',
      model_values: { model_a: 'path', model_b: 'journey' }
    })
  ];
  const packetUnits = disagreements.map(item => ({ packet_unit_id: item.packet_unit_id }));
  return {
    disagreementLog: {
      status: 'complete',
      totals: { model_runs: 2 },
      disagreements,
      item_results: [
        itemResult('stage4m_unit_00001'),
        itemResult('stage4m_unit_00002', 'majority_with_reference'),
        itemResult('stage4m_unit_00003')
      ]
    },
    normalized: {
      status: 'complete',
      runs: [
        modelRun('run_a', 'model_a', packetUnits),
        modelRun('run_b', 'model_b', packetUnits)
      ]
    },
    sample: {
      identification_units: [],
      field_agreement_units: [
        {
          reliability_unit_id: 'rel_001',
          source_audit_id: 'inst_claim',
          sentence_text: 'With malice toward none, the work must continue.'
        },
        {
          reliability_unit_id: 'rel_002',
          source_audit_id: 'inst_other',
          sentence_text: 'The path remained uncertain.'
        },
        {
          reliability_unit_id: 'rel_003',
          source_audit_id: 'inst_other_2',
          sentence_text: 'Two readings remain possible.'
        }
      ]
    },
    claimAudit: {
      claims: [{
        claim_id: 'CLAIM-001',
        title: 'Fixture synthesis claim',
        selected_records: [{ audit_id: 'inst_claim' }]
      }]
    }
  };
}

test('queue is deterministic, complete, prioritized, and preserves per-run context', () => {
  const inputs = populatedInputs();
  const queue = generateQueue(
    inputs.disagreementLog,
    inputs.normalized,
    inputs.sample,
    inputs.claimAudit
  );

  assert.equal(queue.status, 'review_ready');
  assert.deepEqual(queue.totals, {
    queue_items: 3,
    high_priority: 1,
    medium_priority: 1,
    low_priority: 1
  });
  assert.deepEqual(queue.items.map(item => item.priority), ['high', 'medium', 'low']);
  assert.deepEqual(queue.items.map(item => item.queue_order), [1, 2, 3]);

  const high = queue.items[0];
  assert.ok(high.priority_reasons.includes('all_models_disagree_with_stage4a'));
  assert.ok(high.priority_reasons.includes('obligatory_frame_disputed'));
  assert.ok(high.priority_reasons.includes('claim_audit_entry_affected'));
  assert.deepEqual(high.claim_ids, ['CLAIM-001']);
  assert.equal(high.sentence_text, 'With malice toward none, the work must continue.');
  assert.deepEqual(high.model_context.map(context => context.run_id), ['run_a', 'run_b']);
  assert.notEqual(high.model_context[0].model_id, high.model_context[1].model_id);
  assert.match(high.suggested_review_question, /required rather than chosen/);
  assert.equal(high.generated_record_immutable, true);

  assert.ok(queue.items[1].priority_reasons.includes('source_domain_differs_cluster_stable'));
  assert.ok(queue.items[2].priority_reasons.includes('uncertainty_differs_without_classification_change'));
  assert.deepEqual(
    generateQueue(inputs.disagreementLog, inputs.normalized, inputs.sample, inputs.claimAudit),
    queue
  );
});

test('priority rules cover purification, lexical overlap, and weak same-label rationale', () => {
  const defaultItem = itemResult('stage4m_unit_00001');
  assert.equal(priorityFor(
    disagreement({ model_values: { a: 'purification', b: 'purification' } }),
    [],
    defaultItem
  ).priority, 'high');

  assert.equal(priorityFor(
    disagreement({
      field_name: 'lexical_unit',
      reference_value: 'the national house',
      model_values: { a: 'national house', b: 'the house divided' }
    }),
    [],
    defaultItem
  ).priority, 'medium');

  const low = priorityFor(
    disagreement({ model_values: { a: 'union', b: 'union' } }),
    [],
    defaultItem,
    [
      { justification: 'thin' },
      { justification: 'This second model provides a much fuller explanation of its classification.' }
    ]
  );
  assert.equal(low.priority, 'low');
  assert.ok(low.reasons.includes('same_model_label_with_weak_justification'));
});

test('empty queue command writes stable standalone artifacts and human-control guidance', t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-queue-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const comparison = path.join(workspace, 'data', 'reliability', 'model-comparison');
  fs.mkdirSync(comparison, { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'audit'), { recursive: true });
  fs.writeFileSync(path.join(comparison, 'model-disagreement-log.json'), JSON.stringify({
    status: 'no_submissions',
    totals: { model_runs: 0 },
    disagreements: [],
    item_results: []
  }));
  fs.writeFileSync(path.join(comparison, 'normalized-model-runs.json'), JSON.stringify({
    status: 'no_submissions',
    runs: []
  }));
  fs.writeFileSync(path.join(comparison, 'model-instability-report.md'), '# Empty fixture\n');
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'reliability-sample.json'),
    JSON.stringify({ identification_units: [], field_agreement_units: [] })
  );
  fs.writeFileSync(
    path.join(workspace, 'data', 'audit', 'claim-audit.json'),
    JSON.stringify({ claims: [] })
  );

  const run = () => spawnSync(process.execPath, [SCRIPT], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4M_ROOT: workspace }
  });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const queuePath = path.join(
    workspace,
    'data',
    'reliability',
    'model-adjudication',
    'stage4m-adjudication-queue.json'
  );
  const firstQueue = fs.readFileSync(queuePath, 'utf8');
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(queuePath, 'utf8'), firstQueue);

  const queue = JSON.parse(firstQueue);
  assert.equal(queue.status, 'no_items');
  assert.equal(queue.totals.queue_items, 0);
  const csv = fs.readFileSync(queuePath.replace('.json', '.csv'), 'utf8');
  assert.match(csv, /^queue_order,queue_id,disagreement_id,/);
  const template = fs.readFileSync(
    path.join(path.dirname(queuePath), 'stage4m-adjudication-template.csv'),
    'utf8'
  );
  assert.match(template, /decision,adjudicated_value,rationale/);
  const guide = fs.readFileSync(
    path.join(workspace, 'docs', 'methodology', 'stage4m-adjudication-guide.md'),
    'utf8'
  );
  assert.match(guide, /Model consensus is diagnostic evidence, not a vote/);
  assert.match(guide, /does not edit Stage 4A/);
});

test('queue rejects stale or invalid comparison inputs', () => {
  const inputs = populatedInputs();
  assert.throws(() => generateQueue(
    { ...inputs.disagreementLog, totals: { model_runs: 1 } },
    inputs.normalized,
    inputs.sample,
    inputs.claimAudit
  ), /model-run count/);
  assert.throws(() => generateQueue(
    inputs.disagreementLog,
    { ...inputs.normalized, status: 'validation_failed' },
    inputs.sample,
    inputs.claimAudit
  ), /failed validation/);
});
