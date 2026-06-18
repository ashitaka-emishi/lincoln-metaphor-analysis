const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const {
  agreementPatterns,
  boundaryClassification,
  compareRunToReference,
  stability
} = require('../scripts/stage4m/compare-model-runs');

const ROOT = path.resolve(__dirname, '..');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'ingest-model-outputs.js');
const COMPARE_SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'compare-model-runs.js');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4m');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-agreement-'));
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

function runScript(scriptPath, workspace, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4M_ROOT: workspace }
  });
}

function outputJSON(workspace, name) {
  return JSON.parse(fs.readFileSync(path.join(workspace, 'data', 'reliability', 'model-comparison', name), 'utf8'));
}

test('agreement command preserves no-submission state without inventing scores', t => {
  const workspace = copyWorkspace(t);
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'model-comparison', 'normalized-model-runs.json'),
    path.join(workspace, 'data', 'reliability', 'model-comparison', 'normalized-model-runs.json')
  );
  const result = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /No validated Stage 4M model runs/);

  const agreement = outputJSON(workspace, 'model-agreement-results.json');
  assert.equal(agreement.status, 'no_submissions');
  assert.deepEqual(agreement.model_vs_reference, []);
  assert.deepEqual(agreement.model_vs_model, []);
  assert.equal(agreement.stability.categories.cluster_id.agreement_rate_pct, null);
  assert.equal(agreement.stability.categories.cluster_id.classification, 'insufficient_evidence');
});

