const assert = require('node:assert/strict');
const test = require('node:test');

const packageJson = require('../package.json');

test('package exposes v4 corpus pipeline commands', () => {
  const scripts = packageJson.scripts;
  const expectedCommands = {
    'corpus:v4:inventory': 'node scripts/corpus/create-corpus-v4-inventory.js',
    'corpus:v4:validate-inventory': 'node scripts/corpus/validate-corpus-inventory.js',
    'corpus:v4:validate-provenance': 'node scripts/corpus/validate-corpus-provenance.js',
    'corpus:v4:ingest': 'node scripts/corpus/ingest-corpus-documents.js',
    'corpus:v4:segment': 'node scripts/corpus/segment-corpus-v4.js',
    'corpus:v4:validate-sentences': 'node scripts/corpus/validate-sentence-ids.js',
    'corpus:v4:coverage': 'node scripts/corpus/generate-corpus-coverage-report.js',
    'corpus:v4:impact': 'node scripts/corpus/generate-corpus-expansion-impact-report.js',
    'corpus:v4:reliability-sample': 'node scripts/corpus/generate-reliability-sample-update.js',
    'corpus:v4:light-annotation': 'node scripts/corpus/generate-validation-light-annotation-template.js'
  };

  for (const [command, script] of Object.entries(expectedCommands)) {
    assert.equal(scripts[command], script);
  }
  assert.equal(
    scripts['corpus:v4'],
    'npm run corpus:v4:inventory && npm run corpus:v4:validate-inventory && npm run corpus:v4:validate-provenance && npm run corpus:v4:ingest && npm run corpus:v4:segment && npm run corpus:v4:validate-sentences && npm run corpus:v4:coverage && npm run corpus:v4:impact && npm run corpus:v4:reliability-sample && npm run corpus:v4:light-annotation'
  );
});

test('package preserves existing v4 corpus aliases', () => {
  const scripts = packageJson.scripts;
  assert.equal(scripts['corpus:v4-core-raw'], 'python3 scripts/corpus/build-v4-core-raw-texts.py');
  assert.equal(scripts['corpus:v4-ingest'], 'node scripts/corpus/ingest-corpus-documents.js');
  assert.equal(scripts['corpus:v4-segment'], 'node scripts/corpus/segment-corpus-v4.js');
  assert.equal(scripts['corpus:v4-coverage'], 'node scripts/corpus/generate-corpus-coverage-report.js');
  assert.equal(scripts['corpus:v4-impact'], 'node scripts/corpus/generate-corpus-expansion-impact-report.js');
  assert.equal(scripts['corpus:v4-reliability-sampling'], 'node scripts/corpus/generate-reliability-sample-update.js');
  assert.equal(scripts['corpus:v4-light-annotation'], 'node scripts/corpus/generate-validation-light-annotation-template.js');
});
