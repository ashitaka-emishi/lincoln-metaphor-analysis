const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'corpus', 'generate-corpus-expansion-impact-report.js');
const V1_INVENTORY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v1-inventory.json');
const REPORT_JSON_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-expansion-impact-report.json');
const REPORT_MARKDOWN_PATH = path.join(ROOT, 'docs', 'corpus', 'corpus-v4-expansion-impact-report.md');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('v4 expansion impact generator check mode confirms generated files are fresh', () => {
  const output = childProcess.execFileSync('node', [SCRIPT_PATH, '--check', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  const result = JSON.parse(output);

  assert.equal(result.status, 'pass');
  assert.equal(result.changed, false);
  assert.equal(result.summary.v1_documents, 28);
  assert.equal(result.summary.v4_core_documents, 48);
  assert.equal(result.summary.v4_core_additions, 20);
  assert.equal(result.summary.v4_validation_documents, 78);
  assert.equal(result.summary.selection_bias_effect, 'reduced_not_eliminated');
});

test('generated v1 inventory preserves the manifest baseline for impact comparisons', () => {
  const manifest = readJSON(path.join(ROOT, 'corpus', 'corpus_manifest.json'));
  const inventory = readJSON(V1_INVENTORY_PATH);

  assert.equal(inventory.status, undefined);
  assert.equal(inventory.document_count, 28);
  assert.deepEqual(
    inventory.documents.map(record => record.doc_id),
    manifest.documents.map(record => record.id)
  );
  assert.ok(inventory.documents.every(record => record.included_in_v1));
  assert.ok(inventory.documents.every(record => record.annotation_status === 'fully_annotated'));
});

test('impact JSON classifies strengthened, limited, retesting, and unsupported claims', () => {
  const report = readJSON(REPORT_JSON_PATH);

  assert.equal(report.status, 'pass');
  assert.equal(report.summary.selection_bias_effect, 'reduced_not_eliminated');
  assert.equal(report.summary.annotation_boundary, 'Claims remain limited to the currently annotated core until v4 additions receive full Stage 4A re-analysis.');
  assert.equal(report.core_additions.length, 20);
  assert.ok(report.expansion_coverage.key_added_counts.emancipation_core_additions > 0);
  assert.ok(report.expansion_coverage.key_added_counts.condolence_core_additions > 0);
  assert.ok(report.claim_impacts.strengthened.length > 0);
  assert.ok(report.claim_impacts.still_limited.length > 0);
  assert.ok(report.claim_impacts.requiring_retesting.length > 0);
  assert.ok(report.claim_impacts.not_supported_by_expansion_alone.length > 0);
});

test('impact markdown includes all required sections and evidentiary boundaries', () => {
  const report = fs.readFileSync(REPORT_MARKDOWN_PATH, 'utf8');
  const requiredSections = [
    '# V4 Corpus Expansion Impact Report',
    '## What Changed',
    '## What Did Not Change',
    '## Expansion from 28 to 48 Core Documents',
    '## Addition of Extended Validation Corpus',
    '## Added Period Coverage',
    '## Added Genre Coverage',
    '## Added Race and Agency Coverage',
    '## Added Emancipation Coverage',
    '## Added War Powers Coverage',
    '## Added Providence and Sacrifice Coverage',
    '## Claims Strengthened',
    '## Claims Still Limited',
    '## Claims Requiring Re-Testing',
    '## Claims Not Supported by Corpus Expansion Alone'
  ];

  for (const section of requiredSections) {
    assert.match(report, new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'));
  }
  assert.match(report, /V4 reduces but does not eliminate selection-bias risk/);
  assert.match(report, /fully annotated core/);
  assert.match(report, /lightly annotated/);
  assert.match(report, /remain limited to the currently annotated core/);
});

test('npm validate includes the v4 corpus expansion impact freshness check', () => {
  const packageJson = readJSON(path.join(ROOT, 'package.json'));
  assert.equal(packageJson.scripts['corpus:v4-impact'], 'node scripts/corpus/generate-corpus-expansion-impact-report.js');
  assert.equal(packageJson.scripts['validate:corpus-v4-impact'], 'node scripts/corpus/generate-corpus-expansion-impact-report.js --check');
  assert.match(packageJson.scripts.validate, /validate:corpus-v4-impact/);
});
