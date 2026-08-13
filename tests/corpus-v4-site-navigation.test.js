const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const QUARTO_PATH = path.join(ROOT, '_quarto.yml');
const CORPUS_INDEX_PATH = path.join(ROOT, 'corpus_index.qmd');

const REQUIRED_NAV_LINKS = [
  ['docs/corpus/corpus-expansion-rationale.md', 'Expansion Rationale'],
  ['docs/corpus/corpus-tier-definitions.md', 'Tier Definitions'],
  ['docs/corpus/corpus-selection-criteria.md', 'Selection Criteria'],
  ['docs/corpus/corpus-v4-core-inventory.md', 'V4 Core Inventory'],
  ['docs/corpus/corpus-v4-validation-inventory.md', 'V4 Validation Inventory'],
  ['docs/corpus/corpus-v4-coverage-report.md', 'V4 Coverage Report'],
  ['docs/corpus/corpus-v4-expansion-impact-report.md', 'V4 Expansion Limits'],
  ['docs/corpus/corpus-v4-reliability-sampling-update.md', 'V4 Reliability Sampling']
];

test('v4 corpus pages are present in a distinct Quarto sidebar group', () => {
  const quarto = fs.readFileSync(QUARTO_PATH, 'utf8');

  assert.match(quarto, /- section: "Corpus Design \(v4\)"/);
  for (const [href, text] of REQUIRED_NAV_LINKS) {
    const pattern = new RegExp(`- href: ${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\s+text: ${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    assert.match(quarto, pattern, `${href} is missing from the v4 corpus navigation`);
  }

  const corpusSectionStart = quarto.indexOf('- section: "Corpus Design (v4)"');
  const corpusSection = quarto.slice(corpusSectionStart);
  const methodSection = quarto.slice(
    quarto.indexOf('- href: docs/methodology/research-design.md'),
    corpusSectionStart
  );
  assert(corpusSection.indexOf('docs/corpus/corpus-v4-core-inventory.md') < corpusSection.indexOf('- href: data_reproducibility.md'));
  assert(methodSection.indexOf('docs/corpus/corpus-v4-core-inventory.md') === -1);
});

test('corpus landing page links the v4 inventory, coverage, and limitation pages', () => {
  const page = fs.readFileSync(CORPUS_INDEX_PATH, 'utf8');

  for (const required of [
    '[V4 Core Corpus Inventory](docs/corpus/corpus-v4-core-inventory.md)',
    '[V4 Coverage Report](docs/corpus/corpus-v4-coverage-report.md)',
    '[V4 Expansion Impact and Limitations](docs/corpus/corpus-v4-expansion-impact-report.md)'
  ]) {
    assert.match(page, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
