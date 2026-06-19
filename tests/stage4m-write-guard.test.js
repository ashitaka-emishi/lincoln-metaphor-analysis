const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createWriteGuard } = require('../scripts/stage4m/write-guard');

const ROOT = path.resolve(__dirname, '..');

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4m-write-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'corpus', 'annotated'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'evidence'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'reliability'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'methodology'), { recursive: true });
  return root;
}

test('write guard permits only declared Stage 4M output locations', t => {
  const root = workspace(t);
  const guard = createWriteGuard(root);
  const allowed = [
    path.join(root, 'data', 'reliability', 'model-input-packets', 'manifest.json'),
    path.join(root, 'data', 'reliability', 'model-comparison', 'agreement.json'),
    path.join(root, 'data', 'reliability', 'model-adjudication', 'candidate.csv'),
    path.join(root, 'docs', 'methodology', 'stage4m-adjudication-guide.md')
  ];
  for (const filePath of allowed) {
    assert.doesNotThrow(() => guard.assertStage4mWritePath(filePath));
    assert.doesNotThrow(() => guard.writeAtomic(filePath, 'allowed\n'));
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'allowed\n');
  }
  assert.throws(
    () => guard.assertStage4mWritePath(path.join(root, 'docs', 'methodology', 'unrelated.md')),
    /outside allowlisted output paths/
  );
});

test('write guard rejects Stage 4A, evidence, and Stage 4B writes', t => {
  const root = workspace(t);
  const guard = createWriteGuard(root);
  const protectedTargets = [
    path.join(root, 'corpus', 'annotated', 'doc_001_annotated.json'),
    path.join(root, 'data', 'evidence', 'annotation-evidence.json'),
    path.join(root, 'data', 'reliability', 'reliability-sample.json'),
    path.join(root, 'data', 'reliability', 'double-coding-template.csv'),
    path.join(root, 'data', 'reliability', 'double-coding-completed.csv'),
    path.join(root, 'data', 'reliability', 'adjudication-log.csv'),
    path.join(root, 'data', 'reliability', 'reliability-results.json'),
    path.join(root, 'data', 'reliability', 'reliability-second-pass-overrides.json'),
    path.join(root, 'data', 'reliability', 'model-output-submissions', 'run.json')
  ];
  for (const filePath of protectedTargets) {
    assert.throws(
      () => guard.writeAtomic(filePath, 'forbidden\n'),
      /protected Stage 4A\/Stage 4B path/
    );
    assert.equal(fs.existsSync(filePath), false);
  }
});

test('write guard resolves symlinks before applying output allowlists', t => {
  const root = workspace(t);
  const comparison = path.join(root, 'data', 'reliability', 'model-comparison');
  fs.symlinkSync(path.join(root, 'corpus', 'annotated'), comparison);
  const guard = createWriteGuard(root);
  const disguisedProtectedPath = path.join(comparison, 'doc_001_annotated.json');
  assert.throws(
    () => guard.writeAtomic(disguisedProtectedPath, 'forbidden\n'),
    /protected Stage 4A\/Stage 4B path/
  );
  assert.equal(
    fs.existsSync(path.join(root, 'corpus', 'annotated', 'doc_001_annotated.json')),
    false
  );
});

test('all Stage 4M writers use the shared guard and avoid direct filesystem writes', () => {
  const stage4mDir = path.join(ROOT, 'scripts', 'stage4m');
  const writerNames = [
    'generate-model-packets.js',
    'ingest-model-outputs.js',
    'compare-model-runs.js',
    'classify-model-disagreements.js',
    'generate-adjudication-queue.js',
    'generate-model-consensus-report.js'
  ];
  for (const name of writerNames) {
    const source = fs.readFileSync(path.join(stage4mDir, name), 'utf8');
    assert.match(source, /require\(['"]\.\/write-guard['"]\)/, `${name} must import the shared guard`);
    assert.doesNotMatch(
      source,
      /fs\.(writeFileSync|renameSync|appendFileSync|copyFileSync|mkdirSync|rmSync|unlinkSync)\s*\(/,
      `${name} must not mutate files outside the shared guard`
    );
  }
});
