const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const PUBLICATION_PACKAGE = path.join(ROOT, 'publication_package.md');
const DATA_REPRODUCIBILITY = path.join(ROOT, 'data_reproducibility.md');

test('publication package describes v4 corpus tiers and limits without all-Lincoln overclaiming', () => {
  const page = fs.readFileSync(PUBLICATION_PACKAGE, 'utf8');

  assert.match(page, /48-document core interpretive corpus selected by period, genre, audience, and rhetorical function/);
  assert.match(page, /extended 75-100 document validation corpus is used to test recurrence, absence, and negative findings/);
  assert.match(page, /search-only reference corpus supports phrase search and contextual checks but is not treated as fully annotated evidence/);
  assert.match(page, /does not claim to analyze all Lincoln writings/);
  assert.doesNotMatch(page, /analyzes all Lincoln writings|complete Lincoln archive|whole Lincoln archive/);
});

test('publication package preserves required v4 limitation wording', () => {
  const page = fs.readFileSync(PUBLICATION_PACKAGE, 'utf8');

  assert.match(
    page,
    /The expanded v4 corpus reduces selection-bias risk but does not eliminate interpretive judgment\. Claims based on the fully annotated core corpus should not be automatically generalized to the search-only reference corpus\. The validation corpus supports recurrence and negative checks but is not equivalent to full Stage 4A annotation\./
  );
  assert.match(page, /Current interpretive counts remain tied to the fully annotated 28-document v1\/Stage 4A corpus/);
  assert.match(page, /V4 validation and reference tiers \| Defined; validation raw files remain a future release-mode gate/);
});

test('publication package data availability and commands include v4 corpus outputs', () => {
  const page = fs.readFileSync(PUBLICATION_PACKAGE, 'utf8');

  for (const required of [
    'npm run corpus:v4',
    'corpus/raw/v4-core/',
    'corpus/normalized/v4-core/',
    'corpus/segmented/v4-core/',
    'corpus/provenance/corpus-v4-provenance.json',
    'data/corpus/corpus-v4-core-inventory.json',
    'data/corpus/corpus-v4-validation-inventory.json',
    'data/corpus/corpus-v4-reference-inventory.json',
    'data/corpus/corpus-v4-coverage-summary.json',
    'data/corpus/corpus-v4-expansion-impact-report.json',
    'data/corpus/corpus-v4-reliability-sample-frame.json',
    'data/corpus/v4-validation-light-annotation-template.csv'
  ]) {
    assert.match(page, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('data reproducibility page documents v4 regeneration and claim boundary', () => {
  const page = fs.readFileSync(DATA_REPRODUCIBILITY, 'utf8');

  assert.match(page, /npm run corpus:v4/);
  assert.match(page, /48-document core interpretive corpus/);
  assert.match(page, /validation corpus supports recurrence and negative checks but is not equivalent to full Stage 4A annotation/);
  assert.match(page, /Current interpretive claims remain tied to the fully annotated v1\/Stage 4A corpus/);
});
