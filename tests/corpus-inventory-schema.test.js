const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const INVENTORY_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-inventory.schema.json');
const DOCUMENT_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-document.schema.json');

function validator() {
  const inventorySchema = JSON.parse(fs.readFileSync(INVENTORY_SCHEMA_PATH, 'utf8'));
  const documentSchema = JSON.parse(fs.readFileSync(DOCUMENT_SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(documentSchema, 'corpus-document.schema.json');
  return ajv.compile(inventorySchema);
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

function validInventory(overrides = {}) {
  return {
    inventory_id: 'corpus_inventory_v4_core_fixture',
    corpus_version: 'v4',
    created_date: '2026-08-12',
    description: 'Fixture v4 inventory for schema validation.',
    source_files: [
      {
        path: 'schemas/corpus-inventory.schema.json',
        role: 'schema',
        notes: 'Inventory schema contract.'
      },
      {
        path: 'schemas/corpus-document.schema.json',
        role: 'schema',
        notes: 'Document metadata schema contract.'
      }
    ],
    document_count: 2,
    tier_counts: {
      v1: 1,
      v4_core: 2,
      v4_validation: 2,
      v4_reference: 2
    },
    documents: [
      validDocument({
        doc_id: 'doc_001',
        corpus_version: 'v1',
        corpus_tier: 'v1',
        title: "Address Before the Young Men's Lyceum of Springfield, Illinois",
        short_title: 'Lyceum Address',
        date: '1838-01-27',
        year: 1838,
        period: 'early',
        genre: 'speech',
        audience: 'public',
        rhetorical_function: ['civic_warning'],
        research_relevance: ['v1_baseline'],
        included_in_v1: true,
        included_in_v4_core: true,
        annotation_status: 'fully_annotated',
        selection_rationale: 'Preserved v1 baseline document.'
      }),
      validDocument()
    ],
    ...overrides
  };
}

function errorText(validate) {
  return JSON.stringify(validate.errors || []);
}

function computedCounts(inventory) {
  return {
    document_count: inventory.documents.length,
    tier_counts: {
      v1: inventory.documents.filter(document => document.included_in_v1).length,
      v4_core: inventory.documents.filter(document => document.included_in_v4_core).length,
      v4_validation: inventory.documents.filter(document => document.included_in_v4_validation).length,
      v4_reference: inventory.documents.filter(document => document.included_in_v4_reference).length
    }
  };
}

test('corpus inventory schema validates a v4 inventory with document metadata records', () => {
  const validate = validator();
  const inventory = validInventory();
  assert.equal(validate(inventory), true, errorText(validate));
});

test('corpus inventory schema validates a v1-only inventory', () => {
  const validate = validator();
  const inventory = validInventory({
    inventory_id: 'corpus_inventory_v1_fixture',
    corpus_version: 'v1',
    document_count: 1,
    tier_counts: {
      v1: 1,
      v4_core: 0,
      v4_validation: 0,
      v4_reference: 0
    },
    documents: [
      validDocument({
        doc_id: 'doc_001',
        corpus_version: 'v1',
        corpus_tier: 'v1',
        included_in_v1: true,
        included_in_v4_core: false,
        included_in_v4_validation: false,
        included_in_v4_reference: false,
        annotation_status: 'fully_annotated',
        selection_rationale: 'Preserved v1 corpus document.'
      })
    ]
  });
  assert.equal(validate(inventory), true, errorText(validate));
});

test('corpus inventory schema supports reference records without full annotation', () => {
  const validate = validator();
  const inventory = validInventory({
    inventory_id: 'corpus_inventory_v4_reference_fixture',
    document_count: 1,
    tier_counts: {
      v1: 0,
      v4_core: 0,
      v4_validation: 0,
      v4_reference: 1
    },
    documents: [
      validDocument({
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
      })
    ]
  });
  assert.equal(validate(inventory), true, errorText(validate));
});

test('corpus inventory schema rejects malformed top-level and document records', () => {
  const validate = validator();
  assert.equal(validate(validInventory({ inventory_id: 'inventory_v4' })), false);
  assert.match(errorText(validate), /inventory_id/);

  const missingTierCounts = validInventory();
  delete missingTierCounts.tier_counts.v4_reference;
  assert.equal(validate(missingTierCounts), false);
  assert.match(errorText(validate), /v4_reference/);

  const badDocument = validInventory({
    documents: [validDocument({ corpus_tier: 'v4-general' })]
  });
  assert.equal(validate(badDocument), false);
  assert.match(errorText(validate), /corpus_tier/);
});

test('corpus inventory schema exposes counts usable by coverage reports', () => {
  const validate = validator();
  const inventory = validInventory();
  assert.equal(validate(inventory), true, errorText(validate));
  assert.deepEqual(computedCounts(inventory), {
    document_count: inventory.document_count,
    tier_counts: inventory.tier_counts
  });
});
