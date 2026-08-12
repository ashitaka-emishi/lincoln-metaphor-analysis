const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'stage4j-adjudication.schema.json');

function validator() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function validDocument(overrides = {}) {
  return {
    schema_version: 'stage4j-adjudication-decisions-1.0',
    source_adjudication_queue: 'data/reliability/human-adjudication/stage4j-adjudication-queue.json',
    adjudication_batch_id: 'stage4j_batch_fixture',
    decisions: [
      {
        adjudication_id: 'stage4j_0001',
        doc_id: 'doc_001',
        sentence_id: 'doc_001_s01_p02_s03',
        field_name: 'cluster_id',
        decision: 'accept_coder_a',
        adjudicated_value: 'cluster_05_fathers_inheritance',
        rationale: 'Coder A matches the inherited civic-obligation frame in the sentence.',
        codebook_change_needed: 'no',
        codebook_change_type: 'none',
        stage4a_correction_candidate: 'no',
        requires_claim_audit_review: 'yes',
        adjudicator: 'stage4j_adjudicator_fixture',
        adjudication_date: '2026-08-12',
        notes: ''
      }
    ],
    ...overrides
  };
}

function firstDecision(overrides = {}) {
  const document = validDocument();
  document.decisions[0] = { ...document.decisions[0], ...overrides };
  return document;
}

function errorText(validate) {
  return JSON.stringify(validate.errors || []);
}

test('Stage 4J schema validates a completed adjudication decision file', () => {
  const validate = validator();
  const document = validDocument();
  assert.equal(validate(document), true, errorText(validate));
});

test('Stage 4J schema permits uncertainty and deferral without adjudicated values', () => {
  const validate = validator();
  assert.equal(validate(firstDecision({
    decision: 'mark_uncertain',
    adjudicated_value: null,
    rationale: 'Both coder readings remain plausible after review.'
  })), true, errorText(validate));
  assert.equal(validate(firstDecision({
    decision: 'defer',
    adjudicated_value: null,
    rationale: 'Decision deferred until provenance notes are reviewed.'
  })), true, errorText(validate));
});

test('Stage 4J schema separates codebook changes from Stage 4A correction candidates', () => {
  const validate = validator();
  assert.equal(validate(firstDecision({
    decision: 'synthesize',
    adjudicated_value: 'inheritance obligation',
    codebook_change_needed: 'yes',
    codebook_change_type: 'definition',
    stage4a_correction_candidate: 'no'
  })), true, errorText(validate));
  assert.equal(validate(firstDecision({
    decision: 'accept_coder_b',
    adjudicated_value: 'cluster_01_body_organism',
    codebook_change_needed: 'no',
    codebook_change_type: 'none',
    stage4a_correction_candidate: 'yes'
  })), true, errorText(validate));
});

test('Stage 4J schema rejects invalid decision values and inconsistent codebook fields', () => {
  const validate = validator();
  assert.equal(validate(firstDecision({ decision: 'invent_new_reference_value' })), false);
  assert.match(errorText(validate), /decision/);

  assert.equal(validate(firstDecision({
    codebook_change_needed: 'no',
    codebook_change_type: 'definition'
  })), false);
  assert.match(errorText(validate), /codebook_change_type/);

  assert.equal(validate(firstDecision({
    codebook_change_needed: 'yes',
    codebook_change_type: 'none'
  })), false);
  assert.match(errorText(validate), /codebook_change_type/);
});

test('Stage 4J schema rejects adjudicated values for defer and mark_uncertain decisions', () => {
  const validate = validator();
  assert.equal(validate(firstDecision({
    decision: 'defer',
    adjudicated_value: 'cluster_05_fathers_inheritance'
  })), false);
  assert.match(errorText(validate), /adjudicated_value/);
  assert.equal(validate(firstDecision({
    decision: 'mark_uncertain',
    adjudicated_value: 'uncertain'
  })), false);
  assert.match(errorText(validate), /adjudicated_value/);
});

test('Stage 4J schema exposes the expected CSV decision columns', () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  assert.deepEqual(schema['x-stage4j-csv'].decision_columns, [
    'adjudication_id',
    'doc_id',
    'sentence_id',
    'field_name',
    'decision',
    'adjudicated_value',
    'rationale',
    'codebook_change_needed',
    'codebook_change_type',
    'stage4a_correction_candidate',
    'requires_claim_audit_review',
    'adjudicator',
    'adjudication_date',
    'notes'
  ]);
});
