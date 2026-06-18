#!/usr/bin/env node
// Generates deterministic, blind Stage 4M review packets from Stage 4B inputs.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ABSENCE_FLAGS, CLUSTER_IDS, FANTASY_TYPES } = require('../schema_constants');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT_VERSION = '1.0.0';
const SAMPLE_PATH = path.join(ROOT, 'data', 'reliability', 'reliability-sample.json');
const CODING_TEMPLATE_PATH = path.join(ROOT, 'data', 'reliability', 'double-coding-template.csv');
const SEGMENTED_DIR = path.join(ROOT, 'corpus', 'segmented');
const CODEBOOK_PATH = path.join(ROOT, 'docs', 'methodology', 'annotation-codebook.md');
const RELIABILITY_METHOD_PATH = path.join(ROOT, 'docs', 'methodology', 'reliability-report.md');
const SCHEMA_CONSTANTS_PATH = path.join(ROOT, 'scripts', 'schema_constants.js');
const OUTPUT_DIR = path.join(ROOT, 'data', 'reliability', 'model-input-packets');

const OUTPUT_PATHS = Object.freeze({
  manifest: path.join(OUTPUT_DIR, 'model-packet-manifest.json'),
  sentences: path.join(OUTPUT_DIR, 'model-packet-sentences.jsonl'),
  fieldAgreement: path.join(OUTPUT_DIR, 'model-packet-field-agreement.jsonl'),
  instructions: path.join(OUTPUT_DIR, 'model-packet-instructions.md'),
  csvTemplate: path.join(OUTPUT_DIR, 'model-output-template.csv'),
  jsonTemplate: path.join(OUTPUT_DIR, 'model-output-template.json')
});

const RESPONSE_COLUMNS = Object.freeze([
  'packet_id',
  'packet_unit_id',
  'response_id',
  'packet_type',
  'reviewer_id',
  'document_id',
  'sentence_id',
  'provided_span_text',
  'candidate_lexical_unit',
  'span_char_start',
  'span_char_end',
  'mipvu_decision',
  'contextual_meaning',
  'basic_meaning',
  'historical_semantics_note',
  'cluster_id',
  'source_domain',
  'target_domain',
  'entailments',
  'fantasy_type',
  'violence_logic',
  'obligatory_frame',
  'absence_flags',
  'confidence_score',
  'ambiguity_flag',
  'reviewer_notes'
]);

const REFERENCE_COLUMNS = Object.freeze([
  'contextual_meaning',
  'basic_meaning',
  'historical_semantics_note',
  'cluster_id',
  'source_domain',
  'target_domain',
  'entailments',
  'fantasy_type',
  'violence_logic',
  'obligatory_frame',
  'absence_flags',
  'confidence_score',
  'ambiguity_flag',
  'disagreement_category',
  'coder_notes'
]);

const VIOLENCE_LOGIC_VALUES = Object.freeze([
  'restorative',
  'generative',
  'punitive',
  'purifying',
  'evidentiary',
  'obligatory'
]);

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function hashFile(filePath) {
  return sha256Bytes(fs.readFileSync(filePath));
}

function canonicalJSON(value) {
  if (Array.isArray(value)) return value.map(canonicalJSON);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, canonicalJSON(value[key])])
    );
  }
  return value;
}

function generationTimestamp(packetId) {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch !== undefined) {
    if (!/^\d+$/.test(epoch)) throw new Error('SOURCE_DATE_EPOCH must be a non-negative integer Unix timestamp.');
    const milliseconds = Number(epoch) * 1000;
    if (!Number.isFinite(milliseconds)) throw new Error('SOURCE_DATE_EPOCH is outside the supported timestamp range.');
    return {
      value: new Date(milliseconds).toISOString(),
      source: 'SOURCE_DATE_EPOCH'
    };
  }

  if (fs.existsSync(OUTPUT_PATHS.manifest)) {
    const existing = readJSON(OUTPUT_PATHS.manifest);
    if (existing.packet_id === packetId && !Number.isNaN(Date.parse(existing.generated_at || ''))) {
      return {
        value: existing.generated_at,
        source: existing.generation_timestamp_source || 'preserved from existing manifest'
      };
    }
  }

  return {
    value: new Date().toISOString(),
    source: 'system clock at first generation for packet_id'
  };
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('Unterminated quoted field in CSV input.');
  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1)
    .filter(values => values.some(value => value !== ''))
    .map((values, rowIndex) => {
      if (values.length !== headers.length) {
        throw new Error(`CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}.`);
      }
      return Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex]]));
    });
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function makeCSV(rows) {
  return [
    RESPONSE_COLUMNS.join(','),
    ...rows.map(row => RESPONSE_COLUMNS.map(column => csvEscape(row[column])).join(','))
  ].join('\n') + '\n';
}

