const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const VALIDATION_INVENTORY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-validation-inventory.json');
const CORE_INVENTORY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-core-inventory.json');
const INVENTORY_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-inventory.schema.json');
const DOCUMENT_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-document.schema.json');
const MARKDOWN_PATH = path.join(ROOT, 'docs', 'corpus', 'corpus-v4-validation-inventory.md');

const REQUIRED_STRATA = [
  'additional_lincoln_douglas_debate_material',
  'annual_messages',
  'proclamations',
  'military_letters',
  'public_letters',
  'private_letters',
  'condolence_letters',
  'thanksgiving_and_national_ritual_proclamations',
  'emancipation_related_documents',
  'black_soldier_and_emancipation_related_documents',
  'war_powers',
  'sacrifice',
  'providence',
  'reconstruction',
  'negative_findings',
  'period_coverage',
  'genre_coverage'
];

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function inventoryValidator() {
  const inventorySchema = readJSON(INVENTORY_SCHEMA_PATH);
  const documentSchema = readJSON(DOCUMENT_SCHEMA_PATH);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(documentSchema, 'corpus-document.schema.json');
  return ajv.compile(inventorySchema);
}

function errorText(validate) {
  return JSON.stringify(validate.errors || []);
}

function recordsById(inventory) {
  return new Map(inventory.documents.map(record => [record.doc_id, record]));
}

test('v4 validation inventory validates against inventory and document schemas', () => {
  const validate = inventoryValidator();
  const inventory = readJSON(VALIDATION_INVENTORY_PATH);
  assert.equal(validate(inventory), true, errorText(validate));
});

test('v4 validation inventory is in the 75 to 100 document target range', () => {
  const inventory = readJSON(VALIDATION_INVENTORY_PATH);
  assert.equal(inventory.document_count, inventory.documents.length);
  assert.ok(inventory.document_count >= 75, 'validation inventory should contain at least 75 documents');
  assert.ok(inventory.document_count <= 100, 'validation inventory should contain at most 100 documents');
  assert.equal(inventory.tier_counts.v4_validation, inventory.document_count);
  assert.equal(inventory.tier_counts.v4_reference, 0);
});

test('v4 validation inventory includes every v4 core document', () => {
  const validationInventory = readJSON(VALIDATION_INVENTORY_PATH);
  const coreInventory = readJSON(CORE_INVENTORY_PATH);
  const validationById = recordsById(validationInventory);

  for (const coreRecord of coreInventory.documents) {
    const validationRecord = validationById.get(coreRecord.doc_id);
    assert.ok(validationRecord, `${coreRecord.doc_id} missing from validation inventory`);
    assert.equal(validationRecord.included_in_v4_core, coreRecord.included_in_v4_core);
    assert.equal(validationRecord.included_in_v4_validation, true);
    assert.equal(validationRecord.title, coreRecord.title);
  }
});

test('additional validation records are selected by strata and remain lightly annotated', () => {
  const inventory = readJSON(VALIDATION_INVENTORY_PATH);
  const additions = inventory.documents.filter(record => record.corpus_tier === 'v4-validation');
  const strata = new Set(additions.flatMap(record => record.research_relevance));

  assert.equal(additions.length, 30);
  for (const stratum of REQUIRED_STRATA) {
    assert.ok(strata.has(stratum), `missing validation stratum ${stratum}`);
  }

  for (const record of additions) {
    assert.equal(record.included_in_v1, false);
    assert.equal(record.included_in_v4_core, false);
    assert.equal(record.included_in_v4_validation, true);
    assert.equal(record.annotation_status, 'lightly_annotated');
    assert.match(record.provenance_notes, /Provenance placeholder/);
    assert.ok(record.selection_rationale.length > 0, `${record.doc_id} missing selection rationale`);
    assert.ok(record.rhetorical_function.length > 0, `${record.doc_id} missing rhetorical function`);
    assert.ok(record.research_relevance.length > 0, `${record.doc_id} missing research relevance`);
  }
});

test('v4 validation inventory stays within Lincoln project scope', () => {
  const inventory = readJSON(VALIDATION_INVENTORY_PATH);
  for (const record of inventory.documents) {
    assert.ok(record.year <= 1865, `${record.doc_id} is outside Lincoln-era project scope`);
    assert.equal(/post-assassination|Johnson|December 5, 1865/i.test(record.source_citation), false);
  }
});

test('v4 validation markdown stays in sync and marks the corpus as not fully interpreted', () => {
  const inventory = readJSON(VALIDATION_INVENTORY_PATH);
  const markdown = fs.readFileSync(MARKDOWN_PATH, 'utf8');

  assert.match(markdown, /\| Total validation inventory records \| 78 \|/);
  assert.match(markdown, /\| Included v4-core records \| 48 \|/);
  assert.match(markdown, /\| Additional validation candidates \| 30 \|/);
  assert.match(markdown, /not fully interpreted Stage 4 evidence/i);
  assert.match(markdown, /lightly_annotated/);

  for (const record of inventory.documents) {
    assert.match(markdown, new RegExp(`\\\\| ${record.doc_id} \\\\|`), `${record.doc_id} missing from markdown`);
  }
});
