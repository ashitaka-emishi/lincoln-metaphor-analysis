const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'corpus', 'raw', 'v4-core');
const CORE_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-core-inventory.json');
const PROVENANCE_PATH = path.join(ROOT, 'corpus', 'provenance', 'corpus-v4-provenance.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function newCoreDocuments() {
  return readJSON(CORE_PATH).documents.filter(document => (
    document.corpus_tier === 'v4-core' && document.included_in_v1 === false
  ));
}

function rawFiles() {
  return fs.readdirSync(RAW_DIR).filter(file => file.endsWith('.txt')).sort();
}

test('v4 core additions have one raw text file with doc ID, slug, and date', () => {
  const documents = newCoreDocuments();
  const files = rawFiles();

  assert.equal(files.length, documents.length);

  for (const document of documents) {
    const matchingFiles = files.filter(file => file.startsWith(`${document.doc_id}--`));
    assert.equal(matchingFiles.length, 1, `${document.doc_id} should have exactly one raw file`);
    const [file] = matchingFiles;

    assert.match(file, /^doc_\d{3}--[a-z0-9-]+--\d{4}(-\d{2}){0,2}\.txt$/);
    if (document.date_precision === 'exact') {
      assert.match(file, new RegExp(`${document.date.replaceAll('-', '\\-')}\\.txt$`));
    }
  }
});

test('v4 core raw files map to inventory and provenance records', () => {
  const documentsById = new Map(newCoreDocuments().map(document => [document.doc_id, document]));
  const provenanceById = new Map(readJSON(PROVENANCE_PATH).records.map(record => [record.doc_id, record]));

  for (const file of rawFiles()) {
    const docId = file.match(/^(doc_\d{3})--/)[1];
    assert.ok(documentsById.has(docId), `${file} should map to a v4-core inventory record`);
    assert.ok(provenanceById.has(docId), `${file} should map to a provenance record`);
    assert.ok(provenanceById.get(docId).source_url, `${docId} provenance should have a source URL`);
  }
});

test('v4 core raw files contain document text without obvious web boilerplate', () => {
  for (const file of rawFiles()) {
    const text = fs.readFileSync(path.join(RAW_DIR, file), 'utf8');
    const paragraphs = text.trim().split(/\n{2,}/);

    assert.ok(text.length > 200, `${file} should contain substantive raw text`);
    assert.ok(paragraphs.length >= 2, `${file} should preserve paragraph breaks`);
    assert.doesNotMatch(text, /\b(Home|News|Books|Privacy Policy|Search|Menu)\s*\|/);
    assert.doesNotMatch(text, /Project Gutenberg|END OF THE PROJECT GUTENBERG/i);
  }
});
