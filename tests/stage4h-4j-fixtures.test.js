const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const STAGE4H_FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4h');
const STAGE4J_FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4j');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'ingest-human-outputs.js');

const EXPECTED_STAGE4H_FIXTURES = [
  'valid-human-output-coder-a.json',
  'valid-human-output-coder-b.json',
  'invalid-human-output-missing-fields.json',
  'invalid-human-output-bad-sentence-id.json',
  'valid-human-output.csv',
  'sample-human-agreement-results.json',
  'sample-human-disagreement-log.json'
];

const EXPECTED_STAGE4J_FIXTURES = [
  'valid-adjudication-decisions.json',
  'valid-adjudication-decisions.csv',
  'invalid-adjudication-decision-bad-id.json',
  'invalid-adjudication-decision-bad-value.json',
  'sample-codebook-revision-notes.md'
];

const ADJUDICATION_DECISIONS = new Set([
  'select_coder_a',
  'select_coder_b',
  'synthesize_new_value',
  'defer_insufficient_evidence',
  'document_migration_candidate',
  'codebook_clarification'
]);

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4h-fixtures-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-input-packets'),
    path.join(workspace, 'data', 'reliability', 'human-input-packets'),
    { recursive: true }
  );
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-comparison'), { recursive: true });
  return workspace;
}

function installFixture(workspace, fixtureName, submissionName = fixtureName) {
  fs.cpSync(
    path.join(STAGE4H_FIXTURE_DIR, fixtureName),
    path.join(workspace, 'data', 'reliability', 'human-output-submissions', submissionName)
  );
}

function runIngest(workspace) {
  return spawnSync(process.execPath, [INGEST_SCRIPT], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4H_ROOT: workspace }
  });
}

function outputJSON(workspace, name) {
  return readJSON(path.join(workspace, 'data', 'reliability', 'human-comparison', name));
}

function findings(report) {
  return report.files.flatMap(file => file.findings);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => Object.fromEntries(line.split(',').map((value, index) => [headers[index], value])));
}

function validateAdjudicationFixture(fixture) {
  const disagreementLog = readJSON(path.join(ROOT, fixture.source_disagreement_log));
  const knownDisagreements = new Set(disagreementLog.disagreements.map(item => item.disagreement_id));
  const findings = [];

  if (!Array.isArray(fixture.decisions) || fixture.decisions.length === 0) {
    findings.push({ code: 'missing_adjudication_decisions' });
    return findings;
  }

  const seen = new Set();
  for (const [index, decision] of fixture.decisions.entries()) {
    if (seen.has(decision.disagreement_id)) findings.push({ code: 'duplicate_adjudication_decision', index });
    seen.add(decision.disagreement_id);
    if (!knownDisagreements.has(decision.disagreement_id)) findings.push({ code: 'unknown_disagreement_id', index });
    if (!ADJUDICATION_DECISIONS.has(decision.decision)) findings.push({ code: 'invalid_adjudication_decision', index });
    if (typeof decision.rationale !== 'string' || decision.rationale.trim() === '') {
      findings.push({ code: 'missing_adjudication_rationale', index });
    }
  }

  for (const disagreementId of knownDisagreements) {
    if (!seen.has(disagreementId)) findings.push({ code: 'missing_adjudication_decision', disagreementId });
  }
  return findings;
}

test('Stage 4H and Stage 4J fixture inventories match issue #105', () => {
  const stage4h = new Set(fs.readdirSync(STAGE4H_FIXTURE_DIR));
  const stage4j = new Set(fs.readdirSync(STAGE4J_FIXTURE_DIR));
  for (const fixture of EXPECTED_STAGE4H_FIXTURES) assert.ok(stage4h.has(fixture), `Missing Stage 4H fixture: ${fixture}`);
  for (const fixture of EXPECTED_STAGE4J_FIXTURES) assert.ok(stage4j.has(fixture), `Missing Stage 4J fixture: ${fixture}`);
});

test('Stage 4H valid JSON fixtures normalize as complete primary submissions', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'valid-human-output-coder-a.json');
  installFixture(workspace, 'valid-human-output-coder-b.json');

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);

  const normalized = outputJSON(workspace, 'normalized-human-runs.json');
  const report = outputJSON(workspace, 'human-output-validation-report.json');
  assert.equal(normalized.status, 'valid');
  assert.deepEqual(normalized.submissions.map(submission => submission.coder_id), ['human_coder_a', 'human_coder_b']);
  assert.equal(report.totals.primary_coders, 2);
  assert.equal(report.totals.normalized_items, 4);
});

