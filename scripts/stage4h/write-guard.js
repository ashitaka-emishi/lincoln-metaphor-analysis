'use strict';

const fs = require('fs');
const path = require('path');
const { canonicalPath, pathWithin } = require('../stage4m/write-guard');

function createWriteGuard(root) {
  const projectRoot = canonicalPath(path.resolve(root));
  const protectedPaths = [
    path.join(projectRoot, 'corpus', 'annotated'),
    path.join(projectRoot, 'data', 'evidence', 'annotation-evidence.json'),
    path.join(projectRoot, 'data', 'concordance.json'),
    path.join(projectRoot, 'analysis'),
    path.join(projectRoot, 'data', 'audit', 'claim-audit.json')
  ];
  const allowedDirectories = [
    path.join(projectRoot, 'data', 'reliability', 'human-input-packets'),
    path.join(projectRoot, 'data', 'reliability', 'human-output-submissions'),
    path.join(projectRoot, 'data', 'reliability', 'human-comparison'),
    path.join(projectRoot, 'data', 'reliability', 'human-adjudication')
  ];
  const allowedFiles = [
    path.join(projectRoot, 'docs', 'methodology', 'human-reliability-results.md'),
    path.join(projectRoot, 'docs', 'methodology', 'stage4j-adjudication-results.md'),
    path.join(projectRoot, 'docs', 'methodology', 'stage4h-codebook-revision-notes.md')
  ];

  function assertStage4hWritePath(filePath) {
    const target = canonicalPath(filePath);
    if (protectedPaths.some(protectedPath => pathWithin(target, protectedPath))) {
      throw new Error(`Refusing Stage 4H/4J write to protected Stage 4A path: ${filePath}`);
    }
    const allowed = allowedFiles.includes(target)
      || allowedDirectories.some(directory => pathWithin(target, directory));
    if (allowed) return target;
    throw new Error(`Refusing Stage 4H/4J write outside allowlisted output paths: ${filePath}`);
  }

  function writeAtomic(filePath, contents) {
    assertStage4hWritePath(filePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.tmp-${process.pid}`;
    fs.writeFileSync(temporaryPath, contents);
    fs.renameSync(temporaryPath, filePath);
  }

  return {
    allowedDirectories,
    allowedFiles,
    assertStage4hWritePath,
    protectedPaths,
    writeAtomic
  };
}

const DEFAULT_ROOT = (process.env.STAGE4H_ROOT || process.env.STAGE4J_ROOT)
  ? path.resolve(process.env.STAGE4H_ROOT || process.env.STAGE4J_ROOT)
  : path.resolve(__dirname, '..', '..');

module.exports = {
  ...createWriteGuard(DEFAULT_ROOT),
  createWriteGuard
};
