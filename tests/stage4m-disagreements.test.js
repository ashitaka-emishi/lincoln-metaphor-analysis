const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { classify, consensusPattern } = require('../scripts/stage4m/classify-model-disagreements');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4m');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'ingest-model-outputs.js');
const COMPARE_SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'compare-model-runs.js');
const CLASSIFY_SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'classify-model-disagreements.js');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-disagreements-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability'), { recursive: true });
  for (const name of ['model-input-packets', 'reliability-sample.json', 'double-coding-completed.csv', 'adjudication-log.csv']) {
    fs.cpSync(
      path.join(ROOT, 'data', 'reliability', name),
      path.join(workspace, 'data', 'reliability', name),
      { recursive: true }
    );
  }
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'model-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'model-comparison'), { recursive: true });
  return workspace;
}

function runScript(scriptPath, workspace) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4M_ROOT: workspace }
  });
}

function outputJSON(workspace, name) {
  return JSON.parse(fs.readFileSync(path.join(workspace, 'data', 'reliability', 'model-comparison', name), 'utf8'));
}

test('no-submission classifier assigns every packet item reference_only', t => {
  const workspace = copyWorkspace(t);
  for (const name of ['normalized-model-runs.json', 'model-agreement-results.json']) {
    fs.cpSync(
      path.join(ROOT, 'data', 'reliability', 'model-comparison', name),
      path.join(workspace, 'data', 'reliability', 'model-comparison', name)
    );
  }
  const result = runScript(CLASSIFY_SCRIPT, workspace);
  assert.equal(result.status, 0, result.stderr);
  const log = outputJSON(workspace, 'model-disagreement-log.json');
  assert.equal(log.status, 'no_submissions');
  assert.equal(log.item_results.length, 106);
  assert.ok(log.item_results.every(item => item.agreement_pattern === 'reference_only'));
  assert.deepEqual(log.disagreements, []);
  assert.ok(log.taxonomy.disagreement_categories.includes('historical_context_error'));
  assert.ok(log.taxonomy.agreement_patterns.includes('requires_human_adjudication'));
});

