const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const {
  buildConsensus,
  classifyStage4JCandidates,
  humanBooleanPresence,
  valuesMatch
} = require('../scripts/stage4h/compare-human-to-reference');

const ROOT = path.resolve(__dirname, '..');
const INGEST_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'ingest-human-outputs.js');
const COMPARE_SCRIPT = path.join(ROOT, 'scripts', 'stage4h', 'compare-human-to-reference.js');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'stage4h');

function copyWorkspace(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4h-reference-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));

  fs.mkdirSync(path.join(workspace, 'corpus'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'corpus', 'corpus_manifest.json'), path.join(workspace, 'corpus', 'corpus_manifest.json'));
  fs.cpSync(path.join(ROOT, 'corpus', 'segmented'), path.join(workspace, 'corpus', 'segmented'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability'), { recursive: true });
  for (const name of ['human-input-packets', 'reliability-sample.json']) {
    fs.cpSync(
      path.join(ROOT, 'data', 'reliability', name),
      path.join(workspace, 'data', 'reliability', name),
      { recursive: true }
    );
  }
  fs.cpSync(path.join(ROOT, 'schemas'), path.join(workspace, 'schemas'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-output-submissions'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'data', 'reliability', 'human-comparison'), { recursive: true });
  return workspace;
}

function runScript(scriptPath, workspace, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4H_ROOT: workspace }
  });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function installJSON(workspace, fixtureName, mutate = value => value) {
  const fixture = mutate(readJSON(path.join(FIXTURE_DIR, fixtureName)));
  fs.writeFileSync(
    path.join(workspace, 'data', 'reliability', 'human-output-submissions', fixtureName),
    JSON.stringify(fixture, null, 2)
  );
}

function outputJSON(workspace, name) {
  return readJSON(path.join(workspace, 'data', 'reliability', 'human-comparison', name));
}

test('reference command preserves no-submission state without implying Stage 4A error', t => {
  const workspace = copyWorkspace(t);
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json'),
    path.join(workspace, 'data', 'reliability', 'human-comparison', 'normalized-human-runs.json')
  );

  const result = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /No validated Stage 4H human submissions/);

  const reference = outputJSON(workspace, 'human-vs-reference-results.json');
  const markdown = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.md'), 'utf8');
  assert.equal(reference.status, 'no_submissions');
  assert.deepEqual(reference.human_vs_reference, []);
  assert.deepEqual(reference.stage4j_candidates, []);
  assert.match(reference.reference_policy, /not automatic corrections/);
  assert.match(markdown, /Human-vs-reference comparison will be generated/);
});

