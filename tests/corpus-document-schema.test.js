const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-document.schema.json');

function validator() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function validDocument(overrides = {}) {
  return {
    doc_id: 'doc_029',
    corpus_version: 'v4',
    corpus_tier: 'v4-core',
    title: 'Annual Message to Congress',
    short_title: 'Annual Message 1863',
    date: '1863-12-08',
    date_precision: 'exact',
    year: 1863,
    period: 'emancipation',
    genre: 'annual_message',
    audience: 'congress',
    rhetorical_function: ['wartime_accounting', 'policy_justification'],
    research_relevance: ['congressional_message_control', 'emancipation_period_coverage'],
    source_authority: 'Collected Works of Abraham Lincoln',
    source_url: 'https://quod.lib.umich.edu/l/lincoln/',
    source_citation: 'Collected Works of Abraham Lincoln, vol. 7',
    edition_notes: 'Candidate v4 core record for schema validation.',
    text_status: 'complete',
    authorship_status: 'secure',
    included_in_v1: false,
    included_in_v4_core: true,
    included_in_v4_validation: true,
    included_in_v4_reference: true,
    annotation_status: 'fully_annotated',
    provenance_notes: 'Standard source authority; item-level citation pending inventory issue.',
    selection_rationale: 'Adds late-war congressional-message coverage not present in v1.',
    ...overrides
  };
}

function errorText(validate) {
  return JSON.stringify(validate.errors || []);
}

test('corpus document schema validates a v4 core document metadata record', () => {
  const validate = validator();
  const document = validDocument();
  assert.equal(validate(document), true, errorText(validate));
});

test('corpus document schema supports uncertain dates and disputed authorship', () => {
  const validate = validator();
  const document = validDocument({
    doc_id: 'doc_099',
    date: 'circa 1861',
    date_precision: 'uncertain',
    year: 1861,
    period: 'secession_crisis',
    genre: 'fragment',
    audience: 'general_unspecified',
    text_status: 'uncertain',
    authorship_status: 'disputed',
    edition_notes: 'Textual status and authorship require provenance review.',
    provenance_notes: 'Candidate manuscript tradition remains disputed.',
    selection_rationale: 'Useful as a caution-flagged boundary case for v4 metadata.'
  });
  assert.equal(validate(document), true, errorText(validate));
});

test('corpus document schema supports search-only reference records without full annotation', () => {
  const validate = validator();
  const document = validDocument({
    doc_id: 'doc_150',
    corpus_tier: 'v4-reference',
    included_in_v4_core: false,
    included_in_v4_validation: false,
    included_in_v4_reference: true,
    source_url: null,
    genre: 'other',
    audience: 'other',
    annotation_status: 'unprocessed',
    text_status: 'excerpt',
    selection_rationale: 'Search-only record retained for candidate discovery, not interpretive counting.'
  });
  assert.equal(validate(document), true, errorText(validate));
});

test('corpus document schema rejects invalid tiers, missing stratification fields, and overclaimed reference annotation', () => {
  const validate = validator();
  assert.equal(validate(validDocument({ corpus_tier: 'v4-general' })), false);
  assert.match(errorText(validate), /corpus_tier/);

  const missingAudience = validDocument();
  delete missingAudience.audience;
  assert.equal(validate(missingAudience), false);
  assert.match(errorText(validate), /audience/);

  assert.equal(validate(validDocument({
    corpus_tier: 'v4-reference',
    included_in_v4_reference: true,
    annotation_status: 'fully_annotated'
  })), false);
  assert.match(errorText(validate), /annotation_status/);
});
