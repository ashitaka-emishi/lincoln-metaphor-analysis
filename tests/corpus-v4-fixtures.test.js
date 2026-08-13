const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'corpus-v4');
const DOCUMENT_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-document.schema.json');
const INVENTORY_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-inventory.schema.json');
const PROVENANCE_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-provenance.schema.json');
const SOURCE_REGISTER_PATH = path.join(ROOT, 'corpus', 'provenance', 'source-authority-register.json');

function readJSON(fileName) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, fileName), 'utf8'));
}

function schemaJSON(schemaPath) {
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

function documentValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schemaJSON(DOCUMENT_SCHEMA_PATH));
}

function inventoryValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(schemaJSON(DOCUMENT_SCHEMA_PATH), 'corpus-document.schema.json');
  return ajv.compile(schemaJSON(INVENTORY_SCHEMA_PATH));
}

function provenanceValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schemaJSON(PROVENANCE_SCHEMA_PATH));
}

function provenanceEnvelope(record) {
  return {
    provenance_id: 'corpus_provenance_v4_fixture',
    corpus_version: 'v4',
    created_date: '2026-08-13',
    description: 'Fixture provenance wrapper for a single v4 test record.',
    source_authority_register: 'corpus/provenance/source-authority-register.json',
    provenance_count: 1,
    records: [record]
  };
}

function errorText(validate) {
  return JSON.stringify(validate.errors || []);
}

function flattenSentences(segmented) {
  return segmented.sections.flatMap(section =>
    section.paragraphs.flatMap(paragraph => paragraph.sentences)
  );
}

test('corpus-v4 fixtures include the expected issue #133 fixture files', () => {
  const expected = [
    'valid-corpus-document.json',
    'invalid-corpus-document-missing-title.json',
    'invalid-corpus-document-bad-tier.json',
    'valid-corpus-inventory.json',
    'invalid-corpus-inventory-duplicate-doc-id.json',
    'valid-provenance-record.json',
    'invalid-provenance-record-unknown-source.json',
    'sample-raw-document.txt',
    'sample-segmented-document.json',
    'sample-coverage-summary.json'
  ];

  for (const fileName of expected) {
    assert.ok(fs.existsSync(path.join(FIXTURE_DIR, fileName)), `${fileName} fixture is missing`);
  }
});

test('corpus-v4 document fixtures cover valid and invalid metadata', () => {
  const validate = documentValidator();

  assert.equal(validate(readJSON('valid-corpus-document.json')), true, errorText(validate));
  assert.equal(validate(readJSON('invalid-corpus-document-missing-title.json')), false);
  assert.match(errorText(validate), /title/);
  assert.equal(validate(readJSON('invalid-corpus-document-bad-tier.json')), false);
  assert.match(errorText(validate), /corpus_tier/);
});

test('corpus-v4 inventory fixtures validate shape and expose duplicate doc IDs', () => {
  const validate = inventoryValidator();
  const validInventory = readJSON('valid-corpus-inventory.json');
  const duplicateInventory = readJSON('invalid-corpus-inventory-duplicate-doc-id.json');

  assert.equal(validate(validInventory), true, errorText(validate));
  assert.equal(validate(duplicateInventory), true, errorText(validate));

  const docIds = duplicateInventory.documents.map(document => document.doc_id);
  assert.notEqual(new Set(docIds).size, docIds.length);
});

test('corpus-v4 provenance fixtures validate shape and unknown source semantics', () => {
  const validate = provenanceValidator();
  const register = JSON.parse(fs.readFileSync(SOURCE_REGISTER_PATH, 'utf8'));
  const registeredSources = new Set(register.source_authorities.map(source => source.source_id));
  const validRecord = readJSON('valid-provenance-record.json');
  const invalidRecord = readJSON('invalid-provenance-record-unknown-source.json');

  assert.equal(validate(provenanceEnvelope(validRecord)), true, errorText(validate));
  assert.ok(registeredSources.has(validRecord.source_id));

  assert.equal(validate(provenanceEnvelope(invalidRecord)), true, errorText(validate));
  assert.equal(registeredSources.has(invalidRecord.source_id), false);
});

test('corpus-v4 raw, inventory, segmented, and coverage fixtures map to one document', () => {
  const inventory = readJSON('valid-corpus-inventory.json');
  const segmented = readJSON('sample-segmented-document.json');
  const coverage = readJSON('sample-coverage-summary.json');
  const rawText = fs.readFileSync(path.join(FIXTURE_DIR, 'sample-raw-document.txt'), 'utf8');
  const [document] = inventory.documents;
  const sentences = flattenSentences(segmented);

  assert.equal(document.doc_id, 'doc_901');
  assert.equal(segmented.document_id, document.doc_id);
  assert.match(rawText, new RegExp(`^${document.title}`));
  assert.match(rawText, new RegExp(`Date: ${document.date}`));
  assert.equal(coverage.document_count, inventory.document_count);
  assert.equal(coverage.sentence_count, sentences.length);
});

test('corpus-v4 segmented fixture uses stable sentence IDs scoped to the document', () => {
  const segmented = readJSON('sample-segmented-document.json');
  const sentences = flattenSentences(segmented);
  const sentenceIds = sentences.map(sentence => sentence.sentence_id);

  assert.equal(new Set(sentenceIds).size, sentenceIds.length);
  for (const sentenceId of sentenceIds) {
    assert.match(sentenceId, /^doc_901_s[0-9]{2}_p[0-9]{2}_s[0-9]{2}$/);
  }
});
