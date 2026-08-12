const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'ingest-human-outputs.js');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4h-ingest-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability'), { recursive: true });
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-input-packets'),
    path.join(workspace, 'data', 'reliability', 'human-input-packets'),
    { recursive: true }
  );
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-comparison'), { recursive: true });
  return workspace;
}

function runIngest(workspace, args = []) {
  return spawnSync(process.execPath, [INGEST_SCRIPT, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4H_ROOT: workspace }
  });
}

function packetContext(workspace) {
  const packetDir = path.join(workspace, 'data', 'reliability', 'human-input-packets');
  const manifest = JSON.parse(fs.readFileSync(path.join(packetDir, 'human-packet-manifest.json'), 'utf8'));
  const packetItem = JSON.parse(fs.readFileSync(path.join(packetDir, 'human-sentence-identification-packet.jsonl'), 'utf8').split('\n')[0]);
  return { manifest, packetItem };
}

function validSubmission(workspace, overrides = {}) {
  const { manifest, packetItem } = packetContext(workspace);
  return {
    submission_id: 'human_submission_a',
    coder_id: 'human_coder_a',
    coder_role: 'human_coder',
    submission_date: '2026-06-27',
    input_packet_id: manifest.packet_id,
    input_packet_hash: manifest.input_packet_hash,
    training_completed: true,
    conflict_disclosure: 'none',
    notes: 'Test submission',
    items: [{
      packet_unit_id: packetItem.packet_unit_id,
      task_type: packetItem.packet_type,
      doc_id: packetItem.document_id,
      sentence_id: packetItem.sentence_id,
      span_id: null,
      metaphor_present: 'no',
      lexical_unit: null,
      lexical_unit_start: null,
      lexical_unit_end: null,
      basic_meaning: null,
      contextual_meaning: null,
      semantic_contrast: 'no',
      source_domain: null,
      target_domain: null,
      cluster_id: null,
      mapping_description: null,
      koenigsberg_function: null,
      violence_logic: null,
      obligatory_frame: null,
      sacrifice_logic: null,
      guilt_logic: null,
      providence_logic: null,
      reconciliation_logic: null,
      primary_actor: null,
      acted_upon_entity: null,
      agency_status: 'none',
      absence_flag: null,
      enslaved_people_present: 'no',
      black_soldiers_present: 'no',
      disease_or_purification_present: 'no',
      confidence: 'medium',
      ambiguity_flag: 'no',
      rival_reading: null,
      out_of_scope: 'no',
      coder_comment: 'No metaphor-related lexical unit was identified.'
    }],
    ...overrides
  };
}

function submissionPath(workspace, name) {
  return path.join(workspace, 'data', 'reliability', 'human-output-submissions', name);
}

