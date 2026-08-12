const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const {
  boundaryClassification,
  pairwiseKappa,
  positiveAgreement
} = require('../scripts/stage4h/compare-human-runs');

const ROOT = path.resolve(__dirname, '..');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'ingest-human-outputs.js');
const COMPARE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'compare-human-runs.js');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4h');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4h-agreement-'));
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

function installFixture(workspace, fixtureName, submissionName = fixtureName) {
  fs.cpSync(
    path.join(FIXTURE_DIR, fixtureName),
    path.join(workspace, 'data', 'reliability', 'human-output-submissions', submissionName)
  );
}

function outputJSON(workspace, name) {
  return JSON.parse(fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', name), 'utf8'));
}

test('agreement command preserves no-submission state without inventing human scores', t => {
  const workspace = copyWorkspace(t);
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json')
  );

  const result = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /No validated Stage 4H human submissions/);

  const agreement = outputJSON(workspace, 'human-agreement-results.json');
  const markdown = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-agreement-results.md'), 'utf8');
  assert.equal(agreement.status, 'no_submissions');
  assert.equal(agreement.human_human, null);
  assert.equal(agreement.totals.primary_human_coders, 0);
  assert.match(markdown, /No validated human submissions/);
});

test('two valid human fixture submissions produce layered human-human metrics', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'valid-human-output-coder-a.json');
  installFixture(workspace, 'valid-human-output-coder-b.json');
  const ingest = runScript(INGEST_SCRIPT, workspace);
  assert.equal(ingest.status, 0, ingest.stderr);

  const compare = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(compare.status, 0, compare.stderr);
  const agreement = outputJSON(workspace, 'human-agreement-results.json');

  assert.equal(agreement.status, 'complete');
  assert.equal(agreement.totals.primary_human_coders, 2);
  assert.equal(agreement.totals.identification_units, 55);
  assert.equal(agreement.totals.field_agreement_units, 51);
  assert.equal(agreement.human_human.shared_packet_units, 2);
  assert.equal(agreement.human_human.layers.identification.label_agreement.rate_pct, 100);
  assert.equal(agreement.human_human.layers.identification.cohens_kappa_present_absent, 1);
  assert.equal(agreement.human_human.layers.identification.negative_control_accuracy.rate_pct, 100);
  assert.equal(agreement.human_human.layers.lexical_boundary.exact_boundary_agreement, 1);
  assert.equal(agreement.human_human.layers.cmt_mapping.cluster_id.rate_pct, 100);
  assert.equal(agreement.human_human.layers.cmt_mapping.source_domain_family.available, false);
  assert.equal(agreement.human_human.layers.koenigsberg_interpretation.koenigsberg_function.rate_pct, 100);
  assert.equal(agreement.human_human.layers.absence_agency.agency_status.rate_pct, 100);
  assert.equal(agreement.human_human.layers.confidence_ambiguity.confidence.rate_pct, 100);
  assert.match(agreement.metric_policy, /not averaged with Stage 4B or Stage 4M/);
  assert.match(agreement.stage4a_policy, /#94 reports that separately/);

  const summary = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-agreement-summary.csv'), 'utf8');
  const markdown = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-agreement-results.md'), 'utf8');
  assert.match(summary, /identification,present_absent_uncertain_agreement/);
  assert.match(summary, /cmt_mapping,cluster_id_agreement/);
  assert.match(summary, /koenigsberg_interpretation,violence_logic_agreement/);
  assert.match(summary, /absence_agency,disease_or_purification_present_agreement/);
  assert.match(markdown, /## Layered Agreement/);
  assert.match(markdown, /## Identification Diagnostics/);
  assert.match(markdown, /## Stage 4A Policy/);
});

test('one primary human submission reports partial execution', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'valid-human-output-coder-a.json');
  const ingest = runScript(INGEST_SCRIPT, workspace);
  assert.equal(ingest.status, 0, ingest.stderr);

  const compare = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(compare.status, 0, compare.stderr);
  const agreement = outputJSON(workspace, 'human-agreement-results.json');
  assert.equal(agreement.status, 'partial_execution');
  assert.equal(agreement.human_human, null);
});

test('boundary classification separates exact, partial, no-overlap, and missing cases', () => {
  const item = (start, end, text, present = 'yes') => ({
    metaphor_present: present,
    lexical_unit_start: start,
    lexical_unit_end: end,
    lexical_unit: text
  });
  assert.equal(boundaryClassification([item(1, 5, 'legal inheritance')], [item(1, 5, 'legal inheritance')]), 'exact_boundary_agreement');
  assert.equal(boundaryClassification([item(1, 5, 'legal inheritance')], [item(3, 9, 'inheritance frame')]), 'partial_overlap_agreement');
  assert.equal(boundaryClassification([item(1, 5, 'legal inheritance')], [item(10, 15, 'divine judgment')]), 'no_overlap');
  assert.equal(boundaryClassification([item(null, null, null, 'no')], [item(1, 5, 'legal inheritance')]), 'missing_boundary');
});

test('identification helper metrics handle present-absent labels conservatively', () => {
  assert.equal(pairwiseKappa([['yes', 'yes'], ['no', 'no']]), 1);
  assert.equal(pairwiseKappa([['yes', 'no'], ['no', 'yes']]), -1);
  assert.equal(positiveAgreement([['yes', 'yes'], ['yes', 'no'], ['no', 'yes'], ['no', 'no']]), 50);
});
