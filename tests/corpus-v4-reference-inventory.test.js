const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const INVENTORY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-reference-inventory.json');
const CORE_INVENTORY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-core-inventory.json');
const VALIDATION_INVENTORY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-validation-inventory.json');
const INVENTORY_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-inventory.schema.json');
const DOCUMENT_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-document.schema.json');
const MARKDOWN_PATH = path.join(ROOT, 'docs', 'corpus', 'corpus-v4-reference-inventory.md');

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

test('v4 reference inventory validates against the inventory and document schemas', () => {
  const validate = inventoryValidator();
  const inventory = readJSON(INVENTORY_PATH);
  assert.equal(validate(inventory), true, errorText(validate));
});

test('v4 reference inventory uses deterministic reference IDs and counts', () => {
  const inventory = readJSON(INVENTORY_PATH);
  const expectedIds = Array.from({ length: 18 }, (_, index) => `doc_${String(index + 73).padStart(3, '0')}`);
  const actualIds = inventory.documents.map(record => record.doc_id);

  assert.equal(inventory.document_count, 18);
  assert.equal(inventory.tier_counts.v1, 0);
  assert.equal(inventory.tier_counts.v4_core, 0);
  assert.equal(inventory.tier_counts.v4_validation, 0);
  assert.equal(inventory.tier_counts.v4_reference, 18);
  assert.deepEqual(actualIds, expectedIds);
  assert.equal(new Set(actualIds).size, actualIds.length);
});

test('v4 reference records remain search-only and are not annotated evidence', () => {
  const inventory = readJSON(INVENTORY_PATH);

  for (const record of inventory.documents) {
    assert.equal(record.corpus_tier, 'v4-reference');
    assert.equal(record.included_in_v1, false);
    assert.equal(record.included_in_v4_core, false);
    assert.equal(record.included_in_v4_validation, false);
    assert.equal(record.included_in_v4_reference, true);
    assert.notEqual(record.annotation_status, 'fully_annotated');
    assert.ok(record.title.length > 0, `${record.doc_id} missing title`);
    assert.ok(record.date.length > 0, `${record.doc_id} missing date`);
    assert.ok(record.source_authority.length > 0, `${record.doc_id} missing source authority`);
    assert.ok(record.provenance_notes.length > 0, `${record.doc_id} missing provenance notes`);
    assert.match(record.provenance_notes, /Reference-only/i);
    assert.ok(record.selection_rationale.length > 0, `${record.doc_id} missing selection rationale`);
  }
});

test('v4 reference inventory supports incremental promotion without blurring tiers', () => {
  const inventory = readJSON(INVENTORY_PATH);
  const promotionCandidates = inventory.documents.filter(record =>
    record.research_relevance.includes('candidate_for_validation') ||
    record.research_relevance.includes('promotion_context')
  );

  assert.ok(promotionCandidates.length >= 4, 'reference inventory should mark plausible promotion candidates');
  assert.match(inventory.description, /must not enter Stage 4 interpretive counts/i);
});

test('v4 reference inventory does not duplicate selected core or validation records', () => {
  const referenceInventory = readJSON(INVENTORY_PATH);
  const coreInventory = readJSON(CORE_INVENTORY_PATH);
  const validationInventory = readJSON(VALIDATION_INVENTORY_PATH);
  const selectedRecords = new Set(
    coreInventory.documents.concat(validationInventory.documents).map(record => `${record.title}|${record.date}`)
  );

  for (const record of referenceInventory.documents) {
    assert.equal(
      selectedRecords.has(`${record.title}|${record.date}`),
      false,
      `${record.doc_id} duplicates a selected core or validation record`
    );
  }
});

test('v4 reference markdown stays in sync and documents reference-corpus limits', () => {
  const inventory = readJSON(INVENTORY_PATH);
  const markdown = fs.readFileSync(MARKDOWN_PATH, 'utf8');

  assert.match(markdown, /\| Total reference inventory records \| 18 \|/);
  assert.match(markdown, /\| Included v4-core records \| 0 \|/);
  assert.match(markdown, /\| Included validation records \| 0 \|/);
  assert.match(markdown, /not fully annotated Stage 4 evidence/i);
  assert.match(markdown, /must not be counted/i);
  assert.match(markdown, /promoted only through a later tracked issue/i);

  for (const record of inventory.documents) {
    assert.match(markdown, new RegExp(`\\\\| ${record.doc_id} \\\\|`), `${record.doc_id} missing from markdown`);
  }
});
