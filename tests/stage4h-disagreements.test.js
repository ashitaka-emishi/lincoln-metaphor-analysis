const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const {
  boundaryPattern,
  categoryFor,
  classifyAgreementPattern,
  valuesEqual
} = require('../scripts/stage4h/classify-human-disagreements');

const ROOT = path.resolve(__dirname, '..');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'ingest-human-outputs.js');
const AGREEMENT_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'compare-human-runs.js');
const REFERENCE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'compare-human-to-reference.js');
const CLASSIFY_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'classify-human-disagreements.js');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4h');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4h-disagreements-'));
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
  return readJSON(path.join(workspace, 'data', 'reliability', 'human-comparison', name));
}

function runPrerequisites(workspace) {
  for (const script of [INGEST_SCRIPT, AGREEMENT_SCRIPT, REFERENCE_SCRIPT]) {
    const result = runScript(script, workspace);
    assert.equal(result.status, 0, result.stderr);
  }
}

test('disagreement command preserves no-submission state', t => {
  const workspace = copyWorkspace(t);
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json')
  );
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-agreement-results.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-agreement-results.json')
  );
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json')
  );

  const result = runScript(CLASSIFY_SCRIPT, workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /No validated Stage 4H human submissions/);

  const log = outputJSON(workspace, 'human-disagreement-log.json');
  const report = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-instability-report.md'), 'utf8');
  assert.equal(log.status, 'no_submissions');
  assert.equal(log.totals.disagreements, 0);
  assert.deepEqual(log.disagreements, []);
  assert.match(report, /No two-primary-coder disagreement log is available yet/);
});

test('two human fixtures produce categorized Stage 4J disagreement signals', t => {
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

  const classify = runScript(CLASSIFY_SCRIPT, workspace);
  assert.equal(classify.status, 0, classify.stderr);
  const log = outputJSON(workspace, 'human-disagreement-log.json');
  assert.equal(log.status, 'review_ready');
  assert.equal(log.totals.primary_human_coders, 2);
  assert.ok(log.totals.disagreements > 0);
  assert.ok(log.totals.requires_human_adjudication > 0);
  assert.ok(log.totals.major_document_disagreements > 0);
  assert.ok(log.totals.major_synthesis_claim_disagreements > 0);
  assert.ok(log.totals.agency_or_absence_disagreements > 0);
  assert.ok(log.totals.disease_or_purification_disagreements > 0);

  const cluster = log.disagreements.find(row => row.field_name === 'cluster_id');
  assert.ok(cluster);
  assert.equal(cluster.disagreement_category, 'cluster_assignment');
  assert.equal(cluster.agreement_pattern, 'human_split_reference_supports_coder_a');
  assert.equal(cluster.stage4a_reference_value, 'cluster_05_fathers_inheritance');
  assert.deepEqual(cluster.affected_claim_ids, ['CLAIM-004']);

  const boundary = log.disagreements.find(row => row.field_name === 'lexical_unit_boundary');
  assert.ok(boundary);
  assert.equal(boundary.disagreement_category, 'lexical_unit_boundary');
  assert.equal(boundary.boundary_pattern, 'partial_overlap');
  assert.equal(boundary.major_document_flag, true);

  const disease = log.disagreements.find(row => row.field_name === 'disease_or_purification_present');
  assert.ok(disease);
  assert.equal(disease.disease_or_purification_flag, true);

  const csv = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-disagreement-log.csv'), 'utf8');
  const report = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-instability-report.md'), 'utf8');
  assert.match(csv, /cluster_assignment/);
  assert.match(report, /Disagreements classified:/);
});

test('helper classifications cover boundary, category, pattern, and pipe-list behavior', () => {
  assert.equal(valuesEqual('violence_logic', 'restorative|obligatory', 'obligatory|restorative'), true);
  assert.equal(valuesEqual('source_domain', 'inheritance', 'legal inheritance'), false);
  assert.equal(categoryFor('ambiguity_flag', 'yes', 'no'), 'codebook_ambiguity');
  assert.equal(boundaryPattern([
    { metaphor_present: 'yes', lexical_unit: 'legal inheritors', lexical_unit_start: 62, lexical_unit_end: 78 }
  ], [
    { metaphor_present: 'yes', lexical_unit: 'inheritors', lexical_unit_start: 68, lexical_unit_end: 78 }
  ]), 'partial_overlap');
  const pattern = classifyAgreementPattern('cluster_a', 'cluster_b', 'cluster_a', 'cluster_id', 'high', 'low', null);
  assert.equal(pattern.agreement_pattern, 'human_split_reference_supports_coder_a');
  assert.ok(pattern.agreement_pattern_flags.includes('high_confidence_disagreement'));
  assert.ok(pattern.agreement_pattern_flags.includes('low_confidence_disagreement'));
});

test('classifier rejects stale upstream comparison artifacts', t => {
  const workspace = copyWorkspace(t);
  installJSON(workspace, 'valid-human-output-coder-a.json');
  installJSON(workspace, 'valid-human-output-coder-b.json');
  const ingest = runScript(INGEST_SCRIPT, workspace);
  assert.equal(ingest.status, 0, ingest.stderr);
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-agreement-results.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-agreement-results.json')
  );
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.json')
  );

  const result = runScript(CLASSIFY_SCRIPT, workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Human agreement artifact is stale/);
});
