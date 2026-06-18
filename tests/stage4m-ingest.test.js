const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'ingest-model-outputs.js');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-ingest-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'model-input-packets'),
    path.join(workspace, 'data', 'reliability', 'model-input-packets'),
    { recursive: true }
  );
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'model-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'model-comparison'), { recursive: true });
  return workspace;
}

function runIngest(workspace, args = []) {
  return spawnSync(process.execPath, [INGEST_SCRIPT, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4M_ROOT: workspace }
  });
}

function packetContext(workspace) {
  const packetDir = path.join(workspace, 'data', 'reliability', 'model-input-packets');
  const manifest = JSON.parse(fs.readFileSync(path.join(packetDir, 'model-packet-manifest.json'), 'utf8'));
  const packetItem = JSON.parse(fs.readFileSync(path.join(packetDir, 'model-packet-sentences.jsonl'), 'utf8').split('\n')[0]);
  return { manifest, packetItem };
}

function validRun(workspace, overrides = {}) {
  const { manifest, packetItem } = packetContext(workspace);
  return {
    run_id: 'run_json_001',
    model_id: 'openai-gpt-test',
    provider: 'OpenAI',
    model_name: 'GPT Test',
    model_version: '2026-06-18',
    run_date: '2026-06-18',
    operator: 'test-operator',
    input_packet_id: manifest.packet_id,
    input_packet_hash: manifest.model_output_contract.input_packet_hash,
    prompt_hash: manifest.model_output_contract.prompt_hash,
    temperature: 0,
    notes: 'Test submission',
    items: [{
      task_type: packetItem.packet_type,
      doc_id: packetItem.document_id,
      sentence_id: packetItem.sentence_id,
      span_id: packetItem.packet_unit_id,
      metaphor_present: 'no',
      lexical_unit: null,
      lexical_unit_start: null,
      lexical_unit_end: null,
      source_domain: null,
      target_domain: null,
      cluster_id: null,
      koenigsberg_function: null,
      violence_logic: null,
      obligatory_frame: null,
      agency_or_absence_flag: null,
      confidence: 'medium',
      ambiguity_flag: 'no',
      rival_reading: null,
      justification: 'No metaphor-related lexical unit was identified.'
    }],
    ...overrides
  };
}

function submissionPath(workspace, name) {
  return path.join(workspace, 'data', 'reliability', 'model-output-submissions', name);
}

