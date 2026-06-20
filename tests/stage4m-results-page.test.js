const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { renderPage, validateInputs } = require('../scripts/stage4m/generate-results-page');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'generate-results-page.js');

function populatedInputs() {
  const packetId = 'stage4m_0123456789abcdef';
  const category = (layer, agreements, comparisons, classification) => ({
    layer,
    agreements,
    comparisons,
    agreement_rate_pct: Number((agreements / comparisons * 100).toFixed(2)),
    classification
  });
  const runs = [
    {
      run_id: 'run_alpha', provider: 'Provider A', model_name: 'Model Alpha',
      model_version: '1', run_date: '2026-06-19', temperature: 0, items: [{}, {}]
    },
    {
      run_id: 'run_beta', provider: 'Provider B', model_name: 'Model Beta',
      model_version: '2', run_date: '2026-06-19', temperature: null, items: [{}, {}]
    }
  ];
  const disagreementItem = {
    disagreement_id: 'stage4m_disagreement_00001',
    disagreement_category: 'koenigsberg_function'
  };
  return {
    manifest: {
      packet_id: packetId,
      generator: { version: '2.0.1' },
      model_output_contract: { input_packet_hash: 'a'.repeat(64) },
      counts: { sentence_identification_units: 55, field_agreement_units: 51, output_template_seed_rows: 106 },
      selected_document_ids: ['doc_001', 'doc_021']
    },
    normalized: { status: 'valid', packet_id: packetId, runs },
    validation: {
      status: 'valid', packet_id: packetId,
      totals: { submission_files: 2, valid_runs: 2, invalid_runs: 0, normalized_items: 4 }
    },
    agreement: {
      status: 'complete', packet_id: packetId,
      totals: { model_runs: 2, packet_units: 106 },
      model_vs_reference: runs.map(run => ({
        run_id: run.run_id,
        coverage: { covered_packet_units: 2, total_packet_units: 106 },
        metaphor_identification: { true_positive: 1, true_negative: 1, false_positive: 0, false_negative: 0, uncertain: 0 },
        fields: { metaphor_present: { agreement_rate_pct: 100 } }
      })),
      model_vs_model: [{ comparison_id: 'run_alpha__run_beta' }],
      stability: {
        policy: 'Synthetic stability policy for rendering tests.',
        categories: {
          metaphor_present: category('metaphor_identification', 4, 4, 'stable'),
          cluster_id: category('cmt_mapping', 3, 4, 'stable'),
          source_domain: category('cmt_mapping', 2, 4, 'unstable'),
          koenigsberg_function: category('koenigsberg_interpretation', 1, 4, 'unstable'),
          agency_or_absence_flag: category('agency_absence', 1, 2, 'insufficient_evidence')
        }
      }
    },
    disagreement: {
      status: 'complete',
      totals: { model_runs: 2, disagreement_records: 1 },
      summaries: { by_disagreement_category: { koenigsberg_function: 1 } },
      disagreements: [disagreementItem]
    },
    consensus: {
      status: 'review_ready',
      summary: {
        model_runs: 2, stable_fields: 2, unstable_fields: 2, insufficient_evidence_fields: 1,
        disagreement_records: 1, human_review_items: 1
      },
      unstable_coding_fields: [
        { field: 'koenigsberg_function', layer: 'koenigsberg_interpretation', agreements: 1, comparisons: 4, agreement_rate_pct: 25 }
      ],
      insufficient_evidence_fields: [
        { field: 'agency_or_absence_flag', layer: 'agency_absence', agreements: 1, comparisons: 2, agreement_rate_pct: 50 }
      ]
    },
    queue: {
      totals: { queue_items: 1 },
      items: [{
        queue_order: 1, priority: 'high', doc_id: 'doc_021', sentence_id: 'doc_021_s01_p01_s01',
        field_name: 'koenigsberg_function', disagreement_category: 'koenigsberg_function'
      }]
    }
  };
}

test('empty-state command renders every section without inventing results', t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-results-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  for (const [source, destination] of [
    ['data/reliability/model-input-packets', 'data/reliability/model-input-packets'],
    ['data/reliability/model-comparison', 'data/reliability/model-comparison'],
    ['data/reliability/model-adjudication', 'data/reliability/model-adjudication']
  ]) {
    fs.cpSync(path.join(ROOT, source), path.join(workspace, destination), { recursive: true });
  }
  fs.mkdirSync(path.join(workspace, 'docs', 'methodology'), { recursive: true });
  const run = (args = []) => spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4M_ROOT: workspace }
  });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const outputPath = path.join(workspace, 'docs', 'methodology', 'multi-model-reliability-results.md');
  const page = fs.readFileSync(outputPath, 'utf8');
  assert.match(page, /Stage 4M is designed but not yet executed/);
  assert.doesNotMatch(page, /\b\d+(?:\.\d+)?%\b/);
  for (const heading of [
    'Run Summary', 'Models Compared', 'Input Packets', 'Overall Agreement',
    'Identification Agreement', 'CMT Mapping Agreement', 'Koenigsberg Layer Agreement',
    'Absence and Agency Agreement', 'Disagreement Types', 'Unstable Categories',
    'Human Adjudication Queue', 'Limits of Interpretation'
  ]) assert.match(page, new RegExp(`^## ${heading}$`, 'm'));
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(outputPath, 'utf8'), page);
  const check = run(['--check']);
  assert.equal(check.status, 0, check.stderr);
  fs.appendFileSync(outputPath, '\nStale text.\n');
  const stale = run(['--check']);
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /missing or stale.*stage4m:results/);
});

test('populated page summarizes generated metrics, models, disagreements, and queue', () => {
  const page = renderPage(populatedInputs());
  assert.match(page, /Model Alpha/);
  assert.match(page, /Model Beta/);
  assert.match(page, /Stable fields: \*\*2\*\*/);
  assert.match(page, /`source_domain` \| 2\/4 \| 50% \| unstable/);
  assert.match(page, /koenigsberg function \| 1/);
  assert.match(page, /`koenigsberg_function` \| koenigsberg interpretation \| 1\/4 \| 25%/);
  assert.match(page, /`doc_021`/);
  assert.match(page, /Model consensus cannot automatically revise Stage 4A/);
  assert.match(page, /publication package/);
});

test('results page rejects stale cross-artifact counts', () => {
  const inputs = populatedInputs();
  inputs.consensus.summary.model_runs = 1;
  assert.throws(() => validateInputs(inputs), /model-run counts differ/);
});

test('executed runs with no disagreement do not use the no-submission message', () => {
  const inputs = populatedInputs();
  inputs.disagreement.totals.disagreement_records = 0;
  inputs.disagreement.summaries.by_disagreement_category = {};
  inputs.disagreement.disagreements = [];
  inputs.consensus.summary.disagreement_records = 0;
  inputs.consensus.summary.human_review_items = 0;
  inputs.queue.totals.queue_items = 0;
  inputs.queue.items = [];
  const page = renderPage(inputs);
  assert.match(page, /No disagreement records were generated from the validated model runs/);
  assert.doesNotMatch(page, /No disagreement types can be reported before validated model submissions exist/);
});

test('results page is present in Quarto navigation', () => {
  const quarto = fs.readFileSync(path.join(ROOT, '_quarto.yml'), 'utf8');
  assert.match(
    quarto,
    /- href: docs\/methodology\/multi-model-reliability-results\.md\n\s+text: Stage 4M Results/
  );
});
