const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'corpus', 'generate-corpus-coverage-report.js');
const SUMMARY_PATH = path.join(ROOT, 'data', 'corpus', 'corpus-v4-coverage-summary.json');
const REPORT_PATH = path.join(ROOT, 'docs', 'corpus', 'corpus-v4-coverage-report.md');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('v4 coverage generator check mode confirms generated files are fresh', () => {
  const output = childProcess.execFileSync('node', [SCRIPT_PATH, '--check', '--json'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  const result = JSON.parse(output);

  assert.equal(result.status, 'pass');
  assert.equal(result.changed, false);
  assert.equal(result.summary.core, 48);
  assert.equal(result.summary.validation, 78);
  assert.equal(result.summary.reference, 18);
});

test('v4 coverage summary distinguishes tiers and flags representation extremes', () => {
  const summary = readJSON(SUMMARY_PATH);

  assert.equal(summary.status, 'pass');
  assert.deepEqual(summary.tier_counts, {
    core: 48,
    validation: 78,
    reference: 18,
    v1_preserved_in_core: 28,
    new_core_additions: 20
  });
  assert.ok(summary.distributions.period.overrepresented.includes('emancipation'));
  assert.ok(summary.distributions.period.underrepresented.includes('reconstruction_transition'));
  assert.ok(summary.distributions.audience.underrepresented.includes('african_american_delegation'));
  assert.ok(summary.distributions.rhetorical_function.rows.some(row => row.value === 'search_context' && row.reference === 18));
});

test('v4 coverage summary assesses claim-support areas conservatively', () => {
  const summary = readJSON(SUMMARY_PATH);
  const byKey = new Map(summary.claim_coverage.map(area => [area.key, area]));

  assert.equal(byKey.get('slavery_emancipation').assessment, 'supports_claims_with_tier_limits');
  assert.equal(byKey.get('race_black_military_agency').assessment, 'supports_claims_with_tier_limits');
  assert.equal(byKey.get('war_powers').assessment, 'requires_caution_or_follow_up');
  assert.equal(byKey.get('disease_purification_negative_check').assessment, 'requires_caution_or_follow_up');
  assert.equal(byKey.get('disease_purification_negative_check').tier_counts.core, 0);
});

test('v4 coverage markdown includes all required report sections and tier caveats', () => {
  const report = fs.readFileSync(REPORT_PATH, 'utf8');
  const requiredSections = [
    '# V4 Corpus Coverage Report',
    '## Summary',
    '## Corpus Tiers',
    '## Coverage by Period',
    '## Coverage by Genre',
    '## Coverage by Audience',
    '## Coverage by Rhetorical Function',
    '## Coverage by Research Relevance',
    '## Slavery and Emancipation Coverage',
    '## War Powers Coverage',
    '## Sacrifice and Mourning Coverage',
    '## Providence Coverage',
    '## Race and Black Military Agency Coverage',
    '## Disease/Purification Negative-Check Coverage',
    '## Gaps and Limitations'
  ];

  for (const section of requiredSections) {
    assert.match(report, new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'));
  }
  assert.match(report, /not a second fully annotated core/);
  assert.match(report, /Search-only leads; not coded interpretive evidence/);
  assert.match(report, /requires caution or follow-up|supports only cautious/);
});

test('npm validate includes the v4 corpus coverage freshness check', () => {
  const packageJson = readJSON(path.join(ROOT, 'package.json'));
  assert.equal(packageJson.scripts['corpus:v4-coverage'], 'node scripts/corpus/generate-corpus-coverage-report.js');
  assert.equal(packageJson.scripts['validate:corpus-v4-coverage'], 'node scripts/corpus/generate-corpus-coverage-report.js --check');
  assert.match(packageJson.scripts.validate, /validate:corpus-v4-coverage/);
});