test('Stage 4H valid CSV fixture normalizes through the canonical flattened contract', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'valid-human-output.csv');

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);

  const normalized = outputJSON(workspace, 'normalized-human-runs.json');
  assert.equal(normalized.status, 'partial_execution');
  assert.equal(normalized.submissions[0].source_format, 'csv');
  assert.equal(normalized.submissions[0].items.length, 2);
});

test('Stage 4H invalid fixtures cover missing fields, bad sentence IDs, and packet hash mismatch', t => {
  const workspace = copyWorkspace(t);
  installFixture(workspace, 'invalid-human-output-missing-fields.json');
  installFixture(workspace, 'invalid-human-output-bad-sentence-id.json');
  const mismatched = readJSON(path.join(STAGE4H_FIXTURE_DIR, 'valid-human-output-coder-a.json'));
  mismatched.submission_id = 'fixture_human_packet_hash_mismatch';
  mismatched.input_packet_hash = '0'.repeat(64);
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-output-submissions', 'invalid-human-output-packet-hash.json'),
    JSON.stringify(mismatched, null, 2)
  );

  const result = runIngest(workspace);
  assert.notEqual(result.status, 0);

  const report = outputJSON(workspace, 'human-output-validation-report.json');
  const codes = new Set(findings(report).map(finding => finding.code));
  assert.ok(codes.has('schema_required'));
  assert.ok(codes.has('unknown_sentence_id'));
  assert.ok(codes.has('packet_sentence_mismatch'));
  assert.ok(codes.has('packet_hash_mismatch'));
});

test('Stage 4H sample disagreement fixture covers classification scenarios', () => {
  const fixture = readJSON(path.join(STAGE4H_FIXTURE_DIR, 'sample-human-disagreement-log.json'));
  const categories = new Set(fixture.disagreements.map(item => item.disagreement_category));
  const classifications = new Set(fixture.disagreements.map(item => item.expected_classification));
  assert.ok(categories.has('koenigsberg_function'));
  assert.ok(categories.has('agency_or_absence_flag'));
  assert.ok(classifications.has('substantive_interpretive_disagreement'));
  assert.ok(classifications.has('mandatory_human_review'));
  assert.ok(fixture.disagreements.every(item => item.requires_stage4j));
});

test('Stage 4J valid JSON and CSV fixtures satisfy the adjudication contract', () => {
  const jsonFixture = readJSON(path.join(STAGE4J_FIXTURE_DIR, 'valid-adjudication-decisions.json'));
  const csvRows = parseCSV(fs.readFileSync(path.join(STAGE4J_FIXTURE_DIR, 'valid-adjudication-decisions.csv'), 'utf8'));
  assert.deepEqual(validateAdjudicationFixture(jsonFixture), []);
  assert.deepEqual(csvRows.map(row => row.decision), jsonFixture.decisions.map(decision => decision.decision));
  assert.ok(csvRows.every(row => row.rationale));
});

test('Stage 4J invalid fixtures cover bad IDs, bad values, and missing decisions', () => {
  const badId = readJSON(path.join(STAGE4J_FIXTURE_DIR, 'invalid-adjudication-decision-bad-id.json'));
  const badValue = readJSON(path.join(STAGE4J_FIXTURE_DIR, 'invalid-adjudication-decision-bad-value.json'));
  const missing = {
    ...readJSON(path.join(STAGE4J_FIXTURE_DIR, 'valid-adjudication-decisions.json')),
    decisions: []
  };

  assert.ok(validateAdjudicationFixture(badId).some(finding => finding.code === 'unknown_disagreement_id'));
  assert.ok(validateAdjudicationFixture(badValue).some(finding => finding.code === 'invalid_adjudication_decision'));
  assert.ok(validateAdjudicationFixture(missing).some(finding => finding.code === 'missing_adjudication_decisions'));
});

test('Stage 4J codebook revision notes fixture preserves Stage 4A immutability policy', () => {
  const notes = fs.readFileSync(path.join(STAGE4J_FIXTURE_DIR, 'sample-codebook-revision-notes.md'), 'utf8');
  assert.match(notes, /fixture-only/);
  assert.match(notes, /do not authorize edits to Stage 4A/);
  assert.match(notes, /migration candidate/);
});