function makeJSONL(records) {
  return records.map(record => JSON.stringify(record)).join('\n') + '\n';
}

function flattenSentences(segmented) {
  const sentences = [];
  for (const section of segmented.sections || []) {
    for (const paragraph of section.paragraphs || []) {
      for (const sentence of paragraph.sentences || []) {
        sentences.push({
          document_id: segmented.document_id,
          section_id: section.section_id || null,
          section_label: section.section_label || null,
          paragraph_id: paragraph.paragraph_id || null,
          sentence_id: sentence.sentence_id,
          sentence_text: sentence.text || ''
        });
      }
    }
  }
  return sentences;
}

function buildSentenceIndex(documentIds) {
  const indexes = new Map();
  for (const documentId of documentIds) {
    const segmentedPath = path.join(SEGMENTED_DIR, `${documentId}.json`);
    const sentences = flattenSentences(readJSON(segmentedPath));
    const byParagraph = new Map();
    for (const sentence of sentences) {
      if (!byParagraph.has(sentence.paragraph_id)) byParagraph.set(sentence.paragraph_id, []);
      byParagraph.get(sentence.paragraph_id).push({
        sentence_id: sentence.sentence_id,
        sentence_text: sentence.sentence_text
      });
    }
    const byId = new Map();
    sentences.forEach((sentence, index) => {
      byId.set(sentence.sentence_id, {
        ...sentence,
        previous: index > 0 ? sentences[index - 1] : null,
        next: index + 1 < sentences.length ? sentences[index + 1] : null,
        paragraph_sentences: byParagraph.get(sentence.paragraph_id)
      });
    });
    indexes.set(documentId, byId);
  }
  return indexes;
}

function contextFor(sentence) {
  return {
    section_label: sentence.section_label,
    paragraph_sentences: sentence.paragraph_sentences,
    previous_sentence_id: sentence.previous ? sentence.previous.sentence_id : null,
    previous_sentence_text: sentence.previous ? sentence.previous.sentence_text : null,
    next_sentence_id: sentence.next ? sentence.next.sentence_id : null,
    next_sentence_text: sentence.next ? sentence.next.sentence_text : null
  };
}

function compareUnits(left, right) {
  return left.document_id.localeCompare(right.document_id)
    || left.sentence_id.localeCompare(right.sentence_id)
    || String(left.span_text || '').localeCompare(String(right.span_text || ''));
}

function validateCodingTemplate(sample, codingRows) {
  const expectedIds = new Set([
    ...(sample.identification_units || []).map(unit => unit.reliability_unit_id),
    ...(sample.field_agreement_units || []).map(unit => unit.reliability_unit_id)
  ]);
  const actualIds = new Set(codingRows.map(row => row.reliability_unit_id));

  if (expectedIds.size !== actualIds.size || [...expectedIds].some(id => !actualIds.has(id))) {
    throw new Error('double-coding-template.csv units do not match reliability-sample.json.');
  }

  for (const row of codingRows) {
    for (const column of REFERENCE_COLUMNS) {
      if ((row[column] || '').trim() !== '') {
        throw new Error(`Blindness violation in double-coding-template.csv: ${column} is populated for ${row.reliability_unit_id}.`);
      }
    }
  }
}

function sourceFiles(sample) {
  const selectedDocumentIds = sample.sample_policy && sample.sample_policy.selected_document_ids;
  if (!Array.isArray(selectedDocumentIds) || selectedDocumentIds.length === 0) {
    throw new Error('Reliability sample has no selected document IDs.');
  }

  return [
    SAMPLE_PATH,
    CODING_TEMPLATE_PATH,
    ...selectedDocumentIds.map(documentId => path.join(SEGMENTED_DIR, `${documentId}.json`)),
    CODEBOOK_PATH,
    RELIABILITY_METHOD_PATH,
    SCHEMA_CONSTANTS_PATH,
    __filename
  ];
}

