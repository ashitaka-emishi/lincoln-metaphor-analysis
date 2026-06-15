#!/usr/bin/env node
// Builds the publication-facing corpus register from corpus/corpus_manifest.json.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');
const OUTPUT_DIR = path.join(ROOT, 'data', 'metadata');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'corpus-register.csv');

const COLUMNS = [
  'id',
  'title',
  'short_title',
  'date',
  'period',
  'genre',
  'register',
  'source_edition',
  'source_url',
  'authorship',
  'authorship_confidence',
  'editorial_status',
  'inclusion_rationale',
  'known_limitations',
  'risk_flags',
  'analytical_priority',
  'word_count_approx',
  'pipeline_stage_completed'
];

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join('; ') : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function requireField(doc, field) {
  if (doc[field] === undefined || doc[field] === null || doc[field] === '') {
    throw new Error(`${doc.id || 'UNKNOWN'} missing required corpus-register field '${field}'`);
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const docs = manifest.documents || [];

  for (const doc of docs) {
    for (const field of COLUMNS) {
      if (field === 'risk_flags') continue;
      requireField(doc, field);
    }
    if (!Array.isArray(doc.known_limitations)) {
      throw new Error(`${doc.id}: known_limitations must be an array`);
    }
    if (!Array.isArray(doc.risk_flags)) {
      throw new Error(`${doc.id}: risk_flags must be an array`);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const lines = [
    COLUMNS.join(','),
    ...docs.map(doc => COLUMNS.map(column => csvEscape(doc[column])).join(','))
  ];

  fs.writeFileSync(OUTPUT_PATH, `${lines.join('\n')}\n`);
  console.log(`Corpus register written to ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Documents exported: ${docs.length}`);
}

main();
