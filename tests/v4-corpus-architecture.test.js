const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function readDoc(name) {
  return fs.readFileSync(path.join(ROOT, 'docs', 'corpus', name), 'utf8');
}

const rationale = readDoc('corpus-expansion-rationale.md');
const tiers = readDoc('corpus-tier-definitions.md');
const criteria = readDoc('corpus-selection-criteria.md');

test('v4 corpus architecture docs define all three expected files', () => {
  assert.match(rationale, /^# Corpus Expansion Rationale/m);
  assert.match(tiers, /^# Corpus Tier Definitions/m);
  assert.match(criteria, /^# Corpus Selection Criteria/m);
});

test('v4 corpus tiers distinguish core, validation, and search-only roles', () => {
  assert.match(tiers, /Tier 1 - 48-Document Core Interpretive Corpus/);
  assert.match(tiers, /expanded fully annotated core corpus/);
  assert.match(tiers, /Tier 2 - 75-100 Document Extended Validation Corpus/);
  assert.match(tiers, /not a second fully annotated core/);
  assert.match(tiers, /Tier 3 - Search-Only Reference Corpus/);
  assert.match(tiers, /Search hits are leads, not coded evidence/);
});

test('v4 architecture preserves v1 and avoids comprehensive-corpus claims', () => {
  for (const doc of [rationale, tiers, criteria]) {
    assert.match(doc, /does not claim to analyze all Lincoln writings/i);
  }
  assert.match(rationale, /The v1 corpus remains a valid 28-document interpretive corpus/);
  assert.match(rationale, /V4 does not invalidate that work/);
  assert.match(tiers, /The v1 document IDs, sentence IDs, source files, and Stage 4 annotations remain valid and preserved/);
});

test('v4 selection rationale keeps selection bias and interpretive judgment explicit', () => {
  assert.match(rationale, /selection bias/);
  assert.match(rationale, /Larger corpus size reduces selection-bias risk/);
  assert.match(rationale, /does not eliminate interpretive judgment/);
  assert.match(criteria, /reduces selection-bias risk/);
  assert.match(criteria, /does not eliminate bias/);
});
