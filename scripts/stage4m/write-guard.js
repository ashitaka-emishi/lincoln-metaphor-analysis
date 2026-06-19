'use strict';

const fs = require('fs');
const path = require('path');

function pathWithin(candidate, root) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function canonicalPath(filePath) {
  const resolved = path.resolve(filePath);
  let ancestor = resolved;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  if (!fs.existsSync(ancestor)) return resolved;
  return path.join(fs.realpathSync.native(ancestor), path.relative(ancestor, resolved));
}

function createWriteGuard(root) {
  const projectRoot = canonicalPath(path.resolve(root));
  const protectedPaths = [
    path.join(projectRoot, 'corpus', 'annotated'),
    path.join(projectRoot, 'data', 'evidence'),
    path.join(projectRoot, 'data', 'reliability')
  ];
  const allowedDirectories = [
    path.join(projectRoot, 'data', 'reliability', 'model-input-packets'),
    path.join(projectRoot, 'data', 'reliability', 'model-comparison'),
    path.join(projectRoot, 'data', 'reliability', 'model-adjudication')
  ];
  const allowedFiles = [
    path.join(projectRoot, 'docs', 'methodology', 'stage4m-adjudication-guide.md'),
    path.join(projectRoot, 'docs', 'methodology', 'multi-model-reliability-results.md')
  ];

  function assertStage4mWritePath(filePath) {
    const target = canonicalPath(filePath);
    const allowed = allowedFiles.includes(target)
      || allowedDirectories.some(directory => pathWithin(target, directory));
    if (allowed) return target;
    if (protectedPaths.some(protectedPath => pathWithin(target, protectedPath))) {
      throw new Error(`Refusing Stage 4M write to protected Stage 4A/Stage 4B path: ${filePath}`);
    }
    throw new Error(`Refusing Stage 4M write outside allowlisted output paths: ${filePath}`);
  }

  function writeAtomic(filePath, contents) {
    assertStage4mWritePath(filePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.tmp-${process.pid}`;
    fs.writeFileSync(temporaryPath, contents);
    fs.renameSync(temporaryPath, filePath);
  }

  return {
    allowedDirectories,
    allowedFiles,
    assertStage4mWritePath,
    protectedPaths,
    writeAtomic
  };
}

const DEFAULT_ROOT = process.env.STAGE4M_ROOT
  ? path.resolve(process.env.STAGE4M_ROOT)
  : path.resolve(__dirname, '..', '..');

module.exports = {
  ...createWriteGuard(DEFAULT_ROOT),
  canonicalPath,
  createWriteGuard,
  pathWithin
};