function assignPacketIds(units, startOrdinal) {
  return units.map((unit, index) => ({
    ...unit,
    packet_unit_id: `stage4m_unit_${String(startOrdinal + index).padStart(5, '0')}`
  }));
}

function buildPackets(sample, sentenceIndexes) {
  const identificationSource = [...(sample.identification_units || [])].sort(compareUnits);
  const fieldSource = [...(sample.field_agreement_units || [])].sort(compareUnits);
  const documents = new Map((sample.documents || []).map(document => [document.id, {
    document_id: document.id,
    title: document.title,
    short_title: document.short_title,
    date: document.date,
    period: document.period,
    genre: document.genre,
    register: document.register,
    authorship: document.authorship,
    authorship_confidence: document.authorship_confidence,
    editorial_status: document.editorial_status,
    risk_flags: document.risk_flags || []
  }]));
  for (const unit of [...identificationSource, ...fieldSource]) {
    if (!documents.has(unit.document_id)) {
      throw new Error(`Reliability sample metadata not found for ${unit.document_id}.`);
    }
  }

  const identification = identificationSource.map(unit => {
    const sentence = sentenceIndexes.get(unit.document_id)?.get(unit.sentence_id);
    if (!sentence) throw new Error(`Canonical sentence not found: ${unit.document_id}/${unit.sentence_id}`);
    if (sentence.sentence_text !== unit.sentence_text) {
      throw new Error(`Sentence text mismatch for ${unit.sentence_id}.`);
    }
    return {
      packet_type: 'sentence_identification',
      document_id: unit.document_id,
      section_id: sentence.section_id,
      paragraph_id: sentence.paragraph_id,
      sentence_id: sentence.sentence_id,
      sentence_text: sentence.sentence_text,
      document_context: documents.get(unit.document_id),
      context: contextFor(sentence)
    };
  });

  const fieldAgreement = fieldSource.map(unit => {
    const sentence = sentenceIndexes.get(unit.document_id)?.get(unit.sentence_id);
    if (!sentence) throw new Error(`Canonical sentence not found: ${unit.document_id}/${unit.sentence_id}`);
    if (sentence.sentence_text !== unit.sentence_text) {
      throw new Error(`Sentence text mismatch for ${unit.sentence_id}.`);
    }
    if (!unit.span_text || !sentence.sentence_text.includes(unit.span_text)) {
      throw new Error(`Provided span is not present in canonical sentence ${unit.sentence_id}.`);
    }
    return {
      packet_type: 'field_agreement',
      document_id: unit.document_id,
      section_id: sentence.section_id,
      paragraph_id: sentence.paragraph_id,
      sentence_id: sentence.sentence_id,
      sentence_text: sentence.sentence_text,
      provided_span_text: unit.span_text,
      document_context: documents.get(unit.document_id),
      context: contextFor(sentence)
    };
  });

  const identified = assignPacketIds(identification, 1);
  const fielded = assignPacketIds(fieldAgreement, identified.length + 1);
  return { identification: identified, fieldAgreement: fielded };
}

function responseRow(packetId, unit) {
  const providedSpan = unit.packet_type === 'field_agreement' ? unit.provided_span_text : '';
  return {
    packet_id: packetId,
    packet_unit_id: unit.packet_unit_id,
    response_id: `${unit.packet_unit_id}_r01`,
    packet_type: unit.packet_type,
    reviewer_id: '',
    document_id: unit.document_id,
    sentence_id: unit.sentence_id,
    provided_span_text: providedSpan,
    candidate_lexical_unit: providedSpan,
    span_char_start: '',
    span_char_end: '',
    mipvu_decision: '',
    contextual_meaning: '',
    basic_meaning: '',
    historical_semantics_note: '',
    cluster_id: '',
    source_domain: '',
    target_domain: '',
    entailments: '',
    fantasy_type: '',
    violence_logic: '',
    obligatory_frame: '',
    absence_flags: '',
    confidence_score: '',
    ambiguity_flag: '',
    reviewer_notes: ''
  };
}

