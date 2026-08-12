const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createWriteGuard } = require('../scripts/stage4h/write-guard');

const ROOT = path.resolve(__dirname, '..');

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lincoln-stage4h-write-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'corpus', 'annotated'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'evidence'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'audit'), { recursive: true });
  fs.mkdirSync(path.join(root, 'analysis'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'reliability'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'methodology'), { recursive: true });
  return root;
}

test('Stage 4H/4J write guard permits only declared output locations', t => {
  const root = workspace(t);
  const guard = createWriteGuard(root);
  const allowed = [
    path.join(root, 'data', 'reliability', 'human-input-packets', 'manifest.json'),
    path.join(root, 'data', 'reliability', 'human-output-submissions', 'coder-a.json'),
    path.join(root, 'data', 'reliability', 'human-comparison', 'agreement.json'),
    path.join(root, 'data', 'reliability', 'human-adjudication', 'stage4j.csv'),
    path.join(root, 'docs', 'methodology', 'human-reliability-results.md'),
    path.join(root, 'docs', 'methodology', 'stage4j-adjudication-results.md'),
    path.join(root, 'docs', 'methodology', 'stage4h-codebook-revision-notes.md')
  ];
  for (const filePath of allowed) {
    assert.doesNotThrow(() => guard.assertStage4hWritePath(filePath));
    assert.doesNotThrow(() => guard.writeAtomic(filePath, 'allowed\n'));
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'allowed\n');
  }
  assert.throws(
    () => guard.assertStage4hWritePath(path.join(root, 'docs', 'methodology', 'unrelated.md')),
    /outside allowlisted output paths/
  );
});

test('Stage 4H/4J write guard rejects protected Stage 4A and derivative paths', t => {
  const root = workspace(t);
  const guard = createWriteGuard(root);
  const protectedTargets = [
    path.join(root, 'corpus', 'annotated', 'doc_001_annotated.json'),
    path.join(root, 'data', 'evidence', 'annotation-evidence.json'),
    path.join(root, 'data', 'concordance.json'),
    path.join(root, 'analysis', 'analysis.json'),
    path.join(root, 'analysis', 'controlled-analysis.json'),
    path.join(root, 'data', 'audit', 'claim-audit.json')
  ];
  for (const filePath of protectedTargets) {
    assert.throws(
      () => guard.writeAtomic(filePath, 'forbidden\n'),
      /protected Stage 4A path/
    );
    assert.equal(fs.existsSync(filePath), false);
  }
});

test('Stage 4H/4J write guard resolves symlinks before enforcing protected paths', t => {
  const root = workspace(t);
  const comparison = path.join(root, 'data', 'reliability', 'human-comparison');
  fs.symlinkSync(path.join(root, 'corpus', 'annotated'), comparison);
  const guard = createWriteGuard(root);
  const disguisedProtectedPath = path.join(comparison, 'doc_001_annotated.json');
  assert.throws(
    () => guard.writeAtomic(disguisedProtectedPath, 'forbidden\n'),
    /protected Stage 4A path/
  );
  assert.equal(
    fs.existsSync(path.join(root, 'corpus', 'annotated', 'doc_001_annotated.json')),
    false
  );
});

test('all Stage 4H and Stage 4J writers use the shared guard and avoid direct filesystem writes', () => {
  const directMutation = /fs\.(writeFileSync|renameSync|appendFileSync|copyFileSync|mkdirSync|rmSync|unlinkSync)\s*\(/;
  const allScripts = fs.readdirSync(path.join(ROOT, 'scripts', 'stage4h'))
    .filter(name => name.endsWith('.js') && name !== 'write-guard.js')
    .map(name => ['scripts', 'stage4h', name])
    .concat(fs.readdirSync(path.join(ROOT, 'scripts', 'stage4j'))
      .filter(name => name.endsWith('.js'))
      .map(name => ['scripts', 'stage4j', name]));
  for (const parts of allScripts) {
    const source = fs.readFileSync(path.join(ROOT, ...parts), 'utf8');
    assert.doesNotMatch(source, directMutation, `${parts.join('/')} must not mutate files directly`);
  }

  const writerFiles = [
    ...[
      'compare-human-runs.js',
      'compare-human-to-reference.js',
      'generate-human-adjudication-queue.js',
      'generate-human-packets.js',
      'generate-human-reliability-report.js',
      'ingest-human-outputs.js'
    ].map(name => ['scripts', 'stage4h', name]),
    ...[
      'generate-adjudication-results.js',
      'generate-codebook-revision-notes.js',
      'ingest-adjudication-decisions.js'
    ].map(name => ['scripts', 'stage4j', name])
  ];

  for (const parts of writerFiles) {
    const filePath = path.join(ROOT, ...parts);
    const source = fs.readFileSync(filePath, 'utf8');
    const relative = parts.join('/');
    assert.match(source, /require\(['"](?:\.\/|\.\.\/stage4h\/)write-guard['"]\)/, `${relative} must import the shared guard`);
  }
});
