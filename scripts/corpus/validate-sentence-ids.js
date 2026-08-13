#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { writeFile: guardedWriteFile } = require('./write-guard');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  legacySegmented: 'corpus/segmented',
  v4CoreSegmented: 'corpus/segmented/v4-core',
  manifest: 'data/corpus/corpus-v4-segmentation-manifest.json',
  report: 'data/corpus/corpus-v4-sentence-id-validation-report.json'
};

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
    paths: { ...DEFAULT_PATHS }
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--json') {
      options.json = true;
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

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function sentenceIdPrefix(sentenceId) {
  const match = String(sentenceId || '').match(/^(doc_[0-9]{3}[a-z]?)/);
  return match ? match[1] : null;
}

function segmentedFiles(directory, nested = false) {
  const target = absolute(directory);
  if (!fs.existsSync(target)) {
    return [];
  }
  return fs.readdirSync(target, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => ({
      doc_id: entry.name.replace(/\.json$/, ''),
      path: path.join(directory, entry.name)
    }))
    .filter(entry => nested || /^doc_[0-9]{3}[a-z]?$/.test(entry.doc_id))
    .sort((a, b) => a.doc_id.localeCompare(b.doc_id, 'en'));
}

function collectSentences(segmented, filePath, errors) {
  const records = [];
  const docId = segmented.document_id;
  if (!docId) {
    errors.push(issue('error', 'missing_document_id', 'Segmented file is missing document_id', {
      segmented_path: displayPath(filePath)
    }));
  }

  for (const [sectionIndex, section] of (segmented.sections || []).entries()) {
    const expectedSectionOrdinal = sectionIndex + 1;
    if (section.section_ordinal !== expectedSectionOrdinal) {
      errors.push(issue('error', 'section_order_changed', 'Section ordinal is not deterministic', {
        doc_id: docId,
        section_id: section.section_id,
        expected: expectedSectionOrdinal,
        actual: section.section_ordinal
      }));
    }
    for (const [paragraphIndex, paragraph] of (section.paragraphs || []).entries()) {
      const expectedParagraphOrdinal = paragraphIndex + 1;
      if (paragraph.paragraph_ordinal !== expectedParagraphOrdinal) {
        errors.push(issue('error', 'paragraph_order_changed', 'Paragraph ordinal is not deterministic', {
          doc_id: docId,
          paragraph_id: paragraph.paragraph_id,
          expected: expectedParagraphOrdinal,
          actual: paragraph.paragraph_ordinal
        }));
      }
      for (const [sentenceIndex, sentence] of (paragraph.sentences || []).entries()) {
        const expectedSentenceOrdinal = sentenceIndex + 1;
        if (!sentence.sentence_id) {
          errors.push(issue('error', 'missing_sentence_id', 'Segmented sentence is missing sentence_id', {
            doc_id: docId,
            segmented_path: displayPath(filePath),
            section_ordinal: expectedSectionOrdinal,
            paragraph_ordinal: expectedParagraphOrdinal,
            sentence_ordinal: expectedSentenceOrdinal
          }));
          continue;
        }
        if (sentence.sentence_ordinal !== expectedSentenceOrdinal) {
          errors.push(issue('error', 'sentence_order_changed', 'Sentence ordinal is not deterministic', {
            doc_id: docId,
            sentence_id: sentence.sentence_id,
            expected: expectedSentenceOrdinal,
            actual: sentence.sentence_ordinal
          }));
        }
        const prefix = sentenceIdPrefix(sentence.sentence_id);
        if (prefix !== docId) {
          errors.push(issue('error', 'sentence_id_unknown_document', 'Sentence ID does not map to the segmented document ID', {
            doc_id: docId,
            sentence_id: sentence.sentence_id,
            segmented_path: displayPath(filePath)
          }));
        }
        records.push({
          sentence_id: sentence.sentence_id,
          doc_id: docId,
          text: sentence.text,
          path: displayPath(filePath)
        });
      }
    }
  }
  return records;
}

