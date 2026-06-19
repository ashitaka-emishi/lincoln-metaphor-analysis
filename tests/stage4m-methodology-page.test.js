const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const PAGE_PATH = path.join(ROOT, 'docs', 'methodology', 'multi-model-reliability.md');
const QUARTO_PATH = path.join(ROOT, '_quarto.yml');

test('Stage 4M methodology page contains the publication-facing method and limits', () => {
  const page = fs.readFileSync(PAGE_PATH, 'utf8');
  const requiredHeadings = [
    'Purpose',
    'Relation to Stage 4A and Stage 4B',
    'Why This Is Not Human Inter-Annotator Reliability',
    'Model Packet Design',
    'Blind Review Rules',
    'Output Schema',
    'Agreement Metrics',
    'Disagreement Typology',
    'Human Adjudication Boundary',
    'Publication Use',
    'Limitations'
  ];
  for (const heading of requiredHeadings) {
    assert.match(page, new RegExp(`^## ${heading}$`, 'm'), `Missing methodology section: ${heading}`);
  }

  for (const required of [
    'AI-assisted reliability stress test',
    'does not establish human inter-annotator reliability',
    'does not treat AI output as evidence about Lincoln',
    'Stage 4A',
    'Stage 4B',
    'human double-coding protocol',
    'only route to a human-human inter-annotator reliability claim',
    'Model consensus is diagnostic evidence, not a vote',
    'No model output, consensus report, or queue decision can automatically revise Stage 4A',
    'strengthens the publication package',
    'designed but not executed'
  ]) {
    assert.match(page.toLowerCase(), new RegExp(required.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(page, /should eventually record|remain assigned to later issues/);
});

test('Stage 4M methodology page is present in Quarto navigation', () => {
  const quarto = fs.readFileSync(QUARTO_PATH, 'utf8');
  assert.match(
    quarto,
    /- href: docs\/methodology\/multi-model-reliability\.md\n\s+text: Stage 4M Reliability/
  );
});
