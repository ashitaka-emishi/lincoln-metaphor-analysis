const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const Ajv2020 = require('ajv/dist/2020');
const { parseCSVSubmission } = require('../scripts/stage4m/ingest-model-outputs');

const ROOT = path.resolve(__dirname, '..');
const GUIDE_PATH = path.join(ROOT, 'docs', 'methodology', 'model-review-instructions.md');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'stage4m-model-output.schema.json');
const MANIFEST_PATH = path.join(
  ROOT,
  'data',
  'reliability',
  'model-input-packets',
  'model-packet-manifest.json'
);

function fencedBlock(source, language) {
  const match = source.match(new RegExp(`\\\`\\\`\\\`${language}\\n([\\s\\S]*?)\\n\\\`\\\`\\\``));
  assert.ok(match, `Expected a fenced ${language} example`);
  return match[1];
}

test('external model-review guide covers the blindness and manual ingestion workflow', () => {
  const guide = fs.readFileSync(GUIDE_PATH, 'utf8');
  for (const required of [
    'AI-assisted reliability stress test',
    'not human inter-annotator reliability',
    'Files to Send',
    'Files Never to Send',
    'corpus/annotated/',
    'data/evidence/annotation-evidence.json',
    'model-output-submissions/',
    'npm run stage4m:ingest',
    'model-disagreement-log.json',
    'model-instability-report.md',
    'stage4m-adjudication-queue.csv',
    'model agreement is diagnostic evidence, not a vote',
    'No report, queue, or model consensus automatically changes Stage 4A'
  ]) {
    assert.match(guide.toLowerCase(), new RegExp(required.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(guide, /`model-disagreement-log\.md`|`model-adjudication-queue\.csv`/);
});

test('documented JSON and CSV examples validate against the current packet contract', t => {
  const guide = fs.readFileSync(GUIDE_PATH, 'utf8');
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

  const jsonExample = JSON.parse(fencedBlock(guide, 'json'));
  assert.equal(validate(jsonExample), true, JSON.stringify(validate.errors, null, 2));

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'stage4m-guide-'));
  t.after(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));
  const csvPath = path.join(temporaryDirectory, 'example.csv');
  fs.writeFileSync(csvPath, fencedBlock(guide, 'csv') + '\n');
  const csvExample = parseCSVSubmission(csvPath, schema);
  assert.equal(validate(csvExample), true, JSON.stringify(validate.errors, null, 2));

  for (const example of [jsonExample, csvExample]) {
    assert.equal(example.input_packet_id, manifest.packet_id);
    assert.equal(example.input_packet_hash, manifest.model_output_contract.input_packet_hash);
    assert.equal(example.prompt_hash, manifest.model_output_contract.prompt_hash);
  }
});
