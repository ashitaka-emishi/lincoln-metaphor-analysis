#!/usr/bin/env node
// Validate immediately after creating a Stage 4 annotation file.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANNOTATED_DIR = path.join(ROOT, 'corpus', 'annotated');

function resolveAnnotationPath(input) {
  if (!input) return null;

  if (input.endsWith('.json')) {
    return path.isAbsolute(input) ? input : path.join(ROOT, input);
  }

  return path.join(ANNOTATED_DIR, `${input}_annotated.json`);
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/validate_annotation_output.js <doc_id | annotated-json-path>');
    process.exit(1);
  }

  const filePath = resolveAnnotationPath(input);
  const relPath = path.relative(ROOT, filePath);

  if (!fs.existsSync(filePath)) {
    console.error(`Annotated file not found: ${relPath}`);
    process.exit(1);
  }

  console.log(`=== Post-creation annotation validation ===`);
  console.log(`Checking ${relPath}\n`);

  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'validate_schema.js')], {
    cwd: ROOT,
    encoding: 'utf8'
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status === 0) {
    console.log(`\n✓ ${relPath} passed repository validation after creation.`);
    return;
  }

  console.error(`\nValidation failed after creating ${relPath}.`);
  console.error('Prompt the user before proceeding:');
  console.error(`  Validation failed for \`${relPath}\`. Should I fix the schema errors now, show you the errors only, or leave the file as-is and stop?`);
  process.exit(result.status || 1);
}

main();
