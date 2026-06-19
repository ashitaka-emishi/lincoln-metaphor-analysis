const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { stage4mStatus } = require('../scripts/pipeline_status');

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-status-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'data', 'reliability', 'model-output-submissions'), { recursive: true });
  return root;
}

function writeJSON(root, parts, value) {
  const filePath = path.join(root, ...parts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

test('Stage 4M status reports designed but not executed without submissions', t => {
  const root = workspace(t);
  writeJSON(root, ['data', 'reliability', 'model-input-packets', 'model-packet-manifest.json'], {
    status: 'packet_ready'
  });
  writeJSON(root, ['data', 'reliability', 'model-comparison', 'normalized-model-runs.json'], {
    status: 'no_submissions'
  });
  const status = stage4mStatus(root);
  assert.equal(status.summary, 'Stage 4M designed but not executed');
  assert.equal(status.packet_status, 'packet_ready');
  assert.equal(status.submission_files, 0);
  assert.equal(status.normalized_status, 'no_submissions');
});

test('Stage 4M status distinguishes failed validation and review-ready outputs', t => {
  const root = workspace(t);
  const submissionDir = path.join(root, 'data', 'reliability', 'model-output-submissions');
  fs.writeFileSync(path.join(submissionDir, 'run.json'), '{}');
  writeJSON(root, ['data', 'reliability', 'model-comparison', 'model-run-validation-report.json'], {
    status: 'validation_failed',
    totals: { valid_runs: 0 }
  });
  assert.equal(stage4mStatus(root).summary, 'Stage 4M validation failed');

  writeJSON(root, ['data', 'reliability', 'model-comparison', 'model-run-validation-report.json'], {
    status: 'valid',
    totals: { valid_runs: 2 }
  });
  writeJSON(root, ['data', 'reliability', 'model-comparison', 'model-consensus-report.json'], {
    status: 'review_ready'
  });
  const ready = stage4mStatus(root);
  assert.equal(ready.summary, 'Stage 4M review ready');
  assert.equal(ready.valid_runs, 2);
  assert.equal(ready.consensus_status, 'review_ready');
});
