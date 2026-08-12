const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(ROOT, 'publication_package.md'), 'utf8');

test('publication package exposes Stage 4H and Stage 4J in the reviewer path', () => {
  assert.match(page, /Stage 4H Human Inter-Annotator Reliability Study/);
  assert.match(page, /docs\/methodology\/human-interannotator-reliability\.md/);
  assert.match(page, /docs\/methodology\/human-reliability-results\.md/);
  assert.match(page, /Stage 4J Human Adjudication Guide/);
  assert.match(page, /docs\/methodology\/stage4j-adjudication-results\.md/);
  assert.match(page, /docs\/methodology\/stage4h-codebook-revision-notes\.md/);
});

test('publication package records human reliability artifacts and commands', () => {
  assert.match(page, /data\/reliability\/human-input-packets\//);
  assert.match(page, /data\/reliability\/human-output-submissions\//);
  assert.match(page, /data\/reliability\/human-comparison\//);
  assert.match(page, /data\/reliability\/human-adjudication\//);
  assert.match(page, /npm run stage4h/);
  assert.match(page, /npm run stage4j/);
});

test('publication package preserves conservative Stage 4H and Stage 4J status language', () => {
  assert.match(page, /Stage 4H is designed and operational but not executed/);
  assert.match(page, /no validated human coder submissions are present/);
  assert.match(page, /supports no human-human agreement, human-vs-reference comparison, or human disagreement claim yet/);
  assert.match(page, /Stage 4J adjudication is pending/);
  assert.match(page, /no completed human adjudication decision packets are present/);
});

test('publication package separates AI and human reliability claims', () => {
  assert.match(page, /Stage 4B and Stage 4M are AI-assisted reliability layers/);
  assert.match(page, /Stage 4H is the separate blind two-human inter-annotator reliability layer/);
  assert.match(page, /Human-human agreement is reported separately by annotation layer and is not averaged with AI-assisted agreement results/);
  assert.match(page, /Stage 4M model agreement or disagreement[\s\S]*cannot prove a historical claim, establish human-human reliability, or revise Stage 4A/);
  assert.match(page, /Stage 4H human agreement[\s\S]*cannot prove that an interpretation is historically correct and cannot automatically revise Stage 4A/);
});
