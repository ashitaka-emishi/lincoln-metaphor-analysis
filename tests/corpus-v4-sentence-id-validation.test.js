const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'corpus', 'validate-sentence-ids.js');
const REPORT_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-sentence-id-validation-report.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function segmented(docId, sentenceIds) {
  return {
    document_id: docId,
    meta: { id: docId, title: docId },
    sections: [
      {
        section_id: `${docId}_s01`,
        section_label: 'body',
        section_ordinal: 1,
        paragraphs: [
          {
            paragraph_id: `${docId}_s01_p01`,
            paragraph_ordinal: 1,
            sentences: sentenceIds.map((sentenceId, index) => ({
              sentence_id: sentenceId,
              sentence_ordinal: index + 1,
              text: `Sentence ${index + 1}.`,
              word_offset_start: index * 2,
              word_offset_end: index * 2 + 2,
              authorship_note: null,
              metaphor_instances: []
            }))
          }
        ]
      }
    ],
    pipeline_log: []
  };
}

function manifest(records) {
  return {
    segmentation_id: 'test_segmentation',
    corpus_version: 'v4',
    created_date: '2026-08-13',
    status: 'pass',
    inputs: {},
    outputs: {},
    sentence_id_format: '<doc_id>_s<section>_p<paragraph>_s<sentence>',
    summary: {
      documents: records.length,
      copied_v1_documents: records.filter(record => record.status === 'copied_v1').length,
      segmented_v4_core_documents: records.filter(record => record.status === 'segmented_v4_core').length,
      paragraphs: records.length,
      sentences: records.reduce((sum, record) => sum + record.sentence_count, 0)
    },
    records
  };
}

function makeWorkspace({ legacy = segmented('doc_001', ['doc_001_s01_p01_s01']), v4 = segmented('doc_001', ['doc_001_s01_p01_s01']), extraRecords = [] } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-sentence-ids-'));
  const legacyDir = path.join(tmp, 'legacy');
  const v4Dir = path.join(tmp, 'v4-core');
  const manifestPath = path.join(tmp, 'manifest.json');
  const reportPath = path.join(tmp, 'report.json');
  fs.mkdirSync(legacyDir, { recursive: true });
  fs.mkdirSync(v4Dir, { recursive: true });
  writeJSON(path.join(legacyDir, `${legacy.document_id}.json`), legacy);
  writeJSON(path.join(v4Dir, `${v4.document_id}.json`), v4);
  const sentenceCount = v4.sections[0].paragraphs[0].sentences.length;
  writeJSON(manifestPath, manifest([
    {
      doc_id: v4.document_id,
      title: v4.document_id,
      date: '1860-01-01',
      status: 'copied_v1',
      source_path: path.join(legacyDir, `${legacy.document_id}.json`),
      segmented_path: path.join(v4Dir, `${v4.document_id}.json`),
      paragraph_count: 1,
      sentence_count: sentenceCount,
      first_sentence_id: v4.sections[0].paragraphs[0].sentences[0]?.sentence_id || null,
      last_sentence_id: v4.sections[0].paragraphs[0].sentences.at(-1)?.sentence_id || null
    },
    ...extraRecords
  ]));
  return { legacyDir, v4Dir, manifestPath, reportPath };
}

function runValidation(workspace) {
  return spawnSync(process.execPath, [
    SCRIPT,
    '--legacySegmented', workspace.legacyDir,
    '--v4CoreSegmented', workspace.v4Dir,
    '--manifest', workspace.manifestPath,
    '--report', workspace.reportPath,
    '--json'
  ], { cwd: ROOT, encoding: 'utf8' });
}

test('sentence ID validation report stays fresh and npm validate includes the check', () => {
  execFileSync(process.execPath, [SCRIPT, '--check'], { cwd: ROOT, stdio: 'pipe' });

  const report = readJSON(REPORT_PATH);
  const packageJson = readJSON(path.join(ROOT, 'package.json'));
  assert.equal(report.status, 'pass');
  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.v4_core_documents, 48);
  assert.ok(report.summary.v4_core_sentences > report.summary.legacy_sentences);
  assert.match(packageJson.scripts.validate, /validate:sentence-ids/);
  assert.equal(packageJson.scripts['validate:sentence-ids'], 'node scripts/corpus/validate-sentence-ids.js --check');
});

test('duplicate sentence IDs fail validation', () => {
  const workspace = makeWorkspace({
    legacy: segmented('doc_001', ['doc_001_s01_p01_s01']),
    v4: segmented('doc_001', ['doc_001_s01_p01_s01', 'doc_001_s01_p01_s01'])
  });
  const result = runValidation(workspace);
  assert.notEqual(result.status, 0);

  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'fail');
  assert.ok(report.errors.some(error => error.code === 'duplicate_sentence_id'));
});

test('changed v1 sentence IDs fail validation', () => {
  const workspace = makeWorkspace({
    legacy: segmented('doc_001', ['doc_001_s01_p01_s01']),
    v4: segmented('doc_001', ['doc_001_s01_p01_s02'])
  });
  const result = runValidation(workspace);
  assert.notEqual(result.status, 0);

  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'fail');
  assert.ok(report.errors.some(error => error.code === 'v1_sentence_ids_changed'));
});

test('missing sentence IDs fail validation', () => {
  const bad = segmented('doc_001', ['doc_001_s01_p01_s01']);
  delete bad.sections[0].paragraphs[0].sentences[0].sentence_id;
  const workspace = makeWorkspace({ v4: bad });
  const result = runValidation(workspace);
  assert.notEqual(result.status, 0);

  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'fail');
  assert.ok(report.errors.some(error => error.code === 'missing_sentence_id'));
});
