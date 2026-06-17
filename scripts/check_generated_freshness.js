#!/usr/bin/env node
// Fails when tracked pipeline-generated outputs are stale after regeneration.
'use strict';

const { execFileSync } = require('child_process');

const GENERATED_OUTPUTS = [
  'data/concordance.json',
  'analysis/analysis.json',
  'data/evidence/annotation-evidence.json',
  'data/reliability/reliability-sample.json',
  'data/reliability/double-coding-template.csv',
  'data/reliability/adjudication-log.csv',
  'data/reliability/double-coding-completed.csv',
  'data/reliability/reliability-results.json',
  'docs/methodology/reliability-results.md',
  'data/metadata/textual-variant-apparatus.json',
  'docs/methodology/textual-variant-apparatus.md',
  'analysis/controlled-analysis.json',
  'analysis/controlled_outputs.md',
  'data/audit/claim-audit.json',
  'synthesis/claim_audit.md'
];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function nameStatus(args) {
  const output = git(args);
  return output ? output.split(/\r?\n/) : [];
}

function main() {
  const tracked = new Set(nameStatus(['ls-files', '--', ...GENERATED_OUTPUTS]));
  const missing = GENERATED_OUTPUTS.filter(filePath => !tracked.has(filePath));
  if (missing.length > 0) {
    console.error('ERROR: Generated-output freshness manifest includes untracked paths.');
    console.error('');
    for (const filePath of missing) console.error(`  ${filePath}`);
    process.exit(1);
  }

  const unstaged = nameStatus(['diff', '--name-status', '--', ...GENERATED_OUTPUTS]).map(line => `[unstaged] ${line}`);
  const staged = nameStatus(['diff', '--cached', '--name-status', '--', ...GENERATED_OUTPUTS]).map(line => `[staged] ${line}`);
  const changed = [...staged, ...unstaged];

  if (changed.length > 0) {
    console.error('ERROR: Pipeline-generated outputs are stale or unexpectedly changed.');
    console.error('');
    console.error('Changed generated files:');
    for (const line of changed) console.error(`  ${line}`);
    console.error('');
    console.error('Run `npm run pipeline` on a clean branch and commit the regenerated outputs, or restore unintended generated-output changes.');
    console.error('This check is scoped to tracked generated outputs, so unrelated local source edits are ignored; CI runs it after a clean checkout.');
    process.exit(1);
  }

  console.log(`Generated outputs are fresh (${GENERATED_OUTPUTS.length} tracked paths checked).`);
}

main();
