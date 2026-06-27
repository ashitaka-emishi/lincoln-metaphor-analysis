'use strict';

const path = require('path');
const { canonicalPath, pathWithin } = require('../stage4m/write-guard');

const DEFAULT_ROOT = process.env.STAGE4H_ROOT
  ? path.resolve(process.env.STAGE4H_ROOT)
  : path.resolve(__dirname, '..', '..');

const STAGE4H_ALLOWED_DIRECTORIES = [
  path.join(path.resolve(DEFAULT_ROOT), 'data', 'reliability', 'human-input-packets')
];

const STAGE4H_ALLOWED_FILES = [];

function writeAtomic(filePath, contents) {
  const target = canonicalPath(filePath);
  const allowed = STAGE4H_ALLOWED_FILES.includes(target)
    || STAGE4H_ALLOWED_DIRECTORIES.some(directory => pathWithin(target, directory));
  if (!allowed) {
    throw new Error(`Refusing Stage 4H write outside allowlisted output paths: ${filePath}`);
  }
  const fs = require('fs');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents);
  fs.renameSync(temporaryPath, filePath);
}

module.exports = { writeAtomic };