function outputJSON(workspace, name) {
  return JSON.parse(fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', name), 'utf8'));
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCSVSubmission(workspace, submission, name = 'valid-human-output.csv') {
  const schema = JSON.parse(fs.readFileSync(path.join(workspace, 'schemas', 'stage4h-human-output.schema.json'), 'utf8'));
  const columns = [...schema['x-stage4h-csv'].metadata_columns, ...schema['x-stage4h-csv'].item_columns];
  const rows = submission.items.map(item => ({ ...submission, ...item }));
  const text = [
    columns.join(','),
    ...rows.map(row => columns.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
  fs.writeFileSync(submissionPath(workspace, name), text);
}

test('empty Stage 4H submission directory reports designed but not executed', t => {
  const workspace = copyWorkspace(t);
  const check = runIngest(workspace, ['--check']);
  assert.equal(check.status, 0, check.stderr);
  assert.equal(fs.existsSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json')), false);

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /No Stage 4H human submissions found/);

  const normalized = outputJSON(workspace, 'normalized-human-runs.json');
  const report = outputJSON(workspace, 'human-output-validation-report.json');
  assert.equal(normalized.status, 'no_submissions');
  assert.deepEqual(normalized.submissions, []);
  assert.equal(report.totals.submission_files, 0);
  assert.equal(report.totals.warnings, 1);
  assert.match(
    fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-output-validation-report.md'), 'utf8'),
    /Stage 4H is designed but not executed/
  );
});

test('one valid primary human submission normalizes as partial execution', t => {
  const workspace = copyWorkspace(t);
  fs.writeFileSync(submissionPath(workspace, 'human-a.json'), JSON.stringify(validSubmission(workspace), null, 2));

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);

  const normalized = outputJSON(workspace, 'normalized-human-runs.json');
  const report = outputJSON(workspace, 'human-output-validation-report.json');
  assert.equal(normalized.status, 'partial_execution');
  assert.equal(normalized.submissions.length, 1);
  assert.equal(normalized.submissions[0].coder_kind, 'primary');
  assert.equal(report.totals.primary_coders, 1);
  assert.match(
    fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-output-validation-report.md'), 'utf8'),
    /partially executed/
  );
});

test('two primary submissions plus supplemental CSV normalize through one contract', t => {
  const workspace = copyWorkspace(t);
  fs.writeFileSync(submissionPath(workspace, 'human-a.json'), JSON.stringify(validSubmission(workspace), null, 2));
  writeCSVSubmission(workspace, validSubmission(workspace, {
    submission_id: 'human_submission_b',
    coder_id: 'human_coder_b',
    notes: 'CSV submission'
  }), 'human-b.csv');
  fs.writeFileSync(submissionPath(workspace, 'human-supplemental.json'), JSON.stringify(validSubmission(workspace, {
    submission_id: 'human_submission_c',
    coder_id: 'human_coder_c'
  }), null, 2));

  const result = runIngest(workspace);
  assert.equal(result.status, 0, result.stderr);
  const normalized = outputJSON(workspace, 'normalized-human-runs.json');
  const report = outputJSON(workspace, 'human-output-validation-report.json');
  assert.equal(normalized.status, 'valid');
  assert.deepEqual(normalized.submissions.map(submission => submission.coder_id), [
    'human_coder_a',
    'human_coder_b',
    'human_coder_c'
  ]);
  assert.equal(normalized.submissions[2].coder_kind, 'supplemental');
  assert.equal(report.totals.primary_coders, 2);
  assert.equal(report.totals.supplemental_coders, 1);
  assert.equal(report.totals.normalized_items, 3);
});

test('invalid submissions produce readable validation errors and normalize none', t => {
  const workspace = copyWorkspace(t);
  const invalidItem = {
    ...validSubmission(workspace).items[0],
    doc_id: 'doc_999',
    sentence_id: 'doc_999_s01_p01_s01',
    out_of_scope: 'yes',
    coder_comment: '',
    violence_logic: 'invented'
  };
  const unknownPacketItem = {
    ...validSubmission(workspace).items[0],
    packet_unit_id: 'stage4h_ident_99999'
  };
  fs.writeFileSync(submissionPath(workspace, 'semantic-errors.json'), JSON.stringify(validSubmission(workspace, {
    submission_id: 'human_bad_semantic',
    input_packet_hash: '0'.repeat(64),
    items: [invalidItem, unknownPacketItem]
  }), null, 2));
  fs.writeFileSync(submissionPath(workspace, 'missing-fields.json'), JSON.stringify({
    submission_id: 'human_missing_fields',
    items: []
  }, null, 2));

  const result = runIngest(workspace);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /different Stage 4H input packet hash/);
  assert.match(result.stderr, /Unknown corpus document 'doc_999'/);
  assert.match(result.stderr, /does not map to a known Stage 4H packet item/);
  assert.match(result.stderr, /Out-of-scope items must include a reason/);
  assert.match(result.stderr, /Invalid violence_logic value/);
  assert.match(result.stderr, /Missing required field 'coder_id'/);

  const normalized = outputJSON(workspace, 'normalized-human-runs.json');
  const report = outputJSON(workspace, 'human-output-validation-report.json');
  assert.equal(normalized.status, 'validation_failed');
  assert.deepEqual(normalized.submissions, []);
  assert.equal(report.totals.invalid_submissions, 2);
  assert.equal(report.totals.normalized_items, 0);
});

test('ingestion rejects Stage 4H packet artifacts that drift from the manifest', t => {
  const workspace = copyWorkspace(t);
  const packetPath = path.join(
    workspace,
    'data',
    'reliability',
    'human-input-packets',
    'human-sentence-identification-packet.jsonl'
  );
  fs.appendFileSync(packetPath, '\n');

  const result = runIngest(workspace, ['--check']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Packet manifest hash mismatch for data\/reliability\/human-input-packets\/human-sentence-identification-packet\.jsonl/);
});

test('Stage 4H schema and generated templates expose the same CSV contract', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'stage4h-human-output.schema.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-packet-manifest.json'), 'utf8'));
  const csvHeader = fs.readFileSync(
    path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-coder-template.csv'),
    'utf8'
  ).split('\n', 1)[0].split(',');
  const jsonTemplate = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data', 'reliability', 'human-input-packets', 'human-coder-template.json'),
    'utf8'
  ));

  assert.deepEqual(csvHeader, [...schema['x-stage4h-csv'].metadata_columns, ...schema['x-stage4h-csv'].item_columns]);
  assert.equal(jsonTemplate.input_packet_id, manifest.packet_id);
  assert.equal(jsonTemplate.input_packet_hash, manifest.input_packet_hash);
  assert.ok(jsonTemplate.items.every(item => Object.hasOwn(item, 'packet_unit_id')));
  assert.ok(manifest.source_files.some(source => source.path === 'schemas/stage4h-human-output.schema.json'));
});