test('two human fixtures compare separately against Stage 4A and emit Stage 4J candidates', t => {
  const workspace = copyWorkspace(t);
  installJSON(workspace, 'valid-human-output-coder-a.json');
  installJSON(workspace, 'valid-human-output-coder-b.json');
  const ingest = runScript(INGEST_SCRIPT, workspace);
  assert.equal(ingest.status, 0, ingest.stderr);

  const compare = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(compare.status, 0, compare.stderr);
  const reference = outputJSON(workspace, 'human-vs-reference-results.json');

  assert.equal(reference.status, 'complete');
  assert.equal(reference.human_vs_reference.length, 2);
  assert.equal(reference.consensus_vs_reference.subject_id, 'human_consensus_unadjudicated');
  assert.equal(reference.adjudicated_vs_reference.available, false);
  assert.match(reference.separation_policy, /separately from human-human agreement/);
  assert.equal(reference.human_vs_reference[0].fields.cluster_id.rate_pct, 100);
  assert.equal(reference.human_vs_reference[0].fields.source_domain.rate_pct, 0);
  assert.ok(reference.stage4j_candidates.some(candidate => candidate.reasons.includes('both_humans_disagree_with_stage4a')));
  assert.ok(reference.stage4j_candidates.every(candidate => /not an automatic/.test(candidate.stage4a_policy)));

  const summary = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-vs-reference-summary.csv'), 'utf8');
  const markdown = fs.readFileSync(path.join(workspace, 'data', 'reliability', 'human-comparison', 'human-vs-reference-results.md'), 'utf8');
  assert.match(summary, /coder_vs_reference,human_coder_a,cmt_mapping,source_domain/);
  assert.match(summary, /consensus_vs_reference,human_consensus_unadjudicated/);
  assert.match(markdown, /## Stage 4J Candidate Flags/);
  assert.match(markdown, /Human disagreement with Stage 4A is a review signal/);
});

test('split human value with Stage 4A aligned to one coder is specially flagged', t => {
  const workspace = copyWorkspace(t);
  installJSON(workspace, 'valid-human-output-coder-a.json');
  installJSON(workspace, 'valid-human-output-coder-b.json', fixture => {
    fixture.items.find(item => item.packet_unit_id === 'stage4h_field_00001').cluster_id = 'cluster_01_body_organism';
    return fixture;
  });
  const ingest = runScript(INGEST_SCRIPT, workspace);
  assert.equal(ingest.status, 0, ingest.stderr);
  const compare = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(compare.status, 0, compare.stderr);

  const reference = outputJSON(workspace, 'human-vs-reference-results.json');
  const splitCandidate = reference.stage4j_candidates.find(candidate => candidate.field === 'cluster_id');
  assert.ok(splitCandidate);
  assert.ok(splitCandidate.reasons.includes('human_split_stage4a_aligns_with_one_coder'));
  assert.equal(splitCandidate.coder_values.human_coder_a, 'cluster_05_fathers_inheritance');
});

test('both humans uncertain against confident Stage 4A code is specially flagged', t => {
  const workspace = copyWorkspace(t);
  const makeUncertain = fixture => {
    const item = fixture.items.find(entry => entry.packet_unit_id === 'stage4h_field_00001');
    item.metaphor_present = 'uncertain';
    item.ambiguity_flag = 'yes';
    item.coder_comment = 'Fixture uncertainty against a confident reference code.';
    return fixture;
  };
  installJSON(workspace, 'valid-human-output-coder-a.json', makeUncertain);
  installJSON(workspace, 'valid-human-output-coder-b.json', makeUncertain);
  const ingest = runScript(INGEST_SCRIPT, workspace);
  assert.equal(ingest.status, 0, ingest.stderr);
  const compare = runScript(COMPARE_SCRIPT, workspace);
  assert.equal(compare.status, 0, compare.stderr);

  const reference = outputJSON(workspace, 'human-vs-reference-results.json');
  const uncertainCandidate = reference.stage4j_candidates.find(candidate => candidate.field === 'metaphor_present');
  assert.ok(uncertainCandidate);
  assert.ok(uncertainCandidate.reasons.includes('both_humans_uncertain_against_confident_stage4a'));
});

test('reference helper functions keep consensus and list comparison conservative', () => {
  const consensus = buildConsensus([
    {
      coder_id: 'human_coder_a',
      items: [{ packet_unit_id: 'unit_1', metaphor_present: 'yes', cluster_id: 'cluster_a' }]
    },
    {
      coder_id: 'human_coder_b',
      items: [{ packet_unit_id: 'unit_1', metaphor_present: 'yes', cluster_id: 'cluster_b' }]
    }
  ]);
  assert.equal(consensus.items[0].metaphor_present, 'yes');
  assert.equal(consensus.items[0].cluster_id, null);
  const splitConsensus = buildConsensus([
    {
      coder_id: 'human_coder_a',
      items: [{ packet_unit_id: 'unit_2', metaphor_present: 'yes' }]
    },
    {
      coder_id: 'human_coder_b',
      items: [{ packet_unit_id: 'unit_2', metaphor_present: 'no' }]
    }
  ]);
  assert.equal(splitConsensus.items[0].metaphor_present, 'split');
  assert.equal(valuesMatch('violence_logic', 'restorative|obligatory', 'obligatory|restorative'), true);
  assert.equal(valuesMatch('source_domain', 'inheritance', 'legal inheritance'), false);
  assert.equal(humanBooleanPresence('The inheritance must be transmitted intact.'), 'yes');
  assert.equal(humanBooleanPresence('no'), 'no');
  assert.equal(humanBooleanPresence(null), 'no');
});

test('classification helper flags all issue #94 Stage 4J routing cases', () => {
  const candidates = classifyStage4JCandidates([
    {
      subject_id: 'human_coder_a',
      item_results: [
        { packet_unit_id: 'u1', field: 'cluster_id', layer: 'cmt_mapping', human_value: 'a', stage4a_value: 'ref', matches_reference: false, reference_confident: true },
        { packet_unit_id: 'u2', field: 'metaphor_present', layer: 'identification', human_value: 'ref', stage4a_value: 'ref', matches_reference: true, reference_confident: true },
        { packet_unit_id: 'u3', field: 'metaphor_present', layer: 'identification', human_value: 'uncertain', stage4a_value: 'yes', matches_reference: false, reference_confident: true }
      ]
    },
    {
      subject_id: 'human_coder_b',
      item_results: [
        { packet_unit_id: 'u1', field: 'cluster_id', layer: 'cmt_mapping', human_value: 'b', stage4a_value: 'ref', matches_reference: false, reference_confident: true },
        { packet_unit_id: 'u2', field: 'metaphor_present', layer: 'identification', human_value: 'human_split', stage4a_value: 'ref', matches_reference: false, reference_confident: true },
        { packet_unit_id: 'u3', field: 'metaphor_present', layer: 'identification', human_value: 'uncertain', stage4a_value: 'yes', matches_reference: false, reference_confident: true }
      ]
    }
  ]);
  assert.ok(candidates.some(candidate => candidate.reasons.includes('both_humans_disagree_with_stage4a')));
  assert.ok(candidates.some(candidate => candidate.reasons.includes('human_split_stage4a_aligns_with_one_coder')));
  assert.ok(candidates.some(candidate => candidate.reasons.includes('both_humans_uncertain_against_confident_stage4a')));
});
