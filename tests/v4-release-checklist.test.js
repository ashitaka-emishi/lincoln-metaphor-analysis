const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const CHECKLIST_PATH = path.join(ROOT, 'docs', 'release', 'v4-corpus-expansion-release-checklist.md');
const CHECKLIST = fs.readFileSync(CHECKLIST_PATH, 'utf8');
const PUBLICATION_PACKAGE = fs.readFileSync(path.join(ROOT, 'publication_package.md'), 'utf8');
const RESEARCH_APPENDIX = fs.readFileSync(path.join(ROOT, 'research_appendix.md'), 'utf8');

test('v4 corpus expansion release checklist exists with expected release sections', () => {
  assert.match(CHECKLIST, /^# V4 Corpus Expansion Release Checklist$/m);
  for (const heading of [
    '## Architecture',
    '## Metadata',
    '## Core Corpus',
    '## Validation Corpus',
    '## Reference Corpus',
    '## Reports',
    '## Pipeline',
    '## Publication Package',
    '## Scholarly Claims',
    '## Current Pre-Tag Note'
  ]) {
    assert.match(CHECKLIST, new RegExp(`^${heading}$`, 'm'));
  }
});

test('v4 corpus expansion release checklist preserves issue checklist items', () => {
  for (const item of [
    'Corpus tiers defined',
    'Selection criteria documented',
    'Corpus expansion rationale complete',
    'Existing v1 corpus preserved',
    'Document metadata schema complete',
    'Inventory schema complete',
    'Provenance schema complete',
    'Source authority register complete',
    'v4 core inventory complete',
    'v4 core targets 48 documents',
    'All v1 document IDs preserved',
    '20 priority additions reviewed',
    'Each core document has selection rationale',
    'Each core document has provenance',
    'Raw text files added',
    'Normalized files generated',
    'Segmented files generated',
    'Sentence IDs validated',
    'v4 validation inventory complete',
    'Validation corpus targets 75-100 documents',
    'All core documents included',
    'Light annotation template created',
    'Validation corpus limitations documented',
    'Search-only reference corpus inventory created',
    'Reference corpus limitations documented',
    'Promotion path to validation/core documented',
    'Coverage report generated',
    'Expansion impact report generated',
    'Reliability sampling update generated',
    '`npm run corpus:v4` passes',
    '`npm run validate` passes',
    '`npm run status` reports v4 state',
    '`npm run pipeline` passes',
    '`quarto render` passes',
    'Corpus description updated',
    'Data availability updated',
    'Limitations updated',
    'Selection rationale linked',
    'Reliability sampling discussion updated',
    'No claim says the project analyzes all Lincoln writings',
    'No claim treats validation corpus as fully annotated',
    'No claim treats reference corpus as interpretive evidence',
    'Corpus expansion is described as reducing, not eliminating, selection bias'
  ]) {
    assert.match(CHECKLIST, new RegExp(`- \\[ \\] ${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
});

test('v4 release checklist records current pre-tag limits', () => {
  assert.match(CHECKLIST, /core corpus in progress/);
  assert.match(CHECKLIST, /validation-corpus raw files are intentionally missing outside release mode/);
  assert.match(CHECKLIST, /current interpretive claims remain tied to the fully annotated v1\/Stage 4A corpus/);
  assert.match(CHECKLIST, /not yet a v4 release-ready claim/);
});

test('v4 release checklist is linked from publication and appendix paths', () => {
  const link = 'docs/release/v4-corpus-expansion-release-checklist.md';
  assert.match(PUBLICATION_PACKAGE, new RegExp(link));
  assert.match(RESEARCH_APPENDIX, new RegExp(link));
});
