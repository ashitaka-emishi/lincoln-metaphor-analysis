#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  coreRaw: 'corpus/raw/v4-core',
  validationRaw: 'corpus/raw/v4-validation',
  coreInventory: 'data/corpus/corpus-v4-core-inventory.json',
  validationInventory: 'data/corpus/corpus-v4-validation-inventory.json',
  coreNormalized: 'corpus/normalized/v4-core',
  validationNormalized: 'corpus/normalized/v4-validation',
  manifest: 'data/corpus/corpus-v4-ingestion-manifest.json'
};

const BOILERPLATE_PATTERNS = [
  /^\s*\*\*\*\s*(START|END) OF (THIS|THE) PROJECT GUTENBERG/i,
  /^\s*Project Gutenberg(?:'s)?\b/i,
  /^\s*(Home|News|Books|Privacy Policy|Search|Menu)\s*\|/i,
  /^\s*How To Cite This Document\s*$/i,
  /^\s*Return to Abraham Lincoln Online\s*$/i
];

function absolute(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(ROOT, inputPath);
}

function displayPath(inputPath) {
  if (path.isAbsolute(inputPath)) {
    const relative = path.relative(ROOT, inputPath);
    return relative.startsWith('..') ? inputPath : relative;
  }
  return inputPath;
}

function stableJSON(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readJSON(inputPath) {
  return JSON.parse(fs.readFileSync(absolute(inputPath), 'utf8'));
}

function parseArgs(argv) {
  const options = {
    check: false,
    json: false,
    stripBoilerplate: true,
    paths: { ...DEFAULT_PATHS }
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--no-strip-boilerplate') {
      options.stripBoilerplate = false;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!Object.prototype.hasOwnProperty.call(options.paths, key)) {
        throw new Error(`Unknown option ${arg}`);
      }
      index += 1;
      if (!argv[index]) {
        throw new Error(`${arg} requires a path`);
      }
      options.paths[key] = argv[index];
    }
  }

  return options;
}

function pathIsInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertSafeOutput(outputPath) {
  const target = absolute(outputPath);
  if (!pathIsInside(ROOT, target)) {
    return;
  }

  const relative = path.relative(ROOT, target);
  const allowed = relative === DEFAULT_PATHS.manifest
    || relative.startsWith(`${DEFAULT_PATHS.coreNormalized}/`)
    || relative.startsWith(`${DEFAULT_PATHS.validationNormalized}/`);

  if (!allowed) {
    throw new Error(`Refusing to write undeclared v4 ingestion output path: ${relative}`);
  }
  if (relative.startsWith('corpus/raw/') || relative.startsWith('corpus/text/')) {
    throw new Error(`Refusing to modify preserved source text path: ${relative}`);
  }
}

function listRawFiles(directory) {
  const target = absolute(directory);
  if (!fs.existsSync(target)) {
    return [];
  }
  return fs.readdirSync(target)
    .filter(file => file.endsWith('.txt'))
    .sort()
    .map(file => ({
      file,
      path: path.join(directory, file),
      absolutePath: path.join(target, file)
    }));
}

function expectedCoreRecords(inventory) {
  return inventory.documents.filter(record => (
    record.corpus_tier === 'v4-core' && record.included_in_v1 === false
  ));
}

function expectedValidationRecords(inventory) {
  return inventory.documents.filter(record => (
    record.corpus_tier === 'v4-validation'
    && record.included_in_v1 === false
    && record.included_in_v4_core === false
  ));
}

function skippedV1Records(coreInventory, validationInventory) {
  const seen = new Map();
  for (const record of [...coreInventory.documents, ...validationInventory.documents]) {
    if (record.included_in_v1) {
      seen.set(record.doc_id, record);
    }
  }
  return Array.from(seen.values())
    .sort((a, b) => a.doc_id.localeCompare(b.doc_id, 'en'))
    .map(record => ({
      doc_id: record.doc_id,
      title: record.title,
      reason: 'included_in_v1_preserved',
      raw_path: `corpus/raw/${record.doc_id}.txt`
    }));
}

function docIdFromFilename(file) {
  const match = file.match(/^(doc_\d{3})--[a-z0-9-]+--\d{4}(?:-\d{2}){0,2}\.txt$/);
  return match ? match[1] : null;
}

