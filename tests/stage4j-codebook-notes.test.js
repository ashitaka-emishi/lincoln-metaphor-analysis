const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const NOTES_SCRIPT = path.join(ROOT, 'scripts', 'stage4j', 'generate-codebook-revision-notes.js');
const DISAGREEMENT_RELATIVE = 'data/reliability/human-comparison/human-disagreement-log.json';
const DECISIONS_RELATIVE = 'data/reliability/human-adjudication/stage4j-adjudication-decisions-normalized.json';

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function copyWorkspace(t, overrides = {}) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4j-notes-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-comparison'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-adjudication'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'docs', 'methodology'), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, DISAGREEMENT_RELATIVE),
    JSON.stringify(overrides.disagreement || readJSON(path.join(ROOT, DISAGREEMENT_RELATIVE)), null, 2) + '\n'
  );
  fs.writeFileSync(
    path.join(workspace, DECISIONS_RELATIVE),
    JSON.stringify(overrides.decisions || readJSON(path.join(ROOT, DECISIONS_RELATIVE)), null, 2) + '\n'
  );
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-reliability-report.json'),
    JSON.stringify(overrides.reliabilityReport || readJSON(path.join(
      ROOT,
      'data',
      'reliability',
      'human-comparison',
      'human-reliability-report.json'
    )), null, 2) + '\n'
  );
  return workspace;
}

function runNotes(workspace, args = []) {
  return spawnSync(process.execPath, [NOTES_SCRIPT, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4J_ROOT: workspace, STAGE4H_ROOT: workspace }
  });
}

function disagreement(overrides = {}) {
  return {
    disagreement_id: 'stage4h_disagreement_0001',
    packet_unit_id: 'stage4h_field_00001',
    reliability_unit_id: 'unit_fixture',
    source_audit_ids: ['AUDIT-001'],
    affected_claim_ids: ['CLAIM-001'],
    affected_claim_titles: ['Fixture claim'],
    doc_id: 'doc_001',
    document_short_title: 'Lyceum Address',
    sentence_id: 'doc_001_s01_p01_s01',
    sentence_text: 'Fixture sentence.',
    span_text: 'Fixture span.',
    task_type: 'field_agreement',
    field_name: 'lexical_unit_boundary',
    disagreement_category: 'lexical_boundary',
    agreement_pattern: 'human_split',
    agreement_pattern_flags: ['split_human_values'],
    boundary_pattern: 'partial_overlap',
    coder_a_value: 'legal inheritors',
    coder_b_value: 'inheritors',
    stage4a_reference_value: 'legal inheritors',
    requires_human_adjudication: true,
    major_document_flag: false,
    major_document_label: null,
    major_synthesis_claim_flag: true,
    agency_or_absence_flag: false,
    disease_or_purification_flag: false,
    ...overrides
  };
}

function decision(overrides = {}) {
  return {
    source_file: 'data/reliability/human-adjudication/stage4j-adjudication-decisions.json',
    source_format: 'json',
    source_sha256: '0'.repeat(64),
    adjudication_id: 'stage4j_0001',
    disagreement_id: 'stage4h_disagreement_0001',
    packet_unit_id: 'stage4h_field_00001',
    doc_id: 'doc_001',
    sentence_id: 'doc_001_s01_p01_s01',
    field_name: 'lexical_unit_boundary',
    decision: 'synthesize',
    adjudicated_value: 'legal inheritors',
    rationale: 'Clarify boundary guidance around determiner inclusion.',
    codebook_change_needed: 'yes',
    codebook_change_type: 'boundary_rule',
    stage4a_correction_candidate: 'no',
    requires_claim_audit_review: 'no',
    adjudicator: 'adjudicator_1',
    adjudication_date: '2026-08-12',
    notes: '',
    queue_context: {
      priority: 'high',
      disagreement_category: 'lexical_boundary',
      agreement_pattern: 'human_split',
      coder_a_value: 'legal inheritors',
      coder_b_value: 'inheritors',
      stage4a_reference_value: 'legal inheritors',
      affected_claim_ids: ['CLAIM-001']
    },
    ...overrides
  };
}