test('fixture pipeline flags CMT agreement with Koenigsberg disagreement', t => {
  const workspace = copyWorkspace(t);
  for (const name of ['valid-model-output.json', 'valid-model-output.csv']) {
    fs.cpSync(
      path.join(FIXTURE_DIR, name),
      path.join(workspace, 'data', 'reliability', 'model-output-submissions', name)
    );
  }
  assert.equal(runScript(INGEST_SCRIPT, workspace).status, 0);
  assert.equal(runScript(COMPARE_SCRIPT, workspace).status, 0);
  const classification = runScript(CLASSIFY_SCRIPT, workspace);
  assert.equal(classification.status, 0, classification.stderr);

  const log = outputJSON(workspace, 'model-disagreement-log.json');
  const koenigsberg = log.disagreements.find(item =>
    item.packet_unit_id === 'stage4m_unit_00056' && item.field_name === 'koenigsberg_function');
  assert.ok(koenigsberg);
  assert.equal(koenigsberg.disagreement_category, 'koenigsberg_function');
  assert.equal(koenigsberg.agreement_pattern, 'split_no_majority');
  assert.equal(koenigsberg.cmt_agreement_koenigsberg_disagreement, true);
  assert.equal(koenigsberg.requires_human_adjudication, true);
  assert.equal(log.item_results.length, 106);
  assert.ok(log.item_results.find(item => item.packet_unit_id === 'stage4m_unit_00056')
    .pattern_flags.includes('requires_human_adjudication'));

  const markdown = fs.readFileSync(
    path.join(workspace, 'data', 'reliability', 'model-comparison', 'model-instability-report.md'),
    'utf8'
  );
  assert.match(markdown, /## Human Review Priorities/);
  assert.match(markdown, /CMT-agree \/ Koenigsberg-disagree records/);
});

function syntheticSample(referenceValues) {
  return {
    identification_units: [],
    field_agreement_units: [{
      reliability_unit_id: 'rel_field_fixture',
      unit_type: 'field_agreement',
      source_audit_id: 'inst_fixture',
      document_id: 'doc_001',
      sentence_id: 'doc_001_s01_p02_s03',
      sentence_text: 'We found ourselves the legal inheritors of these fundamental blessings.',
      span_text: 'the legal inheritors of these fundamental blessings',
      reference_values: {
        mipvu_decision: 'metaphor_related',
        cluster_id: 'cluster_05_fathers_inheritance',
        source_domain: 'inheritance',
        target_domain: 'civil liberty',
        fantasy_type: 'ancestral_debt',
        violence_logic: 'obligatory',
        obligatory_frame: true,
        absence_flags: [],
        confidence_score: 0.88,
        ambiguity_flag: false,
        ...referenceValues
      }
    }]
  };
}

function syntheticRun(runId, overrides = {}) {
  return {
    run_id: runId,
    items: [{
      packet_unit_id: 'stage4m_unit_00001',
      task_type: 'field_agreement',
      doc_id: 'doc_001',
      sentence_id: 'doc_001_s01_p02_s03',
      metaphor_present: 'yes',
      lexical_unit: 'the legal inheritors of these fundamental blessings',
      source_domain: 'inheritance',
      target_domain: 'civil liberty',
      cluster_id: 'cluster_05_fathers_inheritance',
      koenigsberg_function: 'ancestral_debt',
      violence_logic: 'obligatory',
      obligatory_frame: 'Inheritance creates duty.',
      agency_or_absence_flag: null,
      confidence: 'medium',
      ambiguity_flag: 'no',
      rival_reading: null,
      ...overrides
    }]
  };
}

function syntheticAgreement(classifications = {}) {
  const fields = [
    'metaphor_present', 'lexical_unit_boundary', 'source_domain', 'target_domain',
    'cluster_id', 'koenigsberg_function', 'violence_logic', 'obligatory_frame',
    'agency_or_absence_flag', 'confidence', 'ambiguity_flag', 'rival_reading_presence'
  ];
  return {
    status: 'complete',
    packet_id: 'fixture_packet',
    totals: { model_runs: 2 },
    stability: {
      categories: Object.fromEntries(fields.map(field => [field, {
        classification: classifications[field] || 'insufficient_evidence'
      }]))
    }
  };
}

test('unanimous purification over-read is preserved for human review', () => {
  const result = classify(
    syntheticAgreement({ koenigsberg_function: 'unstable' }),
    {
      packet_id: 'fixture_packet',
      runs: [
        syntheticRun('model_a', { koenigsberg_function: 'disease_and_purification' }),
        syntheticRun('model_b', { koenigsberg_function: 'disease_and_purification' })
      ]
    },
    syntheticSample()
  );
  const disagreement = result.disagreements.find(item => item.field_name === 'koenigsberg_function');
  assert.equal(disagreement.disagreement_category, 'over_interpretation');
  assert.equal(disagreement.agreement_pattern, 'unanimous_against_reference');
  assert.equal(disagreement.over_read_type, 'purification');
  assert.equal(disagreement.all_models_against_reference, true);
  assert.equal(disagreement.requires_human_adjudication, true);
  const item = result.item_results[0];
  assert.ok(item.pattern_flags.includes('unstable_category'));
  assert.ok(item.pattern_flags.includes('requires_human_adjudication'));
});

test('agency/absence disagreement always enters human review', () => {
  const result = classify(
    syntheticAgreement(),
    {
      packet_id: 'fixture_packet',
      runs: [
        syntheticRun('model_a'),
        syntheticRun('model_b', { agency_or_absence_flag: 'enslaved_people_non_agent' })
      ]
    },
    syntheticSample()
  );
  const disagreement = result.disagreements.find(item => item.field_name === 'agency_or_absence_flag');
  assert.equal(disagreement.disagreement_category, 'agency_or_absence_flag');
  assert.equal(disagreement.requires_human_adjudication, true);
});

test('unanimous agency/absence challenges retain the agency category', () => {
  const result = classify(
    syntheticAgreement(),
    {
      packet_id: 'fixture_packet',
      runs: [
        syntheticRun('model_a', { agency_or_absence_flag: 'enslaved_people_non_agent' }),
        syntheticRun('model_b', { agency_or_absence_flag: 'enslaved_people_non_agent' })
      ]
    },
    syntheticSample()
  );
  const disagreement = result.disagreements.find(item => item.field_name === 'agency_or_absence_flag');
  assert.equal(disagreement.disagreement_category, 'agency_or_absence_flag');
  assert.equal(disagreement.agreement_pattern, 'unanimous_against_reference');
  assert.equal(disagreement.all_models_against_reference, true);
  assert.equal(disagreement.requires_human_adjudication, true);
});

test('invented lexical spans are classified as model hallucination', () => {
  const result = classify(
    syntheticAgreement(),
    {
      packet_id: 'fixture_packet',
      runs: [
        syntheticRun('model_a'),
        syntheticRun('model_b', { lexical_unit: 'a phrase that is not in the sentence' })
      ]
    },
    syntheticSample()
  );
  const disagreement = result.disagreements.find(item => item.field_name === 'lexical_unit');
  assert.equal(disagreement.disagreement_category, 'model_hallucination');
  assert.equal(disagreement.requires_human_adjudication, false);
});

test('classifier rejects stale agreement inputs', () => {
  assert.throws(() => classify(
    { ...syntheticAgreement(), packet_id: 'old_packet' },
    { packet_id: 'new_packet', runs: [syntheticRun('model_a'), syntheticRun('model_b')] },
    syntheticSample()
  ), /Packet mismatch/);
});

test('split model values that all reject Stage 4A still require human review', () => {
  const result = classify(
    syntheticAgreement(),
    {
      packet_id: 'fixture_packet',
      runs: [
        syntheticRun('model_a', { koenigsberg_function: 'oath_and_obligation' }),
        syntheticRun('model_b', { koenigsberg_function: 'disease_and_purification' })
      ]
    },
    syntheticSample()
  );
  const disagreement = result.disagreements.find(item => item.field_name === 'koenigsberg_function');
  assert.equal(disagreement.agreement_pattern, 'split_no_majority');
  assert.equal(disagreement.all_models_against_reference, true);
  assert.equal(disagreement.requires_human_adjudication, true);
});

test('consensus patterns cover reference, uncertainty, majority, split, and outlier states', () => {
  const records = values => Object.fromEntries(values.map((value, index) => [
    `model_${index + 1}`,
    { metaphor_present: value }
  ]));
  assert.equal(consensusPattern('yes', {}, 'metaphor_present'), 'reference_only');
  assert.equal(consensusPattern('yes', records(['uncertain', 'uncertain']), 'metaphor_present'), 'all_models_uncertain');
  assert.equal(consensusPattern('yes', records(['yes', 'yes']), 'metaphor_present'), 'unanimous_with_reference');
  assert.equal(consensusPattern('yes', records(['no', 'no']), 'metaphor_present'), 'unanimous_against_reference');
  assert.equal(consensusPattern('yes', records(['yes', 'yes', 'yes', 'no', 'no']), 'metaphor_present'), 'majority_with_reference');
  assert.equal(consensusPattern('yes', records(['no', 'no', 'no', 'yes', 'yes']), 'metaphor_present'), 'majority_against_reference');
  assert.equal(consensusPattern('yes', records(['yes', 'no']), 'metaphor_present'), 'split_no_majority');
  assert.equal(consensusPattern('yes', records(['yes', 'yes', 'yes', 'no']), 'metaphor_present'), 'single_model_outlier');
});
