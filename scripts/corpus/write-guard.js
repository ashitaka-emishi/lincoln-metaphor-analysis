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

function createCorpusV4WriteGuard(root) {
  const projectRoot = canonicalPath(path.resolve(root));
  const protectedDirectories = [
    path.join(projectRoot, 'corpus', 'raw'),
    path.join(projectRoot, 'corpus', 'segmented'),
    path.join(projectRoot, 'corpus', 'annotated'),
    path.join(projectRoot, 'data', 'evidence'),
    path.join(projectRoot, 'data', 'audit'),
    path.join(projectRoot, 'analysis')
  ];
  const allowedDirectories = [
    path.join(projectRoot, 'corpus', 'raw', 'v4-core'),
    path.join(projectRoot, 'corpus', 'raw', 'v4-validation'),
    path.join(projectRoot, 'corpus', 'raw', 'v4-reference'),
    path.join(projectRoot, 'corpus', 'normalized', 'v4-core'),
    path.join(projectRoot, 'corpus', 'normalized', 'v4-validation'),
    path.join(projectRoot, 'corpus', 'segmented', 'v4-core'),
    path.join(projectRoot, 'corpus', 'segmented', 'v4-validation'),
    path.join(projectRoot, 'data', 'corpus'),
    path.join(projectRoot, 'docs', 'corpus'),
    path.join(projectRoot, 'corpus', 'provenance')
  ];

  function assertCorpusV4WritePath(filePath) {
    const resolved = path.resolve(projectRoot, filePath);
    const target = canonicalPath(resolved);
    if (!pathWithin(target, projectRoot)) {
      return target;
    }
    if (allowedDirectories.some(directory => pathWithin(target, directory))) {
      return target;
    }
    if (protectedDirectories.some(directory => pathWithin(target, directory))) {
      throw new Error(`Refusing v4 corpus write to protected v1/Stage 4 path: ${filePath}`);
    }
    throw new Error(`Refusing v4 corpus write outside allowlisted output paths: ${filePath}`);
  }

  function ensureDirectory(dirPath) {
    assertCorpusV4WritePath(path.join(dirPath, '.gitkeep'));
    fs.mkdirSync(dirPath, { recursive: true });
  }

  function writeFile(filePath, contents) {
    assertCorpusV4WritePath(filePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents);
  }

  return {
    allowedDirectories,
    assertCorpusV4WritePath,
    ensureDirectory,
    protectedDirectories,
    writeFile
  };
}

const DEFAULT_ROOT = process.env.CORPUS_V4_ROOT
  ? path.resolve(process.env.CORPUS_V4_ROOT)
  : path.resolve(__dirname, '..', '..');

module.exports = {
  ...createCorpusV4WriteGuard(DEFAULT_ROOT),
  canonicalPath,
  createCorpusV4WriteGuard,
  pathWithin
};