function outputJSON(workspace, name) {
  return JSON.parse(fs.readFileSync(path.join(workspace, 'data', 'reliability', 'model-comparison', name), 'utf8'));
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCSVSubmission(workspace, run) {
  const schema = JSON.parse(fs.readFileSync(path.join(workspace, 'schemas', 'stage4m-model-output.schema.json'), 'utf8'));
  const columns = [...schema['x-stage4m-csv'].metadata_columns, ...schema['x-stage4m-csv'].item_columns];
  const rows = run.items.map(item => ({ ...run, ...item }));
  const text = [
    columns.join(','),
    ...rows.map(row => columns.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
  fs.writeFileSync(submissionPath(workspace, 'valid-model-output.csv'), text);
}

test('empty Stage 4M submission directory warns and writes stable empty artifacts', t => {
  const workspace = copyWorkspace(t);
  const check = runIngest(workspace, ['--check']);
  assert.equal(check.status, 0, check.stderr);
  assert.equal(fs.existsSync(path.join(workspace, 'data', 'reliability', 'model-comparison', 'normalized-model-runs.json')), false);

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /No Stage 4M model submissions found/);

  const normalized = outputJSON(workspace, 'normalized-model-runs.json');
  const report = outputJSON(workspace, 'model-run-validation-report.json');
  assert.equal(normalized.status, 'no_submissions');
  assert.deepEqual(normalized.runs, []);
  assert.equal(report.totals.submission_files, 0);
  assert.equal(report.totals.warnings, 1);
  assert.match(
    fs.readFileSync(path.join(workspace, 'data', 'reliability', 'model-comparison', 'model-run-validation-report.md'), 'utf8'),
    /No model-output submissions were found/
  );
});

test('valid JSON and CSV submissions normalize through one comparison contract', t => {
  const workspace = copyWorkspace(t);
  const jsonRun = validRun(workspace);
  fs.writeFileSync(submissionPath(workspace, 'valid-model-output.json'), JSON.stringify(jsonRun, null, 2));
  writeCSVSubmission(workspace, validRun(workspace, {
    run_id: 'run_csv_001',
    model_id: 'anthropic-claude-test',
    provider: 'Anthropic',
    model_name: 'Claude Test',
    notes: 'CSV, review'
  }));

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);
  const normalized = outputJSON(workspace, 'normalized-model-runs.json');
  const report = outputJSON(workspace, 'model-run-validation-report.json');
  assert.equal(normalized.status, 'valid');
  assert.deepEqual(normalized.runs.map(run => run.run_id), ['run_csv_001', 'run_json_001']);
  assert.equal(normalized.runs[0].temperature, 0);
  assert.equal(normalized.runs[0].notes, 'CSV, review');
  assert.match(normalized.runs[0].items[0].packet_unit_id, /^stage4m_unit_[0-9]{5}$/);
  assert.equal(report.totals.valid_runs, 2);
  assert.equal(report.totals.input_items, 2);
  assert.equal(report.totals.normalized_items, 2);
});

test('invalid submissions report every record and normalize none of them', t => {
  const workspace = copyWorkspace(t);
  fs.writeFileSync(submissionPath(workspace, 'missing-fields.json'), JSON.stringify({
    run_id: 'run_missing_fields',
    items: []
  }));

  const invalidItem = {
    ...validRun(workspace).items[0],
    doc_id: 'doc_999',
    sentence_id: 'doc_999_s01_p01_s01',
    span_id: 'stage4m_unit_99999',
    cluster_id: 'cluster_99_unknown'
  };
  fs.writeFileSync(submissionPath(workspace, 'semantic-errors.json'), JSON.stringify(validRun(workspace, {
    run_id: 'run_semantic_errors',
    input_packet_hash: '0'.repeat(64),
    items: [invalidItem, { ...invalidItem }]
  }), null, 2));

  const result = runIngest(workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing required field 'model_id'/);
  assert.match(result.stderr, /Invalid label; expected one of cluster_01_body_organism/);
  assert.match(result.stderr, /different input packet hash/);
  assert.match(result.stderr, /Unknown corpus document 'doc_999'/);
  assert.match(result.stderr, /does not map to a known packet item/);
  assert.match(result.stderr, /Duplicate response identifier/);

  const normalized = outputJSON(workspace, 'normalized-model-runs.json');
  const report = outputJSON(workspace, 'model-run-validation-report.json');
  assert.equal(normalized.status, 'validation_failed');
  assert.deepEqual(normalized.runs, []);
  assert.equal(report.totals.submission_files, 2);
  assert.equal(report.totals.invalid_runs, 2);
  assert.equal(report.totals.input_items, 2);
  assert.equal(report.totals.normalized_items, 0);
  assert.ok(report.files.every(file => file.valid === false));
  assert.ok(report.files.flatMap(file => file.findings).some(finding => finding.code === 'packet_hash_mismatch'));
  assert.ok(report.files.flatMap(file => file.findings).some(finding => finding.code === 'duplicate_item_response'));
});

test('ingestion rejects packet artifacts that drift from the manifest', t => {
  const workspace = copyWorkspace(t);
  const packetPath = path.join(
    workspace,
    'data',
    'reliability',
    'model-input-packets',
    'model-packet-sentences.jsonl'
  );
  fs.appendFileSync(packetPath, '\n');

  const result = runIngest(workspace, ['--check']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Packet manifest hash mismatch for data\/reliability\/model-input-packets\/model-packet-sentences\.jsonl/);
});