function stripBoilerplate(text) {
  let removedLines = 0;
  const lines = text.split('\n');
  const kept = [];
  for (const line of lines) {
    if (BOILERPLATE_PATTERNS.some(pattern => pattern.test(line))) {
      removedLines += 1;
      continue;
    }
    kept.push(line);
  }
  return { text: kept.join('\n'), removedLines };
}

function normalizeText(input, options) {
  let text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let boilerplateRemovedLines = 0;
  if (options.stripBoilerplate) {
    const stripped = stripBoilerplate(text);
    text = stripped.text;
    boilerplateRemovedLines = stripped.removedLines;
  }

  text = text
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    text: `${text}\n`,
    boilerplateRemovedLines
  };
}

function paragraphCount(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\n{2,}/).length : 0;
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function rawByDocId(rawFiles, tier, errors) {
  const byDocId = new Map();
  for (const rawFile of rawFiles) {
    const docId = docIdFromFilename(rawFile.file);
    if (!docId) {
      errors.push(issue('error', 'raw_filename_invalid', 'Raw file name does not follow the v4 doc_id--slug--date.txt convention', {
        tier,
        raw_path: displayPath(rawFile.path)
      }));
      continue;
    }
    if (byDocId.has(docId)) {
      errors.push(issue('error', 'duplicate_raw_doc_id', 'Multiple raw files map to the same document ID', {
        tier,
        doc_id: docId,
        raw_paths: [displayPath(byDocId.get(docId).path), displayPath(rawFile.path)]
      }));
      continue;
    }
    byDocId.set(docId, rawFile);
  }
  return byDocId;
}

function buildTierRecords({ tier, expectedRecords, rawFiles, normalizedDir, options, errors, warnings }) {
  const expectedById = new Map(expectedRecords.map(record => [record.doc_id, record]));
  const rawMap = rawByDocId(rawFiles, tier, errors);
  const records = [];
  const outputs = [];

  for (const [docId, rawFile] of rawMap) {
    if (!expectedById.has(docId)) {
      errors.push(issue('error', 'raw_missing_inventory_record', 'Raw file does not map to an expected v4 inventory record', {
        tier,
        doc_id: docId,
        raw_path: displayPath(rawFile.path)
      }));
    }
  }

  for (const record of expectedRecords) {
    const rawFile = rawMap.get(record.doc_id);
    if (!rawFile) {
      warnings.push(issue('warning', 'inventory_record_missing_raw_file', 'Inventory record does not yet have a raw v4 source file', {
        tier,
        doc_id: record.doc_id,
        title: record.title
      }));
      records.push({
        doc_id: record.doc_id,
        tier,
        title: record.title,
        date: record.date,
        status: 'missing_raw'
      });
      continue;
    }

    const rawText = fs.readFileSync(rawFile.absolutePath, 'utf8');
    const normalized = normalizeText(rawText, options);
    const outputPath = path.join(normalizedDir, rawFile.file);
    const lineEndingsNormalized = rawText.includes('\r');
    outputs.push({ path: outputPath, contents: normalized.text });
    records.push({
      doc_id: record.doc_id,
      tier,
      title: record.title,
      date: record.date,
      raw_path: displayPath(rawFile.path),
      normalized_path: displayPath(outputPath),
      status: 'ingested',
      input_bytes: Buffer.byteLength(rawText, 'utf8'),
      output_bytes: Buffer.byteLength(normalized.text, 'utf8'),
      paragraph_count: paragraphCount(normalized.text),
      line_endings_normalized: lineEndingsNormalized,
      boilerplate_removed_lines: normalized.boilerplateRemovedLines
    });
  }

  return { records, outputs };
}

