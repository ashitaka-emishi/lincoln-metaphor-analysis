const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'corpus', 'generate-reliability-sample-update.js');
const FRAME_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-reliability-sample-frame.json');
const REPORT_PATH = path.join(ROOT, 'docs', 'corpus', 'corpus-v4-reliability-sampling-update.md');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('v4 reliability sampling generator check mode confirms generated files are fresh', () => {
  const output = childProcess.execFileSync('node', [SCRIPT_PATH, '--check', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  const result = JSON.parse(output);

  assert.equal(result.status, 'pass');
  assert.equal(result.changed, false);
  assert.equal(result.summary.v4_core_documents, 48);
  assert.equal(result.summary.v4_validation_documents, 78);
  assert.equal(result.summary.selected_core_documents, 8);
  assert.equal(result.summary.selected_validation_documents, 1);
  assert.ok(result.summary.selected_new_v4_core_documents > 0);
});

test('v4 reliability sample frame covers every issue #125 sampling criterion', () => {
  const frame = readJSON(FRAME_PATH);
  const byCriterion = new Map(frame.criteria_coverage.map(row => [row.criterion, row]));
  const required = [
    'documents_from_original_v1_corpus',
    'documents_from_new_v4_core_additions',
    'early_political_formation_text',
    'antebellum_slavery_text',
    'secession_crisis_text',
    'early_war_text',
    'emancipation_text',
    'late_war_providence_sacrifice_text',
    'reconstruction_transition_text',
    'positive_metaphor_cases',
    'negative_controls',
    'agency_absence_cases',
    'disease_purification_negative_check_cases',
    'ambiguous_cases'
  ];

  for (const criterion of required) {
    assert.equal(byCriterion.get(criterion)?.status, 'covered', criterion);
  assert.ok(byCriterion.get(criterion).doc_ids.length > 0, criterion);
  }
});

test('v4 reliability sample frame aligns claim areas without loose string matches', () => {
  const frame = readJSON(FRAME_PATH);
  const byClaim = new Map(frame.claim_alignment.map(row => [row.key, row.selected_doc_ids]));

  assert.deepEqual(byClaim.get('war_powers'), ['doc_028']);
  assert.deepEqual(byClaim.get('sacrifice_mourning'), ['doc_041']);
  assert.deepEqual(byClaim.get('providence'), ['doc_041']);
  assert.deepEqual(byClaim.get('disease_purification_negative_check'), ['doc_001', 'doc_070']);
});

test('v4 reliability sample frame distinguishes prior v1 evidence from future v4 coding', () => {
  const frame = readJSON(FRAME_PATH);
  const byId = new Map(frame.selected_documents.map(document => [document.doc_id, document]));

  assert.equal(frame.summary.legacy_sample_scope, 'v3/v1 human reliability remains valid as a prior study tied to the 28-document annotated corpus.');
  assert.equal(byId.get('doc_001').readiness, 'ready_as_legacy_stage4a_anchor');
  assert.equal(byId.get('doc_023').readiness, 'requires_v4_annotation_before_metric_use');
  assert.equal(byId.get('doc_070').corpus_tier, 'v4-validation');
  assert.equal(byId.get('doc_070').readiness, 'requires_v4_annotation_before_metric_use');
  assert.match(frame.methodological_boundaries.join('\n'), /should not be restated as v4 reliability results/);
});

test('v4 reliability sampling markdown documents corpus-version boundaries and future use', () => {
  const report = fs.readFileSync(REPORT_PATH, 'utf8');
  const requiredSections = [
    '# V4 Reliability Sampling Update',
    '## Summary',
    '## Corpus-Version Boundary',
    '## V4 Sample Frame',
    '## Sampling Criteria Coverage',
    '## Human-Coding Use',
    '## Negative Controls and Ambiguity',
    '## Methodological Boundaries'
  ];

  for (const section of requiredSections) {
    assert.match(report, new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'));
  }
  assert.match(report, /v1 annotated corpus/);
  assert.match(report, /future v4 human coding/);
  assert.match(report, /validation-corpus negative-check candidate/);
});

test('npm validate includes the v4 reliability sampling freshness check', () => {
  const packageJson = readJSON(path.join(ROOT, 'package.json'));
  assert.equal(packageJson.scripts['corpus:v4-reliability-sampling'], 'node scripts/corpus/generate-reliability-sample-update.js');
  assert.equal(packageJson.scripts['validate:corpus-v4-reliability-sampling'], 'node scripts/corpus/generate-reliability-sample-update.js --check');
  assert.match(packageJson.scripts.validate, /validate:corpus-v4-reliability-sampling/);
});
