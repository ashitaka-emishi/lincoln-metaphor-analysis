const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const {
  generateReport,
  renderMarkdown
} = require('../scripts/stage4m/generate-model-consensus-report');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'stage4m', 'generate-model-consensus-report.js');

function populatedInputs() {
  const agreement = {
    status: 'complete',
    totals: { model_runs: 3, packet_units: 106 },
    stability: {
      categories: {
        cluster_id: {
          layer: 'cmt_mapping',
          agreements: 27,
          comparisons: 30,
          agreement_rate_pct: 90,
          classification: 'stable'
        },
        koenigsberg_function: {
          layer: 'koenigsberg_interpretation',
          agreements: 18,
          comparisons: 30,
          agreement_rate_pct: 60,
          classification: 'unstable'
        },
        agency_or_absence_flag: {
          layer: 'agency_absence',
          agreements: 2,
          comparisons: 3,
          agreement_rate_pct: 66.67,
          classification: 'insufficient_evidence'
        }
      }
    }
  };
  const disagreements = [
    {
      disagreement_id: 'stage4m_disagreement_00002',
      packet_unit_id: 'stage4m_unit_00002',
      doc_id: 'doc_021',
      sentence_id: 'doc_021_s01_p01_s02',
      field_name: 'koenigsberg_function',
      disagreement_category: 'over_interpretation',
      agreement_pattern: 'unanimous_against_reference',
      reference_value: 'punishment_and_theodicy',
      model_values: { run_a: 'disease_and_purification', run_b: 'disease_and_purification' },
      all_models_against_reference: true,
      cmt_agreement_koenigsberg_disagreement: true,
      over_read_type: 'purification',
      requires_human_adjudication: true,
      rationale: 'Models introduce a purification reading.'
    },
    {
      disagreement_id: 'stage4m_disagreement_00001',
      packet_unit_id: 'stage4m_unit_00001',
      doc_id: 'doc_001',
      sentence_id: 'doc_001_s01_p01_s01',
      field_name: 'cluster_id',
      disagreement_category: 'cluster_assignment',
      agreement_pattern: 'majority_against_reference',
      reference_value: 'cluster_05_fathers_inheritance',
      model_values: {
        run_a: 'cluster_02_covenant_oath',
        run_b: 'cluster_02_covenant_oath',
        run_c: 'cluster_05_fathers_inheritance'
      },
      all_models_against_reference: false,
      cmt_agreement_koenigsberg_disagreement: false,
      over_read_type: null,
      requires_human_adjudication: false,
      rationale: 'Models diverge on cluster assignment.'
    },
    {
      disagreement_id: 'stage4m_disagreement_00003',
      packet_unit_id: 'stage4m_unit_00003',
      doc_id: 'doc_021',
      sentence_id: 'doc_021_s01_p01_s03',
      field_name: 'agency_or_absence_flag',
      disagreement_category: 'agency_or_absence_flag',
      agreement_pattern: 'split_no_majority',
      reference_value: [],
      model_values: { run_a: null, run_b: 'enslaved_people_non_agent' },
      all_models_against_reference: false,
      cmt_agreement_koenigsberg_disagreement: false,
      over_read_type: null,
      requires_human_adjudication: true,
      rationale: 'Agency coding is disputed.'
    }
  ];
  const disagreementLog = {
    status: 'complete',
    totals: { model_runs: 3, disagreement_records: disagreements.length },
    item_results: [
      {
        packet_unit_id: 'stage4m_unit_00004',
        doc_id: 'doc_017',
        sentence_id: 'doc_017_s01_p01_s01',
        task_type: 'field_agreement',
        agreement_pattern: 'unanimous_with_reference',
        disagreement_count: 0,
        field_patterns: { cluster_id: 'unanimous_with_reference' }
      },
      {
        packet_unit_id: 'stage4m_unit_00005',
        doc_id: 'doc_010',
        sentence_id: 'doc_010_s01_p01_s01',
        task_type: 'sentence_identification',
        agreement_pattern: 'reference_only',
        disagreement_count: 0,
        field_patterns: { metaphor_present: 'reference_only' }
      }
    ],
    disagreements
  };
  const queue = {
    totals: { queue_items: 3, high_priority: 2, medium_priority: 1, low_priority: 0 },
    items: [
      {
        queue_order: 3,
        queue_id: 'stage4m_queue_00003',
        disagreement_id: 'stage4m_disagreement_00003',
        priority: 'high',
        priority_reasons: ['agency_or_absence_disputed'],
        doc_id: 'doc_021',
        sentence_id: 'doc_021_s01_p01_s03',
        field_name: 'agency_or_absence_flag',
        disagreement_category: 'agency_or_absence_flag',
        suggested_review_question: 'Which actor is granted or denied agency?'
      },
      {
        queue_order: 2,
        queue_id: 'stage4m_queue_00002',
        disagreement_id: 'stage4m_disagreement_00002',
        priority: 'high',
        priority_reasons: ['all_models_disagree_with_stage4a'],
        doc_id: 'doc_021',
        sentence_id: 'doc_021_s01_p01_s02',
        field_name: 'koenigsberg_function',
        disagreement_category: 'over_interpretation',
        suggested_review_question: 'Is purification textually warranted?'
      },
      {
        queue_order: 1,
        queue_id: 'stage4m_queue_00001',
        disagreement_id: 'stage4m_disagreement_00001',
        priority: 'medium',
        priority_reasons: ['cluster_stable'],
        doc_id: 'doc_001',
        sentence_id: 'doc_001_s01_p01_s01',
        field_name: 'cluster_id',
        disagreement_category: 'cluster_assignment',
        suggested_review_question: 'Which cluster best fits?'
      }
    ]
  };
  return { agreement, disagreementLog, queue };
}