function populatedArtifacts() {
  const records = [
    disagreement(),
    disagreement({
      disagreement_id: 'stage4h_disagreement_0002',
      field_name: 'disease_or_purification_present',
      disagreement_category: 'disease_or_purification_flag',
      coder_a_value: 'yes',
      coder_b_value: 'no',
      disease_or_purification_flag: true
    })
  ];
  const decisions = [
    decision(),
    decision({
      adjudication_id: 'stage4j_0002',
      disagreement_id: 'stage4h_disagreement_0002',
      field_name: 'disease_or_purification_present',
      decision: 'defer',
      adjudicated_value: null,
      rationale: 'Needs a narrower disease/purification example before acceptance.',
      codebook_change_needed: 'no',
      codebook_change_type: 'none',
      queue_context: {
        priority: 'medium',
        disagreement_category: 'disease_or_purification_flag',
        agreement_pattern: 'human_split',
        coder_a_value: 'yes',
        coder_b_value: 'no',
        stage4a_reference_value: 'no',
        affected_claim_ids: []
      }
    })
  ];
  const reliabilityReport = readJSON(path.join(ROOT, 'data', 'reliability', 'human-comparison', 'human-reliability-report.json'));
  reliabilityReport.status = 'complete_enough_for_metrics';
  reliabilityReport.totals.primary_human_coders = 2;
  reliabilityReport.summaries.cmt_mapping = [['`cluster_id`', '5/5', '100%']];
  return {
    disagreement: {
      schema_version: 'stage4h-human-disagreement-log-1.0',
      status: 'review_ready',
      source_human_agreement: 'data/reliability/human-comparison/human-agreement-results.json',
      source_normalized_runs: 'data/reliability/human-comparison/normalized-human-runs.json',
      source_human_vs_reference: 'data/reliability/human-comparison/human-vs-reference-results.json',
      source_claim_audit: 'data/audit/claim-audit.json',
      packet_id: 'stage4h_fixture',
      input_packet_hash: '0'.repeat(64),
      policy: 'Human disagreement categories are Stage 4J review signals.',
      totals: {
        primary_human_coders: 2,
        disagreements: records.length,
        requires_human_adjudication: records.length,
        major_document_disagreements: 0,
        major_synthesis_claim_disagreements: 1,
        agency_or_absence_disagreements: 0,
        disease_or_purification_disagreements: 1
      },
      category_counts: { lexical_boundary: 1, disease_or_purification_flag: 1 },
      agreement_pattern_counts: { human_split: 2 },
      disagreements: records
    },
    decisions: {
      schema_version: 'stage4j-adjudication-decisions-normalized-1.0',
      status: 'valid',
      source_schema: 'schemas/stage4j-adjudication.schema.json',
      source_adjudication_queue: 'data/reliability/human-adjudication/stage4j-adjudication-queue.json',
      decision_files: ['data/reliability/human-adjudication/stage4j-adjudication-decisions.json'],
      totals: {
        decision_files: 1,
        valid_files: 1,
        invalid_files: 0,
        valid_decisions: decisions.length,
        queue_items: 2,
        missing_decisions: 0,
        stage4a_correction_candidates: 0,
        errors: 0,
        warnings: 0
      },
      decisions,
      missing_decision_ids: [],
      stage4a_correction_candidates: []
    },
    reliabilityReport
  };
}

test('codebook notes render pending no-submission state', t => {
  const workspace = copyWorkspace(t);
  const result = runNotes(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /pending human submissions/);
  const page = fs.readFileSync(path.join(workspace, 'docs', 'methodology', 'stage4h-codebook-revision-notes.md'), 'utf8');
  assert.match(page, /# Stage 4H\/4J Codebook Revision Notes/);
  for (const section of [
    'Purpose',
    'Categories Confirmed as Stable',
    'Categories Needing Clarification',
    'Metaphor Identification Notes',
    'Lexical Boundary Notes',
    'CMT Mapping Notes',
    'Koenigsberg Layer Notes',
    'Absence and Agency Notes',
    'Disease and Purification Notes',
    'Confidence and Ambiguity Notes',
    'Recommended Changes',
    'Accepted Changes',
    'Deferred Changes',
    'Impact on Future Human Coding'
  ]) {
    assert.match(page, new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
  assert.match(page, /No category is confirmed stable/);
  assert.match(page, /do not retroactively alter Stage 4A/);
});

test('codebook notes distinguish recommended, accepted, and deferred changes', t => {
  const workspace = copyWorkspace(t, populatedArtifacts());
  const result = runNotes(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 recommended, 1 accepted/);
  const page = fs.readFileSync(path.join(workspace, 'docs', 'methodology', 'stage4h-codebook-revision-notes.md'), 'utf8');
  assert.match(page, /Categories Confirmed as Stable[\s\S]*cmt mapping/);
  assert.match(page, /Lexical Boundary Notes[\s\S]*boundary rule/);
  assert.match(page, /Disease and Purification Notes[\s\S]*stage4h_disagreement_0002/);
  assert.match(page, /Accepted Changes[\s\S]*stage4j_0001/);
  assert.match(page, /Deferred Changes[\s\S]*stage4j_0002/);
  assert.match(page, /Stage 4A remains unchanged unless a separate migration is authorized/);
});

test('codebook notes reject stale disagreement totals', t => {
  const artifacts = populatedArtifacts();
  artifacts.disagreement.totals.disagreements = 99;
  const workspace = copyWorkspace(t, artifacts);
  const result = runNotes(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /disagreement total does not match/);
});