function jsonResponse(row) {
  return {
    ...row,
    entailments: [],
    absence_flags: []
  };
}

function bulletValues(values) {
  return values.map(value => `  - \`${value}\``).join('\n');
}

function makeInstructions(packetId, counts) {
  return `# Stage 4M Blind Model Review Instructions

Packet ID: \`${packetId}\`

This is an AI-assisted reliability stress test, not an invitation to revise the reference corpus. Work only from these instructions and the supplied packet files. Do not inspect repository annotations, evidence chains, reliability results, adjudication records, synthesis claims, or prior model submissions.

## Return Format

Return **only one completed structured template**: either \`model-output-template.json\` or \`model-output-template.csv\`. Do not add prose before or after the structured data. Preserve \`packet_id\`, \`packet_unit_id\`, \`response_id\`, \`packet_type\`, \`document_id\`, and \`sentence_id\` exactly.

Set \`reviewer_id\` to a stable identifier for this review run. In JSON, set both \`reviewer.reviewer_id\` and each response's \`reviewer_id\`; in CSV, set \`reviewer_id\` on every row. In CSV, encode \`entailments\` and \`absence_flags\` as JSON arrays. In JSON, keep them as arrays.

Character offsets are zero-based and end-exclusive relative to \`sentence_text\`.

## Sentence-Identification Tasks (${counts.identification})

For every row in \`model-packet-sentences.jsonl\`, independently identify metaphor-related lexical units using MIPVU:

1. Compare the lexical unit's contextual meaning with a more basic meaning.
2. Decide whether the contextual meaning can be understood by comparison with that basic meaning.
3. Use the narrowest span that activates the mapping.
4. If the sentence has multiple metaphor-related units, duplicate the template response, retain the same \`packet_unit_id\`, and increment the suffix of \`response_id\` (\`_r02\`, \`_r03\`, and so on).
5. If no unit qualifies, retain one response with \`mipvu_decision\` set to \`not_metaphor_related\` and leave mapping fields blank.

Do not infer whether a sentence was selected as a positive example or control. That information is intentionally absent.

## Field-Agreement Tasks (${counts.fieldAgreement})

For every row in \`model-packet-field-agreement.jsonl\`, code the supplied \`provided_span_text\` independently. Copy it unchanged into \`candidate_lexical_unit\`, then complete the MIPVU, CMT, Koenigsberg, absence, confidence, and ambiguity fields. Do not add a second span unless the supplied span itself contains separable lexical units that require distinct judgments; explain that split in \`reviewer_notes\`.

## Controlled Values

\`mipvu_decision\`:
${bulletValues(['metaphor_related', 'not_metaphor_related', 'uncertain'])}

\`cluster_id\` (leave blank when not metaphor-related):
${bulletValues(CLUSTER_IDS)}

\`fantasy_type\` (leave blank when not metaphor-related):
${bulletValues(FANTASY_TYPES)}

\`violence_logic\`:
${bulletValues(VIOLENCE_LOGIC_VALUES)}

\`absence_flags\`:
${bulletValues(ABSENCE_FLAGS)}

\`obligatory_frame\` and \`ambiguity_flag\` must be \`true\` or \`false\` when applicable. \`confidence_score\` must be a number from 0 to 1. Describe passage-specific source and target domains rather than copying cluster labels. Record concise entailments as an array.

## Blindness and Independence

- Do not search for the sentence or span in project outputs.
- Do not guess the reference answer or optimize for agreement with another reviewer.
- Do not treat model consensus as authority.
- Use \`historical_semantics_note\` and \`reviewer_notes\` for genuine uncertainty rather than forcing a confident label.
`;
}

function assertOutputPath(filePath) {
  const resolved = path.resolve(filePath);
  const outputRoot = path.resolve(OUTPUT_DIR) + path.sep;
  if (!resolved.startsWith(outputRoot)) throw new Error(`Refusing write outside Stage 4M packet directory: ${filePath}`);
}

function writeAtomic(filePath, contents) {
  assertOutputPath(filePath);
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents);
  fs.renameSync(temporaryPath, filePath);
}

