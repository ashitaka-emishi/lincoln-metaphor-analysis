const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const GENERATED_FILES = [
  'model-packet-manifest.json',
  'model-packet-sentences.jsonl',
  'model-packet-field-agreement.jsonl',
  'model-packet-instructions.md',
  'model-output-template.csv',
  'model-output-template.json'
];

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  for (const directory of ['corpus', 'data', 'docs', 'schemas', 'scripts']) {
    fs.cpSync(path.join(ROOT, directory), path.join(workspace, directory), { recursive: true });
  }
  return workspace;
}

function runGenerator(workspace, environment = {}) {
  return spawnSync(
    process.execPath,
    [path.join(workspace, 'scripts', 'stage4m', 'generate-model-packets.js')],
    {
      cwd: workspace,
      encoding: 'utf8',
      env: { ...process.env, ...environment }
    }
  );
}

function assertPasses(result) {
  assert.equal(result.status, 0, `Generator failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
}

function outputPath(workspace, name) {
  return path.join(workspace, 'data', 'reliability', 'model-input-packets', name);
}

function snapshotOutputs(workspace) {
  return Object.fromEntries(
    GENERATED_FILES.map(name => [name, fs.readFileSync(outputPath(workspace, name), 'utf8')])
  );
}

function readJSONL(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split('\n').map(line => JSON.parse(line));
}

function collectKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      collectKeys(child, keys);
    }
  }
  return keys;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

test('Stage 4M generator is deterministic and preserves canonical sentence IDs', t => {
  const workspace = copyWorkspace(t);
  fs.rmSync(path.join(workspace, 'data', 'reliability', 'model-input-packets'), {
    recursive: true,
    force: true
  });
  assertPasses(runGenerator(workspace));
  const first = snapshotOutputs(workspace);
  assertPasses(runGenerator(workspace));
  const second = snapshotOutputs(workspace);
  assert.deepEqual(second, first);

  const manifest = JSON.parse(first['model-packet-manifest.json']);
  assert.match(manifest.packet_id, /^stage4m_[a-f0-9]{16}$/);
  assert.equal(Number.isNaN(Date.parse(manifest.generated_at)), false);
  assert.equal(manifest.generation_timestamp_source, 'system clock at first generation for packet_id');
  assert.equal(manifest.counts.sentence_identification_units, 55);
  assert.equal(manifest.counts.field_agreement_units, 51);
  assert.equal(manifest.counts.output_template_seed_rows, 106);
  assert.ok(manifest.source_files.every(source => /^[a-f0-9]{64}$/.test(source.sha256)));
  assert.ok(manifest.outputs.every(output => /^[a-f0-9]{64}$/.test(output.sha256)));
  for (const output of manifest.outputs) {
    assert.equal(sha256(path.join(workspace, output.path)), output.sha256);
  }

  const sample = JSON.parse(fs.readFileSync(path.join(workspace, 'data', 'reliability', 'reliability-sample.json'), 'utf8'));
  const expectedSentenceIds = new Set([
    ...sample.identification_units.map(unit => unit.sentence_id),
    ...sample.field_agreement_units.map(unit => unit.sentence_id)
  ]);
  const sentencePackets = readJSONL(outputPath(workspace, 'model-packet-sentences.jsonl'));
  const fieldPackets = readJSONL(outputPath(workspace, 'model-packet-field-agreement.jsonl'));
  assert.ok(sentencePackets.every(unit => unit.document_context && unit.document_context.date));
  assert.ok(sentencePackets.every(unit => Array.isArray(unit.context.paragraph_sentences)));
  assert.ok(fieldPackets.every(unit => unit.document_context && unit.document_context.register));
  assert.ok(fieldPackets.every(unit => Array.isArray(unit.context.paragraph_sentences)));
  const actualSentenceIds = new Set([...sentencePackets, ...fieldPackets].map(unit => unit.sentence_id));
  assert.deepEqual(actualSentenceIds, expectedSentenceIds);

  const jsonTemplate = JSON.parse(first['model-output-template.json']);
  assert.equal(jsonTemplate.items.length, 106);
  assert.equal(jsonTemplate.input_packet_id, manifest.packet_id);
  assert.equal(jsonTemplate.input_packet_hash, manifest.model_output_contract.input_packet_hash);
  assert.equal(jsonTemplate.prompt_hash, manifest.model_output_contract.prompt_hash);
  assert.equal(jsonTemplate.items.filter(row => row.task_type === 'sentence_identification').length, 55);
  assert.equal(jsonTemplate.items.filter(row => row.task_type === 'field_agreement').length, 51);
  assert.ok(jsonTemplate.items
    .filter(row => row.task_type === 'field_agreement')
    .every(row => row.lexical_unit));
  assert.ok(jsonTemplate.items.every(row => /^stage4m_unit_[0-9]{5}$/.test(row.span_id)));
});

test('model-output schema defines strict JSON labels and the equivalent CSV mapping', () => {
  const schema = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'schemas', 'stage4m-model-output.schema.json'),
    'utf8'
  ));
  const requiredTopLevel = [
    'run_id', 'model_id', 'provider', 'model_name', 'model_version', 'run_date',
    'operator', 'input_packet_id', 'input_packet_hash', 'prompt_hash',
    'temperature', 'notes', 'items'
  ];
  const requiredItem = [
    'task_type', 'doc_id', 'sentence_id', 'span_id', 'metaphor_present',
    'lexical_unit', 'lexical_unit_start', 'lexical_unit_end', 'source_domain',
    'target_domain', 'cluster_id', 'koenigsberg_function', 'violence_logic',
    'obligatory_frame', 'agency_or_absence_flag', 'confidence', 'ambiguity_flag',
    'rival_reading', 'justification'
  ];

  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, requiredTopLevel);
  assert.equal(schema.$defs.item.additionalProperties, false);
  assert.deepEqual(schema.$defs.item.required, requiredItem);
  assert.deepEqual(schema.$defs.item.properties.task_type.enum, ['sentence_identification', 'field_agreement']);
  assert.deepEqual(schema.$defs.item.properties.metaphor_present.enum, ['yes', 'no', 'uncertain']);
  assert.deepEqual(schema.$defs.item.properties.confidence.enum, ['high', 'medium', 'low']);
  assert.deepEqual(schema.$defs.item.properties.ambiguity_flag.enum, ['yes', 'no']);
  assert.equal(schema.$defs.item.properties.cluster_id.oneOf[0].enum.length, 6);
  assert.equal(schema.$defs.item.properties.koenigsberg_function.oneOf[0].enum.length, 8);
  assert.equal(schema.$defs.item.properties.agency_or_absence_flag.oneOf[0].enum.length, 7);
  assert.deepEqual(schema['x-stage4m-csv'].metadata_columns, requiredTopLevel.filter(field => field !== 'items'));
  assert.deepEqual(schema['x-stage4m-csv'].item_columns, requiredItem);

  const csvHeader = fs.readFileSync(
    path.join(ROOT, 'data', 'reliability', 'model-input-packets', 'model-output-template.csv'),
    'utf8'
  ).split('\n', 1)[0].split(',');
  assert.deepEqual(csvHeader, [...schema['x-stage4m-csv'].metadata_columns, ...requiredItem]);
});

test('blind packets omit reference, control, audit, and adjudication fields', t => {
  const workspace = copyWorkspace(t);
  assertPasses(runGenerator(workspace));

  const sentencePackets = readJSONL(outputPath(workspace, 'model-packet-sentences.jsonl'));
  const fieldPackets = readJSONL(outputPath(workspace, 'model-packet-field-agreement.jsonl'));
  const packetKeys = collectKeys([...sentencePackets, ...fieldPackets]);
  const forbiddenKeys = [
    'reference_values',
    'control_type',
    'stage4_anchor_audit_ids',
    'stage4_anchor_count',
    'source_audit_id',
    'coder_a_value',
    'coder_b_value',
    'adjudicated_value'
  ];
  for (const key of forbiddenKeys) assert.equal(packetKeys.has(key), false, `Blind packet leaked ${key}`);

  const packetText = [
    fs.readFileSync(outputPath(workspace, 'model-packet-sentences.jsonl'), 'utf8'),
    fs.readFileSync(outputPath(workspace, 'model-packet-field-agreement.jsonl'), 'utf8'),
    fs.readFileSync(outputPath(workspace, 'model-output-template.csv'), 'utf8'),
    fs.readFileSync(outputPath(workspace, 'model-output-template.json'), 'utf8')
  ].join('\n');
  assert.doesNotMatch(packetText, /inst_\d{5}/);
  assert.doesNotMatch(packetText, /positive_anchor|negative_control/);
  assert.ok(fieldPackets.every(unit => unit.provided_span_text && !unit.packet_unit_id.includes('inst_')));

  const manifest = JSON.parse(fs.readFileSync(outputPath(workspace, 'model-packet-manifest.json'), 'utf8'));
  assert.equal(manifest.blindness.reference_values_included, false);
  assert.equal(manifest.blindness.control_classifications_included, false);
  assert.equal(manifest.blindness.source_audit_ids_included, false);
});

test('generator rejects populated reference fields in the source coding template', t => {
  const workspace = copyWorkspace(t);
  const templatePath = path.join(workspace, 'data', 'reliability', 'double-coding-template.csv');
  const lines = fs.readFileSync(templatePath, 'utf8').split('\n');
  const headers = lines[0].split(',');
  const clusterIndex = headers.indexOf('cluster_id');
  assert.ok(clusterIndex >= 0);

  const dataIndex = lines.findIndex((line, index) => index > 0 && line && line.split(',').length === headers.length);
  assert.ok(dataIndex > 0, 'Expected at least one CSV row without quoted commas');
  const row = lines[dataIndex].split(',');
  row[clusterIndex] = 'cluster_01_body_organism';
  lines[dataIndex] = row.join(',');
  fs.writeFileSync(templatePath, lines.join('\n'));

  const result = runGenerator(workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Blindness violation.*cluster_id/);
});
