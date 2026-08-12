const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const INVENTORY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-core-inventory.json');
const INVENTORY_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-inventory.schema.json');
const DOCUMENT_SCHEMA_PATH = path.join(ROOT, 'schemas', 'corpus-document.schema.json');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');
const MARKDOWN_PATH = path.join(ROOT, 'docs', 'corpus', 'corpus-v4-core-inventory.md');

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

function containsRecord(records, matcher) {
  return records.some(record => {
    const haystack = [
      record.title,
      record.short_title,
      record.date,
      record.source_citation
    ].join(' | ');
    return matcher.test(haystack);
  });
}

test('v4 core inventory validates against the inventory and document schemas', () => {
  const validate = inventoryValidator();
  const inventory = readJSON(INVENTORY_PATH);
  assert.equal(validate(inventory), true, errorText(validate));
});

test('v4 core inventory preserves all v1 IDs and assigns deterministic new IDs', () => {
  const inventory = readJSON(INVENTORY_PATH);
  const manifest = readJSON(MANIFEST_PATH);
  const docIds = inventory.documents.map(record => record.doc_id);
  const v1Ids = manifest.documents.map(record => record.id);
  const newIds = Array.from({ length: 20 }, (_, index) => `doc_${String(index + 23).padStart(3, '0')}`);

  assert.equal(inventory.document_count, 48);
  assert.equal(inventory.tier_counts.v1, 28);
  assert.equal(inventory.tier_counts.v4_core, 48);
  assert.equal(new Set(docIds).size, 48);
  assert.deepEqual(docIds.slice(0, 28), v1Ids);
  assert.deepEqual(docIds.slice(28), newIds);

  for (const id of v1Ids) {
    const record = inventory.documents.find(document => document.doc_id === id);
    assert.equal(record.included_in_v1, true, `${id} should remain marked as v1`);
    assert.equal(record.included_in_v4_core, true, `${id} should be carried into v4 core`);
  }
});

test('v4 core inventory includes every issue #113 required text', () => {
  const inventory = readJSON(INVENTORY_PATH);
  const records = inventory.documents;
  const requiredMatchers = [
    /First Political Announcement.*1832-03-09|First Political Announcement.*March 9, 1832/,
    /Temperance Address.*1842-02-22|Temperance Address.*February 22, 1842/,
    /Eulogy on Henry Clay.*1852-07-06|Henry Clay.*July 6, 1852/,
    /Peoria.*1854-10-16|Peoria.*October 16, 1854/,
    /George Robertson.*1855-08-15|George Robertson.*August 15, 1855/,
    /Joshua.*Speed.*1855-08-24|Joshua.*Speed.*August 24, 1855/,
    /Dred Scott.*1857-06-26|Dred Scott.*June 26, 1857/,
    /Cooper Union.*1860-02-27|Cooper Union.*February 27, 1860/,
    /Springfield Farewell.*1861-02-11|Farewell.*February 11, 1861/,
    /Independence Hall.*1861-02-22|Independence Hall.*February 22, 1861/,
    /Annual Message 1861.*1861-12-03|Annual Message to Congress.*December 3, 1861/,
    /Annual Message 1862.*1862-12-01|Annual Message to Congress.*December 1, 1862/,
    /Prelim.*Emancipation.*1862-09-22|Preliminary Emancipation Proclamation.*September 22, 1862/,
    /Final Emancipation.*1863-01-01|Final Emancipation Proclamation.*January 1, 1863/,
    /Greeley.*1862-08-22|Horace Greeley.*August 22, 1862/,
    /Erastus Corning.*1863-06-12|Erastus Corning.*June 12, 1863/,
    /Conkling.*1863-08-26|James C. Conkling.*August 26, 1863/,
    /Hodges.*1864-04-04|Albert G. Hodges.*April 4, 1864/,
    /Meditation on.*Divine Will.*1862-09|Meditation on the Divine Will.*September 1862/,
    /Last Address.*1865-04-11|Last Public Address.*April 11, 1865/
  ];

  for (const matcher of requiredMatchers) {
    assert.ok(containsRecord(records, matcher), `Missing required text matching ${matcher}`);
  }
});

test('new v4 core records include selection rationale and required stratification metadata', () => {
  const inventory = readJSON(INVENTORY_PATH);
  const additions = inventory.documents.filter(record => !record.included_in_v1);
  assert.equal(additions.length, 20);

  for (const record of additions) {
    assert.equal(record.corpus_tier, 'v4-core');
    assert.equal(record.annotation_status, 'unprocessed');
    assert.ok(record.period, `${record.doc_id} missing period`);
    assert.ok(record.genre, `${record.doc_id} missing genre`);
    assert.ok(record.audience, `${record.doc_id} missing audience`);
    assert.ok(record.rhetorical_function.length > 0, `${record.doc_id} missing rhetorical function`);
    assert.ok(record.research_relevance.length > 0, `${record.doc_id} missing research relevance`);
    assert.ok(record.selection_rationale.length > 0, `${record.doc_id} missing selection rationale`);
  }
});

test('v4 core markdown inventory stays in sync with JSON counts and document IDs', () => {
  const inventory = readJSON(INVENTORY_PATH);
  const markdown = fs.readFileSync(MARKDOWN_PATH, 'utf8');

  assert.match(markdown, /\| Total v4 core inventory records \| 48 \|/);
  assert.match(markdown, /\| Preserved v1 records \| 28 \|/);
  assert.match(markdown, /\| New deterministic v4 additions \| 20 \|/);

  for (const record of inventory.documents) {
    assert.match(markdown, new RegExp(`\\\\| ${record.doc_id} \\\\|`), `${record.doc_id} missing from markdown`);
  }
});
