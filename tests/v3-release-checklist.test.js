const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const checklistPath = path.join(ROOT, 'docs', 'release', 'v3-human-reliability-release-checklist.md');
const checklist = fs.readFileSync(checklistPath, 'utf8');
const publicationPackage = fs.readFileSync(path.join(ROOT, 'publication_package.md'), 'utf8');
const researchAppendix = fs.readFileSync(path.join(ROOT, 'research_appendix.md'), 'utf8');

test('v3 human reliability release checklist exists with expected release sections', () => {
  assert.match(checklist, /^# V3 Human Reliability Release Checklist/m);
  for (const heading of [
    '## Architecture',
    '## Human Coder Materials',
    '## Data',
    '## Adjudication',
    '## Documentation',
    '## Validation',
    '## Scholarly Claims'
  ]) {
    assert.match(checklist, new RegExp(`^${heading}$`, 'm'));
  }
});

test('v3 human reliability release checklist preserves issue checklist items', () => {
  for (const item of [
    'Stage 4H defined',
    'Stage 4J defined',
    'Stage 4H distinguished from Stage 4B and Stage 4M',
    'No-overwrite rule documented',
    'Training guide complete',
    'Calibration guide complete',
    'Calibration packet complete',
    'Blind packet instructions complete',
    'Human coder template complete',
    'Human packets generated',
    'Coder A output received',
    'Coder B output received',
    'Human outputs validated',
    'Human-human agreement generated',
    'Human-vs-reference comparison generated',
    'Human disagreement log generated',
    'Human adjudication queue generated',
    'Adjudication decisions completed',
    'Adjudication decisions validated',
    'Codebook revision notes generated',
    'Stage 4A correction candidates exported',
    'Claim-audit review candidates exported',
    'Human reliability methodology page complete',
    'Human reliability results page complete',
    'Stage 4J adjudication results page complete',
    'Codebook revision notes complete',
    'Publication package updated',
    'Limitations updated',
    '`npm run status` passes',
    '`npm run validate` passes',
    '`npm run stage4h` passes',
    '`npm run stage4j` passes when adjudication files exist',
    '`npm run pipeline` passes',
    '`quarto render` passes',
    'No claim averages AI and human agreement',
    'No claim treats human agreement as proof of interpretation',
    'No claim treats Stage 4A as automatically correct',
    'No claim treats human disagreement as automatic Stage 4A correction',
    "Human coders were blind to Stage 4A, Stage 4B, Stage 4M, synthesis claims, and each other's outputs"
  ]) {
    assert.match(checklist, new RegExp(`- \\[ \\] ${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
});

test('v3 checklist is linked from publication and appendix paths', () => {
  const link = 'docs/release/v3-human-reliability-release-checklist.md';
  assert.match(publicationPackage, new RegExp(link));
  assert.match(researchAppendix, new RegExp(link));
});