test('two valid fixture runs produce layered reference and pair metrics', t => {
  const workspace = copyWorkspace(t);
  for (const name of ['valid-model-output.json', 'valid-model-output.csv']) {
    fs.cpSync(
      path.join(FIXTURE_DIR, name),
      path.join(workspace, 'data', 'reliability', 'model-output-submissions', name)
    );
  }
  const ingest = runScript(INGEST_SCRIPT, workspace);
  assert.equal(ingest.status, 0, ingest.stderr);
  const compare = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(compare.status, 0, compare.stderr);

  const agreement = outputJSON(workspace, 'model-agreement-results.json');
  assert.equal(agreement.status, 'complete');
  assert.equal(agreement.totals.model_runs, 2);
  assert.equal(agreement.totals.packet_units, 106);
  assert.equal(agreement.totals.identification_units, 55);
  assert.equal(agreement.totals.field_agreement_units, 51);
  assert.equal(agreement.totals.adjudicated_context_units, 8);
  assert.equal(agreement.model_vs_reference.length, 2);
  assert.equal(agreement.model_vs_model.length, 1);

  const jsonComparison = agreement.model_vs_reference.find(item => item.run_id === 'fixture_json_run_001');
  const csvComparison = agreement.model_vs_reference.find(item => item.run_id === 'fixture_csv_run_001');
  assert.equal(jsonComparison.coverage.covered_packet_units, 2);
  assert.equal(jsonComparison.metaphor_identification.true_negative, 1);
  assert.equal(jsonComparison.fields.metaphor_present.comparisons, 2);
  assert.equal(jsonComparison.fields.lexical_unit_boundary.exact_match, 1);
  assert.equal(jsonComparison.fields.cluster_id.agreement_rate_pct, 100);
  assert.equal(jsonComparison.fields.koenigsberg_function.agreement_rate_pct, 100);
  assert.equal(csvComparison.fields.cluster_id.agreement_rate_pct, 100);
  assert.equal(csvComparison.fields.koenigsberg_function.agreement_rate_pct, 0);
  assert.equal(csvComparison.fields.obligatory_frame.agreement_rate_pct, 100);

  const pair = agreement.model_vs_model[0];
  assert.equal(pair.shared_packet_units, 2);
  assert.equal(pair.fields.metaphor_present.agreement_rate_pct, 100);
  assert.equal(pair.fields.lexical_unit_boundary.agreement_rate_pct, 100);
  assert.equal(pair.fields.cluster_id.agreement_rate_pct, 100);
  assert.equal(pair.fields.koenigsberg_function.agreement_rate_pct, 0);
  assert.ok(agreement.stability.insufficient_evidence_categories.includes('cluster_id'));
  assert.ok(agreement.stability.insufficient_evidence_categories.includes('koenigsberg_function'));
  assert.equal(agreement.agreement_patterns.by_field.cluster_id.unanimous_with_reference, 1);
  assert.equal(agreement.agreement_patterns.by_field.koenigsberg_function.split, 1);

  const summary = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'model-comparison', 'model-agreement-summary.csv'), 'utf8');
  const markdown = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'model-comparison', 'model-agreement-results.md'), 'utf8');
  assert.match(summary, /model_vs_reference/);
  assert.match(summary, /model_vs_model/);
  assert.match(markdown, /## Model vs Stage 4A/);
  assert.match(markdown, /## Identification Diagnostics/);
  assert.match(markdown, /## Focal Interpretive Categories/);
  assert.match(markdown, /## Stability/);
});

test('identification misses count as false negatives and missing boundaries', () => {
  const references = new Map([['stage4m_unit_00001', {
    packet_unit_id: 'stage4m_unit_00001',
    task_type: 'sentence_identification',
    metaphor_present: 'yes',
    lexical_units: ['legal inheritance'],
    control_type: 'positive_anchor',
    adjudications: []
  }]]);
  const comparison = compareRunToReference({
    run_id: 'missing_metaphor_run',
    items: [{
      packet_unit_id: 'stage4m_unit_00001',
      metaphor_present: 'no',
      lexical_unit: null,
      source_domain: null,
      target_domain: null,
      cluster_id: null,
      koenigsberg_function: null,
      violence_logic: null,
      obligatory_frame: null,
      agency_or_absence_flag: null,
      confidence: 'low',
      ambiguity_flag: 'no',
      rival_reading: null
    }]
  }, references);
  assert.equal(comparison.metaphor_identification.false_negative, 1);
  assert.equal(comparison.fields.lexical_unit_boundary.comparisons, 1);
  assert.equal(comparison.fields.lexical_unit_boundary.missing_boundary, 1);
});

test('agreement patterns distinguish unanimity, majority, split, and outlier', () => {
  const references = new Map([
    ['stage4m_unit_00001', { packet_unit_id: 'stage4m_unit_00001', task_type: 'sentence_identification', metaphor_present: 'yes', lexical_units: [] }],
    ['stage4m_unit_00002', { packet_unit_id: 'stage4m_unit_00002', task_type: 'sentence_identification', metaphor_present: 'yes', lexical_units: [] }],
    ['stage4m_unit_00003', { packet_unit_id: 'stage4m_unit_00003', task_type: 'sentence_identification', metaphor_present: 'yes', lexical_units: [] }],
    ['stage4m_unit_00004', { packet_unit_id: 'stage4m_unit_00004', task_type: 'sentence_identification', metaphor_present: 'yes', lexical_units: [] }]
  ]);
  const valuesByUnit = [
    ['yes', 'yes', 'yes', 'yes', 'yes'],
    ['yes', 'yes', 'yes', 'no', 'no'],
    ['yes', 'yes', 'no', 'no', 'uncertain'],
    ['yes', 'yes', 'yes', 'yes', 'no']
  ];
  const runs = Array.from({ length: 5 }, (_, runIndex) => ({
    run_id: `run_${runIndex + 1}`,
    items: valuesByUnit.map((values, unitIndex) => ({
      packet_unit_id: `stage4m_unit_${String(unitIndex + 1).padStart(5, '0')}`,
      metaphor_present: values[runIndex],
      lexical_unit: null,
      source_domain: null,
      target_domain: null,
      cluster_id: null,
      koenigsberg_function: null,
      violence_logic: null,
      obligatory_frame: null,
      agency_or_absence_flag: null,
      confidence: 'medium',
      ambiguity_flag: 'no',
      rival_reading: null
    }))
  }));
  const patterns = agreementPatterns(runs, references).by_field.metaphor_present;
  assert.equal(patterns.unanimity, 1);
  assert.equal(patterns.majority, 1);
  assert.equal(patterns.split, 1);
  assert.equal(patterns.outlier, 1);
});

test('stability requires a meaningful denominator before classifying fields', () => {
  const fields = Object.fromEntries([
    'metaphor_present', 'lexical_unit_boundary', 'source_domain', 'target_domain',
    'cluster_id', 'koenigsberg_function', 'violence_logic', 'obligatory_frame',
    'agency_or_absence_flag', 'confidence', 'ambiguity_flag', 'rival_reading_presence'
  ].map(field => [field, { agreements: 0, comparisons: 0 }]));
  fields.cluster_id = { agreements: 9, comparisons: 10 };
  fields.koenigsberg_function = { agreements: 7, comparisons: 10 };
  fields.violence_logic = { agreements: 1, comparisons: 2 };
  const result = stability([{ fields }], []);
  assert.ok(result.stable_categories.includes('cluster_id'));
  assert.ok(result.unstable_categories.includes('koenigsberg_function'));
  assert.ok(result.insufficient_evidence_categories.includes('violence_logic'));
});

test('boundary classification separates exact, partial, absent, and missing spans', () => {
  assert.equal(boundaryClassification(['legal inheritance'], ['legal inheritance']), 'exact_match');
  assert.equal(boundaryClassification(['legal inheritance'], ['inheritance']), 'partial_overlap');
  assert.equal(boundaryClassification(['legal inheritance'], ['divine judgment']), 'no_overlap');
  assert.equal(boundaryClassification([], ['inheritance']), 'missing_boundary');
});
