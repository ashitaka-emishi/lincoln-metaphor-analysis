#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { assertCorpusV4WritePath, writeFile: guardedWriteFile } = require('./write-guard');

const ROOT = path.resolve(__dirname, '..', '..');
const CREATED_DATE = '2026-08-13';

const DEFAULT_PATHS = {
  inventory: 'data/corpus/corpus-v4-core-inventory.json',
  normalizedCore: 'corpus/normalized/v4-core',
  legacySegmented: 'corpus/segmented',
  segmentedCore: 'corpus/segmented/v4-core',
  manifest: 'data/corpus/corpus-v4-segmentation-manifest.json'
};

const ABBREVIATIONS = new Set([
  'A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'I.', 'J.', 'K.', 'L.', 'M.',
  'N.', 'O.', 'P.', 'Q.', 'R.', 'S.', 'T.', 'U.', 'V.', 'W.', 'X.', 'Y.', 'Z.',
  'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Gen.', 'Gov.', 'Hon.', 'Jr.', 'Sr.', 'St.', 'vs.',
  'Vol.', 'vol.', 'No.', 'no.', 'U.S.', 'U. S.'
]);

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

function words(text) {
  return text.trim().match(/\S+/g) || [];
}

function lastToken(text) {
  const tokens = text.trim().split(/\s+/);
  return tokens[tokens.length - 1] || '';
}

