const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_SCRIPT = path.join(ROOT, 'scripts', 'stage4j', 'generate-adjudication-results.js');
const QUEUE_RELATIVE = 'data/reliability/human-adjudication/stage4j-adjudication-queue.json';
const DECISIONS_RELATIVE = 'data/reliability/human-adjudication/stage4j-adjudication-decisions-normalized.json';

function copyWorkspace(t, overrides = {}) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4j-results-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-adjudication'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-comparison'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'docs', 'methodology'), { recursive: true });
  fs.writeFileSync(path.join(workspace, QUEUE_RELATIVE), JSON.stringify(
    overrides.queue || readJSON(path.join(ROOT, QUEUE_RELATIVE)), null, 2
  ) + '\n');
  fs.writeFileSync(path.join(workspace, DECISIONS_RELATIVE), JSON.stringify(
    overrides.decisions || readJSON(path.join(ROOT, DECISIONS_RELATIVE)), null, 2
  ) + '\n');
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-adjudication', 'stage4j-stage4a-correction-candidates.json'),
    JSON.stringify(overrides.correctionCandidates || readJSON(path.join(
      ROOT,
      'data',
      'reliability',
      'human-adjudication',
      'stage4j-stage4a-correction-candidates.json'
    )), null, 2) + '\n'
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

function runResults(workspace, args = []) {
  return spawnSync(process.execPath, [RESULTS_SCRIPT, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4J_ROOT: workspace, STAGE4H_ROOT: workspace }
  });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
    coder_a_id: 'human_coder_a',
    coder_b_id: 'human_coder_b',
    coder_a_value: 'yes',
    coder_b_value: 'no',
    stage4a_reference_value: 'yes',
    affected_claim_ids: ['CLAIM-001'],
    review_question: 'Resolve metaphor presence.',
    ...overrides
  };
}

function normalizedDecision(overrides = {}) {
  return {
    source_file: 'data/reliability/human-adjudication/stage4j-adjudication-decisions.json',
    source_format: 'json',
    source_sha256: '0'.repeat(64),
    adjudication_id: 'stage4j_0001',
    disagreement_id: 'stage4h_disagreement_0001',
    packet_unit_id: 'stage4h_field_00001',
    doc_id: 'doc_001',
    sentence_id: 'doc_001_s01_p01_s01',
    field_name: 'metaphor_present',
    decision: 'synthesize',
    adjudicated_value: 'yes',
    rationale: 'Adjudicator records the strongest supported reading.',
    codebook_change_needed: 'yes',
    codebook_change_type: 'definition',
    stage4a_correction_candidate: 'yes',
    requires_claim_audit_review: 'yes',
    adjudicator: 'adjudicator_1',
    adjudication_date: '2026-08-12',
    notes: 'Review the claim audit language.',
    queue_context: {
      priority: 'high',
      disagreement_category: 'metaphor_identification',
      agreement_pattern: 'human_disagreement',
      coder_a_value: 'yes',
      coder_b_value: 'no',
      stage4a_reference_value: 'no',
      affected_claim_ids: ['CLAIM-001']
    },
    ...overrides
  };
}