function main() {
  const sample = readJSON(SAMPLE_PATH);
  const codingRows = parseCSV(fs.readFileSync(CODING_TEMPLATE_PATH, 'utf8'));
  validateCodingTemplate(sample, codingRows);

  const selectedDocumentIds = sample.sample_policy.selected_document_ids;
  const allSourceFiles = sourceFiles(sample);
  for (const filePath of allSourceFiles) {
    if (!fs.existsSync(filePath)) throw new Error(`Required Stage 4M input is missing: ${relative(filePath)}`);
  }

  const sourceHashes = allSourceFiles
    .map(filePath => ({ path: relative(filePath), sha256: hashFile(filePath) }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const packetFingerprint = sha256Bytes(JSON.stringify(canonicalJSON({
    script_version: SCRIPT_VERSION,
    source_files: sourceHashes
  })));
  const packetId = `stage4m_${packetFingerprint.slice(0, 16)}`;
  const timestamp = generationTimestamp(packetId);
  const sentenceIndexes = buildSentenceIndex(selectedDocumentIds);
  const packets = buildPackets(sample, sentenceIndexes);
  const allUnits = [...packets.identification, ...packets.fieldAgreement];
  const responseRows = allUnits.map(unit => responseRow(packetId, unit));

  const artifactContents = new Map([
    [OUTPUT_PATHS.sentences, makeJSONL(packets.identification)],
    [OUTPUT_PATHS.fieldAgreement, makeJSONL(packets.fieldAgreement)],
    [OUTPUT_PATHS.instructions, makeInstructions(packetId, {
      identification: packets.identification.length,
      fieldAgreement: packets.fieldAgreement.length
    })],
    [OUTPUT_PATHS.csvTemplate, makeCSV(responseRows)],
    [OUTPUT_PATHS.jsonTemplate, JSON.stringify({
      schema_version: 'stage4m-model-output-template-draft-0.1',
      packet_id: packetId,
      reviewer: {
        reviewer_id: '',
        model_system: '',
        model_version: '',
        provider_family: '',
        review_date: '',
        instruction_version: SCRIPT_VERSION,
        generation_settings: '',
        tools_or_external_context: ''
      },
      responses: responseRows.map(jsonResponse)
    }, null, 2) + '\n']
  ]);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const [filePath, contents] of artifactContents) writeAtomic(filePath, contents);

  const outputs = [...artifactContents.entries()].map(([filePath, contents]) => ({
    path: relative(filePath),
    sha256: sha256Bytes(contents),
    records: filePath === OUTPUT_PATHS.sentences
      ? packets.identification.length
      : filePath === OUTPUT_PATHS.fieldAgreement
        ? packets.fieldAgreement.length
        : filePath === OUTPUT_PATHS.csvTemplate || filePath === OUTPUT_PATHS.jsonTemplate
          ? responseRows.length
          : null
  }));

  const manifest = {
    schema_version: 'stage4m-packet-manifest-1.0',
    packet_id: packetId,
    generated_at: timestamp.value,
    generation_timestamp_source: timestamp.source,
    generator: {
      path: relative(__filename),
      version: SCRIPT_VERSION,
      runtime: 'node'
    },
    status: 'packet_ready',
    blindness: {
      reference_values_included: false,
      stage4_anchor_metadata_included: false,
      control_classifications_included: false,
      source_audit_ids_included: false,
      second_pass_labels_included: false,
      adjudication_results_included: false,
      reliability_results_included: false
    },
    selected_document_ids: selectedDocumentIds,
    counts: {
      sentence_identification_units: packets.identification.length,
      field_agreement_units: packets.fieldAgreement.length,
      output_template_seed_rows: responseRows.length
    },
    source_files: sourceHashes,
    outputs
  };
  writeAtomic(OUTPUT_PATHS.manifest, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`Stage 4M packet generated: ${packetId}`);
  console.log(`Sentence-identification units: ${packets.identification.length}`);
  console.log(`Field-agreement units: ${packets.fieldAgreement.length}`);
  console.log(`Manifest: ${relative(OUTPUT_PATHS.manifest)}`);
}

main();
