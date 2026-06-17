#!/usr/bin/env node
// Validates or writes Stage 1/2 source provenance checksum metadata.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'corpus', 'corpus_manifest.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'metadata', 'source-provenance-checksums.json');
const WRITE_MODE = process.argv.includes('--write');

function rel(filePath) {
  return path.relative(ROOT, filePath);
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fileRecord(filePath) {
  const exists = fs.existsSync(filePath);
  return {
    path: rel(filePath),
    exists,
    sha256: exists ? sha256(filePath) : null,
    bytes: exists ? fs.statSync(filePath).size : null
  };
}

function generatedDate() {
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const existing = readJSON(OUTPUT_PATH);
      if (/^\d{4}-\d{2}-\d{2}$/.test(existing.generated || '')) return existing.generated;
    } catch (_) {}
  }
  return new Date().toISOString().slice(0, 10);
}

function buildRegistry() {
  const manifest = readJSON(MANIFEST_PATH);
  const records = (manifest.documents || []).map(doc => {
    const rawPath = path.join(ROOT, 'corpus', 'raw', `${doc.id}.txt`);
    const canonicalTextPath = path.join(ROOT, 'corpus', 'text', `${doc.id}.md`);
    const canonicalText = fileRecord(canonicalTextPath);
    if (!canonicalText.exists) throw new Error(`Required source file missing: ${canonicalText.path}`);

    return {
      document_id: doc.id,
      source_url: doc.source_url,
      source_text: doc.source_text,
      source_edition: doc.source_edition,
      editorial_status: doc.editorial_status,
      risk_flags: doc.risk_flags || [],
      known_limitations: doc.known_limitations || [],
      files: {
        raw_text: fileRecord(rawPath),
        canonical_text: canonicalText
      }
    };
  });

  return {
    version: '1.0',
    generated: generatedDate(),
    status: 'complete',
    source_manifest: 'corpus/corpus_manifest.json',
    checksum_algorithm: 'sha256',
    update_policy: 'When a corpus/raw or corpus/text source file is intentionally corrected, make the source-file edit, run npm run source:provenance to refresh this registry, then run npm run validate and include the correction rationale in the same issue or commit.',
    total_documents: records.length,
    records,
    indexes: {
      by_document: Object.fromEntries(records.map((record, index) => [record.document_id, index])),
      raw_files_present: records.filter(record => record.files.raw_text.exists).map(record => record.document_id),
      raw_files_missing: records.filter(record => !record.files.raw_text.exists).map(record => record.document_id)
    }
  };
}

function sameArray(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function validateFileRecord(errors, record, key, expected, required = false) {
  const actual = record.files && record.files[key];
  const label = `${record.document_id}.${key}`;
  if (required && !expected.exists) {
    errors.push(`${label}: required source file missing at ${expected.path}`);
    return;
  }
  if (!actual) {
    errors.push(`${label}: missing file record`);
    return;
  }
  for (const field of ['path', 'exists', 'sha256', 'bytes']) {
    if (actual[field] !== expected[field]) {
      errors.push(`${label}: ${field} expected ${JSON.stringify(expected[field])}, found ${JSON.stringify(actual[field])}`);
    }
  }
}

function validateRegistry() {
  const errors = [];
  if (!fs.existsSync(OUTPUT_PATH)) {
    errors.push(`${rel(OUTPUT_PATH)} not found. Run npm run source:provenance to create it.`);
    return errors;
  }

  const manifest = readJSON(MANIFEST_PATH);
  const registry = readJSON(OUTPUT_PATH);
  const records = Array.isArray(registry.records) ? registry.records : [];
  const recordById = new Map(records.map(record => [record.document_id, record]));
  const seenRecordIds = new Set();

  if (registry.version !== '1.0') errors.push(`version must be 1.0, found ${registry.version}`);
  if (registry.status !== 'complete') errors.push(`status must be complete, found ${registry.status}`);
  if (registry.source_manifest !== 'corpus/corpus_manifest.json') errors.push('source_manifest must be corpus/corpus_manifest.json');
  if (registry.checksum_algorithm !== 'sha256') errors.push('checksum_algorithm must be sha256');
  if (registry.total_documents !== (manifest.documents || []).length) {
    errors.push(`total_documents expected ${(manifest.documents || []).length}, found ${registry.total_documents}`);
  }

  for (const doc of manifest.documents || []) {
    const record = recordById.get(doc.id);
    if (!record) {
      errors.push(`${doc.id}: missing source provenance checksum record`);
      continue;
    }

    for (const field of ['source_url', 'source_text', 'source_edition', 'editorial_status']) {
      if (record[field] !== doc[field]) {
        errors.push(`${doc.id}: ${field} changed without provenance refresh`);
      }
    }
    if (!sameArray(record.risk_flags, doc.risk_flags || [])) {
      errors.push(`${doc.id}: risk_flags changed without provenance refresh`);
    }
    if (!sameArray(record.known_limitations, doc.known_limitations || [])) {
      errors.push(`${doc.id}: known_limitations changed without provenance refresh`);
    }

    validateFileRecord(errors, record, 'raw_text', fileRecord(path.join(ROOT, 'corpus', 'raw', `${doc.id}.txt`)));
    validateFileRecord(errors, record, 'canonical_text', fileRecord(path.join(ROOT, 'corpus', 'text', `${doc.id}.md`)), true);
  }

  for (const record of records) {
    if (!record.document_id) {
      errors.push('Invalid checksum record with missing document_id');
      continue;
    }
    if (seenRecordIds.has(record.document_id)) {
      errors.push(`${record.document_id}: duplicate checksum record`);
    }
    seenRecordIds.add(record.document_id);
    if (!manifest.documents.some(doc => doc.id === record.document_id)) {
      errors.push(`${record.document_id}: checksum record has no manifest document`);
    }
  }

  return errors;
}

function main() {
  if (WRITE_MODE) {
    const registry = buildRegistry();
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    console.log(`Source provenance checksums written to ${rel(OUTPUT_PATH)}`);
    console.log(`Documents indexed: ${registry.total_documents}`);
    console.log(`Raw files present: ${registry.indexes.raw_files_present.length}`);
    console.log(`Canonical text files present: ${registry.records.filter(record => record.files.canonical_text.exists).length}`);
  }

  const errors = validateRegistry();
  if (errors.length > 0) {
    console.error('ERROR: Source provenance checksum validation failed.');
    for (const error of errors) console.error(`  ${error}`);
    if (!WRITE_MODE) {
      console.error('\nIf the source change was intentional, run npm run source:provenance and commit the updated registry with the source correction rationale.');
    }
    process.exit(1);
  }

  console.log(`Source provenance checksums valid (${readJSON(OUTPUT_PATH).records.length} documents).`);
}

main();
