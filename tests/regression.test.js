const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { ABSENCE_FLAGS, CLUSTER_IDS, FANTASY_TYPES } = require('../scripts/schema_constants');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIRS = ['analysis', 'corpus', 'data', 'docs', 'schemas', 'scripts', 'synthesis'];

function copyFixtureWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-regression-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  for (const dir of FIXTURE_DIRS) {
    fs.cpSync(path.join(ROOT, dir), path.join(workspace, dir), {
      recursive: true,
      filter: source => !source.includes(`${path.sep}_site${path.sep}`)
    });
  }

  return workspace;
}

function runScript(workspace, scriptName, args = []) {
  return spawnSync(process.execPath, [path.join(workspace, 'scripts', scriptName), ...args], {
    cwd: workspace,
    encoding: 'utf8'
  });
}

function assertScriptPasses(result, label) {
  assert.equal(
    result.status,
    0,
    `${label} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`
  );
}

function readJSON(workspace, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(workspace, relativePath), 'utf8'));
}

function firstMetaphorInstance(annotation) {
  for (const section of annotation.sections || []) {
    for (const paragraph of section.paragraphs || []) {
      for (const sentence of paragraph.sentences || []) {
        if ((sentence.metaphor_instances || []).length > 0) {
          return sentence.metaphor_instances[0];
        }
      }
    }
  }
  throw new Error('Fixture annotation has no metaphor instances');
}

test('canonical schema constants preserve drift-sensitive enum values', () => {
  assert.equal(CLUSTER_IDS.length, 6);
  assert.ok(CLUSTER_IDS.includes('cluster_01_body_organism'));
  assert.ok(FANTASY_TYPES.includes('disease_and_purification'));
  assert.ok(ABSENCE_FLAGS.includes('disease_purification_absent'));
});

test('schema validation and per-annotation validation pass on fixture workspace', t => {
  const workspace = copyFixtureWorkspace(t);

  const schema = runScript(workspace, 'validate_schema.js');
  assertScriptPasses(schema, 'validate_schema.js');
  assert.match(schema.stdout, /All validations passed/);

  const provenance = runScript(workspace, 'validate_source_provenance.js');
  assertScriptPasses(provenance, 'validate_source_provenance.js');
  assert.match(provenance.stdout, /Source provenance checksums valid/);

  const annotation = runScript(workspace, 'validate_annotation_output.js', ['doc_001']);
  assertScriptPasses(annotation, 'validate_annotation_output.js doc_001');
  assert.match(annotation.stdout, /doc_001_annotated\.json passed repository validation/);
});

test('source provenance validation rejects source text checksum drift', t => {
  const workspace = copyFixtureWorkspace(t);
  const sourcePath = path.join(workspace, 'corpus', 'text', 'doc_001.md');
  fs.appendFileSync(sourcePath, '\n<!-- unintended source drift -->\n');

  const provenance = runScript(workspace, 'validate_source_provenance.js');
  assert.notEqual(provenance.status, 0, 'validate_source_provenance.js should reject source checksum drift');
  assert.match(provenance.stderr, /doc_001\.canonical_text: sha256 expected/);
});

test('schema validation rejects invalid Stage 4 absence flags', t => {
  const workspace = copyFixtureWorkspace(t);
  const annotationPath = path.join(workspace, 'corpus', 'annotated', 'doc_001_annotated.json');
  const annotation = JSON.parse(fs.readFileSync(annotationPath, 'utf8'));
  const instance = firstMetaphorInstance(annotation);
  instance.koenigsberg.absence_flags.push('disease_purification_missing');
  fs.writeFileSync(annotationPath, JSON.stringify(annotation, null, 2));

  const schema = runScript(workspace, 'validate_schema.js');
  assert.notEqual(schema.status, 0, 'validate_schema.js should reject invalid absence flags');
  assert.match(schema.stderr, /invalid absence_flag 'disease_purification_missing'/);
});

test('generated-output scripts produce stable regression counts in fixture workspace', t => {
  const workspace = copyFixtureWorkspace(t);
  const scripts = [
    'build_concordance.js',
    'build_evidence_chains.js',
    'build_controlled_analysis.js',
    'build_reliability_sample.js',
    'build_reliability_results.js',
    'build_claim_audit.js'
  ];

  for (const script of scripts) {
    assertScriptPasses(runScript(workspace, script), script);
  }

  const concordance = readJSON(workspace, 'data/concordance.json');
  assert.equal(concordance.total_documents, 28);
  assert.equal(concordance.total_instances, 136);
  assert.equal(concordance.indexes.high_confidence_only.length, 51);
  assert.equal(concordance.indexes.suppression_instances.length, 7);
  assert.equal(concordance.indexes.by_absence_flag.disease_purification_absent.length, 56);

  const controlled = readJSON(workspace, 'analysis/controlled-analysis.json');
  const full = controlled.subsets.find(subset => subset.name === 'full_corpus');
  const high = controlled.subsets.find(subset => subset.name === 'high_authorship_confidence_0_95');
  assert.equal(full.total_instances, 136);
  assert.equal(full.total_documents, 27);
  assert.equal(full.cluster_totals.cluster_01_body_organism, 34);
  assert.equal(high.total_instances, 73);
  assert.equal(high.total_documents, 13);
  assert.equal(high.cluster_totals.cluster_06_providence_theodicy, 16);

  const reliability = readJSON(workspace, 'data/reliability/reliability-results.json');
  assert.equal(reliability.status, 'complete');
  assert.equal(reliability.sample_summary.identification_units, 55);
  assert.equal(reliability.sample_summary.field_agreement_units, 51);
  assert.equal(reliability.identification_metrics.agreement_rate, 94.55);
  assert.equal(reliability.identification_metrics.cohen_kappa_present_absent, 0.86);
  assert.equal(reliability.adjudication_summary.total_disagreements_adjudicated, 8);

  const audit = readJSON(workspace, 'data/audit/claim-audit.json');
  const diseaseClaim = audit.claims.find(claim => claim.claim_id === 'CLAIM-002');
  assert.equal(audit.total_claims, 6);
  assert.equal(diseaseClaim.evidence_universe.matching_record_count, 56);
  assert.equal(diseaseClaim.selected_records.length, 5);

  const schema = runScript(workspace, 'validate_schema.js');
  assertScriptPasses(schema, 'validate_schema.js after generated outputs');
});