function duplicateIds(layer, sentences, errors) {
  const seen = new Map();
  for (const sentence of sentences) {
    const paths = seen.get(sentence.sentence_id) || [];
    paths.push(sentence.path);
    seen.set(sentence.sentence_id, paths);
  }
  for (const [sentenceId, paths] of seen.entries()) {
    if (paths.length > 1) {
      errors.push(issue('error', 'duplicate_sentence_id', 'Duplicate sentence ID found within a segmented corpus layer', {
        layer,
        sentence_id: sentenceId,
        paths
      }));
    }
  }
}

function layerRecords(directory, layer, errors) {
  const files = segmentedFiles(directory, layer === 'legacy');
  const documents = [];
  const sentences = [];

  for (const file of files) {
    const segmented = readJSON(file.path);
    const documentSentences = collectSentences(segmented, file.path, errors);
    documents.push({
      doc_id: file.doc_id,
      segmented_path: displayPath(file.path),
      paragraph_count: (segmented.sections || []).reduce((total, section) => total + (section.paragraphs || []).length, 0),
      sentence_count: documentSentences.length,
      first_sentence_id: documentSentences[0]?.sentence_id || null,
      last_sentence_id: documentSentences[documentSentences.length - 1]?.sentence_id || null
    });
    sentences.push(...documentSentences);
  }

  duplicateIds(layer, sentences, errors);
  return { documents, sentences };
}

function validateV1CarryForward(legacy, v4, manifest, errors) {
  const legacyByDoc = new Map(legacy.documents.map(document => [document.doc_id, document]));
  const v4ByDoc = new Map(v4.documents.map(document => [document.doc_id, document]));
  const legacySentencesByDoc = new Map();
  const v4SentencesByDoc = new Map();
  for (const sentence of legacy.sentences) {
    const list = legacySentencesByDoc.get(sentence.doc_id) || [];
    list.push(sentence.sentence_id);
    legacySentencesByDoc.set(sentence.doc_id, list);
  }
  for (const sentence of v4.sentences) {
    const list = v4SentencesByDoc.get(sentence.doc_id) || [];
    list.push(sentence.sentence_id);
    v4SentencesByDoc.set(sentence.doc_id, list);
  }

  for (const record of manifest.records.filter(item => item.status === 'copied_v1')) {
    if (!legacyByDoc.has(record.doc_id)) {
      errors.push(issue('error', 'manifest_v1_source_missing', 'Manifest v1 carry-forward source file is missing', {
        doc_id: record.doc_id,
        source_path: record.source_path
      }));
      continue;
    }
    if (!v4ByDoc.has(record.doc_id)) {
      errors.push(issue('error', 'manifest_segmented_file_missing', 'Manifest v4-core segmented file is missing', {
        doc_id: record.doc_id,
        segmented_path: record.segmented_path
      }));
      continue;
    }
    const legacyIds = legacySentencesByDoc.get(record.doc_id) || [];
    const v4Ids = v4SentencesByDoc.get(record.doc_id) || [];
    if (JSON.stringify(legacyIds) !== JSON.stringify(v4Ids)) {
      errors.push(issue('error', 'v1_sentence_ids_changed', 'Copied v1 sentence IDs differ from the preserved v1 segmented file', {
        doc_id: record.doc_id,
        legacy_count: legacyIds.length,
        v4_count: v4Ids.length
      }));
    }
  }
}