test('populated report summarizes stability, risk, reference strength, and review priorities', () => {
  const { agreement, disagreementLog, queue } = populatedInputs();
  const report = generateReport(agreement, disagreementLog, queue);

  assert.equal(report.status, 'review_ready');
  assert.equal(report.summary.stable_fields, 1);
  assert.equal(report.summary.unstable_fields, 1);
  assert.equal(report.summary.insufficient_evidence_fields, 1);
  assert.equal(report.summary.reference_challenges, 1);
  assert.equal(report.summary.strong_reference_cases, 1);
  assert.equal(report.summary.high_priority_review_items, 2);
  assert.equal(report.stable_coding_fields[0].field, 'cluster_id');
  assert.equal(report.unstable_coding_fields[0].field, 'koenigsberg_function');
  assert.equal(report.high_risk_documents[0].doc_id, 'doc_021');
  assert.equal(report.high_risk_documents[0].high_priority_queue_items, 2);
  assert.deepEqual(
    report.high_risk_clusters.map(item => item.cluster_id),
    ['cluster_02_covenant_oath', 'cluster_05_fathers_inheritance']
  );
  assert.equal(report.cases_where_models_challenge_reference[0].field_name, 'koenigsberg_function');
  assert.equal(report.cases_where_reference_remains_strong[0].doc_id, 'doc_017');
  assert.deepEqual(report.human_review_priorities.map(item => item.priority), ['high', 'high', 'medium']);
  assert.ok(report.annotation_codebook_implications.some(item => /purification/.test(item)));
  assert.ok(report.annotation_codebook_implications.some(item => /model evidence alone/.test(item)));

  const markdown = renderMarkdown(report);
  for (const heading of [
    '## Summary',
    '## Stable Coding Fields',
    '## Unstable Coding Fields',
    '## High-Risk Documents',
    '## High-Risk Clusters',
    '## High-Risk Interpretive Categories',
    '## Cases Where Models Challenge Reference',
    '## Cases Where Reference Remains Strong',
    '## Human Review Priorities',
    '## Implications for the Annotation Codebook'
  ]) {
    assert.match(markdown, new RegExp(heading));
  }
  assert.match(markdown, /No majority, unanimity, or aggregate score is decisive/);
});

test('report rejects stale downstream artifacts', () => {
  const { agreement, disagreementLog, queue } = populatedInputs();
  assert.throws(
    () => generateReport(
      agreement,
      { ...disagreementLog, totals: { ...disagreementLog.totals, model_runs: 2 } },
      queue
    ),
    /model-run counts differ/
  );
  assert.throws(
    () => generateReport(
      agreement,
      disagreementLog,
      { ...queue, totals: { ...queue.totals, queue_items: 2 } }
    ),
    /totals do not match/
  );
  assert.throws(
    () => generateReport(
      agreement,
      { ...disagreementLog, totals: { ...disagreementLog.totals, disagreement_records: 2 } },
      { ...queue, totals: { ...queue.totals, queue_items: 2 }, items: queue.items.slice(0, 2) }
    ),
    /Disagreement-log totals do not match/
  );
});

test('empty-state command writes deterministic JSON and every required report section', t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-consensus-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const comparison = path.join(workspace, 'data', 'reliability', 'model-comparison');
  const adjudication = path.join(workspace, 'data', 'reliability', 'model-adjudication');
  fs.mkdirSync(comparison, { recursive: true });
  fs.mkdirSync(adjudication, { recursive: true });
  for (const name of ['model-agreement-results.json', 'model-disagreement-log.json']) {
    fs.cpSync(
      path.join(ROOT, 'data', 'reliability', 'model-comparison', name),
      path.join(comparison, name)
    );
  }
  fs.cpSync(
    path.join(ROOT, 'data', 'reliability', 'model-adjudication', 'stage4m-adjudication-queue.json'),
    path.join(adjudication, 'stage4m-adjudication-queue.json')
  );

  const run = () => spawnSync(process.execPath, [SCRIPT], {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, STAGE4M_ROOT: workspace }
  });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stderr, /No validated Stage 4M model submissions/);
  const jsonPath = path.join(comparison, 'model-consensus-report.json');
  const firstJson = fs.readFileSync(jsonPath, 'utf8');
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(jsonPath, 'utf8'), firstJson);

  const report = JSON.parse(firstJson);
  assert.equal(report.status, 'no_submissions');
  assert.equal(report.summary.stable_fields, 0);
  assert.equal(report.summary.unstable_fields, 0);
  assert.equal(report.summary.insufficient_evidence_fields, 12);
  const markdown = fs.readFileSync(path.join(comparison, 'model-consensus-report.md'), 'utf8');
  assert.match(markdown, /explicit insufficient-evidence state/);
  assert.match(markdown, /`reference_only` is not counted as model support/);
  assert.match(markdown, /## Implications for the Annotation Codebook/);
});