function populatedArtifacts() {
  const itemOne = queueItem();
  const itemTwo = queueItem({
    adjudication_id: 'stage4j_0002',
    disagreement_id: 'stage4h_disagreement_0002',
    packet_unit_id: 'stage4h_field_00002',
    priority: 'medium',
    field_name: 'source_domain',
    coder_a_value: 'inheritance',
    coder_b_value: 'property',
    stage4a_reference_value: 'inheritance',
    affected_claim_ids: []
  });
  const decisionOne = normalizedDecision();
  const decisionTwo = normalizedDecision({
    adjudication_id: 'stage4j_0002',
    disagreement_id: 'stage4h_disagreement_0002',
    packet_unit_id: 'stage4h_field_00002',
    field_name: 'source_domain',
    decision: 'defer',
    adjudicated_value: null,
    rationale: 'Requires adjudicator follow-up.',
    codebook_change_needed: 'no',
    codebook_change_type: 'none',
    stage4a_correction_candidate: 'no',
    requires_claim_audit_review: 'no',
    queue_context: {
      priority: 'medium',
      disagreement_category: 'cmt_mapping',
      agreement_pattern: 'human_disagreement',
      coder_a_value: 'inheritance',
      coder_b_value: 'property',
      stage4a_reference_value: 'inheritance',
      affected_claim_ids: []
    }
  });
  const correction = {
    adjudication_id: decisionOne.adjudication_id,
    doc_id: decisionOne.doc_id,
    sentence_id: decisionOne.sentence_id,
    field_name: decisionOne.field_name,
    stage4a_reference_value: decisionOne.queue_context.stage4a_reference_value,
    adjudicated_value: decisionOne.adjudicated_value,
    decision: decisionOne.decision,
    rationale: decisionOne.rationale,
    requires_claim_audit_review: decisionOne.requires_claim_audit_review,
    notes: decisionOne.notes
  };
  return {
    queue: {
      schema_version: 'stage4j-adjudication-queue-1.0',
      status: 'review_ready',
      packet_id: 'stage4h_fixture',
      input_packet_hash: '0'.repeat(64),
      adjudication_policy: 'Stage 4J adjudication resolves human-coder disagreements for review.',
      mutation_policy: 'Stage 4A correction candidates require a separate migration.',
      decision_values: ['accept_coder_a', 'accept_coder_b', 'accept_stage4a', 'synthesize', 'mark_uncertain', 'exclude', 'defer'],
      totals: {
        queue_items: 2,
        high_priority: 1,
        medium_priority: 1,
        low_priority: 0,
        agency_or_absence_items: 0,
        disease_or_purification_items: 0
      },
      items: [itemOne, itemTwo]
    },
    decisions: {
      schema_version: 'stage4j-adjudication-decisions-normalized-1.0',
      status: 'valid',
      source_schema: 'schemas/stage4j-adjudication.schema.json',
      source_adjudication_queue: QUEUE_RELATIVE,
      decision_files: ['data/reliability/human-adjudication/stage4j-adjudication-decisions.json'],
      totals: {
        decision_files: 1,
        valid_files: 1,
        invalid_files: 0,
        valid_decisions: 2,
        queue_items: 2,
        missing_decisions: 0,
        stage4a_correction_candidates: 1,
        errors: 0,
        warnings: 0
      },
      decisions: [decisionOne, decisionTwo],
      missing_decision_ids: [],
      stage4a_correction_candidates: [correction]
    },
    correctionCandidates: {
      schema_version: 'stage4j-stage4a-correction-candidates-1.0',
      status: 'review_ready',
      source_normalized_decisions: DECISIONS_RELATIVE,
      mutation_policy: 'Correction candidates are review-only and do not modify Stage 4A.',
      candidates: [correction]
    }
  };
}

test('Stage 4J results page renders pending no-decision state', t => {
  const workspace = copyWorkspace(t);
  const result = runResults(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /pending/);

  const page = fs.readFileSync(path.join(workspace, 'docs', 'methodology', 'stage4j-adjudication-results.md'), 'utf8');
  assert.match(page, /# Stage 4J Adjudication Results/);
  for (const section of ['Purpose', 'Inputs', 'Decision Counts', 'High-Priority Cases', 'Stage 4A Correction Candidates', 'Codebook Change Candidates', 'Claim-Audit Review Candidates', 'Deferred Cases', 'Limits']) {
    assert.match(page, new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
  assert.match(page, /Human Inter-Annotator Reliability Results/);
  assert.match(page, /No completed adjudication decisions are available yet/);
  assert.match(page, /does not apply a Stage 4A mutation/);
});

test('Stage 4J results page summarizes populated adjudication implications', t => {
  const artifacts = populatedArtifacts();
  const workspace = copyWorkspace(t, artifacts);
  const result = runResults(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /2 decision/);

  const page = fs.readFileSync(path.join(workspace, 'docs', 'methodology', 'stage4j-adjudication-results.md'), 'utf8');
  assert.match(page, /Status: \*\*valid\*\*/);
  assert.match(page, /Stage 4A correction candidates[\s\S]*stage4j_0001/);
  assert.match(page, /Codebook Change Candidates[\s\S]*definition/);
  assert.match(page, /Claim-Audit Review Candidates[\s\S]*stage4j_0001/);
  assert.match(page, /Deferred Cases[\s\S]*stage4j_0002/);
});

test('Stage 4J results page rejects stale correction-candidate exports', t => {
  const artifacts = populatedArtifacts();
  artifacts.correctionCandidates.candidates = [];
  const workspace = copyWorkspace(t, artifacts);
  const result = runResults(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /correction-candidate export is stale/);
});