function validateManifest(v4, manifest, errors) {
  const actualByDoc = new Map(v4.documents.map(document => [document.doc_id, document]));
  const manifestIds = new Set();
  for (const record of manifest.records) {
    manifestIds.add(record.doc_id);
    const actual = actualByDoc.get(record.doc_id);
    if (!actual) {
      errors.push(issue('error', 'manifest_segmented_file_missing', 'Manifest record is missing an actual v4-core segmented file', {
        doc_id: record.doc_id,
        segmented_path: record.segmented_path
      }));
      continue;
    }
    for (const key of ['paragraph_count', 'sentence_count', 'first_sentence_id', 'last_sentence_id']) {
      if (actual[key] !== record[key]) {
        errors.push(issue('error', 'manifest_count_mismatch', 'Segmentation manifest does not match actual v4-core segmented file', {
          doc_id: record.doc_id,
          field: key,
          expected: record[key],
          actual: actual[key]
        }));
      }
    }
  }

  for (const actual of v4.documents) {
    if (!manifestIds.has(actual.doc_id)) {
      errors.push(issue('error', 'segmented_file_missing_manifest_record', 'Actual v4-core segmented file is missing from the manifest', {
        doc_id: actual.doc_id,
        segmented_path: actual.segmented_path
      }));
    }
  }

  const totals = {
    documents: v4.documents.length,
    paragraphs: v4.documents.reduce((sum, document) => sum + document.paragraph_count, 0),
    sentences: v4.documents.reduce((sum, document) => sum + document.sentence_count, 0)
  };
  for (const [field, actual] of Object.entries(totals)) {
    if (manifest.summary[field] !== actual) {
      errors.push(issue('error', 'manifest_summary_mismatch', 'Segmentation manifest summary does not match actual v4-core segmented files', {
        field,
        expected: manifest.summary[field],
        actual
      }));
    }
  }
}

function validateV4Completeness(v4, manifest, errors) {
  for (const record of manifest.records) {
    const actual = v4.documents.find(document => document.doc_id === record.doc_id);
    if (!actual) {
      continue;
    }
    if (actual.sentence_count < 1) {
      errors.push(issue('error', 'v4_core_document_without_sentences', 'Every v4-core document must have at least one sentence', {
        doc_id: record.doc_id,
        segmented_path: actual.segmented_path
      }));
    }
  }
}

function validationReport(paths) {
  const errors = [];
  const manifest = readJSON(paths.manifest);
  const legacy = layerRecords(paths.legacySegmented, 'legacy', errors);
  const v4 = layerRecords(paths.v4CoreSegmented, 'v4-core', errors);

  validateManifest(v4, manifest, errors);
  validateV4Completeness(v4, manifest, errors);
  validateV1CarryForward(legacy, v4, manifest, errors);

  return {
    validation_id: 'corpus_v4_sentence_id_validation',
    created_date: CREATED_DATE,
    status: errors.length === 0 ? 'pass' : 'fail',
    inputs: {
      legacy_segmented_dir: displayPath(paths.legacySegmented),
      v4_core_segmented_dir: displayPath(paths.v4CoreSegmented),
      segmentation_manifest: displayPath(paths.manifest)
    },
    outputs: {
      report: displayPath(paths.report)
    },
    summary: {
      legacy_documents: legacy.documents.length,
      v4_core_documents: v4.documents.length,
      legacy_sentences: legacy.sentences.length,
      v4_core_sentences: v4.sentences.length,
      errors: errors.length
    },
    errors
  };
}

function writeReport(report, options) {
  const contents = stableJSON(report);
  const reportPath = absolute(options.paths.report);
  const existing = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${displayPath(options.paths.report)} is stale; rerun scripts/corpus/validate-sentence-ids.js`);
    }
    return false;
  }
  guardedWriteFile(reportPath, contents);
  return existing !== contents;
}

function printReadable(report, changed, options) {
  if (options.json) {
    console.log(JSON.stringify({ ...report, report_changed: changed }, null, 2));
    return;
  }
  console.log(`V4 sentence ID validation: ${report.status}`);
  console.log(`Legacy sentences: ${report.summary.legacy_sentences}; v4-core sentences: ${report.summary.v4_core_sentences}`);
  console.log(`Errors: ${report.summary.errors}`);
  for (const error of report.errors.slice(0, 10)) {
    console.log(`ERROR ${error.code}: ${error.message} ${JSON.stringify(error.context)}`);
  }
  if (report.errors.length > 10) {
    console.log(`ERROR: ${report.errors.length - 10} additional error(s) written to report.`);
  }
  console.log(`${options.check ? 'Checked' : 'Wrote'} ${displayPath(options.paths.report)}`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = validationReport(options.paths);
  const changed = writeReport(report, options);
  printReadable(report, changed, options);
  if (report.errors.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validationReport,
  parseArgs
};