function isSentenceBoundary(text, index) {
  const char = text[index];
  if (!'.?!'.includes(char)) {
    return false;
  }

  const before = text.slice(0, index + 1);
  const token = lastToken(before);
  if (ABBREVIATIONS.has(token)) {
    return false;
  }
  if (/\b[A-Z]\.$/.test(token) && /\b[A-Z](?:\.\s+[A-Z]\.)+$/.test(before.slice(Math.max(0, index - 12), index + 1))) {
    return false;
  }

  let nextIndex = index + 1;
  while (nextIndex < text.length && /["')\]]/.test(text[nextIndex])) {
    nextIndex += 1;
  }
  if (nextIndex >= text.length) {
    return true;
  }
  if (!/\s/.test(text[nextIndex])) {
    return false;
  }
  const after = text.slice(nextIndex).trimStart();
  return after.length === 0 || /^[("'\[]?[A-Z0-9]/.test(after);
}

function splitSentences(paragraph) {
  const text = paragraph.replace(/\s+/g, ' ').trim();
  if (!text) {
    return [];
  }

  const sentences = [];
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (!isSentenceBoundary(text, index)) {
      continue;
    }
    let end = index + 1;
    while (end < text.length && /["')\]]/.test(text[end])) {
      end += 1;
    }
    sentences.push(text.slice(start, end).trim());
    start = end;
  }

  const trailing = text.slice(start).trim();
  if (trailing) {
    sentences.push(trailing);
  }
  return sentences;
}

function metaFromInventory(record) {
  return {
    id: record.doc_id,
    title: record.title,
    short_title: record.short_title,
    date: record.date,
    date_precision: record.date_precision,
    register: record.genre,
    authorship: record.authorship_status,
    authorship_confidence: record.authorship_status === 'secure' ? 0.99 : 0.75,
    authorship_notes: record.authorship_status === 'secure' ? null : record.provenance_notes,
    source_text: record.source_citation,
    source_url: record.source_url,
    risk_flags: [
      ...(record.text_status === 'fragment' ? ['fragment'] : []),
      ...(record.authorship_status !== 'secure' ? ['authorship_review'] : [])
    ],
    analytical_priority: record.research_relevance.includes('high_priority') ? 'high' : 'v4_core',
    corpus_version: 'v4',
    corpus_tier: record.corpus_tier,
    source_authority: record.source_authority,
    annotation_status: record.annotation_status
  };
}

function segmentNewDocument(record, text) {
  let wordOffset = 0;
  const paragraphs = text.trim().split(/\n{2,}/).map(paragraph => paragraph.trim()).filter(Boolean);
  const segmentedParagraphs = paragraphs.map((paragraph, paragraphIndex) => {
    const paragraphOrdinal = paragraphIndex + 1;
    const sentences = splitSentences(paragraph).map((sentenceText, sentenceIndex) => {
      const sentenceWords = words(sentenceText);
      const sentenceRecord = {
        sentence_id: `${record.doc_id}_s01_p${String(paragraphOrdinal).padStart(2, '0')}_s${String(sentenceIndex + 1).padStart(2, '0')}`,
        sentence_ordinal: sentenceIndex + 1,
        text: sentenceText,
        word_offset_start: wordOffset,
        word_offset_end: wordOffset + sentenceWords.length,
        authorship_note: null,
        metaphor_instances: []
      };
      wordOffset += sentenceWords.length;
      return sentenceRecord;
    });

    return {
      paragraph_id: `${record.doc_id}_s01_p${String(paragraphOrdinal).padStart(2, '0')}`,
      paragraph_ordinal: paragraphOrdinal,
      sentences
    };
  });

  return {
    document_id: record.doc_id,
    meta: metaFromInventory(record),
    sections: [
      {
        section_id: `${record.doc_id}_s01`,
        section_label: 'body',
        section_ordinal: 1,
        paragraphs: segmentedParagraphs
      }
    ],
    pipeline_log: [
      {
        stage: 'v4_segmentation',
        script: 'scripts/corpus/segment-corpus-v4.js',
        date: CREATED_DATE,
        source: 'corpus/normalized/v4-core'
      }
    ]
  };
}

function sentenceCount(segmented) {
  return segmented.sections.reduce((total, section) => (
    total + section.paragraphs.reduce((paragraphTotal, paragraph) => (
      paragraphTotal + paragraph.sentences.length
    ), 0)
  ), 0);
}

function paragraphCount(segmented) {
  return segmented.sections.reduce((total, section) => total + section.paragraphs.length, 0);
}

function firstSentenceId(segmented) {
  for (const section of segmented.sections) {
    for (const paragraph of section.paragraphs) {
      if (paragraph.sentences.length > 0) {
        return paragraph.sentences[0].sentence_id;
      }
    }
  }
  return null;
}

function lastSentenceId(segmented) {
  for (const section of [...segmented.sections].reverse()) {
    for (const paragraph of [...section.paragraphs].reverse()) {
      if (paragraph.sentences.length > 0) {
        return paragraph.sentences[paragraph.sentences.length - 1].sentence_id;
      }
    }
  }
  return null;
}

function v4CoreRawFilename(docId, normalizedCore) {
  const dir = absolute(normalizedCore);
  if (!fs.existsSync(dir)) {
    return null;
  }
  return fs.readdirSync(dir).find(file => file.startsWith(`${docId}--`) && file.endsWith('.txt')) || null;
}

function buildV1Record(record, paths) {
  const sourcePath = path.join(paths.legacySegmented, `${record.doc_id}.json`);
  const segmented = readJSON(sourcePath);
  return {
    segmented,
    outputPath: path.join(paths.segmentedCore, `${record.doc_id}.json`),
    manifestRecord: {
      doc_id: record.doc_id,
      title: record.title,
      date: record.date,
      status: 'copied_v1',
      source_path: displayPath(sourcePath),
      segmented_path: displayPath(path.join(paths.segmentedCore, `${record.doc_id}.json`)),
      paragraph_count: paragraphCount(segmented),
      sentence_count: sentenceCount(segmented),
      first_sentence_id: firstSentenceId(segmented),
      last_sentence_id: lastSentenceId(segmented)
    }
  };
}

function buildNewRecord(record, paths) {
  const file = v4CoreRawFilename(record.doc_id, paths.normalizedCore);
  if (!file) {
    throw new Error(`${record.doc_id} is missing normalized v4-core input text`);
  }
  const sourcePath = path.join(paths.normalizedCore, file);
  const text = fs.readFileSync(absolute(sourcePath), 'utf8');
  const segmented = segmentNewDocument(record, text);
  const outputPath = path.join(paths.segmentedCore, `${record.doc_id}.json`);
  return {
    segmented,
    outputPath,
    manifestRecord: {
      doc_id: record.doc_id,
      title: record.title,
      date: record.date,
      status: 'segmented_v4_core',
      source_path: displayPath(sourcePath),
      segmented_path: displayPath(outputPath),
      paragraph_count: paragraphCount(segmented),
      sentence_count: sentenceCount(segmented),
      first_sentence_id: firstSentenceId(segmented),
      last_sentence_id: lastSentenceId(segmented)
    }
  };
}

function buildSegmentation(options) {
  const inventory = readJSON(options.paths.inventory);
  const coreRecords = inventory.documents
    .filter(record => record.included_in_v4_core)
    .sort((a, b) => a.doc_id.localeCompare(b.doc_id, 'en'));
  const outputs = [];
  const records = [];

  for (const record of coreRecords) {
    const built = record.included_in_v1
      ? buildV1Record(record, options.paths)
      : buildNewRecord(record, options.paths);
    outputs.push({
      path: built.outputPath,
      contents: stableJSON(built.segmented)
    });
    records.push(built.manifestRecord);
  }

  const manifest = {
    segmentation_id: 'corpus_v4_core_segmentation',
    corpus_version: 'v4',
    created_date: CREATED_DATE,
    status: 'pass',
    inputs: {
      inventory: displayPath(options.paths.inventory),
      normalized_core_dir: displayPath(options.paths.normalizedCore),
      legacy_segmented_dir: displayPath(options.paths.legacySegmented)
    },
    outputs: {
      segmented_core_dir: displayPath(options.paths.segmentedCore),
      manifest: displayPath(options.paths.manifest)
    },
    sentence_id_format: '<doc_id>_s<section>_p<paragraph>_s<sentence>',
    summary: {
      documents: records.length,
      copied_v1_documents: records.filter(record => record.status === 'copied_v1').length,
      segmented_v4_core_documents: records.filter(record => record.status === 'segmented_v4_core').length,
      paragraphs: records.reduce((sum, record) => sum + record.paragraph_count, 0),
      sentences: records.reduce((sum, record) => sum + record.sentence_count, 0)
    },
    records
  };

  return { manifest, outputs };
}

function writeFile(outputPath, contents, options) {
  const target = absolute(outputPath);
  assertCorpusV4WritePath(target);
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (options.check) {
    if (existing !== contents) {
      throw new Error(`${displayPath(outputPath)} is stale; rerun scripts/corpus/segment-corpus-v4.js`);
    }
    return false;
  }
  guardedWriteFile(target, contents);
  return existing !== contents;
}

function writeOutputs(manifest, outputs, options) {
  let changed = false;
  for (const output of outputs) {
    changed = writeFile(output.path, output.contents, options) || changed;
  }
  changed = writeFile(options.paths.manifest, stableJSON(manifest), options) || changed;
  return changed;
}

function printReadable(manifest, changed, options) {
  if (options.json) {
    console.log(JSON.stringify({ ...manifest, outputs_changed: changed }, null, 2));
    return;
  }
  console.log(`V4 core segmentation: ${manifest.status}`);
  console.log(`Documents: ${manifest.summary.documents}; paragraphs: ${manifest.summary.paragraphs}; sentences: ${manifest.summary.sentences}`);
  console.log(`Copied v1: ${manifest.summary.copied_v1_documents}; segmented v4 additions: ${manifest.summary.segmented_v4_core_documents}`);
  console.log(`${options.check ? 'Checked' : 'Wrote'} ${displayPath(options.paths.manifest)}`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const { manifest, outputs } = buildSegmentation(options);
  const changed = writeOutputs(manifest, outputs, options);
  printReadable(manifest, changed, options);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSegmentation,
  splitSentences,
  segmentNewDocument,
  parseArgs
};