function buildManifest(options) {
  const coreInventory = readJSON(options.paths.coreInventory);
  const validationInventory = readJSON(options.paths.validationInventory);
  const errors = [];
  const warnings = [];
  const coreExpected = expectedCoreRecords(coreInventory);
  const validationExpected = expectedValidationRecords(validationInventory);

  const core = buildTierRecords({
    tier: 'v4-core',
    expectedRecords: coreExpected,
    rawFiles: listRawFiles(options.paths.coreRaw),
    normalizedDir: options.paths.coreNormalized,
    options,
    errors,
    warnings
  });
  const validation = buildTierRecords({
    tier: 'v4-validation',
    expectedRecords: validationExpected,
    rawFiles: listRawFiles(options.paths.validationRaw),
    normalizedDir: options.paths.validationNormalized,
    options,
    errors,
    warnings
  });

  const records = [...core.records, ...validation.records]
    .sort((a, b) => a.doc_id.localeCompare(b.doc_id, 'en'));
  const outputs = [...core.outputs, ...validation.outputs]
    .sort((a, b) => displayPath(a.path).localeCompare(displayPath(b.path), 'en'));
  const skipped_records = skippedV1Records(coreInventory, validationInventory);
  const ingested = records.filter(record => record.status === 'ingested');
  const missing = records.filter(record => record.status === 'missing_raw');

  const manifest = {
    ingestion_id: 'corpus_v4_ingestion',
    corpus_version: 'v4',
    created_date: CREATED_DATE,
    status: errors.length === 0 ? 'pass' : 'fail',
    inputs: {
      core_raw_dir: displayPath(options.paths.coreRaw),
      validation_raw_dir: displayPath(options.paths.validationRaw),
      core_inventory: displayPath(options.paths.coreInventory),
      validation_inventory: displayPath(options.paths.validationInventory)
    },
    outputs: {
      core_normalized_dir: displayPath(options.paths.coreNormalized),
      validation_normalized_dir: displayPath(options.paths.validationNormalized),
      manifest: displayPath(options.paths.manifest)
    },
    options: {
      strip_boilerplate: options.stripBoilerplate,
      preserve_paragraph_breaks: true,
      normalize_line_endings: true
    },
    summary: {
      expected_v4_core_raw_records: coreExpected.length,
      expected_v4_validation_raw_records: validationExpected.length,
      raw_files_found: listRawFiles(options.paths.coreRaw).length + listRawFiles(options.paths.validationRaw).length,
      normalized_files_written: ingested.length,
      missing_raw_files: missing.length,
      skipped_v1_records: skipped_records.length,
      errors: errors.length,
      warnings: warnings.length
    },
    records,
    skipped_records,
    errors,
    warnings
  };

  return { manifest, outputs };
}

function writeFile(outputPath, contents, options) {
  assertSafeOutput(outputPath);
  const target = absolute(outputPath);
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${displayPath(outputPath)} is stale; rerun scripts/corpus/ingest-corpus-documents.js`);
    }
    return false;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
  return existing !== contents;
}

function ensureDir(dirPath, options) {
  assertSafeOutput(path.join(dirPath, '.gitkeep'));
  if (!options.check) {
    fs.mkdirSync(absolute(dirPath), { recursive: true });
  }
}

function writeOutputs(manifest, outputs, options) {
  ensureDir(options.paths.coreNormalized, options);
  ensureDir(options.paths.validationNormalized, options);
  let changed = false;
  for (const output of outputs) {
    changed = writeFile(output.path, output.contents, options) || changed;
  }
  if (outputs.filter(output => pathIsInside(absolute(options.paths.validationNormalized), absolute(output.path))).length === 0) {
    changed = writeFile(path.join(options.paths.validationNormalized, '.gitkeep'), '', options) || changed;
  }
  changed = writeFile(options.paths.manifest, stableJSON(manifest), options) || changed;
  return changed;
}

function printReadable(manifest, changed, options) {
  if (options.json) {
    console.log(JSON.stringify({ ...manifest, outputs_changed: changed }, null, 2));
    return;
  }

  console.log(`V4 corpus ingestion: ${manifest.status}`);
  console.log(`Normalized files: ${manifest.summary.normalized_files_written}; missing raw files: ${manifest.summary.missing_raw_files}`);
  console.log(`Errors: ${manifest.summary.errors}; warnings: ${manifest.summary.warnings}`);
  for (const error of manifest.errors) {
    console.log(`ERROR ${error.code}: ${error.message} ${JSON.stringify(error.context)}`);
  }
  for (const warning of manifest.warnings.slice(0, 10)) {
    console.log(`WARN ${warning.code}: ${warning.message} ${JSON.stringify(warning.context)}`);
  }
  if (manifest.warnings.length > 10) {
    console.log(`WARN: ${manifest.warnings.length - 10} additional warning(s) written to manifest.`);
  }
  console.log(`${options.check ? 'Checked' : 'Wrote'} ${displayPath(options.paths.manifest)}`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const { manifest, outputs } = buildManifest(options);
  const changed = writeOutputs(manifest, outputs, options);
  printReadable(manifest, changed, options);
  if (manifest.errors.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildManifest,
  normalizeText,
  parseArgs
};
