const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4m');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'ingest-model-outputs.js');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-fixtures-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'model-input-packets'),
    path.join(workspace, 'data', 'reliability', 'model-input-packets'),
    { recursive: true }
  );
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'model-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'model-comparison'), { recursive: true });
  return workspace;
}

function installFixture(workspace, fixtureName, submissionName = fixtureName) {
  fs.cpSync(
    path.join(FIXTURE_DIR, fixtureName),
    path.join(workspace, 'data', 'reliability', 'model-output-submissions', submissionName)
  );
}

function runIngest(workspace) {
  return spawnSync(process.execPath, [INGEST_SCRIPT], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4M_ROOT: workspace }
  });
}

function outputJSON(workspace, name) {
  return JSON.parse(fs.readFileSync(path.join(workspace, 'data', 'reliability', 'model-comparison', name), 'utf8'));
}

function findings(report) {
  return report.files.flatMap(file => file.findings);
}

test('Stage 4M fixture inventory contains every issue #83 contract', () => {
  const expected = [
    'invalid-model-output-bad-sentence-id.json',
    'invalid-model-output-missing-fields.json',
    'sample-disagreement-log.json',
    'sample-model-agreement-results.json',
    'valid-model-output.csv',
    'valid-model-output.json'
  ];
  const actual = new Set(fs.readdirSync(FIXTURE_DIR));
  for (const fixtureName of expected) assert.ok(actual.has(fixtureName), `Missing fixture: ${fixtureName}`);
});

test('valid JSON fixture is accepted and normalized without record loss', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'valid-model-output.json');
  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);

  const normalized = outputJSON(workspace, 'normalized-model-runs.json');
  const report = outputJSON(workspace, 'model-run-validation-report.json');
  assert.equal(normalized.runs[0].run_id, 'fixture_json_run_001');
  assert.equal(normalized.runs[0].items.length, 2);
  assert.equal(report.totals.input_items, 2);
  assert.equal(report.totals.normalized_items, 2);
});

test('valid CSV fixture is accepted through the canonical CSV mapping', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'valid-model-output.csv');
  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);

  const normalized = outputJSON(workspace, 'normalized-model-runs.json');
  assert.equal(normalized.runs[0].run_id, 'fixture_csv_run_001');
  assert.equal(normalized.runs[0].source_format, 'csv');
  assert.equal(normalized.runs[0].notes, 'Canonical, valid CSV ingestion fixture.');
  assert.equal(normalized.runs[0].items.length, 2);
});

test('missing-fields fixture produces actionable schema errors', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'invalid-model-output-missing-fields.json');
  const result = runIngest(workspace);
  assert.notEqual(result.status, 0);

  const normalized = outputJSON(workspace, 'normalized-model-runs.json');
  const report = outputJSON(workspace, 'model-run-validation-report.json');
  assert.deepEqual(normalized.runs, []);
  assert.ok(findings(report).some(finding => finding.code === 'schema_required' && /model_id/.test(finding.message)));
  assert.equal(report.totals.invalid_runs, 1);
});

test('bad-sentence fixture is rejected against corpus and packet identities', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'invalid-model-output-bad-sentence-id.json');
  const result = runIngest(workspace);
  assert.notEqual(result.status, 0);

  const report = outputJSON(workspace, 'model-run-validation-report.json');
  const codes = new Set(findings(report).map(finding => finding.code));
  assert.ok(codes.has('unknown_sentence_id'));
  assert.ok(codes.has('packet_sentence_mismatch'));
});

test('valid fixture becomes invalid when its packet hash is changed', t => {
  const workspace = copyWorkspace(t);
  const submission = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'valid-model-output.json'), 'utf8'));
  submission.input_packet_hash = '0'.repeat(64);
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'model-output-submissions', 'packet-mismatch.json'),
    JSON.stringify(submission, null, 2)
  );

  const result = runIngest(workspace);
  assert.notEqual(result.status, 0);
  const report = outputJSON(workspace, 'model-run-validation-report.json');
  assert.ok(findings(report).some(finding => finding.code === 'packet_hash_mismatch'));
});

test('future agreement fixture preserves every interpretive layer', () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'sample-model-agreement-results.json'), 'utf8'));
  assert.deepEqual(Object.keys(fixture.layers), [
    'metaphor_identification',
    'lexical_unit_boundary',
    'cmt_mapping',
    'koenigsberg_interpretation',
    'agency_absence',
    'confidence_ambiguity'
  ]);
  assert.ok(fixture.stability.stable_categories.length > 0);
  assert.ok(fixture.stability.unstable_categories.length > 0);
});

test('disagreement fixture classifies fragile and mandatory-review cases', () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'sample-disagreement-log.json'), 'utf8'));
  const allowedCategories = new Set([
    'mipvu_decision', 'lexical_unit_boundary', 'cluster_assignment', 'source_domain',
    'target_domain', 'koenigsberg_function', 'violence_logic', 'obligatory_frame',
    'agency_or_absence_flag', 'confidence_band', 'ambiguity_flag', 'rival_reading',
    'over_interpretation', 'under_interpretation', 'historical_context_error',
    'model_hallucination', 'schema_noncompliance', 'reference_challenge'
  ]);
  const allowedPatterns = new Set([
    'unanimous_with_reference', 'unanimous_against_reference', 'majority_with_reference',
    'majority_against_reference', 'split_no_majority', 'single_model_outlier',
    'reference_only', 'all_models_uncertain', 'unstable_category',
    'requires_human_adjudication'
  ]);

  assert.ok(fixture.cases.every(entry => allowedCategories.has(entry.expected_disagreement_category)));
  assert.ok(fixture.cases.every(entry => allowedPatterns.has(entry.expected_agreement_pattern)));
  assert.ok(fixture.cases.some(entry => entry.cmt_agreement_koenigsberg_disagreement));
  assert.ok(fixture.cases.some(entry => entry.purification_over_read && entry.requires_human_adjudication));
  assert.ok(fixture.cases
    .filter(entry => entry.expected_disagreement_category === 'agency_or_absence_flag')
    .every(entry => entry.requires_human_adjudication));
});
