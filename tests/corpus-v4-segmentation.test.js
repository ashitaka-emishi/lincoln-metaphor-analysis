const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'corpus', 'segment-corpus-v4.js');
const INVENTORY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-core-inventory.json');
const MANIFEST_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-segmentation-manifest.json');
const V4_SEGMENTED_DIR = path.join(ROOT, 'corpus', 'segmented', 'v4-core');
const LEGACY_SEGMENTED_DIR = path.join(ROOT, 'corpus', 'segmented');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sentenceIds(segmented) {
  return segmented.sections.flatMap(section => (
    section.paragraphs.flatMap(paragraph => (
      paragraph.sentences.map(sentence => sentence.sentence_id)
    ))
  ));
}

test('v4 core segmentation manifest and generated files stay fresh', () => {
  execFileSync(process.execPath, [SCRIPT, '--check'], { cwd: ROOT, stdio: 'pipe' });

  const inventory = readJSON(INVENTORY_PATH);
  const manifest = readJSON(MANIFEST_PATH);
  const files = fs.readdirSync(V4_SEGMENTED_DIR).filter(file => file.endsWith('.json')).sort();

  assert.equal(manifest.status, 'pass');
  assert.equal(manifest.summary.documents, 48);
  assert.equal(manifest.summary.copied_v1_documents, 28);
  assert.equal(manifest.summary.segmented_v4_core_documents, 20);
  assert.equal(files.length, inventory.documents.filter(document => document.included_in_v4_core).length);

  for (const record of inventory.documents.filter(document => document.included_in_v4_core)) {
    assert.ok(files.includes(`${record.doc_id}.json`), `${record.doc_id} missing segmented v4-core file`);
  }
});

test('v4 segmentation preserves existing v1 sentence IDs in the v4-core copy', () => {
  const inventory = readJSON(INVENTORY_PATH);
  for (const record of inventory.documents.filter(document => document.included_in_v1)) {
    const legacy = readJSON(path.join(LEGACY_SEGMENTED_DIR, `${record.doc_id}.json`));
    const v4 = readJSON(path.join(V4_SEGMENTED_DIR, `${record.doc_id}.json`));

    assert.deepEqual(sentenceIds(v4), sentenceIds(legacy), `${record.doc_id} sentence IDs changed`);
  }
});

test('new v4 core documents receive deterministic sentence IDs and paragraph counts', () => {
  const manifest = readJSON(MANIFEST_PATH);
  const additions = manifest.records.filter(record => record.status === 'segmented_v4_core');
  assert.equal(additions.length, 20);

  for (const record of additions) {
    const segmented = readJSON(path.join(V4_SEGMENTED_DIR, `${record.doc_id}.json`));
    const ids = sentenceIds(segmented);

    assert.ok(record.paragraph_count > 0, `${record.doc_id} should have paragraphs`);
    assert.ok(record.sentence_count > 0, `${record.doc_id} should have sentences`);
    assert.equal(ids[0], `${record.doc_id}_s01_p01_s01`);
    assert.equal(new Set(ids).size, ids.length, `${record.doc_id} has duplicate sentence IDs`);
    assert.ok(ids.every(id => new RegExp(`^${record.doc_id}_s\\d{2}_p\\d{2}_s\\d{2}$`).test(id)));
  }
});

test('v4 segmentation package command is exposed', () => {
  const packageJson = readJSON(path.join(ROOT, 'package.json'));
  assert.equal(packageJson.scripts['corpus:v4-segment'], 'node scripts/corpus/segment-corpus-v4.js');
});
